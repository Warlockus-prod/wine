import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { logEvent } from "@/lib/server-events";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Anonymous-id is a uuid v4 minted client-side and stored in localStorage.
// We trust it as an opaque token - no privacy claim, just a stable
// identifier so the same browser can re-open its profile later.

const profileSchema = z.object({
  anonymousId: z.string().uuid(),
  compass: z
    .record(z.string(), z.number().min(0).max(4))
    .refine((o) => Object.keys(o).length <= 24, "compass too large"),
  baseTastes: z
    .record(z.string(), z.number().min(0).max(4))
    .refine((o) => Object.keys(o).length <= 8, "baseTastes too large"),
});

/** GET /api/profiles?anonymousId=... - restore on revisit. */
export async function GET(request: Request) {
  const rl = rateLimit(`profiles-get:${clientIp(request)}`, 60, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { data: null, error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }
  const url = new URL(request.url);
  // Validate as a UUID (not just non-empty) so arbitrary strings can't probe
  // the profiles table (audit 2026-07).
  const parsed = z.string().uuid().safeParse(url.searchParams.get("anonymousId"));
  if (!parsed.success) {
    return NextResponse.json({ error: "valid anonymousId required" }, { status: 400 });
  }
  const anonymousId = parsed.data;

  try {
    const [row] = await db
      .select()
      .from(schema.tasteProfiles)
      .where(eq(schema.tasteProfiles.anonymousId, anonymousId))
      .limit(1);
    if (!row) return NextResponse.json({ data: null });
    return NextResponse.json({
      data: {
        id: row.id,
        anonymousId: row.anonymousId,
        compass: row.compass,
        baseTastes: row.baseTastes,
        updatedAt: row.updatedAt,
      },
    });
  } catch (err) {
    console.warn("[profiles] GET failed", err);
    return NextResponse.json({ data: null, error: "DB unavailable" }, { status: 503 });
  }
}

/** POST /api/profiles - upsert by anonymousId. */
export async function POST(request: Request) {
  const rl = rateLimit(`profiles:${clientIp(request)}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    // Don't echo the schema shape back to the client.
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    // Real upsert: anonymous_id is UNIQUE since migration 0002, so ON CONFLICT
    // replaces the old racy select-then-insert (audit M2 closed).
    const [row] = await db
      .insert(schema.tasteProfiles)
      .values({
        anonymousId: parsed.data.anonymousId,
        compass: parsed.data.compass,
        baseTastes: parsed.data.baseTastes,
      })
      .onConflictDoUpdate({
        target: schema.tasteProfiles.anonymousId,
        set: {
          compass: parsed.data.compass,
          baseTastes: parsed.data.baseTastes,
          updatedAt: new Date(),
        },
      })
      .returning({ id: schema.tasteProfiles.id });
    const id = row.id;

    await logEvent({
      type: "profile_save",
      profileId: id,
      anonymousId: parsed.data.anonymousId,
      props: { compass_keys: Object.keys(parsed.data.compass).length },
    });

    return NextResponse.json({ data: { id } });
  } catch (err) {
    console.warn("[profiles] POST failed", err);
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }
}
