import { and, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { children, type Child } from "../db/schema.js";
import { isUuid } from "../lib/ids.js";

// The one place that answers "is this child yours?".
// Returns the child only if it exists AND belongs to userId; otherwise null.
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
