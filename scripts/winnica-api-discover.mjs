#!/usr/bin/env node
/**
 * winnica-api-discover.mjs — map the PrestaShop catalog so we know what to
 * pull (the staging store mixes real wines with leftover demo products).
 * Key from env, JSON output (confirmed working on /products). Prints:
 *   - every category (id → name)
 *   - every product (id, name, price, active, category, reference)
 *     split into "real" vs "demo_*" so we can see how many wines exist and
 *     which category holds them.
 *
 *   node --env-file=.env.local scripts/winnica-api-discover.mjs
 *   # or: WINNICA_API_URL=… WINNICA_API_KEY=… node scripts/winnica-api-discover.mjs
 */

const url = process.env.WINNICA_API_URL;
const key = process.env.WINNICA_API_KEY;
if (!url || !key) { console.error("Missing WINNICA_API_URL / WINNICA_API_KEY."); process.exit(1); }

const auth = "Basic " + Buffer.from(`${key}:`).toString("base64");
const base = url.replace(/\/+$/, "");

async function getJSON(path) {
  const res = await fetch(`${base}${path}`, { headers: { Authorization: auth, Accept: "application/json" } });
  if (res.status !== 200) return { status: res.status, data: null, body: await res.text() };
  return { status: res.status, data: await res.json() };
}
// PrestaShop returns a name as [{id, value}] per language; flatten to a string.
const nameOf = (n) => (Array.isArray(n) ? n[0]?.value : n?.language?.value ?? n) ?? "—";

// ── categories ──
const cats = await getJSON("/categories?output_format=JSON&display=[id,name,active]");
const catName = {};
if (cats.data?.categories) {
  console.log(`CATEGORIES (${cats.data.categories.length}):`);
  for (const c of cats.data.categories) {
    catName[c.id] = nameOf(c.name);
    console.log(`  #${String(c.id).padStart(3)}  ${nameOf(c.name)}${c.active === "0" ? "  (inactive)" : ""}`);
  }
} else {
  console.log(`categories: HTTP ${cats.status}`);
}

// ── products ──
const prods = await getJSON("/products?output_format=JSON&display=[id,name,price,active,reference,id_category_default]");
if (!prods.data?.products) {
  console.log(`\nproducts: HTTP ${prods.status}\n${(prods.body || "").slice(0, 300)}`);
  process.exit(0);
}
const all = prods.data.products;
const demo = all.filter((p) => /^demo_/i.test(p.reference || ""));
const real = all.filter((p) => !/^demo_/i.test(p.reference || ""));

console.log(`\nPRODUCTS: ${all.length} total  ·  ${real.length} real  ·  ${demo.length} demo_*\n`);
console.log(`REAL (non-demo) — candidates for the wine catalog:`);
for (const p of real) {
  const cat = catName[p.id_category_default] ?? `cat ${p.id_category_default}`;
  console.log(`  #${String(p.id).padStart(3)}  ${(nameOf(p.name)).padEnd(40)}  ${Number(p.price).toFixed(2)}  [${cat}]${p.active === "0" ? " (inactive)" : ""}`);
}
console.log(`\nby category (real products):`);
const byCat = {};
for (const p of real) (byCat[catName[p.id_category_default] ?? p.id_category_default] ??= []).push(p.id);
for (const [c, ids] of Object.entries(byCat)) console.log(`  ${c}: ${ids.length}  (${ids.join(", ")})`);
