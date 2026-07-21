/**
 * compass-geometry.ts — the Vinokompas wheel's PURE geometry.
 *
 * Extracted from TasteCompass.tsx so the canonical invariants can be locked
 * by unit tests (src/lib/__tests__/compass-geometry.test.ts) instead of only
 * by eye. The 2026-07-18 independent audit caught 19/37 sprites drifting onto
 * neighbouring sectors — nothing in the gate would have caught that, and
 * nothing protected the fix afterwards. Now the gate does.
 *
 * NOTHING here may import React, next/*, or touch the DOM: it is plain maths
 * over the KB, run in vitest's node environment.
 *
 * Angle convention: 0 = 12 o'clock, growing CLOCKWISE, so
 *   x = cx + r·sin θ,  y = cy − r·cos θ.
 */

import {
  COMPASS_SECTORS,
  type CompassSector,
  type Tendencja,
} from "@/data/wine-compass-kb";

export const MAX_INTENSITY = 5;
// 5 fillable divisions (concentric rings). intensity 0 = empty centre,
// 1..5 fills one ring each up to the outer edge.
export const RING_COUNT = MAX_INTENSITY;
// Click cycle visits 6 states: 0 (empty) then 1..5.
export const STATE_COUNT = MAX_INTENSITY + 1;

// 3 base smaki at 120° intervals. The compass uses a north-zero,
// clockwise convention (x = cx + r·sin θ, y = cy − r·cos θ), so θ=0 is
// the top. Matches the canonical Vinokompas layout:
//   CIERPKOŚĆ top · SŁODYCZ lower-right (4 o'clock) · KWASOWOŚĆ lower-left.
// (Previously these used -π/2 offsets from a math-convention which put
//  CIERPKOŚĆ on the left and clipped its label - fixed.)
export const BASE_AXES = [
  { id: "cierpkosc", label: "CIERPKOŚĆ", label_en: "ASTRINGENCY", angle: 0 },                  // top
  { id: "slodycz",   label: "SŁODYCZ",   label_en: "SWEETNESS",   angle: (2 * Math.PI) / 3 }, // lower-right (4 o'clock)
  { id: "kwasowosc", label: "KWASOWOŚĆ", label_en: "ACIDITY",     angle: (4 * Math.PI) / 3 }, // lower-left (8 o'clock)
] as const;

export interface SpokeMeta {
  sector: CompassSector;
  tendencja: Tendencja;
  /** Angle of spoke center in radians (0 = up, clockwise). */
  angle: number;
  /** Half-width angle of spoke. */
  half: number;
  index: number;
}

/** Arrange 12 spokes around the circle starting at 12 o'clock, clockwise.
 *  Each sector has 2 tendencje placed adjacent to each other. */
const buildSpokes = (): SpokeMeta[] => {
  const out: SpokeMeta[] = [];
  const total = COMPASS_SECTORS.length * 2; // 12
  const arc = (Math.PI * 2) / total;
  let i = 0;
  for (const sector of COMPASS_SECTORS) {
    for (const t of sector.tendencje) {
      // Sector i STARTS at arc*i from 12 o'clock (centre at +arc/2): the base
      // taste axes fall exactly on sector BOUNDARIES, as on the canonical
      // Vinocompas wheel (CIERPKOŚĆ = Szorstkie/Tęgie border, SŁODYCZ =
      // Miękkie/Oleiste, KWASOWOŚĆ = Świeże/Ziemiste). The old -π/2 offset
      // shifted the grid half a sector, centring Miękkie on 12 o'clock.
      const angle = arc * i + arc / 2;
      out.push({
        sector,
        tendencja: t,
        angle,
        half: arc / 2,
        index: i,
      });
      i += 1;
    }
  }
  return out;
};

export const SPOKES = buildSpokes();

/** Arc path for a curved label centred on `theta` (0=top, clockwise) spanning
 *  ±`half`, at radius `r`. Bottom-half arcs are drawn reversed so the text
 *  never renders upside-down — the classic radial-label flip. */
