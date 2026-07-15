/**
 * samouczek-match.ts — match the live Vinokompas taste profile to wines.
 *
 * Pure, dependency-free, SSR-safe. Cosine similarity between the user's
 * profile vector and each wine's compass fingerprint over a fixed set of
 * dimensions (3 base tastes + 12 tendencje). Returns top-N with a display
 * match percentage. No I/O, so it's trivially unit-testable.
 */

import { SAMOUCZEK_WINES, type SamouczekWine } from "@/data/samouczek-wines";

/** Fixed dimension order — must cover every fingerprint/profile key. */
export const MATCH_DIMS = [
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

export interface ScoredWine {
  wine: SamouczekWine;
  /** 0..100 display match. */
  matchPct: number;
}

/** How many profile dimensions the user has set above zero. */
export function filledDimensions(profile: Record<string, number>): number {
  let n = 0;
  for (const d of MATCH_DIMS) if ((profile[d] ?? 0) > 0) n += 1;
  return n;
}

const norm = (v: number[]): number =>
  Math.sqrt(v.reduce((s, x) => s + x * x, 0));

/**
 * Top-N wines whose fingerprint best aligns with the profile.
 * Returns [] when nothing is selected yet.
 */
export function matchWines(
  profile: Record<string, number>,
  limit = 3,
): ScoredWine[] {
  const pv = MATCH_DIMS.map((d) => profile[d] ?? 0);
  const pNorm = norm(pv);
  if (pNorm === 0) return [];

  const scored: ScoredWine[] = SAMOUCZEK_WINES.map((wine) => {
    const wv = MATCH_DIMS.map((d) => wine.fingerprint[d] ?? 0);
    const wNorm = norm(wv);
    if (wNorm === 0) return { wine, matchPct: 0 };
    const dot = pv.reduce((s, x, i) => s + x * wv[i], 0);
    const cos = dot / (pNorm * wNorm);
    return { wine, matchPct: Math.round(cos * 100) };
  });

  scored.sort((a, b) => b.matchPct - a.matchPct);

  // The shop catalog lists the same label in several bottle formats
  // ("Portillo Malbec" + "Portillo Malbec 37,5 cl") with identical
  // fingerprints — two of three proposal slots went to one wine
  // (audit 2026-07). Keep only the best-ranked entry per normalized label
  // (volume suffixes stripped) so every slot is a distinct recommendation.
  const seen = new Set<string>();
  const distinct: ScoredWine[] = [];
  for (const s of scored) {
    const label = s.wine.name_pl
      .toLowerCase()
      .replace(/\b\d+([.,]\d+)?\s*(cl|ml|l)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
    if (seen.has(label)) continue;
    seen.add(label);
    distinct.push(s);
    if (distinct.length === limit) break;
  }
  return distinct.filter((s) => s.matchPct > 0);
}
