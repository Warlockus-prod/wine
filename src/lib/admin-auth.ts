/**
 * Simple env-based admin HTTP Basic Auth — a pilot stopgap that closes the
 * open write API (audit C1) WITHOUT requiring SMTP / magic-link / a DB
 * bootstrap (so there's no lock-out risk).
 *
 * Activated only when AUTH_GATE_ADMIN=1. Credentials come from env:
 *   ADMIN_USER      (default "admin")
 *   ADMIN_PASSWORD  (REQUIRED — if unset the gate fails CLOSED)
 *
 * Used in two places, both of which must agree:
 *   - src/middleware.ts  → challenges the /admin UI (edge runtime)
 *   - src/lib/api-acl.ts → re-validates on every write API call (node runtime)
 *
 * This file has ZERO imports so it is safe in the edge runtime (the middleware
 * must never pull postgres/nodemailer). `atob` is available in both runtimes.
 *
 * For real multi-user accounts later, switch to the Auth.js magic-link flow
 * (docs/ops/auth-gate-flip.md) — requireAuth() already falls through to it.
 */

/** True when the admin gate is switched on. */
export const ADMIN_GATE_ENABLED = (): boolean => process.env.AUTH_GATE_ADMIN === "1";

const adminUser = (): string => process.env.ADMIN_USER || "admin";
const adminPassword = (): string => process.env.ADMIN_PASSWORD || "";

/** Length-aware constant-time-ish compare to avoid a trivial timing leak. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Validate an `Authorization: Basic <base64>` header against the env creds.
 * Returns false (fails closed) when ADMIN_PASSWORD is not configured.
 */
export function checkBasicAuth(header: string | null | undefined): boolean {
  const password = adminPassword();
  if (!password) return false; // not configured → nobody passes
  if (!header || !header.startsWith("Basic ")) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice(6).trim());
  } catch {
    return false;
  }
  const sep = decoded.indexOf(":");
  if (sep === -1) return false;
  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);
  // Evaluate both halves so a wrong username is rejected in ~constant time too.
  const userOk = safeEqual(user, adminUser());
  const passOk = safeEqual(pass, password);
  return userOk && passOk;
}

/** WWW-Authenticate header to send with a 401 so the browser prompts for creds. */
export const BASIC_AUTH_CHALLENGE = {
  "WWW-Authenticate": 'Basic realm="Cellar Compass Admin", charset="UTF-8"',
};
