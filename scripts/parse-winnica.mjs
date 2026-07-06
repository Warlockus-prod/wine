/**
 * parse-winnica.mjs — build the samouczek wine catalogue from winnica.pl.
 *
 * winnica.pl (the Vinocompas originators) publish, on every product page,
 * a <dl class="data-sheet"> with 12 aroma axes scored 0–5 whose Polish
 * labels map 1:1 onto our TendencjaIds — i.e. a READY-MADE compass
 * fingerprint per wine (scouted 2026-07, docs/data-review-2026-07.md).
 *
 * Usage:
 *   node scripts/parse-winnica.mjs                # writes src/data/winnica-catalog.generated.ts
 *   node scripts/parse-winnica.mjs --dry          # JSON to stdout, no file write
 *
 * Polite crawling: ≤1 req/s, browser UA, ~60-70 requests total. robots.txt
 * allows all paths (checked 2026-07). Prices are a snapshot — re-run before
 * any commercial pitch.
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT_TS = resolve(ROOT, "src/data/winnica-catalog.generated.ts");
const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) VinovigatorCatalogBot/1.0" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Style categories on winnica.pl (PrestaShop category ids) + how many wines
// we take from each. Diversity beats volume: max 2 wines per producer.
const CATEGORIES = [
  { id: 191, slug: "czerwone-wino", style: "red", take: 20 },
  { id: 192, slug: "biale-wina", style: "white", take: 18 },
  { id: 193, slug: "musujace-wina", style: "sparkling", take: 9 },
  { id: 194, slug: "wino-slodkie", style: "dessert", take: 7 },
  { id: 195, slug: "rozowe-wino", style: "rose", take: 6 },
];

// data-sheet aroma labels → our TendencjaIds (exact strings from the site).
const AXIS_BY_LABEL = {
  "Tytoń, kawa, czekolada": "tegie.cigaro",
  "Suszone owoce": "tegie.suszone",
  "Dojrzałe owoce": "miekkie.dojrzale",
  "Konfitury, wanilia": "miekkie.konfitury",
  "Masło, orzechy": "oleiste.maslo",
  "Tropikalne owoce": "oleiste.tropikalne",
  "Warzywa, zielone owoce": "swieze.zielone",
  "Cytrusy, kwaśne owoce": "swieze.cytrusy",
  "Minerały": "ziemiste.mineraly",
  "Ściółka leśna, fiołki": "ziemiste.sciolka",
  "Piżmo, skóra": "szorstkie.pizmo",
  "Dąb, dym, garbniki": "szorstkie.dab",
};

// Smak (dryness tier) → base.slodycz 0..5.
const SLODYCZ_BY_SMAK = { Wytrawne: 0, Półwytrawne: 2, Półsłodkie: 3, Słodkie: 5 };

// "why it fits" phrase per dominant axis (Vinokompas vocabulary, PL).
const WHY_BY_AXIS = {
  "tegie.cigaro": "nuty czekolady, kawy i tytoniu",
  "tegie.suszone": "aromaty suszonych owoców",
  "miekkie.dojrzale": "miękkie, dojrzałe owoce",
  "miekkie.konfitury": "konfiturowa słodycz owoców",
  "oleiste.maslo": "masłowa, orzechowa gładkość",
  "oleiste.tropikalne": "soczyste owoce tropikalne",
  "swieze.zielone": "zielona, warzywna świeżość",
  "swieze.cytrusy": "rześki, cytrusowy nerw",
  "ziemiste.mineraly": "krzemienna mineralność",
  "ziemiste.sciolka": "leśne runo i fiołki",
  "szorstkie.pizmo": "dzikie nuty piżma i skóry",
  "szorstkie.dab": "dąb, dym i zdecydowane garbniki",
};

const fetchText = async (url) => {
  const res = await fetch(url, { headers: UA });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
};

const strip = (html) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

async function listCategory(cat, page = 1) {
  // Listing pages also contain cross-sell tiles from other categories and
  // repeat producers, so a single page can yield fewer than the quota —
  // callers paginate until the quota is met (max 3 pages).
  const suffix = page > 1 ? `?page=${page}` : "";
  const html = await fetchText(`https://winnica.pl/pl/${cat.id}-${cat.slug}${suffix}`);
  const urls = [...html.matchAll(/href="(https:\/\/winnica\.pl\/pl\/[a-z0-9-]+\/\d+-[a-z0-9-]+\.html)"/g)].map((m) => m[1]);
  return [...new Set(urls)];
}

function parseProduct(html, url, style) {
  const name = strip((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [, ""])[1]);
  const price = Number((html.match(/itemprop="price"[^>]*content="([^"]+)"/) || [])[1]);
  const image = (html.match(/property="og:image"[^>]*content="([^"]+)"/) || [])[1] ?? null;
  const dl = (html.match(/<dl class="data-sheet">([\s\S]*?)<\/dl>/) || [])[1];
  if (!name || !price || !dl) return null;

  const sheet = {};
  for (const m of dl.matchAll(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/g)) {
    sheet[strip(m[1])] = strip(m[2]);
  }
  // CANARY: the theme changed if the axis labels vanish — fail loudly.
  const axes = Object.keys(AXIS_BY_LABEL).filter((l) => l in sheet);
  if (axes.length < 10) return { canary: true, url, axesFound: axes.length };

  const fingerprint = {};
  for (const [label, id] of Object.entries(AXIS_BY_LABEL)) {
    const v = Number(sheet[label]);
    if (Number.isFinite(v) && v > 0) fingerprint[id] = v;
  }
  // Base tastes derived transparently from the sheet:
  //  slodycz ← the Smak tier; kwasowosc ≈ the citrus/sour axis;
  //  cierpkosc ≈ the oak/tannin axis (garbniki).
  const slodycz = SLODYCZ_BY_SMAK[sheet["Smak"]] ?? 0;
  if (slodycz > 0) fingerprint["base.slodycz"] = slodycz;
  const kwas = Number(sheet["Cytrusy, kwaśne owoce"]);
  if (Number.isFinite(kwas) && kwas > 0) fingerprint["base.kwasowosc"] = kwas;
  const cierp = Number(sheet["Dąb, dym, garbniki"]);
  if (Number.isFinite(cierp) && cierp > 0) fingerprint["base.cierpkosc"] = cierp;

  const grapes = (sheet["Szczep"] || "").split(",").map((s) => s.trim()).filter(Boolean);
  const region = [sheet["Region"], sheet["Kraj"]].filter(Boolean).join(", ");
  const isSparkling = sheet["Musujące"] === "Tak" || style === "sparkling";

  // why_pl from the two strongest aroma axes.
  const top = Object.entries(fingerprint)
    .filter(([k]) => !k.startsWith("base."))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([k]) => WHY_BY_AXIS[k])
    .filter(Boolean);
  const why = top.length ? `Dominują ${top.join(" oraz ")}.` : "Zrównoważony profil na każdą okazję.";

  const slug = (url.match(/\/(\d+-[a-z0-9-]+)\.html/) || [])[1] ?? name.toLowerCase().replace(/\W+/g, "-");
  return {
    id: `wn-${slug}`,
    name_pl: name,
    grape: grapes[0] || "Blend",
    region_pl: region || "Europa",
    style: isSparkling ? "sparkling" : style,
    priceFrom: Math.round(price),
    why_pl: why,
    fingerprint,
    query: grapes[0] || name,
    url,
    imageUrl: image,
    producer: sheet["Producent"] ?? null,
    vivino: Number(sheet["Punktacja Vivino"]) || null,
  };
}

const producerCount = new Map();
const wines = [];
let requests = 0;

for (const cat of CATEGORIES) {
  let taken = 0;
  const seenUrls = new Set();
  for (let page = 1; page <= 3 && taken < cat.take; page++) {
    let urls;
    try {
      urls = await listCategory(cat, page);
      requests++;
    } catch (e) {
      console.error(`[list] ${cat.slug} p${page} failed: ${e.message}`);
      break;
    }
    for (const url of urls) {
      if (taken >= cat.take) break;
      if (seenUrls.has(url)) continue;
      seenUrls.add(url);
      await sleep(1000);
      let html;
      try {
        html = await fetchText(url);
        requests++;
      } catch (e) {
        console.error(`[fetch] ${url}: ${e.message}`);
        continue;
      }
      const wine = parseProduct(html, url, cat.style);
      if (!wine) continue;
      if (wine.canary) {
        console.error(`[CANARY] data-sheet axis labels missing at ${url} (found ${wine.axesFound}) — theme changed?`);
        continue;
      }
      const pc = producerCount.get(wine.producer) ?? 0;
      if (wine.producer && pc >= 2) continue; // diversity: max 2 per producer
      if (wines.some((w) => w.id === wine.id)) continue;
      producerCount.set(wine.producer, pc + 1);
      wines.push(wine);
      taken++;
      console.error(`  + [${wine.style}] ${wine.name_pl} — ${wine.priceFrom} zł (${Object.keys(wine.fingerprint).length} dims)`);
    }
  }
  console.error(`[${cat.slug}] took ${taken}/${cat.take}`);
}

console.error(`TOTAL: ${wines.length} wines, ${requests} requests`);

const header = `/**
 * winnica-catalog.generated.ts — REAL wines from winnica.pl.
 *
 * GENERATED by scripts/parse-winnica.mjs — do not edit by hand; re-run the
 * script to refresh prices/availability. Fingerprints come 1:1 from the
 * per-product Vinocompas data-sheet published by winnica.pl (0–5 per axis);
 * base.* axes are derived: slodycz←Smak tier, kwasowosc←cytrusy axis,
 * cierpkosc←garbniki axis.
 *
 * Generated: ${new Date().toISOString()} · ${wines.length} wines
 */

import type { SamouczekWine } from "./samouczek-wines";

export const WINNICA_CATALOG: SamouczekWine[] = `;

const body = JSON.stringify(
  wines.map(({ producer, vivino, ...w }) => w),
  null,
  2,
);

if (process.argv.includes("--dry")) {
  console.log(body);
} else {
  writeFileSync(OUT_TS, header + body + ";\n");
  console.error(`written: ${OUT_TS}`);
}
