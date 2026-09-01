#!/usr/bin/env node
/**
 * parse-winnica-api.mjs — build src/data/winnica-catalog.generated.ts from the
 * winnica.pl PrestaShop Webservice.
 *
 * Replaces the HTML scraper (scripts/parse-winnica.mjs): the shop publishes the
 * Vinocompas data-sheet as PrestaShop product FEATURES, so the compass
 * fingerprint is read directly instead of being guessed from page markup.
 * Calibrated 2026-09-01 against Portillo Malbec (#400): every axis and the
 * price matched the scraped entry exactly.
 *
 * Notes that cost time to discover:
 *  - The `/api` URL the agency sent 404s (URL rewriting is off). The working
 *    endpoint is /webservice/dispatcher.php?url=<resource>.
 *  - `price` is NET. Customer-facing price = price * 1.23 (PL wine VAT).
 *  - `id_category_default` is often the PRODUCER, not a type — wines are
 *    selected by membership in the category-12 ("Wina") subtree.
 *  - Staging and production share product ids, so links point at winnica.pl.
 *
 *   WINNICA_API_KEY=... node scripts/parse-winnica-api.mjs [--limit N] [--dry-run]
 */
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const KEY = process.env.WINNICA_API_KEY;
const BASE =
  process.env.WINNICA_API_URL || "https://winnica.pageartdev.dev/webservice/dispatcher.php";
/** Where the customer actually buys — staging shares ids with production. */
const SHOP = "https://winnica.pl";
const VAT = 1.23;

if (!KEY) {
  console.error("WINNICA_API_KEY missing.");
  process.exit(1);
}

const argLimit = (() => {
  const i = process.argv.indexOf("--limit");
  return i > -1 ? Number(process.argv[i + 1]) : Infinity;
})();
const DRY = process.argv.includes("--dry-run");

const H = {
  Authorization: "Basic " + Buffer.from(`${KEY}:`).toString("base64"),
  Accept: "application/json",
};
const api = async (q) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(`${BASE}?${q}`, { headers: H });
      if (r.status === 200) return await r.json();
      if (r.status === 404) return null; // empty resource, not an error
      if (attempt === 2) throw new Error(`HTTP ${r.status} for ${q.slice(0, 60)}`);
    } catch (e) {
      if (attempt === 2) throw e;
    }
    await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
  }
  return null;
};
/** PrestaShop returns localized fields as [{id, value}]. */
const L = (n) => (Array.isArray(n) ? (n[0]?.value ?? "") : (n?.language?.value ?? n ?? ""));

/** Feature id → CompassProfile key. The shop's own Vinocompas data-sheet. */
const AXIS = {
  427: "tegie.cigaro",
  428: "tegie.suszone",
  429: "miekkie.dojrzale",
  430: "miekkie.konfitury",
  431: "oleiste.maslo",
  432: "oleiste.tropikalne",
  433: "swieze.zielone",
  434: "swieze.cytrusy",
  435: "ziemiste.mineraly",
  436: "ziemiste.sciolka",
  437: "szorstkie.pizmo",
  438: "szorstkie.dab",
};
const F_SMAK = 426, F_KOLOR = 420, F_SZCZEP = 424, F_REGION = 441, F_KRAJ = 440;
const META = [F_SMAK, F_KOLOR, F_SZCZEP, F_REGION, F_KRAJ];

/** Smak tier → base.slodycz, matching the scale the wheel uses (0..5). */
const SLODYCZ = { wytrawne: 0, "półwytrawne": 2, "polwytrawne": 2, "półsłodkie": 3, "polslodkie": 3, "słodkie": 5, "slodkie": 5 };

const STYLE = [
  [/musuj|champagne|prosecco|cava|sparkling/i, "sparkling"],
  [/różow|rozow|rose/i, "rose"],
  [/czerwon|red/i, "red"],
  [/biał|bial|white/i, "white"],
  [/deser|słodk|slodk|porto|sherry/i, "dessert"],
];

const log = (...a) => console.log(...a);

