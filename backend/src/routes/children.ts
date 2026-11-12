import { Router } from "express";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/client.js";
import { children, type Child } from "../db/schema.js";
import { requireParent } from "../middleware/requireParent.js";
import { validate } from "../middleware/validate.js";
import { getOwnedChild } from "../services/access.js";

export const LANGUAGE_CODES = ["en", "ar"] as const;

const childFields = {
  name: z.string().trim().min(1).max(40),
  age: z.number().int().min(8).max(14),
  language: z.enum(LANGUAGE_CODES),
};

// Notice: no parentId here. If the client sends one, Zod drops it.
const createChildSchema = z.object({
  ...childFields,
  language: childFields.language.default("en"),
});

// PATCH = change only the fields you send, so every field is optional.
const updateChildSchema = z.object(childFields).partial();

// Same shape as ChildProfile in the frontend's AppState.tsx.
function toChildProfile(child: Child) {
  return { id: child.id, name: child.name, age: child.age, language: child.language };
}

export const childrenRouter = Router();

// Every route below needs a logged-in parent, and can then use req.user.
childrenRouter.use(requireParent);

childrenRouter.get("/", async (req, res) => {
  const rows = await db
    .select()
    .from(children)
    .where(eq(children.parentId, req.user!.id)) // only MY children
    .orderBy(asc(children.createdAt));

  res.json({ children: rows.map(toChildProfile) });
  return;
});

childrenRouter.post("/", validate(createChildSchema), async (req, res) => {
  const body = req.body as z.infer<typeof createChildSchema>;

  const [child] = await db
    .insert(children)
    .values({ ...body, parentId: req.user!.id }) // owner comes from the session, never the body
    .returning();

  res.status(201).json({ child: toChildProfile(child!) });
  return;
});

childrenRouter.patch("/:id", validate(updateChildSchema), async (req, res) => {
  const child = await getOwnedChild(req.user!.id, req.params.id);
  if (!child) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const changes = req.body as z.infer<typeof updateChildSchema>;
  if (Object.keys(changes).length === 0) {
    // Nothing to change; just send back the current profile.
    res.json({ child: toChildProfile(child) });
    return;
  }

  const [updated] = await db.update(children).set(changes).where(eq(children.id, child.id)).returning();
  if (!updated) {
    // Deleted by another request between our check and the update.
    res.status(404).json({ error: "Not found" });
    return;
  }

  res.json({ child: toChildProfile(updated) });
  return;
});

childrenRouter.delete("/:id", async (req, res) => {
  const child = await getOwnedChild(req.user!.id, req.params.id);
  if (!child) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  await db.delete(children).where(eq(children.id, child.id));
  res.status(204).end();
  return;
});
