#!/usr/bin/env -S npx tsx
/**
 * Idempotent DB seed — seed-restaurants.ts → Postgres.
 *
 * TypeScript so we can `import { seedRestaurants }` directly without
 * brittle source parsing. Run via tsx (npm devDep) inside the deploy
 * container.
 *
 * Re-runs safely on every deploy — `ON CONFLICT DO NOTHING` for content
 * rows, restaurant slug is the natural upsert key for tenant rows.
 */

import "dotenv/config";
import postgres from "postgres";
import { seedRestaurants } from "../src/data/seed-restaurants";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

// Restaurant meta (lat/lng/country/format/district) — mirror of
// restaurant-directory.ts kept inline so this script has no ts-path-alias
// dependency tree to chase.
const META: Record<string, { country: string; format: string; district: string; lat: number; lng: number }> = {
  "trattoria-bellavista": { country: "Italy", format: "Trattoria", district: "Santa Croce", lat: 45.4408, lng: 12.3155 },
  "sakura-ember": { country: "Denmark", format: "Chef's Table", district: "Christianshavn", lat: 55.6717, lng: 12.5912 },
  "brasa-iberica": { country: "Spain", format: "Grill House", district: "Salamanca", lat: 40.4286, lng: -3.6772 },
  "bistro-maree": { country: "France", format: "Bistro", district: "Presqu'ile", lat: 45.7595, lng: 4.8346 },
  "andes-fuego": { country: "Portugal", format: "Fusion Bar", district: "Chiado", lat: 38.7110, lng: -9.1416 },
  "atelier-amaro": { country: "Polska", format: "Gastropub", district: "Stare Miasto", lat: 51.1100, lng: 17.0303 },
};

const fallbackMeta = (slug: string, city: string, idx: number) => ({
  country: "Polska",
  format: "Restaurant",
  district: city || "Centrum",
  lat: 52.2297 + idx * 0.01,
  lng: 21.0122 + idx * 0.01,
});

type Wine = (typeof seedRestaurants)[number]["wines"][number];

function inferBody(w: Wine) {
  const text = `${w.name?.en ?? ""} ${w.grape ?? ""} ${w.style ?? ""} ${w.notes?.en ?? ""}`.toLowerCase();
  if (/(cabernet|malbec|syrah|shiraz|tignanello|brunello|valbuena|chateauneuf|beaucastel|santa rita|cobos)/.test(text))
    return "full";
  if (/(riesling|albarino|pinot grigio|rose|sancerre|gavi|sparkling|champagne|brut|chablis)/.test(text))
    return "light";
  return "medium";
}
function inferAcidity(w: Wine) {
  const text = `${w.name?.en ?? ""} ${w.grape ?? ""} ${w.style ?? ""} ${w.notes?.en ?? ""}`.toLowerCase();
  if (/(riesling|sancerre|chablis|albarino|gavi|pinot grigio|sparkling|champagne|brut|citrus|crisp|saline|mineral)/.test(text))
    return "high";
  return "medium";
}
function inferTannin(w: Wine) {
  const text = `${w.name?.en ?? ""} ${w.grape ?? ""} ${w.style ?? ""} ${w.notes?.en ?? ""}`.toLowerCase();
  if (!text.includes("red") && !/(cabernet|malbec|tempranillo|sangiovese|merlot|pinot noir|zinfandel|carmenere)/.test(text))
    return "none";
  if (/(cabernet|malbec|tempranillo|brunello|valbuena|tignanello|chateauneuf|beaucastel)/.test(text))
    return "high";
  if (/(pinot noir|meiomi|jadot)/.test(text)) return "soft";
  return "medium";
}
function inferAbv(w: Wine) {
  const body = inferBody(w);
  if ((w.style ?? "").toLowerCase().includes("sparkling")) return 12.5;
  if ((w.style ?? "").toLowerCase().includes("dessert")) return 14;
  return body === "full" ? 14.5 : body === "medium" ? 13.5 : 12.5;
}

const stats = { restaurants: 0, dishes: 0, wines: 0, pairings: 0, skippedDishes: 0, skippedWines: 0 };

console.log(`Loaded seed: ${seedRestaurants.length} restaurants`);

