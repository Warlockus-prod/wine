import { describe, expect, it } from "vitest";
import {
  AFFINITY_DIMS,
  filledProfileDims,
  parseStoredProfile,
  profileWineAffinity,
  type AffinityWineInput,
} from "@/lib/profile-affinity";

// Shaped like the sandbox seed / restaurant-adapter output.
const citrusWhite: AffinityWineInput = {
  tags: ["White", "Citrus", "High Acid"],
  passport: { acidity: "high", tannin: "none", body: "light" },
};

const tannicRed: AffinityWineInput = {
  tags: ["Red", "Bold", "Tannic"],
  passport: { acidity: "medium", tannin: "high", body: "full" },
};

const dessertWine: AffinityWineInput = {
  tags: ["Dessert", "Rich"],
  passport: { acidity: "low", tannin: "none", body: "full" },
};

describe("profileWineAffinity", () => {
  it("returns 0 for an empty or all-zero profile", () => {
    expect(profileWineAffinity({}, citrusWhite)).toBe(0);
    expect(profileWineAffinity({ "base.kwasowosc": 0 }, citrusWhite)).toBe(0);
  });

  it("returns 0 for a wine with no mappable tags and no passport", () => {
    const profile = { "swieze.cytrusy": 5, "base.kwasowosc": 4 };
    expect(profileWineAffinity(profile, {})).toBe(0);
    expect(profileWineAffinity(profile, { tags: ["Riesling", "Unknown Label"] })).toBe(0);
  });

  it("a citrus/acid profile prefers the citrus white over the tannic red (badge-worthy ≥ 0.5)", () => {
    const profile = { "swieze.cytrusy": 5, "base.kwasowosc": 4 };
    const white = profileWineAffinity(profile, citrusWhite);
    const red = profileWineAffinity(profile, tannicRed);
    expect(white).toBeGreaterThan(red);
    expect(white).toBeGreaterThanOrEqual(0.5);
  });

  it("a tannic/oak profile prefers the bold red; a sweet profile prefers the dessert wine", () => {
    const tanninLover = { "base.cierpkosc": 5, "szorstkie.dab": 4, "tegie.cigaro": 2 };
    expect(profileWineAffinity(tanninLover, tannicRed)).toBeGreaterThan(
      profileWineAffinity(tanninLover, citrusWhite),
    );
    expect(profileWineAffinity(tanninLover, tannicRed)).toBeGreaterThanOrEqual(0.5);

    const sweetTooth = { "base.slodycz": 5, "oleiste.tropikalne": 3, "miekkie.konfitury": 3 };
    expect(profileWineAffinity(sweetTooth, dessertWine)).toBeGreaterThan(
      profileWineAffinity(sweetTooth, tannicRed),
    );
  });

  it("stays within 0..1 for arbitrary profiles and is tag-case-insensitive", () => {
    const everything = Object.fromEntries(AFFINITY_DIMS.map((d, i) => [d, (i % 6) as number]));
    for (const wine of [citrusWhite, tannicRed, dessertWine]) {
      const a = profileWineAffinity(everything, wine);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(1);
    }
    const profile = { "swieze.cytrusy": 5 };
    expect(profileWineAffinity(profile, { tags: ["CITRUS"] })).toBe(
      profileWineAffinity(profile, { tags: ["citrus"] }),
    );
  });
});

describe("parseStoredProfile + filledProfileDims", () => {
  it("rejects missing, corrupt and non-object payloads", () => {
    expect(parseStoredProfile(null)).toBeNull();
    expect(parseStoredProfile("")).toBeNull();
    expect(parseStoredProfile("not json{")).toBeNull();
    expect(parseStoredProfile("[1,2,3]")).toBeNull();
    expect(parseStoredProfile('"string"')).toBeNull();
  });

  it("keeps only known positive numeric dims, clamps to 5, and null on empty result", () => {
    expect(parseStoredProfile("{}")).toBeNull();
    expect(parseStoredProfile('{"base.slodycz":0,"junk.dim":5}')).toBeNull();
    const parsed = parseStoredProfile(
      '{"base.kwasowosc":9,"swieze.cytrusy":3,"junk.dim":4,"tegie.cigaro":"x"}',
    );
    expect(parsed).toEqual({ "base.kwasowosc": 5, "swieze.cytrusy": 3 });
    expect(filledProfileDims(parsed ?? {})).toBe(2);
    expect(filledProfileDims({})).toBe(0);
  });
});
