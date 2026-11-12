import "dotenv/config";
import { z } from "zod";

// Describe the environment variables we expect, with defaults for local dev.
// z.coerce turns the string "3000" from .env into the number 3000.
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DB_PATH: z.string().min(1).default("./data"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Fail fast at startup instead of crashing later with a confusing error.
  console.error("Invalid environment variables:", z.treeifyError(parsed.error));
  process.exit(1);
}

export const config = {
  port: parsed.data.PORT,
  dbPath: parsed.data.DB_PATH,
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === "production",
};
