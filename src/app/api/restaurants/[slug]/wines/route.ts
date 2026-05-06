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
  region: z.string().min(1).max(120),
  grape: z.string().min(1).max(120),
  style: z.string().min(1).max(60),
  vintage: z.string().max(20).optional(),
  year: z.number().int().min(1900).max(2100).optional(),
  price: z.number().nonnegative().max(99999),
  rating: z.number().min(0).max(5).optional(),
  imageUrl: z.string().url().max(2000).optional(),
  notes: localized,
  tags: z.array(z.string().max(40)).max(8).optional(),
  body: z.enum(["light", "medium", "full"]).optional(),
  acidity: z.enum(["low", "medium", "high"]).optional(),
  tannin: z.enum(["none", "soft", "medium", "high"]).optional(),
  abv: z.number().min(0).max(20).optional(),
  servingTempC: z.string().max(20).optional(),
  decant: z.string().max(200).optional(),
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
      .from(schema.wines)
      .where(eq(schema.wines.restaurantId, restaurant.id))
      .orderBy(asc(schema.wines.sortOrder));
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
      .insert(schema.wines)
      .values({
        restaurantId: restaurant.id,
        externalId: parsed.data.externalId,
        name: toLocalizedString(parsed.data.name),
        notes: toLocalizedString(parsed.data.notes),
        region: parsed.data.region,
        grape: parsed.data.grape,
        style: parsed.data.style,
        vintage: parsed.data.vintage,
        year: parsed.data.year,
        price: String(parsed.data.price),
        rating: parsed.data.rating !== undefined ? String(parsed.data.rating) : undefined,
        imageUrl: parsed.data.imageUrl,
        tags: parsed.data.tags ?? [],
        body: parsed.data.body ?? "medium",
        acidity: parsed.data.acidity ?? "medium",
        tannin: parsed.data.tannin ?? "medium",
        abv: parsed.data.abv !== undefined ? String(parsed.data.abv) : undefined,
        servingTempC: parsed.data.servingTempC,
        decant: parsed.data.decant,
        sortOrder: parsed.data.sortOrder ?? 0,
      })
      .returning();

    void logEvent({
      type: "admin_wine_create",
      restaurantId: restaurant.id,
      wineId: row.id,
      props: { actor: user.id, role: user.role },
    });

    return NextResponse.json({ data: row });
  });
}
