/**
 * Retention policy for guest chat logs.
 *
 * /api/chat persists every turn (chat_sessions + chat_messages) so the admin
 * "O co pytają goście?" page can show what guests actually ask. That is free
 * text typed by real people in a Polish restaurant, tied to an anonymous id —
 * so it must not accumulate forever. scripts/db-purge-chat.mts drops anything
 * older than this window, nightly.
 *
 * The window is env-tunable (CHAT_RETENTION_DAYS) but deliberately FAILS
 * CLOSED: a malformed or too-small value throws instead of falling back to a
 * default, because the caller is a DELETE job — a typo that reads as "0 days"
 * would wipe the table, and a cron that errors out deletes nothing.
 */

/** Matches the widest range offered by the admin analytics page (90 days). */
export const DEFAULT_CHAT_RETENTION_DAYS = 90;
/** Below this the analytics page would show empty ranges it still offers. */
export const MIN_CHAT_RETENTION_DAYS = 7;
/** ~10 years; anything beyond is certainly a typo (e.g. a pasted timestamp). */
export const MAX_CHAT_RETENTION_DAYS = 3650;

export class RetentionConfigError extends Error {}

/**
 * Resolve the retention window from a raw env value.
 *  - unset / empty  → DEFAULT_CHAT_RETENTION_DAYS
 *  - anything else  → must be an integer in [MIN, MAX], or this throws
 */
export function resolveRetentionDays(raw: string | undefined | null): number {
  if (raw === undefined || raw === null || raw.trim() === "") {
    return DEFAULT_CHAT_RETENTION_DAYS;
  }
  const trimmed = raw.trim();
  // Number() would accept "90.0", "0x5A", " 90 " and "1e3"; for a destructive
  // job we want exactly the digits someone meant to type.
  if (!/^\d+$/.test(trimmed)) {
    throw new RetentionConfigError(
      `CHAT_RETENTION_DAYS must be a whole number of days, got ${JSON.stringify(raw)}`,
    );
  }
  const days = Number(trimmed);
  if (days < MIN_CHAT_RETENTION_DAYS) {
    throw new RetentionConfigError(
      `CHAT_RETENTION_DAYS=${days} is below the ${MIN_CHAT_RETENTION_DAYS}-day floor; ` +
        `refusing to purge (set it to at least ${MIN_CHAT_RETENTION_DAYS}, or delete rows by hand if that is really the intent)`,
    );
  }
  if (days > MAX_CHAT_RETENTION_DAYS) {
    throw new RetentionConfigError(
      `CHAT_RETENTION_DAYS=${days} exceeds the ${MAX_CHAT_RETENTION_DAYS}-day ceiling; that is almost certainly a typo`,
    );
  }
  return days;
}
