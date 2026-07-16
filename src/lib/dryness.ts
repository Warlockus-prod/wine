/**
 * dryness — wytrawność estimate from the 3 base smaki (0-5 each).
 *
 * PLACEHOLDER model until the real Vinocompas wytrawność algorithm lands
 * (the UI labels it "model poglądowy"). Extracted from StagedTutorial so the
 * pure math is unit-testable without pulling in the React/next tree.
 *
 *   raw = słodycz*18 − cierpkość*3 − kwasowość*3 + 10, clamped 0..100,
 *   then bucketed into 6 labels (higher = sweeter).
 *
 * `lang` picks the bucket-label language (default PL - existing call-sites
 * and tests stay byte-identical); EN labels follow docs/i18n/samouczek-en.md.
 */

import type { CompassLang } from "@/data/wine-compass-kb";

export interface DrynessResult {
  /** 0-100, higher = sweeter. */
  score: number;
  label: string;
}

// Bucket labels, driest → sweetest. EN terms per the translation pack
// (Bone dry / Dry / Off-dry / Medium sweet / Sweet / Lusciously sweet).
const LABELS: Record<CompassLang, [string, string, string, string, string, string]> = {
  pl: ["Bardzo wytrawne", "Wytrawne", "Półwytrawne", "Półsłodkie", "Słodkie", "Bardzo słodkie"],
  en: ["Bone dry", "Dry", "Off-dry", "Medium sweet", "Sweet", "Lusciously sweet"],
};

export function dryness(
  profile: Record<string, number | undefined>,
  lang: CompassLang = "pl",
): DrynessResult {
  const s = (profile["base.slodycz"] ?? 0) as number;
  const c = (profile["base.cierpkosc"] ?? 0) as number;
  const k = (profile["base.kwasowosc"] ?? 0) as number;
  const raw = s * 18 - c * 3 - k * 3 + 10;
  const score = Math.max(0, Math.min(100, raw));
  const L = LABELS[lang];
  let label: string;
  if (score < 8) label = L[0];
  else if (score < 25) label = L[1];
  else if (score < 45) label = L[2];
  else if (score < 65) label = L[3];
  else if (score < 85) label = L[4];
  else label = L[5];
  return { score, label };
}
