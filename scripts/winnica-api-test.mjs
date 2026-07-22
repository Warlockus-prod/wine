#!/usr/bin/env node
/**
 * winnica-api-test.mjs — connectivity check for the winnica.pl PrestaShop
 * Webservice. Key comes from the environment (never hardcode / commit it);
 * PrestaShop uses the key as the HTTP Basic Auth *username*, empty password.
 *
 *   node --env-file=.env.local scripts/winnica-api-test.mjs
 *   # or one-shot:
 *   WINNICA_API_URL=… WINNICA_API_KEY=… node scripts/winnica-api-test.mjs
 *
 * Uses XML (PrestaShop's native, always-on format) — the JSON root endpoint
 * 500s on this install. Prints the granted resources and a product sample so
 * we can shape the catalog rewrite. The key is never printed.
 */

const url = process.env.WINNICA_API_URL;
const key = process.env.WINNICA_API_KEY;
if (!url || !key) {
  console.error("Missing env: set WINNICA_API_URL and WINNICA_API_KEY.");
  process.exit(1);
}

const auth = "Basic " + Buffer.from(`${key}:`).toString("base64");
const base = url.replace(/\/+$/, "");

async function get(path) {
  const res = await fetch(`${base}${path}`, { headers: { Authorization: auth } });
  return { status: res.status, body: await res.text() };
}

console.log(`→ ${base}  key ${key.slice(0, 3)}…${key.slice(-2)} (${key.length} chars)\n`);

// ── 1) root resource list (XML) ──
const root = await get("/");
if (root.status === 401) {
  console.error("✗ 401 — key rejected. Enable it in Advanced Parameters → Webservice with GET perms.");
  process.exit(1);
}
if (root.status !== 200) {
  console.error(`✗ root HTTP ${root.status}\n${root.body.slice(0, 600)}`);
  process.exit(1);
}
const resources = [...new Set([...root.body.matchAll(/<(\w+)\s+xlink:href/g)].map((m) => m[1]))];
console.log(`✓ authenticated. Resources granted: ${resources.join(", ") || "(none)"}\n`);

// ── 2) does JSON work anywhere? (products endpoint, not root) ──
const pj = await get("/products?output_format=JSON&limit=1");
console.log(`products JSON probe: HTTP ${pj.status}${pj.status === 200 ? " ✓ JSON usable" : " — will use XML"}`);

// ── 3) product sample (XML, full) so we see the fields ──
const prod = await get("/products?display=full&limit=3");
if (prod.status !== 200) {
  console.log(`products: HTTP ${prod.status}\n${prod.body.slice(0, 500)}`);
  process.exit(0);
}
const pick = (xml, tag) => {
  const m = xml.match(new RegExp(`<${tag}>\\s*(?:<!\\[CDATA\\[)?([^<\\]]*)`, "i"));
  return m ? m[1].trim() : "—";
};
const blocks = prod.body.split(/<product>/).slice(1);
console.log(`\nSample of ${blocks.length} product(s):`);
for (const b of blocks) {
  const id = pick(b, "id");
  const price = pick(b, "price");
  const ref = pick(b, "reference");
  const nameM = b.match(/<name>[\s\S]*?<!\[CDATA\[([^\]]*)\]\]/);
  console.log(`  · #${id}  "${nameM ? nameM[1].trim() : "—"}"  ref=${ref}  price=${price}`);
}
console.log("\n(first product XML head — so I can see all fields for the parser:)");
console.log(prod.body.slice(prod.body.indexOf("<product>"), prod.body.indexOf("<product>") + 900));
