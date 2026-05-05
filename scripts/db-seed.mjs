#!/usr/bin/env node
/**
 * Idempotent DB seed — seed-restaurants.ts → Postgres.
 *
 * Run after `drizzle-kit migrate`. Safe to run on every deploy: skips
 * restaurants/dishes/wines/pairings that already exist (matched by
 * external_id which we set from the seed's stable id).
 *
 * Why a node script (not TS): keep deploy stack tiny — just node + pg, no
 * tsx, no node-loader. We import the compiled JSON-equivalent of the seed
 * file by reading the .ts source and parsing the literal — simple because
 * the seed file is plain literals, no logic.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import postgres from "postgres";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1 });

// ---------------------------------------------------------------------
// Load seed data — we evaluate the TS literal via a sandbox-y `Function`
// after stripping types/imports. The seed file is pure data with no
// runtime logic, so this works without tsx.
// ---------------------------------------------------------------------

const seedSrc = readFileSync(join(ROOT, "src/data/seed-restaurants.ts"), "utf-8");
const startMarker = "export const seedRestaurants";
const startIdx = seedSrc.indexOf(startMarker);
if (startIdx < 0) throw new Error("seedRestaurants export not found");
const literalStart = seedSrc.indexOf("[", startIdx);
let depth = 0;
let literalEnd = -1;
for (let i = literalStart; i < seedSrc.length; i++) {
  const ch = seedSrc[i];
  if (ch === "[") depth++;
  else if (ch === "]") {
    depth--;
    if (depth === 0) {
      literalEnd = i + 1;
      break;
    }
  }
}
if (literalEnd < 0) throw new Error("seedRestaurants array close not found");
const literal = seedSrc.slice(literalStart, literalEnd);
const seedRestaurants = new Function(`return ${literal};`)();

console.log(`Loaded seed: ${seedRestaurants.length} restaurants`);

// Restaurant meta lookup table (lat/lng/country/format/district)
// Mirror of restaurant-directory.ts — kept in-script so we can run
// without TypeScript transpilation.
const meta = {
  "trattoria-bellavista": {
    country: "Italy",
    format: "Trattoria",
    district: "Santa Croce",
    lat: 45.4408,
    lng: 12.3155,
  },
  "sakura-ember": {
    country: "Denmark",
    format: "Chef's Table",
    district: "Christianshavn",
    lat: 55.6717,
    lng: 12.5912,
  },
  "brasa-iberica": {
    country: "Spain",
    format: "Grill House",
    district: "Salamanca",
    lat: 40.4286,
    lng: -3.6772,
  },
  "bistro-maree": {
    country: "France",
    format: "Bistro",
    district: "Presqu'ile",
    lat: 45.7595,
    lng: 4.8346,
  },
  "andes-fuego": {
    country: "Portugal",
    format: "Fusion Bar",
    district: "Chiado",
    lat: 38.7110,
    lng: -9.1416,
  },
  "atelier-amaro": {
    country: "Polska",
    format: "Gastropub",
    district: "Stare Miasto",
    lat: 51.1100,
    lng: 17.0303,
  },
};

// Cheap heuristics so we keep wine passport data in DB even though seed
// stores English keywords in `wine.notes`. Mirrors restaurant-pairing-adapter.
function inferBody(wine) {
  const text = `${wine.name?.en ?? ""} ${wine.grape ?? ""} ${wine.style ?? ""} ${wine.notes?.en ?? ""}`.toLowerCase();
  if (/(cabernet|malbec|syrah|shiraz|tignanello|brunello|valbuena|chateauneuf|beaucastel|santa rita|cobos)/.test(text))
    return "full";
  if (/(riesling|albarino|pinot grigio|rose|sancerre|gavi|sparkling|champagne|brut|chablis)/.test(text))
    return "light";
  return "medium";
}
function inferAcidity(wine) {
  const text = `${wine.name?.en ?? ""} ${wine.grape ?? ""} ${wine.style ?? ""} ${wine.notes?.en ?? ""}`.toLowerCase();
  if (/(riesling|sancerre|chablis|albarino|gavi|pinot grigio|sparkling|champagne|brut|citrus|crisp|saline|mineral)/.test(text))
    return "high";
  return "medium";
}
function inferTannin(wine) {
  const text = `${wine.name?.en ?? ""} ${wine.grape ?? ""} ${wine.style ?? ""} ${wine.notes?.en ?? ""}`.toLowerCase();
  if (!text.includes("red") && !/(cabernet|malbec|tempranillo|sangiovese|merlot|pinot noir|zinfandel|carmenere)/.test(text))
    return "none";
  if (/(cabernet|malbec|tempranillo|brunello|valbuena|tignanello|chateauneuf|beaucastel)/.test(text))
    return "high";
  if (/(pinot noir|meiomi|jadot)/.test(text)) return "soft";
  return "medium";
}
function inferAbv(wine) {
  const body = inferBody(wine);
  if ((wine.style ?? "").toLowerCase().includes("sparkling")) return 12.5;
  if ((wine.style ?? "").toLowerCase().includes("dessert")) return 14;
  return body === "full" ? 14.5 : body === "medium" ? 13.5 : 12.5;
}

let stats = { restaurants: 0, dishes: 0, wines: 0, pairings: 0, skipped: 0 };

await sql.begin(async (tx) => {
  for (const seed of seedRestaurants) {
    const m = meta[seed.slug] ?? {
      country: "Polska",
      format: "Restaurant",
      district: seed.city || "Centrum",
      lat: 52.2297,
      lng: 21.0122,
    };

    // Upsert restaurant by slug
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

    // Map external dish ids → DB ids for pairing rebuild
    const dishIdMap = new Map();
    for (let i = 0; i < seed.dishes.length; i++) {
      const d = seed.dishes[i];
      const [row] = await tx`
        INSERT INTO dishes (
          restaurant_id, external_id, name, description, category, price, sort_order, tags
        ) VALUES (
          ${r.id},
          ${d.id},
          ${JSON.stringify(d.name)}::jsonb,
          ${JSON.stringify(d.description)}::jsonb,
          ${d.category},
          ${Number(d.price ?? 0)},
          ${i},
          ${[]}
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      if (row) {
        dishIdMap.set(d.id, row.id);
        stats.dishes++;
      } else {
        // already existed — re-fetch for pairing rebuild
        const [existing] = await tx`SELECT id FROM dishes WHERE restaurant_id = ${r.id} AND external_id = ${d.id}`;
        if (existing) dishIdMap.set(d.id, existing.id);
        stats.skipped++;
      }
    }

    const wineIdMap = new Map();
    for (let i = 0; i < seed.wines.length; i++) {
      const w = seed.wines[i];
      const yearNum = Number.parseInt(w.vintage, 10);
      const [row] = await tx`
        INSERT INTO wines (
          restaurant_id, external_id, name, region, grape, style, vintage, year, price, notes,
          body, acidity, tannin, abv, sort_order, tags
        ) VALUES (
          ${r.id},
          ${w.id},
          ${JSON.stringify(w.name)}::jsonb,
          ${w.region},
          ${w.grape},
          ${w.style},
          ${w.vintage ?? null},
          ${Number.isFinite(yearNum) ? yearNum : null},
          ${Number(w.price ?? 0)},
          ${JSON.stringify(w.notes)}::jsonb,
          ${inferBody(w)},
          ${inferAcidity(w)},
          ${inferTannin(w)},
          ${inferAbv(w)},
          ${i},
          ${[]}
        )
        ON CONFLICT DO NOTHING
        RETURNING id
      `;
      if (row) {
        wineIdMap.set(w.id, row.id);
        stats.wines++;
      } else {
        const [existing] = await tx`SELECT id FROM wines WHERE restaurant_id = ${r.id} AND external_id = ${w.id}`;
        if (existing) wineIdMap.set(w.id, existing.id);
        stats.skipped++;
      }
    }

    // Curated pairings — flatten dish.pairings array
    for (const d of seed.dishes) {
      const dishDbId = dishIdMap.get(d.id);
      if (!dishDbId) continue;
      for (const p of d.pairings ?? []) {
        const wineDbId = wineIdMap.get(p.wineId);
        if (!wineDbId) continue;
        const [row] = await tx`
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
        if (row) stats.pairings++;
      }
    }
  }
});

console.log("Seed complete:", stats);
await sql.end();
