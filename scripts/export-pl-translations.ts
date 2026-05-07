#!/usr/bin/env -S npx tsx
/**
 * Export all LocalizedString entries from seed files as a CSV the
 * Polish-speaking sommelier can review:
 *   id,kind,en,pl,note
 *
 * `note` column is empty — the sommelier fills it (or marks "OK").
 * After review, run import-pl-translations to apply the corrected PL.
 *
 * Usage:
 *   npx tsx scripts/export-pl-translations.mts > review/pl-review.csv
 */

// @ts-expect-error — Node 23 strip-types requires explicit .ts; tsconfig forbids
import { seedRestaurants } from "../src/data/seed-restaurants.ts";
// @ts-expect-error — same as above
import { seedPairingDataset } from "../src/data/seed-pairing.ts";
// @ts-expect-error — same as above
import { COMPASS_SECTORS, BASE_TASTES, FAQ_ITEMS } from "../src/data/wine-compass-kb.ts";

interface Row {
  id: string;
  kind: string;
  en: string;
  pl: string;
}

const rows: Row[] = [];

// CSV cell escape — quote, double-up internal quotes, normalize newlines.
function csv(v: string): string {
  const safe = v.replace(/\r?\n/g, " ").replace(/"/g, '""');
  return `"${safe}"`;
}

// ─── seed-restaurants
for (const r of seedRestaurants) {
  rows.push({ id: `restaurant.${r.slug}.name`, kind: "restaurant_name", en: r.name.en, pl: r.name.pl });
  rows.push({
    id: `restaurant.${r.slug}.description`,
    kind: "restaurant_description",
    en: r.description.en,
    pl: r.description.pl,
  });
  for (const d of r.dishes) {
    rows.push({ id: `dish.${r.slug}.${d.id}.name`, kind: "dish_name", en: d.name.en, pl: d.name.pl });
    rows.push({
      id: `dish.${r.slug}.${d.id}.description`,
      kind: "dish_description",
      en: d.description.en,
      pl: d.description.pl,
    });
    for (const p of d.pairings ?? []) {
      rows.push({
        id: `pairing.${r.slug}.${d.id}.${p.wineId}.reason`,
        kind: "pairing_reason",
        en: p.reason.en,
        pl: p.reason.pl,
      });
    }
  }
  for (const w of r.wines) {
    rows.push({ id: `wine.${r.slug}.${w.id}.name`, kind: "wine_name", en: w.name.en, pl: w.name.pl });
    rows.push({ id: `wine.${r.slug}.${w.id}.notes`, kind: "wine_notes", en: w.notes.en, pl: w.notes.pl });
  }
}

// ─── seed-pairing (global library)
for (const d of seedPairingDataset.dishes) {
  rows.push({ id: `lib.dish.${d.id}.name`, kind: "lib_dish_name", en: d.name.en, pl: d.name.pl });
  rows.push({ id: `lib.dish.${d.id}.description`, kind: "lib_dish_description", en: d.description.en, pl: d.description.pl });
}
for (const w of seedPairingDataset.wines) {
  rows.push({ id: `lib.wine.${w.id}.name`, kind: "lib_wine_name", en: w.name.en, pl: w.name.pl });
  rows.push({ id: `lib.wine.${w.id}.description`, kind: "lib_wine_description", en: w.description.en, pl: w.description.pl });
}
for (const p of seedPairingDataset.pairings) {
  rows.push({
    id: `lib.pairing.${p.dishId}.${p.wineId}.reason`,
    kind: "lib_pairing_reason",
    en: p.reason.en,
    pl: p.reason.pl,
  });
}

// ─── Vinokompas KB methodology
for (const sector of COMPASS_SECTORS) {
  rows.push({ id: `kb.sector.${sector.id}.short`, kind: "kb_sector_short", en: sector.short_pl, pl: sector.short_pl });
  rows.push({ id: `kb.sector.${sector.id}.long`, kind: "kb_sector_long", en: sector.long_pl, pl: sector.long_pl });
  for (const t of sector.tendencje) {
    rows.push({ id: `kb.tendencja.${t.id}.assoc`, kind: "kb_tendencja_assoc", en: t.associations_pl, pl: t.associations_pl });
    rows.push({ id: `kb.tendencja.${t.id}.examples`, kind: "kb_tendencja_examples", en: t.examples_pl, pl: t.examples_pl });
  }
}
for (const b of BASE_TASTES) {
  rows.push({ id: `kb.base.${b.id}.desc`, kind: "kb_base_taste", en: b.description_pl, pl: b.description_pl });
}
for (let i = 0; i < FAQ_ITEMS.length; i++) {
  const f = FAQ_ITEMS[i];
  rows.push({ id: `kb.faq.${i}.q`, kind: "kb_faq_q", en: f.q_pl, pl: f.q_pl });
  rows.push({ id: `kb.faq.${i}.a`, kind: "kb_faq_a", en: f.a_pl, pl: f.a_pl });
}

// Stable sort: by kind first, then id
rows.sort((a, b) => (a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind.localeCompare(b.kind)));

console.log("id,kind,en,pl,sommelier_note");
for (const r of rows) {
  console.log([csv(r.id), csv(r.kind), csv(r.en), csv(r.pl), csv("")].join(","));
}

console.error(`Exported ${rows.length} rows.`);
console.error("Send to PL sommelier — they fill the 'sommelier_note' column.");
