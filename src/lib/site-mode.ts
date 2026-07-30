/**
 * site-mode.ts — which of the two sites is THIS process serving?
 *
 * The codebase ships one image that runs as two independent deployments
 * (client 2026-07-30 "это два отдельных проекта"):
 *
 *   SITE_MODE=full       → wine2.icoffio.com — the whole product: restaurant
 *                          directory, /pairing, /admin, /pitch, /samouczek.
 *   SITE_MODE=samouczek  → wine.icoffio.com  — ONLY the Vinocompas tutorial
 *                          (the shop-facing surface for winnica.pl).
 *
 * Anything else on the samouczek host is sent to the full site instead of
 * 404-ing, so the QR codes already printed for restaurants keep working
 * (that was an explicit call: old links must not break).
 *
 * ZERO imports on purpose — src/middleware.ts runs in the edge runtime, where
 * pulling in app code (or anything touching postgres) crashes the worker.
 */

export type SiteMode = "full" | "samouczek";

/** Host of the full product — redirect target for everything the tutorial
 *  site does not serve itself. Overridable so staging can point elsewhere. */
export const FULL_SITE_URL = process.env.FULL_SITE_URL || "https://wine2.icoffio.com";

export function siteMode(): SiteMode {
  return process.env.SITE_MODE === "samouczek" ? "samouczek" : "full";
}

/**
 * Paths the tutorial site serves itself. Everything here is either the
 * tutorial, the embeddable widget, or a page the law/footer requires.
 * `/pl` prefix optional — next-intl uses "as-needed" so EN sits at the root.
 */
const SAMOUCZEK_ALLOWED = [
  /^\/(?:pl\/)?samouczek(?:\/|$)/,
  /^\/(?:pl\/)?embed\/samouczek(?:\/|$)/,
  /^\/(?:pl\/)?privacy(?:\/|$)/,
];

/** Bare host root — the tutorial IS the site, so land guests on it. */
const ROOT_RE = /^\/(?:pl)?\/?$/;

/**
 * Where should `pathname` go on the SAMOUCZEK site?
 *   null                  → serve it here, unchanged
 *   { to, external:false} → redirect within this host (the root → tutorial)
 *   { to, external:true } → redirect to the full site, path preserved
 *
 * Pure and total, so the routing contract is unit-testable without a request.
 */
export function samouczekRoute(
  pathname: string,
): { to: string; external: boolean } | null {
  if (SAMOUCZEK_ALLOWED.some((re) => re.test(pathname))) return null;
  // "/" and "/pl" open the tutorial in the guest's language.
  if (ROOT_RE.test(pathname)) {
    return { to: pathname.startsWith("/pl") ? "/pl/samouczek" : "/samouczek", external: false };
  }
  return { to: `${FULL_SITE_URL}${pathname}`, external: true };
}
