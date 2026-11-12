import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, type User } from "../db/schema.js";

// What we're allowed to send to the client: every user column EXCEPT passwordHash.
export type PublicUser = Omit<User, "passwordHash">;

export function toPublicUser(user: User): PublicUser {
  const { passwordHash: _secret, ...rest } = user;
  return rest;
}

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

// Returns the new user, or null if the email is already taken.
// onConflictDoNothing lets the database's unique rule decide, so two signups with
// the same email at the same instant can't both succeed.
export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  consentAt: Date;
}): Promise<User | null> {
  const [user] = await db.insert(users).values(input).onConflictDoNothing({ target: users.email }).returning();
  return user ?? null;
}
