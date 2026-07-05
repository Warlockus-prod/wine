import { describe, expect, it } from "vitest";
import { MATCH_DIMS, filledDimensions, matchWines } from "@/lib/samouczek-match";
import { SAMOUCZEK_WINES } from "@/data/samouczek-wines";

describe("filledDimensions", () => {
  it("counts only known dimensions set above zero", () => {
    expect(filledDimensions({})).toBe(0);
    expect(filledDimensions({ "base.slodycz": 0 })).toBe(0);
    expect(filledDimensions({ "base.slodycz": 3, "swieze.cytrusy": 1 })).toBe(2);
    expect(filledDimensions({ "not.a.dimension": 5 })).toBe(0);
  });
});

describe("matchWines (cosine matcher)", () => {
  it("returns [] for an empty profile (norm 0 guard)", () => {
    expect(matchWines({})).toEqual([]);
    expect(matchWines({ "base.slodycz": 0 })).toEqual([]);
  });

  it("respects the limit and sorts descending by matchPct", () => {
    const res = matchWines({ "miekkie.dojrzale": 5, "base.slodycz": 2 }, 3);
    expect(res.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < res.length; i++) {
      expect(res[i - 1].matchPct).toBeGreaterThanOrEqual(res[i].matchPct);
    }
  });

  it("matchPct stays within 0..100 for arbitrary profiles", () => {
    const profile = Object.fromEntries(MATCH_DIMS.map((d, i) => [d, (i % 6) as number]));
    for (const { matchPct } of matchWines(profile, SAMOUCZEK_WINES.length)) {
      expect(matchPct).toBeGreaterThanOrEqual(0);
      expect(matchPct).toBeLessThanOrEqual(100);
    }
  });

  it("a profile equal to a wine's fingerprint ranks that wine #1 (pct 100)", () => {
    const wine = SAMOUCZEK_WINES[0];
    const profile: Record<string, number> = {};
    for (const d of MATCH_DIMS) profile[d] = wine.fingerprint[d] ?? 0;
    const res = matchWines(profile, 1);
    expect(res[0]?.matchPct).toBe(100);
  });

  it("every wine fingerprint key is a known MATCH_DIM (no silent-zero typos)", () => {
    const dims = new Set<string>(MATCH_DIMS);
    for (const wine of SAMOUCZEK_WINES) {
      for (const key of Object.keys(wine.fingerprint)) {
        expect(dims.has(key), `${wine.id} fingerprint key "${key}"`).toBe(true);
      }
    }
  });
});
