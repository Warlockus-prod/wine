/**
 * Postgres connection — module-singleton pool.
 *
 * Why postgres-js + drizzle: postgres-js is the officially recommended
 * driver for drizzle-orm; lightweight, no native deps, plays nicely with
 * Next.js serverless and edge-runtime constraints (we run nodejs runtime
 * for /api routes so no edge limitations apply).
 *
 * Pool sizing: keep small in dev (max=5) — Next dev server's HMR aggressively
 * recompiles routes which can exhaust connection budget. For prod we still
 * stay modest (10) since the VPS aiw-postgres is shared with other services.
 */

import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  pgConn?: ReturnType<typeof postgres>;
};

const url = process.env.DATABASE_URL;

if (!url) {
  // Don't throw at import — lots of build-time imports must work without the
  // DB (e.g. type-only re-exports). Throw on first actual query attempt.
  console.warn(
    "[db] DATABASE_URL is not set — DB calls will fail. Set it in .env.local.",
  );
}

const conn =
  globalForDb.pgConn ??
  postgres(url ?? "postgresql://invalid", {
    max: process.env.NODE_ENV === "production" ? 10 : 5,
    idle_timeout: 20,
    max_lifetime: 60 * 30,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  // Avoid connection storms in dev with HMR.
  globalForDb.pgConn = conn;
}

export const db = drizzle(conn, { schema, logger: process.env.DRIZZLE_LOG === "1" });
export { schema };