export function labelArc(cx: number, cy: number, r: number, theta: number, half: number): string {
  const deg = (((theta * 180) / Math.PI) % 360 + 360) % 360;
  const bottom = deg > 90 && deg < 270;
  const a1 = bottom ? theta + half : theta - half;
  const a2 = bottom ? theta - half : theta + half;
  const p = (a: number): [number, number] => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x1, y1] = p(a1);
  const [x2, y2] = p(a2);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 ${bottom ? 0 : 1} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Base-taste wedge that owns spoke i: CIERPKOŚĆ spans ±60° about 12 o'clock
 *  (spokes 10,11,0,1), SŁODYCZ spokes 2-5, KWASOWOŚĆ spokes 6-9. Used to route
 *  the level-1 base value onto its four 30° slices so the fill keeps each
 *  slice's own official colour ("цвета как оригинал", 2026-07-17). */
export const axisIdForSpoke = (i: number): string => BASE_AXES[Math.floor(((i + 2) % 12) / 4)].id;

// The association wreath is a garland of INDIVIDUAL object sprites (client
// 2026-07-18: "равномерно без отступов", per her reference poster — no
// grouped tiles). scratchpad/slice-ring2.mjs cuts each official image into
// its component objects via alpha connected-components + gap-only valley
// splits → public/senses/ring/<tendencja>-<k>.png. Order below = clockwise
// ring order (sector order from 12 o'clock); `a` = true sprite aspect.
/** `k` — optional per-sprite shrink (client 2026-07-21: "элементы немного
 *  находят друг на друга… только те, что находят, и чуть больше остальных
 *  уменьшить"). Applied AFTER the common scale, so unflagged sprites keep
 *  their size; flagged ones (the 11→2:30 overlap chain in the inner row +
 *  the visually-oversized dojrzałe/masło/konfitury pieces) shrink 8-18%. */
