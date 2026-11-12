import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  driver: "pglite",
  schema: "./src/db/schema.ts",
  dbCredentials: {
    url: process.env.DB_PATH ?? "./data",
  },
});
