import { and, eq, sql } from "drizzle-orm";
import { setTimeout as sleep } from "node:timers/promises";
import { db } from "../db/client.js";
import { jobs, panels, stories } from "../db/schema.js";
import { emitJobEvent } from "../jobs/queue.js";
import type { StoryState } from "../types/story.js";

export const PANEL_COUNT = 15;
const PANEL_DELAY_MS = 400;

// FAKE story writer. The real version will call the AI for text and images.
// Panel 15 always ends with "One real step today."
function panelText(n: number, hero: string, dream: string): string {
  const lines: Record<number, string> = {
    1: `Meet ${hero}. Today feels like the start of something big.`,
    2: `${hero} has a dream: ${dream}.`,
    3: `${hero} looks at the path ahead and takes a deep breath.`,
    4: `The first step is easy. ${hero} smiles.`,
    5: `Then a problem appears, right in the middle of the path.`,
    6: `${hero} feels it in their heart, but doesn't turn back.`,
    7: `${hero} remembers their strengths and makes a brave move.`,
    8: `It works, a little. That's enough to keep going.`,
    9: `${hero} finds a quiet, safe place to rest and think.`,
    10: `A second challenge arrives, bigger than the first.`,
    11: `${hero} speaks their hero words out loud.`,
    12: `Step by step, the challenge gets smaller.`,
    13: `${hero} looks back and sees how far they've come.`,
    14: `The dream, ${dream}, feels closer than ever.`,
    15: `${hero} knows the next move. One real step today.`,
  };
  return lines[n]!;
}

function placeholderImage(heroType: string, n: number): string {
  return `/placeholders/${heroType}/panel-${String(n).padStart(2, "0")}.png`;
}

export async function runGeneration(jobId: string, storyId: string): Promise<void> {
  try {
    const [story] = await db.select().from(stories).where(eq(stories.id, storyId)).limit(1);
    if (!story) throw new Error(`story ${storyId} not found`);

    const state: StoryState = story.state;
    const hero = state.charName.trim();
    const dream = state.aspiration.trim() || "to be brave";
    const heroType = state.heroType!; // the route checked this before enqueueing

    await db.update(jobs).set({ status: "running" }).where(eq(jobs.id, jobId));
    // A previous failed attempt may have left some panels behind; start clean.
    await db.delete(panels).where(eq(panels.storyId, storyId));

    for (let n = 1; n <= PANEL_COUNT; n++) {
      await sleep(PANEL_DELAY_MS); // pretend the AI is thinking

      await db.insert(panels).values({
        storyId,
        number: n,
        text: panelText(n, hero, dream),
        imageUrl: placeholderImage(heroType, n),
      });

      const progress = Math.round((n / PANEL_COUNT) * 100);
      await db.update(jobs).set({ progress }).where(eq(jobs.id, jobId));
      emitJobEvent({ type: "progress", jobId, progress, panel: n });
    }

    // Finish both rows together: either story AND job are updated, or neither.
    await db.transaction(async (tx) => {
      const generatedAt = new Date().toISOString();
      await tx
        .update(stories)
        .set({
          status: "child_review",
          state: sql`${stories.state} || ${JSON.stringify({ storyGeneratedAt: generatedAt })}::jsonb`,
        })
        .where(and(eq(stories.id, storyId), eq(stories.status, "generating")));
      await tx.update(jobs).set({ status: "done", progress: 100 }).where(eq(jobs.id, jobId));
    });

    emitJobEvent({ type: "done", jobId });
  } catch (err) {
    // The real error (maybe SQL or AI details) goes to the log only.
    console.error(`[generation] job ${jobId} failed`, err);
    const message = "Story generation failed. Please try again.";

    try {
      await db.update(jobs).set({ status: "failed", error: message }).where(eq(jobs.id, jobId));
      // Give the story back to the child so they can try again.
      await db
        .update(stories)
        .set({ status: "draft" })
        .where(and(eq(stories.id, storyId), eq(stories.status, "generating")));
    } catch (cleanupErr) {
      console.error(`[generation] could not mark job ${jobId} as failed`, cleanupErr);
    }

    emitJobEvent({ type: "error", jobId, error: message });
  }
}
