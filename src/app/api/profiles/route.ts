import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { logEvent } from "@/lib/server-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Anonymous-id is a uuid v4 minted client-side and stored in localStorage.
// We trust it as an opaque token — no privacy claim, just a stable
// identifier so the same browser can re-open its profile later.

const profileSchema = z.object({
  anonymousId: z.string().uuid(),
  compass: z.record(z.string(), z.number().min(0).max(4)),
  baseTastes: z.record(z.string(), z.number().min(0).max(4)),
});

/** GET /api/profiles?anonymousId=... — restore on revisit. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const anonymousId = url.searchParams.get("anonymousId");
  if (!anonymousId) return NextResponse.json({ error: "anonymousId required" }, { status: 400 });

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

/** POST /api/profiles — upsert by anonymousId. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = profileSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.format() },
      { status: 400 },
    );
  }

  try {
    const [row] = await db
      .insert(schema.tasteProfiles)
      .values({
        anonymousId: parsed.data.anonymousId,
        compass: parsed.data.compass,
        baseTastes: parsed.data.baseTastes,
      })
      .returning({ id: schema.tasteProfiles.id });

    await logEvent({
      type: "profile_save",
      profileId: row.id,
      anonymousId: parsed.data.anonymousId,
      props: {
        compass_keys: Object.keys(parsed.data.compass).length,
      },
    });

    return NextResponse.json({ data: { id: row.id } });
  } catch (err) {
    console.warn("[profiles] POST failed", err);
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }
}
