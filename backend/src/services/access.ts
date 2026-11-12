import { and, eq, getTableColumns } from "drizzle-orm";
import { db } from "../db/client.js";
import { children, stories, type Child, type Story } from "../db/schema.js";
import { isUuid } from "../lib/ids.js";

// The one place that answers "is this yours?".
// Each function returns the row only if it exists AND belongs to userId; otherwise null.
// Routes turn null into 404, so "doesn't exist" and "belongs to someone else"
// look exactly the same from outside, and nobody can probe for other families' ids.

export async function getOwnedChild(userId: string, childId: unknown): Promise<Child | null> {
  if (!isUuid(childId)) return null;

  const [child] = await db
    .select()
    .from(children)
    .where(and(eq(children.id, childId), eq(children.parentId, userId)))
    .limit(1);

  return child ?? null;
}

// Stories don't store a parentId, so we follow the chain:
// story -> its child -> that child's parent, and check the parent is you.
export async function getOwnedStory(userId: string, storyId: unknown): Promise<Story | null> {
  if (!isUuid(storyId)) return null;

  const [story] = await db
    .select(getTableColumns(stories)) // only the story's columns, not the child's
    .from(stories)
    .innerJoin(children, eq(stories.childId, children.id))
    .where(and(eq(stories.id, storyId), eq(children.parentId, userId)))
    .limit(1);

  return story ?? null;
}
