/**
 * Server-side analytics ingest helper.
 *
 * Use from API routes whenever a server-tracked moment happens (pairing
 * request, chat reply, admin write). Client-side events go through
 * /api/events to land in the same table.
 *
 * Soft-fail on DB error — never block the user-facing response if analytics
 * write hiccups. Errors logged to console for ops to triage.
 */

import { db } from "@/db";
import { events, type EventType } from "@/db/schema";

interface LogEventInput {
  type: EventType;
  restaurantId?: string | null;
  dishId?: string | null;
  wineId?: string | null;
  profileId?: string | null;
  sessionId?: string | null;
  anonymousId?: string | null;
  props?: Record<string, unknown>;
}

export async function logEvent(input: LogEventInput): Promise<void> {
  try {
    await db.insert(events).values({
      eventType: input.type,
      restaurantId: input.restaurantId ?? null,
      dishId: input.dishId ?? null,
      wineId: input.wineId ?? null,
      profileId: input.profileId ?? null,
      sessionId: input.sessionId ?? null,
      anonymousId: input.anonymousId ?? null,
      props: input.props ?? {},
    });
  } catch (err) {
    // Don't throw — analytics never blocks UX.
    console.warn("[events] insert failed", { type: input.type, err });
  }
}
