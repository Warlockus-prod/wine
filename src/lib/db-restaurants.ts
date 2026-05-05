/**
 * DB-backed restaurant queries.
 *
 * Mapping: DB row ⇄ legacy Restaurant/CatalogRestaurant types so existing
 * UI keeps working without rewrite. The DB is canonical; seed-restaurants
 * stays as the source-of-truth template that the seed script loads on first
 * deploy.
 *
 * Fallback: if DB is unreachable (early dev or VPS hiccup) we transparently
 * fall back to the in-repo seed so the app never goes dark. Logged loudly
 * so ops sees the regression.
 */

import { eq, asc } from "drizzle-orm";
import { db, schema } from "@/db";
import {
  decorateRestaurant,
  decorateRestaurants,
  type CatalogRestaurant,
} from "@/lib/restaurant-directory";
import { seedRestaurants } from "@/data/seed-restaurants";
import type { Restaurant, Dish, Wine } from "@/types/restaurant";

const FALLBACK_REASON = "demo seed";

/** Convert a DB row to the legacy `Restaurant` shape (with hydrated dishes/wines). */
async function rehydrate(row: typeof schema.restaurants.$inferSelect): Promise<Restaurant> {
  const [dishRows, wineRows, pairingRows] = await Promise.all([
    db
      .select()
      .from(schema.dishes)
      .where(eq(schema.dishes.restaurantId, row.id))
      .orderBy(asc(schema.dishes.sortOrder)),
    db
      .select()
      .from(schema.wines)
      .where(eq(schema.wines.restaurantId, row.id))
      .orderBy(asc(schema.wines.sortOrder)),
    db
      .select()
      .from(schema.curatedPairings)
      .where(eq(schema.curatedPairings.restaurantId, row.id)),
  ]);

  const wineExtById = new Map<string, string>(); // db wine id → external id
  for (const w of wineRows) {
    if (w.externalId) wineExtById.set(w.id, w.externalId);
  }

  const pairingsByDishDbId = new Map<string, { wineId: string; reason: unknown }[]>();
  for (const p of pairingRows) {
    const ext = wineExtById.get(p.wineId);
    if (!ext) continue;
    const list = pairingsByDishDbId.get(p.dishId) ?? [];
    list.push({ wineId: ext, reason: p.reason });
    pairingsByDishDbId.set(p.dishId, list);
  }

  const dishes: Dish[] = dishRows.map((d) => ({
    id: d.externalId ?? d.id,
    name: d.name as Dish["name"],
    description: d.description as Dish["description"],
    category: d.category,
    price: Number(d.price),
    pairings:
      (pairingsByDishDbId.get(d.id) ?? []).map((p) => ({
        wineId: p.wineId,
        reason: p.reason as Dish["pairings"][number]["reason"],
      })),
  }));

  const wines: Wine[] = wineRows.map((w) => ({
    id: w.externalId ?? w.id,
    name: w.name as Wine["name"],
    region: w.region,
    grape: w.grape,
    style: w.style,
    vintage: w.vintage ?? undefined,
    notes: w.notes as Wine["notes"],
  }));

  return {
    id: row.id,
    slug: row.slug,
    name: row.name as Restaurant["name"],
    cuisine: row.cuisine,
    city: row.city,
    description: row.description as Restaurant["description"],
    coverGradient: row.coverGradient,
    dishes,
    wines,
  };
}

export async function listRestaurantsFromDb(): Promise<CatalogRestaurant[] | null> {
  try {
    const rows = await db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.published, true))
      .orderBy(asc(schema.restaurants.city));
    if (rows.length === 0) return null;
    const hydrated = await Promise.all(rows.map(rehydrate));
    return decorateRestaurants(hydrated);
  } catch (err) {
    console.warn("[db-restaurants] list failed, falling back to seed", err);
    return null;
  }
}

export async function getRestaurantBySlugFromDb(
  slug: string,
): Promise<CatalogRestaurant | null> {
  try {
    const [row] = await db
      .select()
      .from(schema.restaurants)
      .where(eq(schema.restaurants.slug, slug))
      .limit(1);
    if (!row) return null;
    const hydrated = await rehydrate(row);
    return decorateRestaurant(hydrated, 0);
  } catch (err) {
    console.warn("[db-restaurants] get-by-slug failed, falling back to seed", err);
    return null;
  }
}

/** Resolve restaurants with DB → seed fallback. Used by API routes + RSC. */
export async function resolveRestaurants(): Promise<{
  data: CatalogRestaurant[];
  source: "db" | "seed";
}> {
  const fromDb = await listRestaurantsFromDb();
  if (fromDb && fromDb.length > 0) {
    return { data: fromDb, source: "db" };
  }
  return { data: decorateRestaurants(seedRestaurants), source: FALLBACK_REASON as "seed" };
}

export async function resolveRestaurantBySlug(
  slug: string,
): Promise<{ data: CatalogRestaurant | null; source: "db" | "seed" }> {
  const fromDb = await getRestaurantBySlugFromDb(slug);
  if (fromDb) return { data: fromDb, source: "db" };
  const fromSeed = decorateRestaurants(seedRestaurants).find((r) => r.slug === slug);
  return { data: fromSeed ?? null, source: "seed" };
}
