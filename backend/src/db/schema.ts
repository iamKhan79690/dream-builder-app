import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { STORY_STATUSES, type StoryState } from "../types/story.js";

// Each pgTable() call describes one table. The first argument is the table's name
// in Postgres; the object lists its columns. We use camelCase in TypeScript and
// snake_case in the database (the string passed to each column helper).

export const users = pgTable("users", {
  // gen_random_uuid() runs inside Postgres, so every new row gets an id automatically.
  id: uuid("id").primaryKey().defaultRandom(),
  // unique() makes Postgres reject a second account with the same email.
  // Lowercase emails before saving so "Ana@x.com" and "ana@x.com" count as the same.
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  // The scrypt hash, never the real password. Never send this column to the client.
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("parent"),
  // When the parent agreed to the terms / gave consent for their child. Empty until they do.
  consentAt: timestamp("consent_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
  "sessions",
  {
    // The random token stored in the "sid" cookie. It is the session's id.
    id: text("id").primaryKey(),
    // Which user this session belongs to. See the explanation of references/cascade.
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  // An index makes "find all sessions for this user" fast (e.g. "log out everywhere").
  (table) => [index("sessions_user_id_idx").on(table.userId)],
);

export const children = pgTable(
  "children",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The parent who owns this profile. Deleting the parent deletes their children's profiles.
    parentId: uuid("parent_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    // 8–14 is checked by Zod in the route. Mode comes from this: under 12 = junior, 12+ = senior.
    age: integer("age").notNull(),
    // A short language code ("en", "ar"), not the display label.
    language: text("language").notNull().default("en"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Every children query filters by parent_id, so index it.
  (table) => [index("children_parent_id_idx").on(table.parentId)],
);

export const stories = pgTable(
  "stories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    // The child writing this story. Deleting the child deletes their stories.
    // (No parentId here: ownership is "the story's child belongs to you".)
    childId: uuid("child_id")
      .notNull()
      .references(() => children.id, { onDelete: "cascade" }),
    // `enum` here only narrows the TypeScript type; the routes enforce the flow.
    status: text("status", { enum: STORY_STATUSES }).notNull().default("draft"),
    // The whole StoryState object as one JSON value. jsonb = JSON stored in a
    // binary form Postgres can search and merge. $type tells TypeScript its shape.
    state: jsonb("state").$type<StoryState>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    // $onUpdate: Drizzle sets this to "now" on every update() automatically.
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("stories_child_id_idx").on(table.childId)],
);

export const panels = pgTable(
  "panels",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    text: text("text").notNull(),
    imageUrl: text("image_url").notNull(),
    status: text("status").notNull().default("ok"),
  },
  (table) => [
    // A story can have only one panel 3. This also makes "panels of a story" fast.
    unique("panels_story_id_number_unique").on(table.storyId, table.number),
    // CHECK = a rule Postgres enforces on every insert/update, even from buggy code.
    check("panels_number_range", sql`${table.number} BETWEEN 1 AND 15`),
  ],
);

export const JOB_STATUSES = ["queued", "running", "done", "failed"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storyId: uuid("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    status: text("status", { enum: JOB_STATUSES }).notNull().default("queued"),
    progress: integer("progress").notNull().default(0),
    // A short, safe message for the user when status is "failed". Details go to the server log.
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("jobs_story_id_idx").on(table.storyId),
    check("jobs_progress_range", sql`${table.progress} BETWEEN 0 AND 100`),
    check("jobs_status_valid", sql`${table.status} IN ('queued', 'running', 'done', 'failed')`),
  ],
);

// Types for a row read from the table and for a row you insert.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Child = typeof children.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Panel = typeof panels.$inferSelect;
export type Job = typeof jobs.$inferSelect;
