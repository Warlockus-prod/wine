/**
 * API access-control helpers — for write routes.
 *
 * Two layers:
 *  - requireAuth: returns the active user or throws 401.
 *  - requireRestaurantMember: confirms userId is in restaurant_members for
 *    the slug; throws 403 otherwise. Owner role implies write access; the
 *    `viewer` role is read-only and rejected from write routes.
 *
 * AUTH_GATE_ADMIN env: when "0" (current pilot mode), `requireAuth` becomes
 * a permissive no-op that returns a synthetic "pilot" user — keeps the
 * write API testable end-to-end before SMTP/auth lands.
 */

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db, schema } from "@/db";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { checkBasicAuth } from "@/lib/admin-auth";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    /** Optional seconds for a Retry-After header (e.g. on 429). */
    public retryAfter?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const PILOT_MODE = () => process.env.AUTH_GATE_ADMIN !== "1";

interface ApiUser {
  id: string;
  email?: string | null;
  role: "admin" | "staff" | "guest" | "pilot";
}

export async function requireAuth(request?: Request): Promise<ApiUser> {
  if (PILOT_MODE()) {
    return { id: "pilot", email: null, role: "pilot" };
  }
  // Gate ON. Accept the simple env Basic Auth admin (pilot stopgap, audit C1) —
  // creds live in ADMIN_USER/ADMIN_PASSWORD, no SMTP/DB bootstrap needed.
  if (request && checkBasicAuth(request.headers.get("authorization"))) {
    return { id: "admin", email: null, role: "admin" };
  }
  // …or a real Auth.js magic-link session, if one exists.
  const session = await auth();
  if (!session?.user?.id) {
    throw new ApiError(401, "Authentication required");
  }
  return {
    id: session.user.id,
    email: session.user.email,
    role: ((session.user as { role?: string }).role ?? "staff") as ApiUser["role"],
  };
}

/**
 * Resolve restaurant by slug AND check membership in one shot.
 * Returns the restaurant row so handlers don't have to re-fetch.
 *
 * In pilot mode (AUTH_GATE_ADMIN=0), membership is bypassed — any user
 * (including the synthetic pilot user) can write to any restaurant. This
 * is the *demonstrated* gap; flipping the env reinstates real ACL.
 */
export async function requireRestaurantMember(
  user: ApiUser,
  slug: string,
): Promise<typeof schema.restaurants.$inferSelect> {
  const [restaurant] = await db
    .select()
    .from(schema.restaurants)
    .where(eq(schema.restaurants.slug, slug))
    .limit(1);
  if (!restaurant) {
    throw new ApiError(404, `Restaurant '${slug}' not found`);
  }
  if (PILOT_MODE() || user.role === "admin") {
    return restaurant;
  }
  const [membership] = await db
    .select()
    .from(schema.restaurantMembers)
    .where(
      and(
        eq(schema.restaurantMembers.restaurantId, restaurant.id),
        eq(schema.restaurantMembers.userId, user.id),
      ),
    )
    .limit(1);
  if (!membership) {
    throw new ApiError(403, "Not a member of this restaurant");
  }
  if (membership.role === "viewer") {
    throw new ApiError(403, "Viewers cannot modify content");
  }
  return restaurant;
}

/** Wrap an API handler so ApiError is converted to JSON+status. */
export function apiHandler<T>(handler: () => Promise<T>): Promise<NextResponse> {
  return handler()
    .then((data) => NextResponse.json(data))
    .catch((err: unknown) => {
      if (err instanceof ApiError) {
        return NextResponse.json(
          { error: err.message },
          {
            status: err.status,
            headers: err.retryAfter ? { "Retry-After": String(err.retryAfter) } : undefined,
          },
        );
      }
      console.error("[api] unexpected", err);
      return NextResponse.json(
        { error: "Internal error" },
        { status: 500 },
      );
    });
}

// ─── Write-route throttle ──────────────────────────────────────────────
// Per-IP sliding window on mutating requests. Generous enough that bulk menu
// editing in /admin never trips it, tight enough to blunt an open-gate flood
// (defacement / DB-bloat) while AUTH_GATE_ADMIN=0. Tighten once the gate is on.
const WRITE_LIMIT = 120;
const WRITE_WINDOW_MS = 60_000;

/** Throttle a mutating request by client IP; throws 429 when exceeded. */
export function enforceWriteRateLimit(request: Request): void {
  const verdict = rateLimit(`write:${clientIp(request)}`, WRITE_LIMIT, WRITE_WINDOW_MS);
  if (!verdict.ok) {
    throw new ApiError(429, "Too many requests - slow down.", verdict.retryAfter);
  }
}
