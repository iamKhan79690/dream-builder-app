import { Router } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { jobs, type Job } from "../db/schema.js";
import { jobChannel, jobEvents, type JobEvent } from "../jobs/queue.js";
import { requireParent } from "../middleware/requireParent.js";
import { getOwnedJob } from "../services/access.js";
import { PANEL_COUNT } from "../services/generation.js";

// Proxies and load balancers often close a connection that's silent for ~30–60s.
// A comment line every 15s keeps it alive while the AI is slow.
const HEARTBEAT_MS = 15_000;

function toJobResponse(job: Job) {
  return {
    id: job.id,
    storyId: job.storyId,
    status: job.status,
    progress: job.progress,
    error: job.error,
    createdAt: job.createdAt,
  };
}

// Turn the job row into the same event shape the generator emits, so the client
// handles "current state" and "live updates" with the same code.
function snapshotEvent(job: Job): JobEvent {
  if (job.status === "done") return { type: "done", jobId: job.id };
  if (job.status === "failed") {
    return { type: "error", jobId: job.id, error: job.error ?? "Story generation failed. Please try again." };
  }
  // progress = round(panel / 15 * 100), so this gives back the panel number.
  return { type: "progress", jobId: job.id, progress: job.progress, panel: Math.round((job.progress / 100) * PANEL_COUNT) };
}

const isFinal = (event: JobEvent) => event.type === "done" || event.type === "error";

export const jobsRouter = Router();

jobsRouter.use(requireParent);

// One-off check: "how is my job doing right now?"
jobsRouter.get("/:id", async (req, res) => {
  const job = await getOwnedJob(req.user!.id, req.params.id);
  if (!job) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ job: toJobResponse(job) });
  return;
});

// Live updates with Server-Sent Events. The browser connects ONCE with
// `new EventSource("/api/v1/jobs/<id>/events")` and we keep writing to it.
jobsRouter.get("/:id/events", async (req, res) => {
  // Check ownership while we can still send a normal JSON 404.
  const owned = await getOwnedJob(req.user!.id, req.params.id);
  if (!owned) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const jobId = owned.id;

  res.status(200).set({
    "Content-Type": "text/event-stream", // tells the browser "this is an SSE stream"
    "Cache-Control": "no-cache", // never cache a live stream
    Connection: "keep-alive",
    "X-Accel-Buffering": "no", // tells nginx-style proxies not to hold data back
  });
  // Send the headers NOW instead of waiting for the first event, so the browser
  // knows the stream is open.
  res.flushHeaders();

  let closed = false;
  // Events that arrive before we've sent the snapshot wait here, so they can't
  // be sent ahead of it (and show progress jumping backwards).
  let pending: JobEvent[] | null = [];

  const send = (event: JobEvent) => {
    if (closed) return;
    // The SSE format: "data: <text>" then a blank line ends one message.
    res.write(`data: ${JSON.stringify(event)}\n\n`);
    if (isFinal(event)) finish();
  };

  const onEvent = (event: JobEvent) => {
    if (pending) pending.push(event);
    else send(event);
  };

  const heartbeat = setInterval(() => {
    // Lines starting with ":" are comments; EventSource ignores them.
    if (!closed) res.write(": ping\n\n");
  }, HEARTBEAT_MS);

  // Runs exactly once, whether the job ended or the client left.
  function cleanup() {
    if (closed) return;
    closed = true;
    clearInterval(heartbeat);
    jobEvents.off(jobChannel(jobId), onEvent); // stop listening, or we'd leak memory
  }

  function finish() {
    cleanup();
    res.end();
  }

  // The child closed the tab, navigated away, or lost signal.
  req.on("close", cleanup);

  // 1. Subscribe FIRST, so no event can slip by between reading and subscribing.
  jobEvents.on(jobChannel(jobId), onEvent);

  // 2. Then read the current state and send it. A finished job sends done/error
  //    here and the stream ends straight away.
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) {
    // Deleted (with its story) in the meantime.
    send({ type: "error", jobId, error: "Job not found" });
    return;
  }

  const snapshot = snapshotEvent(job);
  send(snapshot);

  // 3. Release anything that arrived while we were reading, skipping progress
  //    the snapshot already covered.
  const buffered = pending;
  pending = null;
  for (const event of buffered) {
    if (event.type === "progress" && snapshot.type === "progress" && event.progress <= snapshot.progress) continue;
    send(event);
  }
  return;
});
