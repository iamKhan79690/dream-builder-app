import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

// scrypt is a deliberately SLOW hash. That's the point: it takes us ~50ms per
// password, but an attacker who steals the database would need that per guess.
const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number) => Promise<Buffer>;

const KEY_LENGTH = 64;

// Stored format: "<salt hex>:<hash hex>".
// The salt is random per user, so two people with the same password get
// different hashes, and precomputed "rainbow tables" are useless.
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = await scryptAsync(password, Buffer.from(saltHex, "hex"), KEY_LENGTH);

  // timingSafeEqual takes the same time whether the first byte or the last byte
  // differs, so an attacker can't learn the hash by measuring response times.
  // It throws if the lengths differ, so check that first.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// A real-looking hash nobody's password matches. Login checks against it when the
// email doesn't exist, so "unknown email" takes as long as "wrong password" and
// response time doesn't reveal which emails have accounts.
export const DUMMY_PASSWORD_HASH = await hashPassword(randomBytes(16).toString("hex"));
