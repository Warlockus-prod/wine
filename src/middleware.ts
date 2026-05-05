/**
 * Composed middleware: i18n routing + lightweight admin gate.
 *
 * Runs in edge runtime — must NOT import the full Auth.js config (which
 * pulls postgres + nodemailer, neither available in edge). Instead we
 * probe the standard Auth.js session cookie. Real session validation
 * happens in API route handlers and `auth()` calls inside server pages
 * where node runtime is available.
 *
 * If AUTH_GATE_ADMIN=0 the gate is fully disabled (current pilot mode —
 * admin stays open while SMTP for magic-link is being set up).
 */

import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intl = createIntlMiddleware(routing);

const ADMIN_PATH_RE = /^\/(?:[a-z]{2}\/)?admin(\/|$)/;
const SIGNIN_PATH_RE = /^\/(?:[a-z]{2}\/)?admin\/signin(\/|$)/;
const GATE_ENABLED = process.env.AUTH_GATE_ADMIN === "1";

const SESSION_COOKIE_NAMES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export default function middleware(request: NextRequest) {
  const intlResponse = intl(request);
  if (!GATE_ENABLED) return intlResponse;

  const { pathname, search } = request.nextUrl;
  if (!ADMIN_PATH_RE.test(pathname)) return intlResponse;
  if (SIGNIN_PATH_RE.test(pathname)) return intlResponse;

  // Cheap cookie probe — sufficient gatekeeper at the edge. The actual
  // session is re-validated server-side via auth() in API/RSC.
  const hasSession = SESSION_COOKIE_NAMES.some((name) => request.cookies.get(name));
  if (hasSession) return intlResponse;

  const localeMatch = pathname.match(/^\/([a-z]{2})\//);
  const localePrefix = localeMatch ? `/${localeMatch[1]}` : "";
  const returnTo = encodeURIComponent(pathname + search);
  return NextResponse.redirect(
    new URL(`${localePrefix}/admin/signin?returnTo=${returnTo}`, request.url),
  );
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
