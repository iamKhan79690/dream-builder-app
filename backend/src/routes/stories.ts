import { Router, type Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { stories, type Story } from "../db/schema.js";
import { requireParent } from "../middleware/requireParent.js";
import { validate } from "../middleware/validate.js";
import { getOwnedChild, getOwnedStory } from "../services/access.js";
import { EMPTY_STORY, StoryPatchSchema, type StoryPatch, type StoryStatus } from "../types/story.js";

const createStorySchema = z.object({
  childId: z.string(), // checked against the session below, not trusted
});

function toStoryResponse(story: Story) {
  return {
    id: story.id,
    childId: story.childId,
    status: story.status,
    state: story.state,
    createdAt: story.createdAt,
    updatedAt: story.updatedAt,
  };
}

function notFound(res: Response) {
  res.status(404).json({ error: "Not found" });
}

function wrongStatus(res: Response, current: StoryStatus, needed: StoryStatus) {
  res.status(409).json({ error: `Story is "${current}", must be "${needed}" for this action` });
}

export const storiesRouter = Router();

storiesRouter.use(requireParent);

storiesRouter.post("/", validate(createStorySchema), async (req, res) => {
  const { childId } = req.body as z.infer<typeof createStorySchema>;

  const child = await getOwnedChild(req.user!.id, childId);
  if (!child) {
    notFound(res);
    return;
  }

  const [story] = await db
    .insert(stories)
    .values({ childId: child.id, state: { ...EMPTY_STORY, childId: child.id } })
    .returning();

  res.status(201).json({ story: toStoryResponse(story!) });
  return;
});

storiesRouter.get("/:id", async (req, res) => {
  const story = await getOwnedStory(req.user!.id, req.params.id);
  if (!story) {
    notFound(res);
    return;
  }

  res.json({ story: toStoryResponse(story) });
  return;
});

// Saves the child's answers while they write. Only allowed in "draft".
storiesRouter.patch("/:id", validate(StoryPatchSchema), async (req, res) => {
  const story = await getOwnedStory(req.user!.id, req.params.id);
  if (!story) {
    notFound(res);
    return;
  }
  if (story.status !== "draft") {
    wrongStatus(res, story.status, "draft");
    return;
  }

  const patch = req.body as StoryPatch;

  // `state || patch` is Postgres's jsonb merge: keys in the patch replace the
  // same keys in state, everything else is kept. Doing it in SQL (instead of
  // read-merge-write in JS) means two quick saves of different fields can't
  // overwrite each other. `status = 'draft'` in WHERE re-checks the status in
  // the same statement, in case the story moved on since we read it.
  const [updated] = await db
    .update(stories)
    .set({ state: sql`${stories.state} || ${JSON.stringify(patch)}::jsonb` })
    .where(and(eq(stories.id, story.id), eq(stories.status, "draft")))
    .returning();

  if (!updated) {
    res.status(409).json({ error: "Story is no longer a draft" });
    return;
  }

  res.json({ story: toStoryResponse(updated) });
  return;
});

// Moves a story one step along the flow, only if it's currently at `from`.
// The WHERE clause checks the status again inside the update, so two clicks
// at once can't both succeed.
async function transition(
  story: Story,
  from: StoryStatus,
  to: StoryStatus,
  stateChanges: Partial<Story["state"]> = {},
): Promise<Story | null> {
  const [updated] = await db
    .update(stories)
    .set({ status: to, state: { ...story.state, ...stateChanges } })
    .where(and(eq(stories.id, story.id), eq(stories.status, from)))
    .returning();
  return updated ?? null;
}

// The child has read the generated story and says "yes, that's my story".
storiesRouter.post("/:id/confirm", async (req, res) => {
  const story = await getOwnedStory(req.user!.id, req.params.id);
  if (!story) {
    notFound(res);
    return;
  }
  if (story.status !== "child_review") {
    wrongStatus(res, story.status, "child_review");
    return;
  }

  const updated = await transition(story, "child_review", "parent_review", { confirmedByChild: true });
  if (!updated) {
    res.status(409).json({ error: "Story status changed, reload and try again" });
    return;
  }

  res.json({ story: toStoryResponse(updated) });
  return;
});

// The parent has checked the story and approves it as final.
storiesRouter.post("/:id/approve", async (req, res) => {
  const story = await getOwnedStory(req.user!.id, req.params.id);
  if (!story) {
    notFound(res);
    return;
  }
  if (story.status !== "parent_review") {
    wrongStatus(res, story.status, "parent_review");
    return;
  }

  const updated = await transition(story, "parent_review", "final");
  if (!updated) {
    res.status(409).json({ error: "Story status changed, reload and try again" });
    return;
  }

  res.json({ story: toStoryResponse(updated) });
  return;
});