export const RING_SPRITES: { f: string; t: string; a: number; k?: number }[] = [
  { f: "tegie-cigaro-1", t: "tegie-cigaro", a: 1.348, k: 0.8 },
  { f: "tegie-cigaro-2", t: "tegie-cigaro", a: 1.095 },
  { f: "tegie-cigaro-3", t: "tegie-cigaro", a: 1.611, k: 0.75 },
  { f: "tegie-cigaro-4", t: "tegie-cigaro", a: 1.735, k: 0.92 },
  { f: "tegie-cigaro-5", t: "tegie-cigaro", a: 0.553, k: 0.86 },
  { f: "tegie-suszone-1", t: "tegie-suszone", a: 2.119, k: 0.92 },
  { f: "tegie-suszone-2", t: "tegie-suszone", a: 2.224, k: 0.82 },
  { f: "tegie-suszone-3", t: "tegie-suszone", a: 1.589 },
  { f: "tegie-suszone-4", t: "tegie-suszone", a: 4.415, k: 0.82 },
  { f: "tegie-suszone-5", t: "tegie-suszone", a: 1.481, k: 0.9 },
  { f: "miekkie-dojrzale-1", t: "miekkie-dojrzale", a: 1.523, k: 0.88 },
  { f: "miekkie-konfitury-1", t: "miekkie-konfitury", a: 0.985 },
  { f: "miekkie-konfitury-2", t: "miekkie-konfitury", a: 1.2, k: 0.92 },
  { f: "miekkie-konfitury-3", t: "miekkie-konfitury", a: 1.136 },
  { f: "oleiste-maslo-1", t: "oleiste-maslo", a: 1.591, k: 0.88 },
  { f: "oleiste-tropikalne-1", t: "oleiste-tropikalne", a: 1.364 },
  { f: "oleiste-tropikalne-2", t: "oleiste-tropikalne", a: 1.723 },
  { f: "oleiste-tropikalne-3", t: "oleiste-tropikalne", a: 1.573 },
  { f: "oleiste-tropikalne-4", t: "oleiste-tropikalne", a: 0.576 },
  { f: "oleiste-tropikalne-5", t: "oleiste-tropikalne", a: 0.527 },
  { f: "swieze-zielone-1", t: "swieze-zielone", a: 1.584 },
  { f: "swieze-cytrusy-1", t: "swieze-cytrusy", a: 1.036 },
  { f: "swieze-cytrusy-2", t: "swieze-cytrusy", a: 1.193 },
  { f: "swieze-cytrusy-3", t: "swieze-cytrusy", a: 0.87 },
  { f: "ziemiste-mineraly-1", t: "ziemiste-mineraly", a: 1.386 },
  { f: "ziemiste-sciolka-1", t: "ziemiste-sciolka", a: 0.969 },
  { f: "ziemiste-sciolka-2", t: "ziemiste-sciolka", a: 0.959 },
  { f: "ziemiste-sciolka-3", t: "ziemiste-sciolka", a: 0.86 },
  { f: "ziemiste-sciolka-4", t: "ziemiste-sciolka", a: 0.948 },
  { f: "ziemiste-sciolka-5", t: "ziemiste-sciolka", a: 0.394 },
  { f: "szorstkie-pizmo-1", t: "szorstkie-pizmo", a: 0.295 },
  { f: "szorstkie-pizmo-2", t: "szorstkie-pizmo", a: 1.216 },
  { f: "szorstkie-dab-1", t: "szorstkie-dab", a: 0.556, k: 0.88 },
  { f: "szorstkie-dab-2", t: "szorstkie-dab", a: 3.352 },
  { f: "szorstkie-dab-3", t: "szorstkie-dab", a: 0.766, k: 0.84 },
  { f: "szorstkie-dab-4", t: "szorstkie-dab", a: 1.167 },
  { f: "szorstkie-dab-5", t: "szorstkie-dab", a: 1.136, k: 0.8 },
];
/** Lay the sprites in TWO staggered rows with near-uniform gaps AND every
 *  sprite anchored INSIDE its own 30° slice. The earlier pure-uniform pass
 *  drifted 19/37 sprites onto neighbouring sectors (worst 47.6° — caught by
 *  the 2026-07-18 independent audit), which breaks the methodology's
 *  directional meaning. Now: each tendencja's row-items start evenly spread
 *  within their slice, then gap-equalising relaxation runs with a HARD
 *  clamp to the slice's middle 76% — heavy slices (Suszone: 5 wide
 *  sprites) let their objects overlap each other instead of invading the
 *  neighbour, exactly like the dense reference poster. Deterministic. */
