#!/usr/bin/env node
// Replace the top-level fields of each of the 5 restaurant blocks in
// seed-restaurants.ts with the 5 real Polish restaurants. Inner dish/wine ids
// (r1-d1, r1-w1, etc.) and curated pairing references stay intact — only the
// restaurant identity changes.
import fs from "node:fs";
import path from "node:path";

const target = path.resolve("src/data/seed-restaurants.ts");
let content = fs.readFileSync(target, "utf-8");

const replacements = [
  {
    old: {
      slug: "trattoria-bellavista",
      name: "Trattoria Bellavista",
      cuisine: "Italian",
      city: "Florence",
      descEn: "Warm Tuscan comfort food with classic pasta, seafood, and regional bottles.",
      descPl: "Domowa kuchnia toskańska — klasyczne makarony, owoce morza i regionalne wina.",
    },
    next: {
      slug: "atelier-amaro",
      nameEn: "Atelier Amaro",
      namePl: "Atelier Amaro",
      cuisine: "Polish Modern",
      city: "Warszawa",
      descEn:
        "Modern Polish fine dining in Łazienki — fermented vegetables, foraged herbs, game and quiet European bottles.",
      descPl:
        "Nowoczesna kuchnia polska w Łazienkach — fermentowane warzywa, dzika zwierzyna, zioła z lasu i spokojne europejskie wina.",
      gradient: "from-[#2f4a35] via-[#5d7a4d] to-[#c4ad7a]",
    },
  },
  {
    old: {
      slug: "sakura-ember",
      name: "Sakura Ember",
      cuisine: "Asian",
      city: "Copenhagen",
      descEn: "Modern Japanese kitchen in Copenhagen with robata grill, pristine seafood, and precise pairings.",
      descPl: "Nowoczesna kuchnia japońska w Kopenhadze — grill robata, świeże owoce morza i precyzyjne łączenia z winami.",
    },
    next: {
      slug: "senses-warsaw",
      nameEn: "Senses",
      namePl: "Senses",
      cuisine: "Tasting Menu",
      city: "Warszawa",
      descEn:
        "Michelin-starred tasting menu on Bielańska — refined produce-driven cooking with a wine pairing for each course.",
      descPl:
        "Restauracja z gwiazdką Michelin przy Bielańskiej — wyrafinowane menu degustacyjne z dobranym winem do każdego dania.",
      gradient: "from-[#1f2a4a] via-[#445279] to-[#a3b3d6]",
    },
  },
  {
    old: {
      slug: "brasa-iberica",
      name: "Brasa Iberica",
      cuisine: "European Mix",
      city: "Madrid",
      descEn: "Spanish tapas and grill house focused on coastal seafood and cast-iron fire.",
      descPl: "Hiszpańskie tapas i grill house z naciskiem na nadmorskie owoce morza i ogień z żeliwnego paleniska.",
    },
    next: {
      slug: "bottiglieria-1881",
      nameEn: "Bottiglieria 1881",
      namePl: "Bottiglieria 1881",
      cuisine: "Italian",
      city: "Kraków",
      descEn:
        "One-Michelin-star Italian wine bar on ul. Bocheńska — hand-cut pasta, charcoal-grilled fish, and a 600-bottle Italian cellar.",
      descPl:
        "Włoski wine bar z gwiazdką Michelin przy Bocheńskiej — ręcznie krojone pasta, ryby z węgla i piwnica 600 włoskich butelek.",
      gradient: "from-[#5f2f23] via-[#a04d2b] to-[#e1a65b]",
    },
  },
  {
    old: {
      slug: "bistro-maree",
      name: "Bistro Maree",
      cuisine: "French",
      city: "Lyon",
      descEn: "French bistro classics with seafood focus and cellar-style old world labels.",
      descPl: "Klasyka francuskiego bistro — owoce morza i piwniczne etykiety ze starego świata.",
    },
    next: {
      slug: "pod-aniolami",
      nameEn: "Pod Aniołami",
      namePl: "Pod Aniołami",
      cuisine: "Polish Heritage",
      city: "Kraków",
      descEn:
        "Heritage Polish kitchen inside a 13th-century cellar at ul. Grodzka — pierogi, żurek, slow-roasted goose and Hungarian whites.",
      descPl:
        "Polska kuchnia tradycyjna w XIII-wiecznych piwnicach przy Grodzkiej — pierogi, żurek, gęś z pieca i węgierskie białe wina.",
      gradient: "from-[#3b2520] via-[#7a4f37] to-[#d6b777]",
    },
  },
  {
    old: {
      slug: "andes-fuego",
      name: "Andes Fuego",
      cuisine: "Asian-Latin Mix",
      city: "Lisbon",
      descEn: "Peruvian and Nikkei signatures in Lisbon with bright citrus, chili, and charcoal notes.",
      descPl: "Peruwiańskie i Nikkei popisy w Lizbonie — żywe cytrusy, papryczki chili i nuty z węgla drzewnego.",
    },
    next: {
      slug: "brovariusz-wroclaw",
      nameEn: "Brovariusz",
      namePl: "Brovariusz",
      cuisine: "Polish Gastropub",
      city: "Wrocław",
      descEn:
        "A Wrocław gastropub on the Rynek — house-fermented sauerkraut, beer-aged cheeses, hearty Silesian dishes and a small Italian wine cellar.",
      descPl:
        "Wrocławski gastropub na Rynku — domowa kapusta kiszona, sery dojrzewające w piwie, sycące śląskie dania i niewielka włoska piwnica win.",
      gradient: "from-[#4a3a1f] via-[#8a6e3a] to-[#d6c188]",
    },
  },
];

for (const { old, next } of replacements) {
  // Match the restaurant header block — slug + name + cuisine + city + description
  // (allow whitespace flexibility but stay anchored to slug match).
  const oldSlugRe = new RegExp(`slug:\\s*"${escapeRe(old.slug)}"`);
  if (!oldSlugRe.test(content)) {
    console.warn(`  ! slug not found: ${old.slug}`);
    continue;
  }

  content = content.replace(`slug: "${old.slug}"`, `slug: "${next.slug}"`);
  content = content.replace(
    `name: { en: "${old.name}", pl: "${old.name}" }`,
    `name: { en: "${next.nameEn}", pl: "${next.namePl}" }`,
  );
  content = content.replace(`cuisine: "${old.cuisine}"`, `cuisine: "${next.cuisine}"`);
  content = content.replace(`city: "${old.city}"`, `city: "${next.city}"`);
  content = content.replace(
    `{ en: "${old.descEn}", pl: "${old.descPl}" }`,
    `{ en: "${next.descEn.replace(/"/g, '\\"')}", pl: "${next.descPl.replace(/"/g, '\\"')}" }`,
  );
  // Replace coverGradient — match any from-[...] via-[...] to-[...] line per slug.
  const blockRe = new RegExp(
    `(slug:\\s*"${escapeRe(next.slug)}"[\\s\\S]*?coverGradient:\\s*)"[^"]+"`,
  );
  content = content.replace(blockRe, `$1"${next.gradient}"`);

  console.log(`  ✓ ${old.slug} → ${next.slug}`);
}

fs.writeFileSync(target, content, "utf-8");
console.log("Relabel complete.");

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
