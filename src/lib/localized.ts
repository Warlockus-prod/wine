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
