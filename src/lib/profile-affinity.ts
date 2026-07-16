/**
 * profile-affinity.ts — how well a restaurant wine fits the guest's
 * Vinokompas taste profile persisted by /samouczek
 * (localStorage["wn_compass_profile_v1"], dimension values 0–5).
 *
 * Pure, dependency-free, SSR-safe. Restaurant wines carry no compass
 * fingerprint, so the wine's tags + passport structure are projected onto
 * the same 15 compass dimensions the tutorial uses (static TAG→dimension
 * weight map below), then cosine-scored against the profile vector. Both
 * vectors are non-negative, so the cosine is already in 0..1.
 *
 * Consumed by /pairing ("Uwzględnij mój profil smaku" ranking blend).
 * No I/O — trivially unit-testable (see __tests__/profile-affinity.test.ts).
 */

/** Same dimension set as MATCH_DIMS in samouczek-match.ts — 3 base tastes
 *  + 12 tendencje. Kept local so the pairing bundle doesn't drag the
 *  samouczek wine catalog in. */
export const AFFINITY_DIMS = [
  "base.slodycz",
  "base.cierpkosc",
  "base.kwasowosc",
  "swieze.cytrusy",
  "swieze.zielone",
  "oleiste.maslo",
  "oleiste.tropikalne",
  "miekkie.dojrzale",
  "miekkie.konfitury",
  "tegie.cigaro",
  "tegie.suszone",
  "szorstkie.pizmo",
  "szorstkie.dab",
  "ziemiste.mineraly",
  "ziemiste.sciolka",
] as const;

export type AffinityDim = (typeof AFFINITY_DIMS)[number];

type DimWeights = Partial<Record<AffinityDim, number>>;

/** Structural subset of PairingWine — accepts any wine-shaped object. */
export interface AffinityWineInput {
  tags?: string[];
  passport?: {
    acidity?: string;
    tannin?: string;
    body?: string;
  };
}

/**
 * Static tag → compass-dimension weight map. Keys are lowercased; covers
 * the sandbox seed vocabulary (Dry / High Acid / Tannic / Bold / Rich /
 * Red Fruit / Mineral / Savory / Sparkling …) and the restaurant adapter's
 * style + derived aroma tags (White / Red / Dessert / Citrus / Mineral /
 * Red Fruit / Savory). Unknown tags (grape names, DB-authored labels)
 * simply contribute nothing.
 */
const TAG_DIMENSIONS: Record<string, DimWeights> = {
  // wine styles
  white: { "swieze.cytrusy": 1, "swieze.zielone": 1, "base.kwasowosc": 1 },
  red: { "miekkie.dojrzale": 1, "base.cierpkosc": 1 },
  rose: { "miekkie.dojrzale": 1, "swieze.cytrusy": 1 },
  "rosé": { "miekkie.dojrzale": 1, "swieze.cytrusy": 1 },
  sparkling: { "swieze.cytrusy": 2, "ziemiste.mineraly": 2, "base.kwasowosc": 2 },
  dessert: { "base.slodycz": 3, "oleiste.tropikalne": 2, "miekkie.konfitury": 2 },
  // aroma / structure tags
  citrus: { "swieze.cytrusy": 3, "base.kwasowosc": 2 },
  mineral: { "ziemiste.mineraly": 3, "base.kwasowosc": 1 },
  "red fruit": { "miekkie.dojrzale": 3, "base.slodycz": 1 },
  "high acid": { "base.kwasowosc": 3, "swieze.cytrusy": 1, "swieze.zielone": 1 },
  dry: { "base.cierpkosc": 1, "base.kwasowosc": 1 },
  sweet: { "base.slodycz": 3, "miekkie.konfitury": 1 },
  tannic: { "base.cierpkosc": 3, "szorstkie.dab": 2, "szorstkie.pizmo": 1 },
  bold: { "base.cierpkosc": 2, "tegie.cigaro": 2, "szorstkie.dab": 1 },
  rich: { "base.slodycz": 2, "oleiste.maslo": 2, "oleiste.tropikalne": 1 },
  savory: { "ziemiste.sciolka": 2, "szorstkie.pizmo": 1, "base.cierpkosc": 1 },
  peppery: { "szorstkie.dab": 1, "tegie.cigaro": 1 },
  delicate: { "swieze.zielone": 1, "base.kwasowosc": 1 },
  oaky: { "szorstkie.dab": 3, "tegie.cigaro": 1, "oleiste.maslo": 1 },
};

