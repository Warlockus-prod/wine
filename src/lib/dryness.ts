/**
 * dryness — wytrawność estimate from the 3 base smaki (0-5 each).
 *
 * PLACEHOLDER model until the real Vinocompas wytrawność algorithm lands
 * (the UI labels it "model poglądowy"). Extracted from StagedTutorial so the
 * pure math is unit-testable without pulling in the React/next tree.
 *
 *   raw = słodycz*18 − cierpkość*3 − kwasowość*3 + 10, clamped 0..100,
 *   then bucketed into 5 labels (higher = sweeter).
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

// Bucket labels, driest → sweetest. FIVE intervals per the client's sketch
// of the scale (2026-07-21: B.W / W / P.W / P.S / S) — each an equal fifth,
// so the pin always sits inside the interval whose label it carries.
const LABELS: Record<CompassLang, [string, string, string, string, string]> = {
  pl: ["Bardzo wytrawne", "Wytrawne", "Półwytrawne", "Półsłodkie", "Słodkie"],
  en: ["Bone dry", "Dry", "Off-dry", "Medium sweet", "Sweet"],
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
  // Equal fifths — the interval boundaries match the labelled scale ticks.
  const label = L[Math.min(4, Math.floor(score / 20))];
  return { score, label };
}
