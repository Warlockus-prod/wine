#!/usr/bin/env node
/**
 * gen-plum.mjs — generate a "śliwka" sprite for tegie-suszone in the EXACT
 * style of the existing association artwork (client 2026-07-22: replace the
 * removed trail-mix with a plum). Uses gpt-image-1 with the neighbouring
 * dried-fruit sprites as STYLE REFERENCES (images.edit) + native transparent
 * background, so it matches instead of a text-only guess.
 *
 *   node --env-file=.env.local scripts/gen-plum.mjs
 *
 * Writes a few candidates to scratchpad/plum/ for review; does NOT touch
 * public/ (place the chosen one by hand once approved).
 */
import OpenAI from "../node_modules/openai/index.mjs";
import sharp from "../node_modules/sharp/lib/index.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RING = resolve(ROOT, "public/senses/ring");
const OUT = resolve(ROOT, "scratchpad/plum");
mkdirSync(OUT, { recursive: true });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) { console.error("OPENAI_API_KEY missing (run with --env-file=.env.local)"); process.exit(1); }
const openai = new OpenAI({ apiKey });

// Style references: the dried-fruit sprites already in tegie-suszone.
const refFiles = ["tegie-suszone-4", "tegie-suszone-2", "miekkie-dojrzale-9"]; // apricots, raisins, fig
const refs = [];
for (const f of refFiles) {
  refs.push(await OpenAI.toFile(await readFile(resolve(RING, `${f}.png`)), `${f}.png`, { type: "image/png" }));
}

const PROMPT =
  "Using the reference images ONLY as a strict style guide (their glossy, " +
  "semi-realistic hand-painted food-illustration look, saturated colours, " +
  "soft highlights and gentle drop shadow), create ONE new sticker of a " +
  "small cluster of TWO to THREE whole DRIED PLUMS (prunes): deep dark " +
  "purple-black glossy skin with natural soft wrinkles, clearly plum-shaped " +
  "and noticeably larger than raisins, one plum optionally cut to show the " +
  "amber flesh and pit. Centred, subtle soft shadow beneath, FULLY " +
  "TRANSPARENT background, no text, no packaging, no plate. Match the " +
  "reference style exactly.";

const N = Number(process.env.PLUM_N || 3);
console.log(`Generating ${N} plum candidate(s) with gpt-image-1 (transparent)…`);

const res = await openai.images.edit({
  model: "gpt-image-1",
  image: refs,
  prompt: PROMPT,
  size: "1024x1024",
  background: "transparent",
  n: N,
});

let k = 0;
for (const img of res.data) {
  k++;
  const raw = Buffer.from(img.b64_json, "base64");
  writeFileSync(resolve(OUT, `plum-${k}-raw.png`), raw);
  // trim transparent margins so it drops straight into the ring like the others
  const trimmed = await sharp(raw).trim({ threshold: 1 }).png().toBuffer();
  const meta = await sharp(trimmed).metadata();
  writeFileSync(resolve(OUT, `plum-${k}.png`), trimmed);
  console.log(`  plum-${k}.png  ${meta.width}x${meta.height}  a=${(meta.width / meta.height).toFixed(3)}`);
}
console.log(`\nReview scratchpad/plum/plum-*.png — place the best as public/senses/ring/tegie-suszone-5.png`);
