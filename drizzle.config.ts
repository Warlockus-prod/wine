import "dotenv/config";
import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  // Loaded from .env.local via dotenv/config above. If still missing, the
  // CLI commands will fail explicitly — surface here for friendlier error.
  console.error(
    "[drizzle.config] DATABASE_URL is not set. Add it to .env.local before running drizzle-kit.",
  );
}

export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://invalid",
  },
  // Print SQL — easier to review in PRs/manual deploys.
  verbose: true,
  strict: true,
});
