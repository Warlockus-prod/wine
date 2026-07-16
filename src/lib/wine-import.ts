/**
 * Wine-list import parser for the DB restaurant editor
 * (/admin/restaurants/[slug] → "Import karty win").
 *
 * Accepts two paste formats:
 *  (a) CSV with a header row — columns name,region,grape,style,vintage,price,notes
 *      (any subset, name required; PL header synonyms accepted; comma OR
 *      semicolon separated; quoted cells with embedded separators supported)
 *  (b) plain pipe lines — "Name | Region | Grape | Style | Vintage | Price"
 *      (a line without pipes is treated as a name-only wine)
 *
 * Pure functions only — unit-tested in src/lib/__tests__/wine-import.test.ts.
 * The POST payload shape mirrors createSchema in
 * src/app/api/restaurants/[slug]/wines/route.ts (region/grape/style are
 * min(1) strings there, so toWinePayload fills visible placeholders the
 * operator edits later; LocalizedString fields get {en, pl} = same value).
 */

import type { WineCreate } from "@/lib/use-restaurant-data";

export const WINE_STYLES = ["Red", "White", "Rose", "Sparkling", "Dessert"] as const;
export type WineStyle = (typeof WINE_STYLES)[number];

/** Case-insensitive aliases → canonical style (EN + PL operator vocabulary). */
const STYLE_ALIASES: Record<string, WineStyle> = {
  red: "Red",
  czerwone: "Red",
  czerwony: "Red",
  white: "White",
  biale: "White",
  białe: "White",
  bialy: "White",
  biały: "White",
  rose: "Rose",
  rosé: "Rose",
  rozowe: "Rose",
  różowe: "Rose",
  sparkling: "Sparkling",
  musujace: "Sparkling",
  musujące: "Sparkling",
  dessert: "Dessert",
  deserowe: "Dessert",
  deserowy: "Dessert",
};

export function normalizeStyle(input: string): WineStyle | null {
  return STYLE_ALIASES[input.trim().toLowerCase()] ?? null;
}

type ColumnKey = "name" | "region" | "grape" | "style" | "vintage" | "price" | "notes";

/** Header-cell synonyms (lowercased) → column key. */
const HEADER_ALIASES: Record<string, ColumnKey> = {
  name: "name",
  nazwa: "name",
  wine: "name",
  wino: "name",
  region: "region",
  grape: "grape",
  szczep: "grape",
  style: "style",
  styl: "style",
  vintage: "vintage",
  rocznik: "vintage",
  price: "price",
  cena: "price",
  notes: "notes",
  nuty: "notes",
  notatki: "notes",
  opis: "notes",
};

export interface ImportedWineRow {
  /** 1-based line number in the pasted text (stable row key for the UI). */
  line: number;
  name: string;
  region: string;
  grape: string;
  /** Canonical style when recognized, raw input otherwise (flagged in errors). */
  style: string;
  vintage: string;
  /** Parsed price; null = column empty/absent (defaults to 0 on import). */
  price: number | null;
  notes: string;
  /** Polish validation messages; non-empty ⇒ row is not importable. */
  errors: string[];
}

/** Split one CSV line on `sep`, honouring double-quoted cells ("" = escaped quote). */
export function splitDelimitedLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === sep) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/** Count occurrences of `sep` outside quoted cells. */
function countSeparators(line: string, sep: string): number {
  let n = 0;
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (!inQuotes && ch === sep) n++;
  }
  return n;
}

/**
 * Parse a price cell. Accepts "120", "120.50", "120,50", "1 200,50",
 * currency suffixes (zł/PLN/€/$). Returns null when unparseable,
 * negative, or above the API cap (99999).
 */
export function parsePrice(raw: string): number | null {
  const cleaned = raw
    .replace(/(zł|pln|eur|usd|€|\$)/gi, "")
    .replace(/\s+/g, "")
    .replace(",", ".");
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0 || n > 99999) return null;
  return n;
}