// ── 1. categories: the "Wina" subtree + slugs for building URLs ────────────
log("1/4  категории…");
const catRes = await api("url=categories&output_format=JSON&display=[id,name,id_parent,link_rewrite]");
const cats = catRes?.categories ?? [];
const byParent = new Map();
const catSlug = new Map();
for (const c of cats) {
  const p = String(c.id_parent);
  if (!byParent.has(p)) byParent.set(p, []);
  byParent.get(p).push(String(c.id));
  catSlug.set(String(c.id), L(c.link_rewrite));
}
const wineCats = new Set(["12"]);
const walk = (id) => {
  for (const child of byParent.get(id) ?? []) {
    if (!wineCats.has(child)) { wineCats.add(child); walk(child); }
  }
};
walk("12");
log(`     поддерево «Wina»: ${wineCats.size} категорий`);

// ── 2. feature values: id → text, for our axes + meta fields ──────────────
log("2/4  значения характеристик…");
const wanted = [...Object.keys(AXIS).map(Number), ...META];
const valText = new Map();
for (const fid of wanted) {
  const r = await api(`url=product_feature_values&output_format=JSON&filter[id_feature]=${fid}&display=[id,value]`);
  for (const v of r?.product_feature_values ?? []) valText.set(String(v.id), L(v.value).trim());
}
log(`     значений: ${valText.size}`);

// ── 3. products ───────────────────────────────────────────────────────────
log("3/4  товары…");
const idRes = await api("url=products&output_format=JSON&filter[active]=1&display=[id]");
const ids = (idRes?.products ?? []).map((p) => String(p.id));
log(`     активных: ${ids.length}`);

const CHUNK = 60;
const wines = [];
let skippedNotWine = 0, skippedNoAxes = 0;

for (let i = 0; i < ids.length && wines.length < argLimit; i += CHUNK) {
  const slice = ids.slice(i, i + CHUNK);
  const res = await api(`url=products&output_format=JSON&filter[id]=[${slice.join("|")}]&display=full`);
  for (const p of res?.products ?? []) {
    const catIds = (p.associations?.categories ?? []).map((c) => String(c.id));
    const defCat = String(p.id_category_default);
    if (!catIds.some((c) => wineCats.has(c)) && !wineCats.has(defCat)) { skippedNotWine++; continue; }

    const feats = p.associations?.product_features ?? [];
    const fingerprint = {};
    let axisCount = 0;
    for (const f of feats) {
      const key = AXIS[Number(f.id)];
      if (!key) continue;
      const n = Number(valText.get(String(f.id_feature_value)));
      if (Number.isFinite(n)) { fingerprint[key] = n; axisCount++; }
    }
    // No data-sheet → the cosine matcher would rank it on noise. Drop it.
    if (axisCount < 6) { skippedNoAxes++; continue; }

    const metaOf = (fid) => {
      const f = feats.find((x) => Number(x.id) === fid);
      return f ? (valText.get(String(f.id_feature_value)) ?? "") : "";
    };
    const smak = metaOf(F_SMAK);
    const slod = SLODYCZ[smak.toLowerCase().split(" / ")[0]] ?? 1;
    fingerprint["base.slodycz"] = slod;
    // Same derivation the scraped catalogue used, so old and new entries mix.
    if (fingerprint["swieze.cytrusy"] != null) fingerprint["base.kwasowosc"] = fingerprint["swieze.cytrusy"];
    if (fingerprint["szorstkie.dab"] != null) fingerprint["base.cierpkosc"] = fingerprint["szorstkie.dab"];

    const name = L(p.name).trim();
    const slug = L(p.link_rewrite).trim();
    const kolor = metaOf(F_KOLOR);
    const hay = `${kolor} ${name} ${catIds.map((c) => catSlug.get(c) ?? "").join(" ")}`;
    const style = (STYLE.find(([re]) => re.test(hay)) ?? [null, "red"])[1];
    const grape = metaOf(F_SZCZEP) || "";
    const region = [metaOf(F_REGION), metaOf(F_KRAJ)].filter(Boolean).join(", ");
    const price = Math.round(Number(p.price) * VAT);
    const catPath = catSlug.get(defCat) || "wina";

    wines.push({
      id: `wn-${p.id}-${slug}`.slice(0, 60),
      name_pl: name,
      grape,
      region_pl: region,
      style,
      priceFrom: price,
      why_pl: buildWhy(fingerprint, smak),
      fingerprint,
      query: grape || name,
      url: `${SHOP}/pl/${catPath}/${p.id}-${slug}.html`,
      imageUrl: p.id_default_image ? `${SHOP}/${p.id_default_image}-home_default/${slug}.jpg` : undefined,
    });
    if (wines.length >= argLimit) break;
  }
  process.stdout.write(`\r     обработано ${Math.min(i + CHUNK, ids.length)}/${ids.length}, вин: ${wines.length}   `);
}
log("");
log(`     не вино: ${skippedNotWine}, без данных компаса: ${skippedNoAxes}`);

