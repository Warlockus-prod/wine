/**
 * Canonical invariants of the Vinokompas wheel.
 *
 * These are the rules we re-established by eye across ~15 client rounds in
 * July 2026, and which nothing in the gate protected: the 2026-07-18
 * independent audit found 19/37 association sprites sitting on the WRONG
 * sector (worst 47.6°), which silently breaks the methodology's directional
 * meaning — a guest reading "cytrusy" would find it under Ziemiste.
 *
 * Everything here is pure maths over the KB, so a radius/font/tile change
 * that violates the canon fails `npm run check` in ~1s instead of shipping.
 * If a test here fails, the wheel stopped matching the licensed poster —
 * fix the geometry, do NOT relax the assertion.
 */

import { describe, it, expect } from "vitest";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { COMPASS_SECTORS } from "@/data/wine-compass-kb";
import { ringSpritesFor } from "@/data/sense-images";
import {
  BASE_AXES,
  SPOKES,
  RING_SPRITES,
  spriteRing,
  labelArc,
  axisIdForSpoke,
  MAX_INTENSITY,
  RING_COUNT,
  STATE_COUNT,
} from "@/lib/compass-geometry";

const TAU = Math.PI * 2;
const SPOKE_ARC = TAU / 12; // 30° — one tendencja
const SECTOR_ARC = TAU / 6; // 60° — one wrażenie
const DEG = (rad: number) => ((((rad * 180) / Math.PI) % 360) + 360) % 360;

/** Sector order clockwise from 12 o'clock, per the official vinocompas.pl
 *  wheel (verified against the calculator's S1/S2 data, 2026-06). */
const CANONICAL_SECTOR_ORDER = [
  "tegie",
  "miekkie",
  "oleiste",
  "swieze",
  "ziemiste",
  "szorstkie",
];

describe("sector ring", () => {
  it("keeps the canonical clockwise order from 12 o'clock", () => {
    expect(COMPASS_SECTORS.map((s) => s.id)).toEqual(CANONICAL_SECTOR_ORDER);
  });

  it("lays 12 spokes, two per sector, in KB order", () => {
    expect(SPOKES).toHaveLength(12);
    expect(SPOKES.map((s) => s.sector.id)).toEqual(
      CANONICAL_SECTOR_ORDER.flatMap((id) => [id, id]),
    );
    // tendencje keep their KB order inside each sector
    expect(SPOKES.map((s) => s.tendencja.id)).toEqual(
      COMPASS_SECTORS.flatMap((s) => s.tendencje.map((t) => t.id)),
    );
  });

  it("starts sector 0 exactly at 12 o'clock — no half-sector offset", () => {
    // The pre-2026-07 bug was a -π/2 offset that centred Miękkie on 12:00.
    // Spoke 0 is the FIRST half of sector 0, so its centre sits at 15°.
    expect(DEG(SPOKES[0].angle)).toBeCloseTo(15, 6);
    expect(SPOKES.every((s) => s.half === SPOKE_ARC / 2)).toBe(true);
    SPOKES.forEach((s, i) => expect(DEG(s.angle)).toBeCloseTo(i * 30 + 15, 6));
  });
});

describe("base-taste axes", () => {
  /** Each base axis must land exactly ON a sector boundary, between the two
   *  named sectors — the geometric heart of the methodology. */
  const EXPECTED: Record<string, { deg: number; before: string; after: string }> = {
    cierpkosc: { deg: 0, before: "szorstkie", after: "tegie" },
    slodycz: { deg: 120, before: "miekkie", after: "oleiste" },
    kwasowosc: { deg: 240, before: "swieze", after: "ziemiste" },
  };

  it("sits at 0° / 120° / 240°", () => {
    expect(BASE_AXES.map((a) => a.id)).toEqual(Object.keys(EXPECTED));
    for (const axis of BASE_AXES) {
      expect(DEG(axis.angle)).toBeCloseTo(EXPECTED[axis.id].deg, 6);
    }
  });

  it("falls ON sector boundaries, not through sector middles", () => {
    for (const axis of BASE_AXES) {
      const deg = DEG(axis.angle);
      // exact multiple of 60° ⇒ it is a boundary
      expect(deg % (DEG(SECTOR_ARC) || 60)).toBeCloseTo(0, 6);
      const { before, after } = EXPECTED[axis.id];
      const idxAfter = Math.round(deg / 60) % 6;
      const idxBefore = (idxAfter + 5) % 6;
      expect(CANONICAL_SECTOR_ORDER[idxAfter]).toBe(after);
      expect(CANONICAL_SECTOR_ORDER[idxBefore]).toBe(before);
    }
  });

  it("routes each spoke to the base taste that owns it", () => {
    // CIERPKOŚĆ owns ±60° about 12:00 (spokes 10,11,0,1), then 4 each.
    const owner = Array.from({ length: 12 }, (_, i) => axisIdForSpoke(i));
    expect(owner).toEqual([
      "cierpkosc", "cierpkosc",
      "slodycz", "slodycz", "slodycz", "slodycz",
      "kwasowosc", "kwasowosc", "kwasowosc", "kwasowosc",
      "cierpkosc", "cierpkosc",
    ]);
    // and the owner's axis is always within 60° of the spoke it claims
    owner.forEach((id, i) => {
      const axis = BASE_AXES.find((a) => a.id === id)!;
      // circular distance spoke-centre → axis, must stay within the axis's
      // own 120° wedge (half-wedge 60°)
      const d = Math.abs(((DEG(SPOKES[i].angle) - DEG(axis.angle) + 540) % 360) - 180);
      expect(d, `spoke ${i} is ${d}° from ${id}`).toBeLessThanOrEqual(60);
    });
  });
});

