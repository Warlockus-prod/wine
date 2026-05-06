/**
 * /api/restaurants/[slug]/dishes
 *  GET   — list dishes for a restaurant (public)
 *  POST  — create a dish (admin/editor; pilot mode unrestricted)
 *
 * Localized fields (name, description) accept either a plain string (we
 * mirror to {en,pl}) or a fully-shaped {en,pl} object for explicit control.
 */

import { eq, asc } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { ApiError, apiHandler, requireAuth, requireRestaurantMember } from "@/lib/api-acl";
import { logEvent } from "@/lib/server-events";
import { toLocalizedString } from "@/lib/localized";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const localized = z.union([z.string().min(1).max(500), z.object({ en: z.string(), pl: z.string() })]);

const createSchema = z.object({
  name: localized,
  description: localized,
  category: z.string().min(1).max(80),
  price: z.number().nonnegative().max(99999),
  imageUrl: z.string().url().max(2000).optional(),
  tags: z.array(z.string().max(40)).max(8).optional(),
  externalId: z.string().max(60).optional(),
  sortOrder: z.number().int().optional(),
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
      .from(schema.dishes)
      .where(eq(schema.dishes.restaurantId, restaurant.id))
      .orderBy(asc(schema.dishes.sortOrder));
    return { data: rows };
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  return apiHandler(async () => {
    const { slug } = await params;
    const user = await requireAuth();
    const restaurant = await requireRestaurantMember(user, slug);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Invalid JSON");
    }
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Invalid payload");

    const [row] = await db
      .insert(schema.dishes)
      .values({
        restaurantId: restaurant.id,
        externalId: parsed.data.externalId,
        name: toLocalizedString(parsed.data.name),
        description: toLocalizedString(parsed.data.description),
        category: parsed.data.category,
        price: String(parsed.data.price),
        imageUrl: parsed.data.imageUrl,
        tags: parsed.data.tags ?? [],
        sortOrder: parsed.data.sortOrder ?? 0,
      })
      .returning();

    void logEvent({
      type: "admin_dish_create",
      restaurantId: restaurant.id,
      dishId: row.id,
      props: { actor: user.id, role: user.role },
    });

    return NextResponse.json({ data: row });
  });
}
