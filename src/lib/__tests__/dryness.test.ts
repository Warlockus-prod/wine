import { describe, expect, it } from "vitest";
import { dryness } from "@/lib/dryness";

describe("dryness (placeholder wytrawność model)", () => {
  it("empty profile → base offset 10 → Wytrawne", () => {
    const r = dryness({});
    expect(r.score).toBe(10);
    expect(r.label).toBe("Bardzo wytrawne");
  });

  it("max słodycz → clamped to 100 → Słodkie", () => {
    const r = dryness({ "base.slodycz": 5 });
    expect(r.score).toBe(100);
    expect(r.label).toBe("Słodkie");
  });

  it("cierpkość + kwasowość pull the score down to the floor", () => {
    const r = dryness({ "base.cierpkosc": 5, "base.kwasowosc": 5 });
    expect(r.score).toBe(0); // 10 - 15 - 15 clamped at 0
    expect(r.label).toBe("Bardzo wytrawne");
  });

  it("score is always clamped to 0..100", () => {
    for (let s = 0; s <= 5; s++)
      for (let c = 0; c <= 5; c++)
        for (let k = 0; k <= 5; k++) {
          const { score } = dryness({
            "base.slodycz": s,
            "base.cierpkosc": c,
            "base.kwasowosc": k,
          });
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
  });

  it("label boundaries match the documented buckets", () => {
    expect(dryness({ "base.cierpkosc": 1 }).label).toBe("Bardzo wytrawne"); // 7
    expect(dryness({}).label).toBe("Bardzo wytrawne"); // 10 (<20)
    expect(dryness({ "base.slodycz": 1 }).label).toBe("Wytrawne"); // 28
    expect(dryness({ "base.slodycz": 2 }).label).toBe("Półwytrawne"); // 46
    expect(dryness({ "base.slodycz": 3 }).label).toBe("Półsłodkie"); // 64
    expect(dryness({ "base.slodycz": 4 }).label).toBe("Słodkie"); // 82
  });
});
