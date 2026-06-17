/**
 * /api/restaurants/[slug]/pairings
 *  GET    — list curated pairings (public)
 *  POST   — upsert one curated pairing (admin/editor)
 *  DELETE — remove via ?dishId=&wineId=
 *
 * Pairings have a unique (restaurant_id, dish_id, wine_id) constraint, so
 * POST is idempotent — submit the same triple twice and it updates the
 * reason / boost.
 */

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

const upsertSchema = z.object({
  dishId: z.string().uuid(),
  wineId: z.string().uuid(),
  reason: localized,
  boost: z.number().int().min(0).max(40).optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return apiHandler(async () => {
    const { slug } = await params;
    const [restaurant] = await db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.slug, slug))
      .limit(1);
    if (!restaurant) throw new ApiError(404, "Restaurant not found");
    const rows = await db
      .select()
      .from(schema.curatedPairings)
      .where(eq(schema.curatedPairings.restaurantId, restaurant.id));
    return { data: rows };
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return apiHandler(async () => {
    enforceWriteRateLimit(request);
    const { slug } = await params;
    const user = await requireAuth(request);
    const restaurant = await requireRestaurantMember(user, slug);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Invalid JSON");
    }
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Invalid payload");

    // Verify dish + wine belong to this restaurant.
    const [dish] = await db
      .select({ id: schema.dishes.id })
      .from(schema.dishes)
      .where(and(eq(schema.dishes.id, parsed.data.dishId), eq(schema.dishes.restaurantId, restaurant.id)))
      .limit(1);
    if (!dish) throw new ApiError(404, "Dish not found in this restaurant");
    const [wine] = await db
      .select({ id: schema.wines.id })
      .from(schema.wines)
      .where(and(eq(schema.wines.id, parsed.data.wineId), eq(schema.wines.restaurantId, restaurant.id)))
      .limit(1);
    if (!wine) throw new ApiError(404, "Wine not found in this restaurant");

    const reason = toLocalizedString(parsed.data.reason);
    const boost = parsed.data.boost ?? 15;

    const [row] = await db
      .insert(schema.curatedPairings)
      .values({
        restaurantId: restaurant.id,
        dishId: parsed.data.dishId,
        wineId: parsed.data.wineId,
        reason,
        boost,
      })
      .onConflictDoUpdate({
        target: [
          schema.curatedPairings.restaurantId,
          schema.curatedPairings.dishId,
          schema.curatedPairings.wineId,
        ],
        set: { reason, boost, updatedAt: new Date() },
      })
      .returning();

    void logEvent({
      type: "admin_pairing_create",
      restaurantId: restaurant.id,
      dishId: parsed.data.dishId,
      wineId: parsed.data.wineId,
      props: { actor: user.id },
    });

    return NextResponse.json({ data: row });
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return apiHandler(async () => {
    enforceWriteRateLimit(request);
    const { slug } = await params;
    const url = new URL(request.url);
    const ids = z
      .object({ dishId: z.string().uuid(), wineId: z.string().uuid() })
      .safeParse({
        dishId: url.searchParams.get("dishId"),
        wineId: url.searchParams.get("wineId"),
      });
    if (!ids.success) throw new ApiError(400, "Valid dishId & wineId required");

    const user = await requireAuth(request);
    const restaurant = await requireRestaurantMember(user, slug);

    const result = await db
      .delete(schema.curatedPairings)
      .where(
        and(
          eq(schema.curatedPairings.restaurantId, restaurant.id),
          eq(schema.curatedPairings.dishId, ids.data.dishId),
          eq(schema.curatedPairings.wineId, ids.data.wineId),
        ),
      )
      .returning({ id: schema.curatedPairings.id });

    void logEvent({
      type: "admin_pairing_delete",
      restaurantId: restaurant.id,
      dishId: ids.data.dishId,
      wineId: ids.data.wineId,
      props: { actor: user.id },
    });

    return NextResponse.json({ ok: true, deleted: result.length });
  });
}