// Passport structure signals — lighter than explicit tags, but they let a
// DB-authored wine with unknown tags still land near the right sectors.
const ACIDITY_DIMENSIONS: Record<string, DimWeights> = {
  high: { "base.kwasowosc": 3, "swieze.cytrusy": 1 },
  medium: { "base.kwasowosc": 1.5 },
};

const TANNIN_DIMENSIONS: Record<string, DimWeights> = {
  high: { "base.cierpkosc": 3, "szorstkie.dab": 2 },
  medium: { "base.cierpkosc": 1.5, "szorstkie.dab": 1 },
  soft: { "base.cierpkosc": 0.5 },
};

const BODY_DIMENSIONS: Record<string, DimWeights> = {
  full: { "oleiste.maslo": 1, "tegie.suszone": 1 },
  light: { "swieze.zielone": 1 },
};

const addWeights = (target: Map<AffinityDim, number>, weights?: DimWeights) => {
  if (!weights) return;
  for (const [dim, w] of Object.entries(weights) as Array<[AffinityDim, number]>) {
    target.set(dim, (target.get(dim) ?? 0) + w);
  }
};

/** Project a wine's tags + passport onto the compass dimensions. */
const buildWineWeights = (wine: AffinityWineInput): Map<AffinityDim, number> => {
  const weights = new Map<AffinityDim, number>();
  for (const tag of wine.tags ?? []) {
    addWeights(weights, TAG_DIMENSIONS[tag.trim().toLowerCase()]);
  }
  addWeights(weights, ACIDITY_DIMENSIONS[wine.passport?.acidity?.toLowerCase() ?? ""]);
  addWeights(weights, TANNIN_DIMENSIONS[wine.passport?.tannin?.toLowerCase() ?? ""]);
  addWeights(weights, BODY_DIMENSIONS[wine.passport?.body?.toLowerCase() ?? ""]);
  return weights;
};

/**
 * Affinity 0..1 between the guest's compass profile and a wine.
 * 0 when the profile is empty/all-zero or the wine maps to no dimension.
 */
export function profileWineAffinity(
  profile: Record<string, number>,
  wine: AffinityWineInput,
): number {
  const wineWeights = buildWineWeights(wine);

  let dot = 0;
  let pSq = 0;
  let wSq = 0;
  for (const dim of AFFINITY_DIMS) {
    const p = Math.max(0, profile[dim] ?? 0);
    const w = wineWeights.get(dim) ?? 0;
    dot += p * w;
    pSq += p * p;
    wSq += w * w;
  }

  if (pSq === 0 || wSq === 0) return 0;
  const cos = dot / (Math.sqrt(pSq) * Math.sqrt(wSq));
  return Math.min(1, Math.max(0, cos));
}

/** How many known dimensions the profile has set above zero. */
export function filledProfileDims(profile: Record<string, number>): number {
  let n = 0;
  for (const dim of AFFINITY_DIMS) {
    if ((profile[dim] ?? 0) > 0) n += 1;
  }
  return n;
}

/**
 * Safe-parse the raw localStorage payload into a clean profile: known
 * dimensions only, finite positive numbers, clamped to the tutorial's 0–5
 * scale. Returns null for missing/corrupt/empty payloads.
 */
export function parseStoredProfile(
  raw: string | null | undefined,
): Record<string, number> | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const source = parsed as Record<string, unknown>;
    const profile: Record<string, number> = {};
    for (const dim of AFFINITY_DIMS) {
      const value = source[dim];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        profile[dim] = Math.min(5, value);
      }
    }
    return Object.keys(profile).length > 0 ? profile : null;
  } catch {
    return null;
  }
}
