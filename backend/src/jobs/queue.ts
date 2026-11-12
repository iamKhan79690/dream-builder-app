import { EventEmitter } from "node:events";

// A tiny in-memory job queue. Good enough for one server process.
// Later this becomes BullMQ (jobs stored in Redis, run by separate worker processes).
// Limitation for now: if the server restarts (including tsx watch reloading on save),
// running jobs just stop.

export type JobEvent =
  | { type: "progress"; jobId: string; progress: number; panel: number }
  | { type: "done"; jobId: string }
  | { type: "error"; jobId: string; error: string };

// One shared "radio station" for job news. Code that wants updates (e.g. a future
// live-progress endpoint) subscribes with jobEvents.on(jobChannel(id), ...).
//
// We publish on a per-job channel named "job:<id>", and never on a channel literally
// named "error": EventEmitter treats "error" specially and crashes the whole
// process if nobody is listening.
export const jobEvents = new EventEmitter();
// Many browser tabs may watch jobs at once; raise Node's default warning limit of 10.
jobEvents.setMaxListeners(100);

export function jobChannel(jobId: string): string {
  return `job:${jobId}`;
}

export function emitJobEvent(event: JobEvent): void {
  jobEvents.emit(jobChannel(event.jobId), event);
}

// Run `work` later, after the current request has finished sending its response.
// setImmediate schedules it for the next turn of Node's event loop.
// The catch is a last safety net: an unhandled rejected promise would crash Node.
export function enqueue(name: string, work: () => Promise<void>): void {
  setImmediate(() => {
    work().catch((err) => {
      console.error(`[queue] job "${name}" crashed`, err);
    });
  });
}
