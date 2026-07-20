/**
 * Contextual chat suggestions.
 *
 * The chips under the composer used to be 5 fixed questions shown only while
 * the conversation was empty. They now follow what the guest is actually
 * doing: which stage is open, which segment they last set, and which part of
 * the page is on screen (client 2026-07-18 "подсказывать кнопкой ... из
 * последнего что наводил или кликал").
 *
 * Deliberately TEMPLATE-based, not model-generated: chips must be instant and
 * free. /api/chat is capped at 350 tokens per reply and 50 questions/day per
 * guest — spending that budget on generating button labels would be absurd.
 * Text comes from the same KB the bot is primed with, so a chip's wording and
 * the answer's vocabulary match.
 */

import {
  BASE_TASTES,
  COMPASS_SECTORS,
  pickL,
  type CompassLang,
} from "@/data/wine-compass-kb";

/** Which part of the page the guest is looking at. */
export type ViewSection = "wheel" | "proposals" | "other";

export interface SuggestionContext {
  lang: CompassLang;
  /** 1 | 2 | 3 on /samouczek; omitted elsewhere. */
  stage?: 1 | 2 | 3;
  /** Profile key the guest last set: "base.slodycz" | "swieze.cytrusy". */
  lastPickKey?: string | null;
  /** How strongly they set it (0-5). */
  lastPickValue?: number | null;
  /** Section currently in the viewport. */
  section?: ViewSection;
  /** True once the profile is rich enough that wine questions make sense. */
  hasProfile?: boolean;
}

/** Human label for a profile key, or null when the key is unknown. */
export function labelForProfileKey(key: string, lang: CompassLang): string | null {
  if (key.startsWith("base.")) {
    const b = BASE_TASTES.find((x) => x.id === key.slice(5));
    return b ? pickL(lang, b.name_pl, b.name_en) : null;
  }
  for (const s of COMPASS_SECTORS) {
    const t = s.tendencje.find((x) => x.id === key);
    if (t) return pickL(lang, t.name_pl, t.name_en);
  }
  return null;
}

const GENERIC_PL = [
  "Co to jest cierpkość?",
  "Czym różni się świeże od oleiste?",
  "Co znaczy moja kombinacja na kompasie?",
];
const GENERIC_EN = [
  "What is astringency?",
  "How does fresh differ from oily?",
  "What does my compass combination mean?",
];

/**
 * Up to 3 chips, most specific first. Order of priority:
 *   1. the segment just set (explain it / which wines carry it)
 *   2. what the guest is looking at (wine proposals → ask about the match)
 *   3. the current stage's own question
 *   4. generic KB fallbacks, so the row is never empty
 */
export function buildSuggestions(ctx: SuggestionContext): string[] {
  const { lang } = ctx;
  const out: string[] = [];
  const push = (s: string) => {
    if (out.length < 3 && !out.includes(s)) out.push(s);
  };

  const label = ctx.lastPickKey ? labelForProfileKey(ctx.lastPickKey, lang) : null;

  if (label) {
    const strong = (ctx.lastPickValue ?? 0) >= 3;
    push(pickL(lang, `Co oznacza „${label}"?`, `What does "${label}" mean?`));
    if (strong) {
      push(
        pickL(
          lang,
          `Jakie wina mają dużo „${label}"?`,
          `Which wines are high in "${label}"?`,
        ),
      );
    }
  }

  if (ctx.section === "proposals" && ctx.hasProfile) {
    push(
      pickL(
        lang,
        "Dlaczego te wina pasują do mojego profilu?",
        "Why do these wines fit my profile?",
      ),
    );
  }

  if (ctx.stage === 1) {
    push(pickL(lang, "Czym jest wytrawność?", "What does dry actually mean?"));
  } else if (ctx.stage === 2) {
    push(pickL(lang, "Czym różnią się wrażenia?", "How do the sensations differ?"));
  } else if (ctx.stage === 3) {
    push(pickL(lang, "Jak czytać aromaty w winie?", "How do I read aromas in wine?"));
  }

  if (ctx.hasProfile) {
    push(
      pickL(lang, "Pokaż wino dla mojego profilu", "Show a wine for my profile"),
    );
  }

  for (const g of lang === "pl" ? GENERIC_PL : GENERIC_EN) push(g);
  return out.slice(0, 3);
}
