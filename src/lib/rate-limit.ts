/**
 * Shared in-memory sliding-window rate limiter for API routes.
 *
 * Single-container deploy → an in-process Map is enough; buckets hang off
 * globalThis so they survive module re-eval (HMR / route recompiles) within
 * one instance. If we ever run more than one app container, swap the backing
 * store for Redis or a Postgres token table.
 *
 * Keyed by a caller-supplied string — namespace it per route (e.g. `write:<ip>`)
 * so unrelated routes don't share a budget. Use clientIp() behind nginx.
 */

type Buckets = Map<string, number[]>;

const store: Buckets =
  ((globalThis as unknown) as { __wn_rateBuckets?: Buckets }).__wn_rateBuckets ?? new Map();
((globalThis as unknown) as { __wn_rateBuckets?: Buckets }).__wn_rateBuckets = store;

/**
 * Trustworthy client IP from the proxy headers.
 *
 * Our nginx_server block for wine.icoffio.com sets `X-Real-IP $remote_addr`
 * (overwriting any client-sent value) and, because MetroWeb passes 443 through
 * at the TCP layer, `$remote_addr` is the REAL client IP. So X-Real-IP is
 * authoritative and not client-spoofable — prefer it. The LEFTMOST
 * X-Forwarded-For token is attacker-controlled (nginx APPENDS the true peer),
 * so if we must fall back to XFF we take the LAST entry, never the first.
 */
export function clientIp(request: Request): string {
  const real = request.headers.get("x-real-ip")?.trim();
  if (real) return real;
  const parts = request.headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return (parts && parts[parts.length - 1]) || "unknown";
}

export interface RateVerdict {
  ok: boolean;
  /** Seconds until the caller may retry (only meaningful when !ok). */
  retryAfter: number;
}

/**
 * Sliding-window check. Records the hit when allowed.
 *
 * @param key      unique bucket key (namespace per route)
 * @param limit    max hits per window
 * @param windowMs window length in ms
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateVerdict {
  const now = Date.now();
  const recent = (store.get(key) ?? []).filter((ts) => now - ts < windowMs);
  if (recent.length >= limit) {
    const oldest = recent[0] ?? now;
    store.set(key, recent); // keep pruned
    return { ok: false, retryAfter: Math.max(1, Math.ceil((windowMs - (now - oldest)) / 1000)) };
  }
  recent.push(now);
  store.set(key, recent);
  return { ok: true, retryAfter: 0 };
}
