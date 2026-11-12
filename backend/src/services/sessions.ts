import { createHash, randomBytes } from "node:crypto";
import type { CookieOptions, Response } from "express";
import { eq } from "drizzle-orm";
import { config } from "../config.js";
import { db } from "../db/client.js";
import { sessions, users, type User } from "../db/schema.js";

export const SESSION_COOKIE = "sid";
const SESSION_DAYS = 30;
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

const cookieOptions: CookieOptions = {
  httpOnly: true, // page JavaScript can't read it, so an XSS bug can't steal the session
  sameSite: "lax", // not sent on cross-site form posts/requests, which blocks most CSRF
  secure: config.isProduction, // HTTPS-only in production; localhost is plain http
  path: "/",
};

// The browser gets the raw token; the database only stores its SHA-256 hash.
// If the database ever leaks, the hashes can't be used as cookies.
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(res: Response, userId: string): Promise<void> {
  // 32 random bytes = impossible to guess.
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MS);

  await db.insert(sessions).values({ id: hashToken(token), userId, expiresAt });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions, maxAge: SESSION_MS });
}

// Returns the user for a valid, unexpired token, otherwise null.
// Expired sessions are deleted when we find them.
export async function getUserForToken(token: string): Promise<User | null> {
  const id = hashToken(token);
  const [row] = await db
    .select({ expiresAt: sessions.expiresAt, user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, id))
    .limit(1);

  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, id));
    return null;
  }
  return row.user;
}

export async function deleteSession(token: string): Promise<void> {
  await db.delete(sessions).where(eq(sessions.id, hashToken(token)));
}

// The browser only removes a cookie if the options (path, sameSite, ...) match.
export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, cookieOptions);
}