for (let rIdx = 0; rIdx < seedRestaurants.length; rIdx++) {
  const seed = seedRestaurants[rIdx];
  const m = META[seed.slug] ?? fallbackMeta(seed.slug, seed.city, rIdx);

  await sql.begin(async (tx) => {
    const [r] = await tx`
      INSERT INTO restaurants (slug, name, description, cuisine, city, country, district, cover_gradient, lat, lng)
      VALUES (
        ${seed.slug},
        ${JSON.stringify(seed.name)}::jsonb,
        ${JSON.stringify(seed.description)}::jsonb,
        ${seed.cuisine},
        ${seed.city},
        ${m.country},
        ${m.district},
        ${seed.coverGradient},
        ${m.lat},
        ${m.lng}
      )
      ON CONFLICT (slug) DO UPDATE
        SET name = EXCLUDED.name,
            description = EXCLUDED.description,
            cuisine = EXCLUDED.cuisine,
            city = EXCLUDED.city,
            updated_at = NOW()
      RETURNING id, slug
    `;
    stats.restaurants++;

    const dishIdMap = new Map<string, string>();
    for (let i = 0; i < seed.dishes.length; i++) {
      const d = seed.dishes[i];
      const inserted = await tx`
        INSERT INTO dishes (
          restaurant_id, external_id, name, description, category, price, sort_order
        ) VALUES (
          ${r.id},
          ${d.id},
          ${JSON.stringify(d.name)}::jsonb,
          ${JSON.stringify(d.description)}::jsonb,
          ${d.category},
          ${Number(d.price ?? 0)},
          ${i}
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      if (inserted.length > 0) {
        dishIdMap.set(d.id, inserted[0].id as string);
        stats.dishes++;
      } else {
        const existing = await tx`SELECT id FROM dishes WHERE restaurant_id = ${r.id} AND external_id = ${d.id}`;
        if (existing.length > 0) dishIdMap.set(d.id, existing[0].id as string);
        stats.skippedDishes++;
      }
    }

    const wineIdMap = new Map<string, string>();
    for (let i = 0; i < seed.wines.length; i++) {
      const w = seed.wines[i];
      const yearNum = Number.parseInt(String(w.vintage ?? ""), 10);
      const inserted = await tx`
        INSERT INTO wines (
          restaurant_id, external_id, name, region, grape, style, vintage, year, price, notes,
          body, acidity, tannin, abv, sort_order
        ) VALUES (
          ${r.id},
          ${w.id},
          ${JSON.stringify(w.name)}::jsonb,
          ${w.region},
          ${w.grape},
          ${w.style},
          ${w.vintage ?? null},
          ${Number.isFinite(yearNum) ? yearNum : null},
          ${Number(0)},
          ${JSON.stringify(w.notes)}::jsonb,
          ${inferBody(w)},
          ${inferAcidity(w)},
          ${inferTannin(w)},
          ${inferAbv(w)},
          ${i}
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      if (inserted.length > 0) {
        wineIdMap.set(w.id, inserted[0].id as string);
        stats.wines++;
      } else {
        const existing = await tx`SELECT id FROM wines WHERE restaurant_id = ${r.id} AND external_id = ${w.id}`;
        if (existing.length > 0) wineIdMap.set(w.id, existing[0].id as string);
        stats.skippedWines++;
      }
    }

    for (const d of seed.dishes) {
      const dishDbId = dishIdMap.get(d.id);
      if (!dishDbId) continue;
      for (const p of d.pairings ?? []) {
        const wineDbId = wineIdMap.get(p.wineId);
        if (!wineDbId) continue;
        const inserted = await tx`
          INSERT INTO curated_pairings (restaurant_id, dish_id, wine_id, reason)
          VALUES (
            ${r.id},
            ${dishDbId},
            ${wineDbId},
            ${JSON.stringify(p.reason)}::jsonb
          )
          ON CONFLICT (restaurant_id, dish_id, wine_id) DO NOTHING
          RETURNING id
        `;
        if (inserted.length > 0) stats.pairings++;
      }
    }
  });
}

console.log("Seed complete:", stats);
await sql.end();
