/**
 * Composed middleware: i18n routing + lightweight admin gate.
 *
 * Runs in the edge runtime - must NOT import the full Auth.js config (it pulls
 * postgres + nodemailer, neither available in edge). The admin gate here is a
 * simple env-based HTTP Basic Auth (see src/lib/admin-auth.ts, which has zero
 * DB imports). When AUTH_GATE_ADMIN=1 it challenges /admin; the write APIs
 * re-validate the same credentials server-side in src/lib/api-acl.ts.
 *
 * When AUTH_GATE_ADMIN!=1 the gate is fully disabled (pilot mode - admin stays
 * open). To turn it on: set AUTH_GATE_ADMIN=1 + ADMIN_PASSWORD in the env.
 */

import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { ADMIN_GATE_ENABLED, checkBasicAuth, BASIC_AUTH_CHALLENGE } from "./lib/admin-auth";
import { siteMode, samouczekRoute, samouczekAllowsApi } from "./lib/site-mode";
import { buildCsp, makeNonce, EMBED_FRAME_ANCESTORS, SELF_FRAME_ANCESTORS } from "./lib/csp";

const intl = createIntlMiddleware(routing);

const ADMIN_PATH_RE = /^\/(?:[a-z]{2}\/)?admin(\/|$)/;
/** Only the embeddable widget may be framed cross-origin. */
const EMBED_PATH_RE = /^\/(?:[a-z]{2}\/)?embed(\/|$)/;

export default function middleware(request: NextRequest) {
  // ── API routes ──────────────────────────────────────────────────────────
  // Handled before anything else and WITHOUT the intl middleware, which would
  // try to locale-rewrite them. The matcher now includes /api purely so the
  // site split can cover it: until 2026-09-01 the tutorial host — our most
  // widely published origin, printed on QR codes and iframed by the shop —
  // served the entire API, write routes included, because /api was excluded
  // from the matcher entirely.
  if (request.nextUrl.pathname.startsWith("/api")) {
    if (siteMode() === "samouczek" && !samouczekAllowsApi(request.nextUrl.pathname)) {
      // 404, not 302: an API client should get a definite answer, and
      // redirecting a POST across hosts would silently drop its body.
      return new NextResponse(
        JSON.stringify({ error: "Not found on this site." }),
        { status: 404, headers: { "Content-Type": "application/json" } },
      );
    }
    // Return NOTHING for allowed API routes. `NextResponse.next()` re-issues
    // the request internally and DROPS the body of a POST — /api/pairing then
    // scored with no dish context and returned an unrelated wine (caught by
    // pairing-algorithm.spec on 2026-09-01). Returning undefined lets the
    // request continue to the route untouched.
    return undefined;
  }

  // Site split (SITE_MODE=samouczek → wine.icoffio.com). Runs FIRST: the
  // tutorial deployment must never render the product pages, and the redirect
  // is cheaper than letting i18n rewrite a path we are about to leave.
  // 302, not 301 — a migration should stay reversible; browsers cache a 301
  // for a long time and we would not be able to take it back.
  if (siteMode() === "samouczek") {
    const decision = samouczekRoute(request.nextUrl.pathname);
    if (decision) {
      if (decision.external) {
        const target = new URL(decision.to);
        target.search = request.nextUrl.search;
        return NextResponse.redirect(target, 302);
      }
      // Same-host hop (root → tutorial). Clone nextUrl rather than trusting a
      // Host header (that is the classic open-redirect footgun, and this repo
      // already hardened one such case in safeReturnTo). Next emits a relative
      // Location for a same-origin target, so the browser resolves it against
      // whichever public host it asked for — the internal container address
      // never appears. A hand-written relative Location is NOT an option: the
      // middleware runtime rejects it with "Invalid URL".
      const target = request.nextUrl.clone();
      target.pathname = decision.to;
      return NextResponse.redirect(target, 302);
    }
  }

  // ── CSP with a per-request nonce ────────────────────────────────────────
  // Next reads the nonce out of the Content-Security-Policy REQUEST header and
  // stamps it on the inline bootstrap scripts it emits, so the header has to be
  // set on the request that reaches the renderer — not only on the response.
  const nonce = makeNonce();
  const csp = buildCsp({
    nonce,
    frameAncestors: EMBED_PATH_RE.test(request.nextUrl.pathname)
      ? EMBED_FRAME_ANCESTORS
      : SELF_FRAME_ANCESTORS,
    isDev: process.env.NODE_ENV !== "production",
  });
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);
  const forwarded = new NextRequest(request, { headers: requestHeaders });

  const intlResponse = intl(forwarded);
  intlResponse.headers.set("Content-Security-Policy", csp);

  if (!ADMIN_GATE_ENABLED()) return intlResponse;

  const { pathname } = request.nextUrl;
  if (!ADMIN_PATH_RE.test(pathname)) return intlResponse;

  // Basic Auth gate (pilot stopgap, audit C1). Once the browser authenticates
  // here, its same-origin fetches to the write API carry the same credentials,
  // which api-acl re-validates. Fails CLOSED when ADMIN_PASSWORD is unset.
  if (checkBasicAuth(request.headers.get("authorization"))) return intlResponse;
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: BASIC_AUTH_CHALLENGE,
  });
}

export const config = {
  // /api is INCLUDED so the site split can police it (see the API branch
  // above); _next and static files stay out.
  // /api is INCLUDED so the site split can police it (see the API branch
  // above); _next and static files stay out.
  matcher: ["/((?!_next|.*\\..*).*)"],
};
