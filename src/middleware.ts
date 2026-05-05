/**
 * Composed middleware: i18n routing + admin auth gate.
 *
 * 1) i18n routing (next-intl) — adds /pl/... prefix as needed, sets locale
 *    cookie. Runs first because admin pages live under [locale]/admin.
 * 2) Auth gate — any /admin or /pl/admin path requires a session OR is
 *    explicitly the signin page. Unauthed users get redirected to signin
 *    with a returnTo param so post-login they land where they aimed.
 *
 * The /admin route stays open in early-pilot mode if AUTH_GATE_ADMIN=0.
 * That keeps the demo open for sales meetings while we wire SMTP for the
 * real magic-link flow.
 */

import { NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { auth } from "./auth";

const intl = createIntlMiddleware(routing);

const ADMIN_PATH_RE = /^\/(?:[a-z]{2}\/)?admin(\/|$)/;
const SIGNIN_PATH_RE = /^\/(?:[a-z]{2}\/)?admin\/signin(\/|$)/;
const GATE_ENABLED = process.env.AUTH_GATE_ADMIN !== "0";

export default async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // Pass-through to i18n first — it might issue a redirect for locale
  // negotiation; we'll re-evaluate auth on the redirected URL.
  const intlResponse = intl(request);

  if (!GATE_ENABLED) return intlResponse;
  if (!ADMIN_PATH_RE.test(pathname)) return intlResponse;
  if (SIGNIN_PATH_RE.test(pathname)) return intlResponse;

  // Check session — DrizzleAdapter reads from sessions table.
  const session = await auth();
  if (session?.user) return intlResponse;

  // Build sign-in URL preserving the locale prefix the user already had.
  const localeMatch = pathname.match(/^\/([a-z]{2})\//);
  const localePrefix = localeMatch ? `/${localeMatch[1]}` : "";
  const returnTo = encodeURIComponent(pathname + search);
  return NextResponse.redirect(
    new URL(`${localePrefix}/admin/signin?returnTo=${returnTo}`, request.url),
  );
}

export const config = {
  // Skip API, _next, static files. Auth.js routes live under /api/auth and
  // are excluded by the `api` token (Auth.js handles its own redirects).
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
