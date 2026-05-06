import type { LocalizedString } from "@/types/pairing";
import type { Locale } from "@/i18n/routing";

/**
 * Read a localized string in the given locale, falling back to the other
 * language if the requested one is empty. Used as a single source of truth
 * for rendering content fields like dish names, wine descriptions, and
 * pairing reasons.
 */
export const t = (field: LocalizedString | string | undefined | null, locale: Locale): string => {
  if (!field) {
    return "";
  }
  if (typeof field === "string") {
    return field;
  }
  const primary = field[locale];
  if (primary && primary.trim().length > 0) {
    return primary;
  }
  const fallbackLocale: Locale = locale === "en" ? "pl" : "en";
  return field[fallbackLocale] ?? "";
};

/**
 * Coerce a value (string or partially-filled object) into a complete
 * LocalizedString. Used by data normalization paths (pairing-store import,
 * legacy seed migrations).
 */
export const toLocalizedString = (
  value: unknown,
  fallback: LocalizedString = { en: "", pl: "" },
): LocalizedString => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return { en: trimmed || fallback.en, pl: trimmed || fallback.pl };
  }
  if (value && typeof value === "object") {
    const raw = value as Record<string, unknown>;
    const en = typeof raw.en === "string" ? raw.en : fallback.en;
    const pl = typeof raw.pl === "string" ? raw.pl : fallback.pl;
    // If only one side is present, mirror it so admin UI never shows a fully
    // blank field on import.
    if (en && !pl) {
      return { en, pl: en };
    }
    if (pl && !en) {
      return { en: pl, pl };
    }
    return { en, pl };
  }
  return fallback;
};

export const isLocalizedString = (value: unknown): value is LocalizedString =>
  Boolean(
    value &&
      typeof value === "object" &&
      typeof (value as Record<string, unknown>).en === "string" &&
      typeof (value as Record<string, unknown>).pl === "string",
  );

/**
 * Server-stored "decant" strings on wines are plain English strings (legacy
 * shape — pre-i18n). Until we promote them to LocalizedString in DB, this
 * shim translates the small set of common patterns so PL UI doesn't leak EN.
 *
 * Patterns: "No decant. Open X minutes before service.", "Decant N minutes
 * before service.", "Optional N-minute decant.", "Serve chilled in ...".
 */
export const localizeDecant = (text: string | undefined | null, locale: Locale): string => {
  if (!text) return "";
  if (locale !== "pl") return text;

  let s = text;
  // Order matters — most specific first.
  s = s.replace(
    /No decant\.\s*Serve chilled in white[- ]wine stem\.?/i,
    "Bez dekantowania. Podawaj schłodzone w kieliszku do białego wina.",
  );
  s = s.replace(
    /No decant\.\s*Serve fresh from the cellar\.?/i,
    "Bez dekantowania. Podawaj prosto z piwnicy.",
  );
  s = s.replace(
    /No decant\.\s*Open (\d+) minutes? before service\.?/i,
    "Bez dekantowania. Otwórz $1 minut przed podaniem.",
  );
  s = s.replace(
    /No decant\.\s*Open just before service\.?/i,
    "Bez dekantowania. Otwórz tuż przed podaniem.",
  );
  s = s.replace(
    /Decant (\d+) minutes? before service\.?/i,
    "Dekantuj $1 minut przed podaniem.",
  );
  s = s.replace(/Decant (\d+) minutes?\.?/i, "Dekantuj $1 minut.");
  s = s.replace(/Optional (\d+)[- ]minute decant\.?/i, "Opcjonalne dekantowanie $1 minut.");
  s = s.replace(/^No decant\.?$/i, "Bez dekantowania.");
  return s;
};
