/**
 * dryness — wytrawność estimate from the 3 base smaki (0-5 each).
 *
 * PLACEHOLDER model until the real Vinocompas wytrawność algorithm lands
 * (the UI labels it "model poglądowy"). Extracted from StagedTutorial so the
 * pure math is unit-testable without pulling in the React/next tree.
 *
 *   raw = słodycz*18 − cierpkość*3 − kwasowość*3 + 10, clamped 0..100,
 *   then bucketed into 6 labels (higher = sweeter).
 */

export interface DrynessResult {
  /** 0-100, higher = sweeter. */
  score: number;
  label: string;
}

export function dryness(profile: Record<string, number | undefined>): DrynessResult {
  const s = (profile["base.slodycz"] ?? 0) as number;
  const c = (profile["base.cierpkosc"] ?? 0) as number;
  const k = (profile["base.kwasowosc"] ?? 0) as number;
  const raw = s * 18 - c * 3 - k * 3 + 10;
  const score = Math.max(0, Math.min(100, raw));
  let label: string;
  if (score < 8) label = "Bardzo wytrawne";
  else if (score < 25) label = "Wytrawne";
  else if (score < 45) label = "Półwytrawne";
  else if (score < 65) label = "Półsłodkie";
  else if (score < 85) label = "Słodkie";
  else label = "Bardzo słodkie";
  return { score, label };
}
