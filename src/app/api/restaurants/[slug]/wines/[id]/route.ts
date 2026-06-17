import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import {
  ApiError,
  apiHandler,
  requireAuth,
  requireRestaurantMember,
  enforceWriteRateLimit,
} from "@/lib/api-acl";
import { logEvent } from "@/lib/server-events";
import { toLocalizedString } from "@/lib/localized";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const localized = z.union([z.string().min(1).max(500), z.object({ en: z.string(), pl: z.string() })]);
const updateSchema = z
  .object({
    name: localized.optional(),
    region: z.string().min(1).max(120).optional(),
    grape: z.string().min(1).max(120).optional(),
    style: z.string().min(1).max(60).optional(),
    vintage: z.string().max(20).nullable().optional(),
    year: z.number().int().min(1900).max(2100).nullable().optional(),
    price: z.number().nonnegative().max(99999).optional(),
    rating: z.number().min(0).max(5).nullable().optional(),
    imageUrl: z.string().url().max(2000).nullable().optional(),
    notes: localized.optional(),
    tags: z.array(z.string().max(40)).max(8).optional(),
    body: z.enum(["light", "medium", "full"]).optional(),
    acidity: z.enum(["low", "medium", "high"]).optional(),
    tannin: z.enum(["none", "soft", "medium", "high"]).optional(),
    abv: z.number().min(0).max(20).nullable().optional(),
    servingTempC: z.string().max(20).nullable().optional(),
    decant: z.string().max(200).nullable().optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Empty payload" });

async function loadWine(restaurantId: string, id: string) {
  const [row] = await db
    .select()
    .from(schema.wines)
    .where(and(eq(schema.wines.id, id), eq(schema.wines.restaurantId, restaurantId)))
    .limit(1);
  if (!row) throw new ApiError(404, "Wine not found");
  return row;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  return apiHandler(async () => {
    enforceWriteRateLimit(request);
    const { slug, id } = await params;
    const user = await requireAuth(request);
    const restaurant = await requireRestaurantMember(user, slug);
    await loadWine(restaurant.id, id);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Invalid JSON");
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Invalid payload");

    const patch: Partial<typeof schema.wines.$inferInsert> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) patch.name = toLocalizedString(parsed.data.name);
    if (parsed.data.notes !== undefined) patch.notes = toLocalizedString(parsed.data.notes);
    for (const k of [
      "region",
      "grape",
      "style",
      "vintage",
      "year",
      "imageUrl",
      "tags",
      "body",
      "acidity",
      "tannin",
      "servingTempC",
      "decant",
      "sortOrder",
    ] as const) {
      const v = parsed.data[k];
      if (v !== undefined) (patch as Record<string, unknown>)[k] = v;
    }
    if (parsed.data.price !== undefined) patch.price = String(parsed.data.price);
    if (parsed.data.rating !== undefined && parsed.data.rating !== null)
      patch.rating = String(parsed.data.rating);
    if (parsed.data.abv !== undefined && parsed.data.abv !== null)
      patch.abv = String(parsed.data.abv);

    const [row] = await db
      .update(schema.wines)
      .set(patch)
      .where(and(eq(schema.wines.id, id), eq(schema.wines.restaurantId, restaurant.id)))
      .returning();

    void logEvent({
      type: "admin_wine_update",
      restaurantId: restaurant.id,
      wineId: id,
      props: { actor: user.id, fields: Object.keys(parsed.data) },
    });

    return NextResponse.json({ data: row });
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  return apiHandler(async () => {
    enforceWriteRateLimit(request);
    const { slug, id } = await params;
    const user = await requireAuth(request);
    const restaurant = await requireRestaurantMember(user, slug);
    await loadWine(restaurant.id, id);

    await db
      .delete(schema.wines)
      .where(and(eq(schema.wines.id, id), eq(schema.wines.restaurantId, restaurant.id)));

    void logEvent({
      type: "admin_wine_delete",
      restaurantId: restaurant.id,
      wineId: id,
      props: { actor: user.id },
    });

    return NextResponse.json({ ok: true });
  });
}
