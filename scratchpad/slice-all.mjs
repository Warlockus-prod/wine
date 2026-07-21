#!/usr/bin/env node
/**
 * slice-grouped.mjs — cut the 4 "grouped" association originals into their
 * individual objects (client 2026-07-21: some tendencje shipped as ONE glued
 * sprite because the earlier slicer only cut on a single axis and fell back
 * to one blob on grid-arranged images).
 *
 * True 2D connected-components (8-connectivity flood fill) over a
 * background mask (alpha when present, else near-white), min-area filter to
 * drop specks/shadows, and a small bbox-merge to reunite a detached
 * leaf/stem/highlight with its parent object. Each component is isolated
 * (neighbours zeroed) and trimmed to its own bbox.
 *
 *   node scratchpad/slice-grouped.mjs            # → OUT_DIR, prints manifest
 *   node scratchpad/slice-grouped.mjs --write    # also copies into public/
 */
import sharp from "../node_modules/sharp/lib/index.js";
import { readdirSync, mkdirSync, copyFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = resolve(ROOT, "vinocompas_graphics/obrazkinut");
const OUT = resolve(ROOT, "scratchpad/sliced2");
const RING = resolve(ROOT, "public/senses/ring");
mkdirSync(OUT, { recursive: true });

// tendencja → source original (mapped by eye from the labelled contact sheet).
// ALL 12 tendencje re-sliced 2026-07-21 to standardise: one object per sprite
// (client: split the horse from the campfire, the citrus trio, etc.). The
// bbox-merge PAD reunites a detached leaf/stem with its parent AND keeps a
// touching composition (honey jar + comb) as one — the client OK'd honey.
const MAP = {
  "tegie-cigaro": "16_13_31",     // chocolate, cocoa, coffee cup, cinnamon sticks, choc+beans
  "tegie-suszone": "16_14_43",    // dried cranberries, apricots, raisins, muesli mix, cinnamon+vanilla
  "miekkie-dojrzale": "16_15_52", // gooseberry, peach, blueberries, strawberry, blackberry, apple, cherries, barberry, fig
  "miekkie-konfitury": "16_17_44",// jam jars ×4 + fruit pie
  "oleiste-maslo": "16_22_30",    // nuts, butter, toast, honey(jar+comb), cookies
  "oleiste-tropikalne": "16_49_29",// mango, lychee, watermelon, banana, pineapple, papaya
  "swieze-zielone": "16_49_12",   // tomato, asparagus, pepper, cucumber-lemonade, mint, kiwi, artichoke, apple
  "swieze-cytrusy": "16_47_46",   // grapefruit, lemon peel, orange, lime, lemon, lemonade pitcher
  "ziemiste-mineraly": "16_45_40",// starfish ×2, shells ×3, wave, star anise, rock, crystals
  "ziemiste-sciolka": "16_33_51", // lavender, pinecone, mushroom, sprout, thyme, rock, crystals
  "szorstkie-pizmo": "16_36_23",  // wheat, horse, campfire, leather tag
  "szorstkie-dab": "16_45_36",    // smoke swirls, barrel, tree, straw, oak+acorns
};

const findSrc = (stamp) => {
  const f = readdirSync(SRC).find((x) => x.includes(stamp));
  if (!f) throw new Error(`source ${stamp} not found`);
  return resolve(SRC, f);
};

// 8-neighbour offsets
const NB = [-1, 0, 1].flatMap((dy) => [-1, 0, 1].map((dx) => [dx, dy])).filter(([x, y]) => x || y);

async function slice(tendencja, stamp) {
  const src = findSrc(stamp);
  const img = sharp(src).ensureAlpha();
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H, channels: C } = info;

  // Is the alpha channel meaningful? (a real transparent cut-out)
  let transparent = 0;
  for (let i = 0; i < W * H; i++) if (data[i * C + 3] < 32) transparent++;
  const useAlpha = transparent > W * H * 0.05;

  const isBg = (i) => {
    const a = data[i * C + 3];
    if (useAlpha) return a < 40;
    const r = data[i * C], g = data[i * C + 1], b = data[i * C + 2];
    return r > 236 && g > 236 && b > 236; // near-white paper
  };

  // ── connected components (iterative BFS, stack of pixel indices) ──
  const label = new Int32Array(W * H).fill(-1);
  const comps = []; // {id, minX,minY,maxX,maxY, area}
  const stack = [];
  for (let s = 0; s < W * H; s++) {
    if (label[s] !== -1 || isBg(s)) continue;
    const id = comps.length;
    let minX = W, minY = H, maxX = 0, maxY = 0, area = 0;
    stack.push(s);
    label[s] = id;
    while (stack.length) {
      const p = stack.pop();
      const px = p % W, py = (p / W) | 0;
      area++;
      if (px < minX) minX = px; if (px > maxX) maxX = px;
      if (py < minY) minY = py; if (py > maxY) maxY = py;
      for (const [dx, dy] of NB) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (label[q] === -1 && !isBg(q)) { label[q] = id; stack.push(q); }
      }
    }
    comps.push({ id, minX, minY, maxX, maxY, area });
  }

  // ── drop specks/shadows, then merge a small component into a larger one
  //    whose (padded) bbox contains its centre — reunites detached
  //    leaves / stems / drips with their parent object ──
  const MIN_AREA = W * H * 0.0016; // ~0.16% of the frame
  let kept = comps.filter((c) => c.area >= MIN_AREA);
  kept.sort((a, b) => b.area - a.area);
  const PAD = 14;
  const remap = new Map(); // small id → parent id
  for (let i = 0; i < kept.length; i++) {
    for (let j = 0; j < i; j++) {
      const big = kept[j], sm = kept[i];
      if (sm.area > big.area * 0.5) continue; // only truly small get merged
      const cx = (sm.minX + sm.maxX) / 2, cy = (sm.minY + sm.maxY) / 2;
      if (cx >= big.minX - PAD && cx <= big.maxX + PAD && cy >= big.minY - PAD && cy <= big.maxY + PAD) {
        remap.set(sm.id, big.id);
        big.minX = Math.min(big.minX, sm.minX); big.minY = Math.min(big.minY, sm.minY);
        big.maxX = Math.max(big.maxX, sm.maxX); big.maxY = Math.max(big.maxY, sm.maxY);
        sm.merged = true;
        break;
      }
    }
  }
  kept = kept.filter((c) => !c.merged);
  // union-find flatten (one level of merge is enough here)
  const owner = (id) => (remap.has(id) ? remap.get(id) : id);

  // ── export each kept component, isolated + trimmed ──
  kept.sort((a, b) => a.minY - b.minY || a.minX - b.minX); // stable order
  const out = [];
  let k = 0;
  for (const c of kept) {
    k++;
    const w = c.maxX - c.minX + 1, h = c.maxY - c.minY + 1;
    const buf = Buffer.alloc(w * h * 4, 0);
    for (let y = c.minY; y <= c.maxY; y++) {
      for (let x = c.minX; x <= c.maxX; x++) {
        const p = y * W + x;
        const lp = label[p];
        if (lp === -1) continue;
        if (owner(lp) !== c.id && lp !== c.id) continue;
        const o = ((y - c.minY) * w + (x - c.minX)) * 4;
        buf[o] = data[p * C]; buf[o + 1] = data[p * C + 1];
        buf[o + 2] = data[p * C + 2]; buf[o + 3] = useAlpha ? data[p * C + 3] : 255;
      }
    }
    const name = `${tendencja}-${k}`;
    const meta = await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
      .trim({ threshold: 1 })
      .png()
      .toFile(resolve(OUT, `${name}.png`));
    out.push({ name, w: meta.width, h: meta.height, a: +(meta.width / meta.height).toFixed(3) });
  }
  return out;
}

const write = process.argv.includes("--write");
const manifest = {};
for (const [t, stamp] of Object.entries(MAP)) {
  const parts = await slice(t, stamp);
  manifest[t] = parts;
  console.log(`${t}: ${parts.length} objects`);
  for (const p of parts) console.log(`    ${p.name.padEnd(24)} ${p.w}×${p.h}  a=${p.a}`);
  if (write) {
    for (const p of parts) copyFileSync(resolve(OUT, `${p.name}.png`), resolve(RING, `${p.name}.png`));
  }
}
console.log(`\n${write ? "WROTE into public/senses/ring/" : "dry run (add --write to copy into public/)"}`);
// print RING_SPRITES rows for the 4 tendencje, in case they help
console.log("\n// RING_SPRITES rows:");
for (const [t, parts] of Object.entries(manifest)) {
  for (const p of parts) console.log(`  { f: "${p.name}", t: "${t}", a: ${p.a} },`);
}
