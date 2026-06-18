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

const intl = createIntlMiddleware(routing);

const ADMIN_PATH_RE = /^\/(?:[a-z]{2}\/)?admin(\/|$)/;

export default function middleware(request: NextRequest) {
  const intlResponse = intl(request);
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
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
