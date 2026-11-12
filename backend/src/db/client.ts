import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { config } from "../config.js";
import * as schema from "./schema.js";

// PGlite is a full Postgres that runs inside this Node process and keeps its
// files in a folder (config.dbPath, "./data" by default). No separate server needed.
// Only ONE process can open that folder at a time, so stop `pnpm dev` before
// running `pnpm db:push`.
const client = new PGlite(config.dbPath);

// Drizzle wraps the connection so we can write typed queries like
// db.select().from(users) instead of raw SQL strings.
export const db = drizzle({ client, schema });
