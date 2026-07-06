import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { logEvent } from "@/lib/server-events";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Client-side analytics ingest. Accepts either single event or batch.
// Soft-fail on validation error so a bad client never gets a 4xx that
// trips browser network panels.

// Only these event types may be reported by the browser. Server-emitted types
// (admin_*, chat_*, pairing_match, profile_save) are written via logEvent
// directly and must NOT be forgeable from the client - accepting them here
// would let anyone poison the audit/analytics trail (audit M1).
const CLIENT_EVENT_TYPES = [
  "page_view",
  "restaurant_view",
  "dish_select",
  "wine_select",
  "pairing_request",
  "compass_intensity_set",
] as const;

const eventSchema = z.object({
  type: z.enum(CLIENT_EVENT_TYPES),
  restaurantId: z.string().uuid().nullish(),
  // Browsers know the public SLUG, not the DB uuid — accept it and resolve
  // server-side so events land with a real restaurant_id (the owner
  // dashboard aggregates on the indexed column, not on props JSON).
  restaurantSlug: z
    .string()
    .max(64)
    .regex(/^[a-z0-9][a-z0-9-]*$/)
    .nullish(),
  dishId: z.string().uuid().nullish(),
  wineId: z.string().uuid().nullish(),
  profileId: z.string().uuid().nullish(),
  sessionId: z.string().max(128).nullish(),
  anonymousId: z.string().uuid().nullish(),
  // Bound the free-form bag so it can't be used to bloat the events table.
  props: z
    .record(z.string(), z.unknown())
    .refine((p) => JSON.stringify(p).length <= 4000, "props too large")
    .optional(),
});

const payloadSchema = z.union([eventSchema, z.array(eventSchema).max(50)]);

export async function POST(request: Request) {
  const rl = rateLimit(`events:${clientIp(request)}`, 120, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: true });
  }

  const list = Array.isArray(parsed.data) ? parsed.data : [parsed.data];

  // Resolve restaurant SLUGs → uuids in one pass (module-level cache; the
  // slug set is tiny and stable). Soft-fail: unknown slug just means no
  // restaurant_id on the row — the event still lands.
  const slugs = [...new Set(list.map((e) => e.restaurantSlug).filter((s): s is string => !!s))];
  for (const slug of slugs) {
    if (slugIdCache.has(slug)) continue;
    try {
      const [row] = await db
        .select({ id: schema.restaurants.id })
        .from(schema.restaurants)
        .where(eq(schema.restaurants.slug, slug))
        .limit(1);
      slugIdCache.set(slug, row?.id ?? null);
    } catch {
      // DB hiccup — leave unresolved, don't block ingest.
    }
  }

  // Fire-and-forget - never block the client. Errors logged in logEvent.
  await Promise.all(
    list.map(({ restaurantSlug, ...e }) =>
      logEvent({
        ...e,
        restaurantId: e.restaurantId ?? (restaurantSlug ? slugIdCache.get(restaurantSlug) ?? null : null),
      }),
    ),
  );

  return NextResponse.json({ ok: true, count: list.length });
}

// slug → restaurant uuid (null = known-missing). Survives module re-eval via
// globalThis, same pattern as the rate-limit buckets.
const slugIdCache: Map<string, string | null> =
  ((globalThis as unknown) as { __wn_slugIds?: Map<string, string | null> }).__wn_slugIds ?? new Map();
((globalThis as unknown) as { __wn_slugIds?: Map<string, string | null> }).__wn_slugIds = slugIdCache;