/** One-line PL rationale from the two strongest tendencje. */
function buildWhy(fp, smak) {
  const LABEL = {
    "tegie.cigaro": "tytoniu, kawy i czekolady", "tegie.suszone": "suszonych owoców",
    "miekkie.dojrzale": "dojrzałych owoców", "miekkie.konfitury": "konfitur i wanilii",
    "oleiste.maslo": "masła i orzechów", "oleiste.tropikalne": "owoców tropikalnych",
    "swieze.zielone": "warzyw i zielonych owoców", "swieze.cytrusy": "cytrusów",
    "ziemiste.mineraly": "minerałów", "ziemiste.sciolka": "ściółki leśnej i fiołków",
    "szorstkie.pizmo": "piżma i skóry", "szorstkie.dab": "dębu, dymu i garbników",
  };
  const top = Object.entries(fp)
    .filter(([k]) => LABEL[k])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .filter(([, v]) => v > 0)
    .map(([k]) => LABEL[k]);
  if (!top.length) return `Wino ${smak.toLowerCase() || "wytrawne"}.`;
  return `Wyraźne nuty ${top.join(" oraz ")}${smak ? `; ${smak.toLowerCase()}` : ""}.`;
}

// ── 4. emit ───────────────────────────────────────────────────────────────
const header = `/**
 * winnica-catalog.generated.ts — REAL wines from winnica.pl.
 *
 * GENERATED by scripts/parse-winnica-api.mjs from the shop's PrestaShop
 * Webservice — do not edit by hand; re-run the script to refresh
 * prices/availability. Fingerprints are the shop's OWN per-product Vinocompas
 * data-sheet (0-5 per axis), read from product features, not inferred.
 * base.* axes are derived: slodycz<-Smak tier, kwasowosc<-cytrusy axis,
 * cierpkosc<-garbniki axis.
 *
 * Wines only: the shop also sells delicatessen, pasta and cookies, so entries
 * are filtered to the "Wina" (category 12) subtree, active products only.
 * Prices include 23% VAT (the API reports net).
 */
import type { SamouczekWine } from "./samouczek-wines";

export const WINNICA_CATALOG: SamouczekWine[] = `;

const body = JSON.stringify(wines, null, 2).replace(/\n/g, "\n");
const out = `${header}${body};\n`;

log(`4/4  ${DRY ? "СУХОЙ ПРОГОН — файл не пишу" : "пишу файл"}`);
log(`     вин в каталоге: ${wines.length}`);
const styles = {};
for (const w of wines) styles[w.style] = (styles[w.style] ?? 0) + 1;
log(`     по стилям: ${Object.entries(styles).map(([k, v]) => `${k}=${v}`).join(", ")}`);
const prices = wines.map((w) => w.priceFrom).sort((a, b) => a - b);
if (prices.length) log(`     цены: ${prices[0]}–${prices[prices.length - 1]} zł, медиана ${prices[Math.floor(prices.length / 2)]}`);

if (!DRY) {
  writeFileSync(resolve(ROOT, "src/data/winnica-catalog.generated.ts"), out);
  log("     → src/data/winnica-catalog.generated.ts");
}