export function spriteRing(r1: number, r2: number): { f: string; t: string; theta: number; r: number; w: number; h: number }[] {
  const rows: { idx: number[]; r: number }[] = [
    { idx: RING_SPRITES.map((_, i) => i).filter((i) => i % 2 === 0), r: r1 },
    { idx: RING_SPRITES.map((_, i) => i).filter((i) => i % 2 === 1), r: r2 },
  ];
  // one common sprite scale = the tighter row's budget (uniform look)
  const s0 = Math.min(
    ...rows.map((row) => {
      const sqrtSum = row.idx.reduce((s, i) => s + Math.sqrt(Math.min(RING_SPRITES[i].a, 2.3)), 0);
      // Row coverage: fraction of the ring circumference the sprites fill.
      // Lowered 0.84 → 0.76 (client 2026-07-21 "еще немного") for a uniform
      // ~10% of extra air around every sprite, no per-sprite hand-tuning.
      return (0.76 * 2 * Math.PI * row.r) / sqrtSum;
    }),
  );
  // Radial cap: a sprite may never be taller than the gap between the two
  // rows minus a hair — otherwise angular neighbours from the OTHER row
  // stack onto it (client crops 2026-07-21: cocoa over chocolate at 12,
  // watermelon over papaya at 5). Only tall sprites shrink; wide/flat ones
  // are untouched — exactly the colliding class.
  const hCap = Math.min(0.98 * s0, Math.abs(r2 - r1) - 2);
  const arc = (Math.PI * 2) / 12;
  const sliceIdx: Record<string, number> = {};
  for (const s of SPOKES) sliceIdx[s.tendencja.id.replace(/\./g, "-")] = s.index;
  const out: { f: string; t: string; theta: number; r: number; w: number; h: number }[] = [];
  for (const row of rows) {
    const items = row.idx.map((i) => {
      const x = RING_SPRITES[i];
      const aCap = Math.min(x.a, 2.3);
      let w = s0 * Math.sqrt(aCap) * (x.k ?? 1);
      let h = w / x.a; // true aspect: capped-wide strips get shorter, narrow ones taller
      if (h > hCap) {
        const f = hCap / h;
        w *= f;
        h = hCap;
      }
      return { f: x.f, t: x.t, w, h };
    });
    // Per-tendencja angular domain = its own slice, EXTENDED by half of any
    // adjacent slice that has no items in THIS row (single-sprite tendencje
    // occupy only one row; without the donation the other row opens a
    // ~130px hole there — the slice's true object still shows in its own
    // row at that angle, so the direction keeps reading correctly).
    const present = new Set(items.map((x) => sliceIdx[x.t]));
    const loB: Record<number, number> = {};
    const hiB: Record<number, number> = {};
    for (const si of present) {
      loB[si] = arc * si;
      hiB[si] = arc * (si + 1);
    }
    for (let e = 0; e < 12; e++) {
      if (present.has(e)) continue;
      let p = (e + 11) % 12;
      while (!present.has(p)) p = (p + 11) % 12;
      let n = (e + 1) % 12;
      while (!present.has(n)) n = (n + 1) % 12;
      hiB[p] = Math.max(hiB[p], arc * e + arc / 2 + (p > e ? Math.PI * 2 : 0));
      loB[n] = Math.min(loB[n], arc * e + arc / 2 - (n < e ? Math.PI * 2 : 0));
    }
    // initial: spread each tendencja's items evenly WITHIN its domain
    const theta: number[] = [];
    for (let k = 0; k < items.length; k++) {
      const si = sliceIdx[items[k].t];
      const group = items.map((x, j) => (x.t === items[k].t ? j : -1)).filter((j) => j >= 0);
      const m = group.length;
      const pos = group.indexOf(k);
      theta.push(loB[si] + ((hiB[si] - loB[si]) * (pos + 1)) / (m + 1));
    }
    // clamped gap-equalising relaxation within each sprite's domain.
    // Over-full slices (Σ widths > their arc: the dab/cigaro chain at
    // 11-1 o'clock) get a slimmer pad, so their centres may use more of
    // their OWN slice before overlapping each other — still hard-clamped
    // inside the slice, so the canon (sprite in own slice) holds.
    const sliceLoad: Record<number, number> = {};
    for (const it of items) {
      const si = sliceIdx[it.t];
      sliceLoad[si] = (sliceLoad[si] ?? 0) + it.w;
    }
    for (let pass = 0; pass < 8; pass++) {
      for (let k = 0; k < items.length; k++) {
        const prev = (k + items.length - 1) % items.length;
        const next = (k + 1) % items.length;
        const arcL = (((theta[k] - theta[prev]) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const arcR = (((theta[next] - theta[k]) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const gapL = arcL * row.r - (items[k].w + items[prev].w) / 2;
        const gapR = arcR * row.r - (items[k].w + items[next].w) / 2;
        const shift = ((gapR - gapL) / 2 / row.r) * 0.5;
        const si = sliceIdx[items[k].t];
        const pad = arc * (sliceLoad[si] > arc * row.r ? 0.04 : 0.1);
        theta[k] = Math.max(loB[si] + pad, Math.min(hiB[si] - pad, theta[k] + shift));
      }
    }
    for (let k = 0; k < items.length; k++) {
      out.push({ ...items[k], theta: theta[k], r: row.r });
    }
  }
  return out;
}
