import { NextResponse } from "next/server";
import { z } from "zod";
import { logEvent } from "@/lib/server-events";
import { EVENT_TYPES, type EventType } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Client-side analytics ingest. Accepts either single event or batch.
// Soft-fail on validation error so a bad client never gets a 4xx that
// trips browser network panels.

const eventSchema = z.object({
  type: z.enum(EVENT_TYPES as readonly [EventType, ...EventType[]]),
  restaurantId: z.string().uuid().nullish(),
  dishId: z.string().uuid().nullish(),
  wineId: z.string().uuid().nullish(),
  profileId: z.string().uuid().nullish(),
  sessionId: z.string().nullish(),
  anonymousId: z.string().uuid().nullish(),
  props: z.record(z.string(), z.unknown()).optional(),
});

const payloadSchema = z.union([eventSchema, z.array(eventSchema).max(50)]);

export async function POST(request: Request) {
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
  // Fire-and-forget — never block the client. Errors logged in logEvent.
  await Promise.all(list.map((e) => logEvent(e)));

  return NextResponse.json({ ok: true, count: list.length });
}