describe("association garland", () => {
  const sliceOf: Record<string, number> = {};
  for (const s of SPOKES) sliceOf[s.tendencja.id.replace(/\./g, "-")] = s.index;

  it("names only real tendencje", () => {
    for (const sprite of RING_SPRITES) {
      expect(sliceOf[sprite.t], `unknown tendencja ${sprite.t}`).toBeTypeOf("number");
    }
  });

  it("ships every sprite file it references", () => {
    for (const sprite of RING_SPRITES) {
      const p = resolve(process.cwd(), `public/senses/ring/${sprite.f}.png`);
      expect(existsSync(p), `missing asset ${sprite.f}.png`).toBe(true);
    }
  });

  /** THE regression the audit caught. A sprite may only stray into a
   *  neighbouring slice that is EMPTY in its own row (single-sprite
   *  tendencje donate half their arc so no hole opens) — never onto a slice
   *  that has objects of its own. */
  it("keeps every sprite inside its own 30° slice", () => {
    const sprites = spriteRing(224, 266);
    expect(sprites).toHaveLength(RING_SPRITES.length);

    const rows = new Map<number, typeof sprites>();
    for (const s of sprites) rows.set(s.r, [...(rows.get(s.r) ?? []), s]);
    expect(rows.size).toBe(2); // two staggered rows

    let worstDeg = 0;
    for (const items of rows.values()) {
      const present = new Set(items.map((x) => sliceOf[x.t]));
      for (const it of items) {
        const own = sliceOf[it.t];
        const landed = Math.floor((((it.theta % TAU) + TAU) % TAU) / SPOKE_ARC);
        expect(
          landed === own || !present.has(landed),
          `${it.f} landed on slice ${landed}, owns ${own}`,
        ).toBe(true);

        // how far outside its own slice, in degrees (0 = inside)
        const lo = own * 30;
        const hi = lo + 30;
        const d = DEG(it.theta);
        const outside = d < lo ? lo - d : d > hi ? d - hi : 0;
        worstDeg = Math.max(worstDeg, Math.min(outside, 360 - outside));
      }
    }
    // audit measured 11° worst after the fix; 15° = half a slice is the
    // hard ceiling the donation logic can ever produce.
    expect(worstDeg).toBeLessThanOrEqual(15);
  });

  it("is deterministic — same input, same layout", () => {
    expect(spriteRing(224, 266)).toEqual(spriteRing(224, 266));
  });
});

describe("curved labels", () => {
  it("flips bottom-half arcs so text never renders upside-down", () => {
    // sweep flag 1 on the top half, 0 on the bottom
    const top = labelArc(320, 320, 178, 0, 0.26);
    const bottom = labelArc(320, 320, 178, Math.PI, 0.26);
    expect(top).toMatch(/A 178 178 0 0 1 /);
    expect(bottom).toMatch(/A 178 178 0 0 0 /);
  });

  it("puts the arc at the requested radius", () => {
    const [, x, y] = labelArc(320, 320, 178, 0, 0.2).match(/M ([\d.]+) ([\d.]+)/)!;
    const dist = Math.hypot(Number(x) - 320, Number(y) - 320);
    expect(dist).toBeCloseTo(178, 1);
  });
});

/** The guide card (InteractiveCompass) reuses these sprites through its OWN
 *  hand-maintained count map in sense-images.ts. Two hand-written copies of
 *  one fact drift the moment anyone re-slices — this ties them together. */
describe("card ↔ wheel sprite manifests", () => {
  it("agree on every tendencja, and both match what is on disk", () => {
    const wheelCount: Record<string, number> = {};
    for (const s of RING_SPRITES) wheelCount[s.t] = (wheelCount[s.t] ?? 0) + 1;

    for (const spoke of SPOKES) {
      const key = spoke.tendencja.id.replace(/\./g, "-");
      const fromCard = ringSpritesFor(spoke.tendencja.id, 99)
        .filter((p) => p.includes(`/${key}-`))
        .length;
      const onDisk = Array.from({ length: 12 }, (_, i) => i + 1).filter((i) =>
        existsSync(resolve(process.cwd(), `public/senses/ring/${key}-${i}.png`)),
      ).length;

      expect(wheelCount[key] ?? 0, `wheel vs disk for ${key}`).toBe(onDisk);
      expect(fromCard, `card vs disk for ${key}`).toBe(onDisk);
    }
  });

  it("never hands the card a path it cannot render", () => {
    for (const spoke of SPOKES) {
      for (const id of [spoke.tendencja.id, spoke.sector.id]) {
        for (const p of ringSpritesFor(id)) {
          expect(existsSync(resolve(process.cwd(), `public${p}`)), `dead ${p}`).toBe(true);
        }
      }
    }
  });
});

describe("intensity scale", () => {
  it("keeps 5 fillable rings and a 6-state click cycle", () => {
    expect(MAX_INTENSITY).toBe(5);
    expect(RING_COUNT).toBe(MAX_INTENSITY);
    expect(STATE_COUNT).toBe(MAX_INTENSITY + 1);
  });
});
