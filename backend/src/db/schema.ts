import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

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

// Types for a row read from the table and for a row you insert.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type Child = typeof children.$inferSelect;
