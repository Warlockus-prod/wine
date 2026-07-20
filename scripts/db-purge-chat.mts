#!/usr/bin/env -S npx tsx
/**
 * Nightly retention purge for guest chat logs.
 *
 * /api/chat stores every turn so the admin analytics page can answer "what do
 * guests actually ask?". Those are free-text messages from real restaurant
 * guests tied to an anonymous id, so they get a bounded lifetime — see
 * src/lib/chat-retention.ts for the window and why a bad value fails closed.
 *
 * A session is judged by its LAST message, not by ended_at: chat-store only
 * closes a session when the same guest comes back after a 45-minute gap, so
 * most sessions stay open forever and ended_at is useless as an age signal.
 * Sessions that never got a message age out on started_at instead.
 *
 * chat_messages.session_id is ON DELETE CASCADE, so removing the sessions
 * removes their messages. Idempotent — a second run finds nothing.
 *
 *   npx tsx scripts/db-purge-chat.mts --dry-run   # report only, touch nothing
 *   npx tsx scripts/db-purge-chat.mts             # delete
 *   CHAT_RETENTION_DAYS=180 npx tsx scripts/db-purge-chat.mts
 */

import "dotenv/config";
import postgres from "postgres";
import { resolveRetentionDays, RetentionConfigError } from "../src/lib/chat-retention";

const dryRun = process.argv.includes("--dry-run");

let days: number;
try {
  days = resolveRetentionDays(process.env.CHAT_RETENTION_DAYS);
} catch (err) {
  // Fail closed: a misconfigured window must delete nothing and be loud in
  // the cron log.
  console.error(
    `[purge-chat] ${err instanceof RetentionConfigError ? err.message : String(err)}`,
  );
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("[purge-chat] DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });
const stamp = new Date().toISOString();

try {
  // Sessions past the window, judged by their last message (or, for empty
  // sessions, when they started). A FACTORY, not a shared fragment: the same
  // fragment object embedded in several queries would have to re-bind its
  // parameter each time, and that is not a property worth relying on in a
  // DELETE job.
  const doomedIds = () => sql`
    SELECT s.id
    FROM chat_sessions s
    LEFT JOIN (
      SELECT session_id, max(ts) AS last_ts
      FROM chat_messages
      GROUP BY session_id
    ) m ON m.session_id = s.id
    WHERE COALESCE(m.last_ts, s.started_at) < now() - make_interval(days => ${days})
  `;

  const [{ sessions, messages }] = await sql`
    SELECT
      (SELECT count(*)::int FROM (${doomedIds()}) d) AS sessions,
      (SELECT count(*)::int FROM chat_messages
        WHERE session_id IN (SELECT id FROM (${doomedIds()}) d2)) AS messages
  `;

  if (dryRun) {
    console.log(
      `[purge-chat] ${stamp} DRY RUN — would drop ${sessions} session(s) / ${messages} message(s) older than ${days}d`,
    );
  } else if (sessions === 0) {
    console.log(`[purge-chat] ${stamp} nothing older than ${days}d`);
  } else {
    const deleted = await sql`
      DELETE FROM chat_sessions WHERE id IN (SELECT id FROM (${doomedIds()}) d) RETURNING id
    `;
    console.log(
      `[purge-chat] ${stamp} deleted ${deleted.length} session(s) / ${messages} message(s) older than ${days}d`,
    );
  }

  // Always report what survives — makes the cron log self-verifying.
  const [remaining] = await sql`
    SELECT
      (SELECT count(*)::int FROM chat_sessions) AS sessions,
      (SELECT count(*)::int FROM chat_messages) AS messages,
      (SELECT min(ts) FROM chat_messages) AS oldest
  `;
  console.log(
    `[purge-chat] remaining: ${remaining.sessions} session(s), ${remaining.messages} message(s), oldest ${remaining.oldest ? new Date(remaining.oldest).toISOString() : "—"}`,
  );
} catch (err) {
  console.error("[purge-chat] failed:", err);
  await sql.end({ timeout: 5 });
  process.exit(1);
}

await sql.end({ timeout: 5 });
