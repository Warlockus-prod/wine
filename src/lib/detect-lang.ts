/**
 * detect-lang.ts — which language did the guest write in?
 *
 * WHY: the chat bot must answer in the guest's language (client 2026-07-29:
 * a Russian question got a Polish answer). Asking the model to "mirror the
 * language" is unreliable here — the system prompt is a very long Polish
 * document, and the model kept snapping back to Polish even with the rule at
 * the top. So we decide server-side and hand the model an unambiguous
 * "Reply ONLY in <language>." directive.
 *
 * Deliberately small: script detection first (Cyrillic/Greek are decisive),
 * then diacritics, then a stop-word vote for the Latin languages that share
 * an alphabet. Not a general-purpose language ID — it only needs to cover the
 * languages a Polish wine-shop's guests actually type in.
 */

export type DetectedLang =
  | "ru" | "uk" | "pl" | "en" | "de" | "fr" | "es" | "it" | "cs" | "unknown";

/** Human-readable name used in the prompt directive (English, for the model). */
export const LANG_NAME: Record<Exclude<DetectedLang, "unknown">, string> = {
  ru: "Russian",
  uk: "Ukrainian",
  pl: "Polish",
  en: "English",
  de: "German",
  fr: "French",
  es: "Spanish",
  it: "Italian",
  cs: "Czech",
};

/** Stop words that are common AND fairly language-specific. Scored by count. */
const STOP: Record<Exclude<DetectedLang, "unknown" | "ru" | "uk">, string[]> = {
  pl: ["czy", "jest", "jak", "co", "to", "nie", "dla", "kto", "lubi", "wino", "jakie", "który", "moja", "się", "od", "przy", "gdzie", "dobre"],
  en: ["what", "is", "the", "a", "how", "which", "for", "with", "wine", "do", "does", "can", "you", "me", "good", "about", "and", "to"],
  de: ["was", "ist", "wie", "der", "die", "das", "wein", "für", "mit", "und", "ich", "kann", "gut"],
  fr: ["quoi", "est", "le", "la", "les", "vin", "pour", "avec", "et", "je", "que", "quel", "bon"],
  es: ["que", "es", "el", "la", "los", "vino", "para", "con", "y", "yo", "cual", "bueno", "como"],
  it: ["che", "cosa", "il", "la", "vino", "per", "con", "e", "io", "quale", "buono", "come"],
  cs: ["co", "je", "jak", "víno", "pro", "s", "a", "já", "který", "dobré"],
};

/**
 * Best-guess language of a single chat message.
 * Returns "unknown" when there is no usable signal ("ok", "👍", "2016").
 */
export function detectLang(textRaw: string): DetectedLang {
  const text = (textRaw ?? "").trim();
  if (!text) return "unknown";

  // 1. Script: Cyrillic is decisive. Ukrainian-only letters split uk from ru.
  if (/[Ѐ-ӿ]/.test(text)) {
    return /[іїєґ]/i.test(text) ? "uk" : "ru";
  }

  const lower = text.toLowerCase();

  // 2. Language-unique diacritics (checked before the word vote — a single
  //    "ł" or "ß" outweighs any amount of shared vocabulary).
  //    Order matters: only letters UNIQUE to one language may decide. Shared
  //    accents (é, è, à, ô…) appear in French, Spanish and Italian alike, so
  //    they must come last — otherwise "¿Qué vino?" is read as French.
  if (/[ąćęłńśźż]/.test(lower)) return "pl";
  if (/[ěščřůžťďň]/.test(lower)) return "cs";
  if (/[ß]/.test(lower)) return "de";
  if (/[ñ¿¡]/.test(lower)) return "es";
  if (/[œçâêëîïû]/.test(lower)) return "fr";
  if (/[äöü]/.test(lower)) return "de";

  // 3. Stop-word vote for the remaining Latin languages.
  const words = lower.split(/[^a-z']+/).filter(Boolean);
  if (words.length === 0) return "unknown";

  let best: DetectedLang = "unknown";
  let bestScore = 0;
  for (const [lang, list] of Object.entries(STOP) as [
    Exclude<DetectedLang, "unknown" | "ru" | "uk">,
    string[],
  ][]) {
    const score = words.reduce((n, w) => n + (list.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      best = lang;
    }
  }
  // One matching stop word is enough for a short question ("Co to jest X?"),
  // but a message with NO match stays unknown so the caller can fall back to
  // the page locale instead of guessing.
  return bestScore > 0 ? best : "unknown";
}