function validateRow(row: ImportedWineRow, rawStyle: string, rawPrice: string): void {
  if (!row.name) {
    row.errors.push("Brak nazwy wina");
  }
  if (rawStyle) {
    const norm = normalizeStyle(rawStyle);
    if (norm) {
      row.style = norm;
    } else {
      row.errors.push(`Nieznany styl „${rawStyle}” (dozwolone: ${WINE_STYLES.join(", ")})`);
    }
  }
  if (rawPrice) {
    const price = parsePrice(rawPrice);
    if (price === null) {
      row.errors.push(`Nieprawidłowa cena „${rawPrice}”`);
    } else {
      row.price = price;
    }
  }
}

function makeRow(line: number): ImportedWineRow {
  return {
    line,
    name: "",
    region: "",
    grape: "",
    style: "",
    vintage: "",
    price: null,
    notes: "",
    errors: [],
  };
}

/**
 * Parse pasted text into preview rows. Never throws — malformed rows come
 * back with `errors` filled so the UI can show them and skip on import.
 */
export function parseWineImport(text: string): ImportedWineRow[] {
  // Strip a UTF-8 BOM (0xFEFF) left by Excel/Numbers CSV exports.
  const clean = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const lines = clean.split(/\r?\n/);
  const content: { line: number; text: string }[] = [];
  lines.forEach((raw, i) => {
    const trimmed = raw.trim();
    if (trimmed) content.push({ line: i + 1, text: trimmed });
  });
  if (content.length === 0) return [];

  // CSV mode: the first content line is a header row containing a "name" column.
  const first = content[0].text;
  const sep = countSeparators(first, ";") > countSeparators(first, ",") ? ";" : ",";
  const headerCells = splitDelimitedLine(first, sep).map((c) => c.toLowerCase());
  const columns = headerCells.map((c) => HEADER_ALIASES[c] ?? null);

  if (columns.includes("name")) {
    return content.slice(1).flatMap(({ line, text: rowText }) => {
      const cells = splitDelimitedLine(rowText, sep);
      if (cells.every((c) => !c)) return [];
      const row = makeRow(line);
      let rawStyle = "";
      let rawPrice = "";
      columns.forEach((key, i) => {
        const value = cells[i] ?? "";
        if (!key || !value) return;
        if (key === "style") rawStyle = value;
        else if (key === "price") rawPrice = value;
        else row[key] = value;
      });
      validateRow(row, rawStyle, rawPrice);
      return [row];
    });
  }

  // Plain-lines mode: "Name | Region | Grape | Style | Vintage | Price"
  // (a line without pipes = name-only wine).
  return content.map(({ line, text: rowText }) => {
    const row = makeRow(line);
    const parts = rowText.split("|").map((p) => p.trim());
    row.name = parts[0] ?? "";
    row.region = parts[1] ?? "";
    row.grape = parts[2] ?? "";
    row.vintage = parts[4] ?? "";
    validateRow(row, parts[3] ?? "", parts[5] ?? "");
    return row;
  });
}

/**
 * Build the POST /api/restaurants/[slug]/wines payload for a valid row.
 * region/grape/style are required min(1) by the API, so missing values get
 * visible placeholders the operator edits later; LocalizedString fields set
 * both locales to the imported string.
 */
export function toWinePayload(row: ImportedWineRow): WineCreate {
  const style = normalizeStyle(row.style) ?? "White";
  return {
    name: { en: row.name, pl: row.name },
    notes: { en: row.notes, pl: row.notes },
    region: (row.region || "—").slice(0, 120),
    grape: (row.grape || "Blend").slice(0, 120),
    style,
    vintage: row.vintage ? row.vintage.slice(0, 20) : undefined,
    price: row.price ?? 0,
  };
}

/** Polish plural for "wino": 1 wino, 2–4 wina, 5+ win (12–14 → win). */
export function winePlural(n: number): string {
  if (n === 1) return "wino";
  const d = n % 10;
  const h = n % 100;
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return "wina";
  return "win";
}
