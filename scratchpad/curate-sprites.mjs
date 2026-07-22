#!/usr/bin/env node
/**
 * curate-sprites.mjs — drop duplicate / over-fragmented object sprites the
 * source sticker-sheets repeated (client 2026-07-21: "почистим повторения").
 *
 * The 2D slicer faithfully cut every instance, so a source that drew two red
 * starfish / two straw bundles / five smoke swirls produced duplicates in the
 * garland. This keeps ONE clean representative of each distinct object,
 * renumbers survivors sequentially, and prints the regenerated manifest.
 *
 *   node scratchpad/curate-sprites.mjs           # dry run + manifest
 *   node scratchpad/curate-sprites.mjs --write   # rewrite public/senses/ring
 */
import sharp from "../node_modules/sharp/lib/index.js";
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RING = resolve(ROOT, "public/senses/ring");
const write = process.argv.includes("--write");

// Which CURRENT indices to KEEP (drop the rest). Tendencje not listed keep
// all. NOTE: reads the CURRENT on-disk state — the cigaro/mineraly/dab dedup
// already shipped, so only the new drops are listed here (client 2026-07-21:
// remove the two "miksy" — the trail-mix and the nuts-on-spoon).
const KEEP = {
  "swieze-cytrusy": [1, 2, 4, 5, 6], // drop 3 (thin lemon-peel curl — reads as clutter in the card, keep the big fruits)
};

const TENDENCJE = [
  "tegie-cigaro", "tegie-suszone", "miekkie-dojrzale", "miekkie-konfitury",
  "oleiste-maslo", "oleiste-tropikalne", "swieze-zielone", "swieze-cytrusy",
  "ziemiste-mineraly", "ziemiste-sciolka", "szorstkie-pizmo", "szorstkie-dab",
];

const rows = [];
const counts = {};
for (const t of TENDENCJE) {
  const present = readdirSync(RING)
    .filter((f) => new RegExp(`^${t}-\\d+\\.png$`).test(f))
    .map((f) => +f.match(/-(\d+)\./)[1])
    .sort((a, b) => a - b);
  const keep = KEEP[t] ?? present;

  // load survivors into memory BEFORE deleting anything
  const survivors = [];
  for (const idx of keep) {
    const p = resolve(RING, `${t}-${idx}.png`);
    survivors.push(readFileSync(p));
  }

  if (write) {
    for (const idx of present) unlinkSync(resolve(RING, `${t}-${idx}.png`));
  }

  let k = 0;
  for (const buf of survivors) {
    k++;
    const meta = await sharp(buf).metadata();
    const a = +(meta.width / meta.height).toFixed(3);
    if (write) writeFileSync(resolve(RING, `${t}-${k}.png`), buf);
    rows.push(`  { f: "${t}-${k}", t: "${t}", a: ${a} },`);
  }
  counts[t.replace("-", ".")] = k;
  const dropped = present.length - keep.length;
  console.log(`${t}: ${present.length} → ${k}${dropped ? `  (dropped ${dropped})` : ""}`);
}

console.log(`\n${write ? "REWROTE public/senses/ring/" : "dry run (add --write)"}  — ${rows.length} sprites total`);
console.log("\n// RING_SPRITES rows:");
console.log(rows.join("\n"));
console.log("\n// RING_SPRITE_COUNTS:");
for (const [k, v] of Object.entries(counts)) console.log(`  "${k}": ${v},`);
