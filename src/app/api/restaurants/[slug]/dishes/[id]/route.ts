import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { NextResponse } from "next/server";
import { db, schema } from "@/db";
import { ApiError, apiHandler, requireAuth, requireRestaurantMember } from "@/lib/api-acl";
import { logEvent } from "@/lib/server-events";
import { toLocalizedString } from "@/lib/localized";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const localized = z.union([z.string().min(1).max(500), z.object({ en: z.string(), pl: z.string() })]);
const updateSchema = z
  .object({
    name: localized.optional(),
    description: localized.optional(),
    category: z.string().min(1).max(80).optional(),
    price: z.number().nonnegative().max(99999).optional(),
    imageUrl: z.string().url().max(2000).nullable().optional(),
    tags: z.array(z.string().max(40)).max(8).optional(),
    sortOrder: z.number().int().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "Empty payload" });

async function loadDish(restaurantId: string, id: string) {
  const [row] = await db
    .select()
    .from(schema.dishes)
    .where(and(eq(schema.dishes.id, id), eq(schema.dishes.restaurantId, restaurantId)))
    .limit(1);
  if (!row) throw new ApiError(404, "Dish not found");
  return row;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  return apiHandler(async () => {
    const { slug, id } = await params;
    const user = await requireAuth();
    const restaurant = await requireRestaurantMember(user, slug);
    await loadDish(restaurant.id, id); // 404 guard

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(400, "Invalid JSON");
    }
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) throw new ApiError(400, "Invalid payload");

    const patch: Partial<typeof schema.dishes.$inferInsert> = { updatedAt: new Date() };
    if (parsed.data.name !== undefined) patch.name = toLocalizedString(parsed.data.name);
    if (parsed.data.description !== undefined)
      patch.description = toLocalizedString(parsed.data.description);
    if (parsed.data.category !== undefined) patch.category = parsed.data.category;
    if (parsed.data.price !== undefined) patch.price = String(parsed.data.price);
    if (parsed.data.imageUrl !== undefined) patch.imageUrl = parsed.data.imageUrl;
    if (parsed.data.tags !== undefined) patch.tags = parsed.data.tags;
    if (parsed.data.sortOrder !== undefined) patch.sortOrder = parsed.data.sortOrder;

    const [row] = await db
      .update(schema.dishes)
      .set(patch)
      .where(eq(schema.dishes.id, id))
      .returning();

    void logEvent({
      type: "admin_dish_update",
      restaurantId: restaurant.id,
      dishId: id,
      props: { actor: user.id, fields: Object.keys(parsed.data) },
    });

    return NextResponse.json({ data: row });
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ slug: string; id: string }> },
) {
  return apiHandler(async () => {
    const { slug, id } = await params;
    const user = await requireAuth();
    const restaurant = await requireRestaurantMember(user, slug);
    await loadDish(restaurant.id, id);

    await db.delete(schema.dishes).where(eq(schema.dishes.id, id));

    void logEvent({
      type: "admin_dish_delete",
      restaurantId: restaurant.id,
      dishId: id,
      props: { actor: user.id },
    });

    return NextResponse.json({ ok: true });
  });
}
