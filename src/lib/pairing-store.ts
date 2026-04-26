"use client";

import { useEffect, useState } from "react";
import { seedPairingDataset } from "@/data/seed-pairing";
import { toLocalizedString } from "@/lib/localized";
import type {
  CuratedPairing,
  LocalizedString,
  PairingDataset,
  WineAcidity,
  WineBody,
  WineTannin,
} from "@/types/pairing";

const STORAGE_KEY = "web_wn_pairing_dataset_v3";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isMeaningful = (value: LocalizedString) =>
  value.en.trim().length > 0 || value.pl.trim().length > 0;

const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);
};

const bodyValues = new Set<WineBody>(["light", "medium", "full"]);
const acidityValues = new Set<WineAcidity>(["low", "medium", "high"]);
const tanninValues = new Set<WineTannin>(["none", "soft", "medium", "high"]);

const fromSet = <T extends string>(value: unknown, allowed: Set<T>, fallback: T): T => {
  const normalized = String(value ?? "").trim().toLowerCase() as T;
  return allowed.has(normalized) ? normalized : fallback;
};

const inferPassportFromTags = (tags: string[]) => {
  const normalized = tags.join(" ").toLowerCase();

  const body: WineBody = normalized.includes("bold")
    ? "full"
    : normalized.includes("light")
      ? "light"
      : "medium";

  const acidity: WineAcidity = normalized.includes("high acid")
    ? "high"
    : normalized.includes("low acid")
      ? "low"
      : "medium";

  const tannin: WineTannin = normalized.includes("tannic")
    ? "high"
    : normalized.includes("soft tannin")
      ? "soft"
      : normalized.includes("none")
        ? "none"
        : "medium";

  return {
    grape: "Blend",
    abv: 13,
    body,
    acidity,
    tannin,
    servingTempC: body === "full" ? "16-18" : "8-12",
    decant: body === "full" ? "Decant 30 minutes." : "No decant.",
  };
};

const normalizePassport = (value: unknown, tags: string[]) => {
  const fallback = inferPassportFromTags(tags);
  if (!value || typeof value !== "object") {
    return fallback;
  }

  const raw = value as Record<string, unknown>;
  const abv = Number(raw.abv ?? fallback.abv);
  const safeAbv = Number.isFinite(abv) ? Math.max(5, Math.min(20, Number(abv.toFixed(1)))) : fallback.abv;

  return {
    grape: String(raw.grape ?? fallback.grape).trim() || fallback.grape,
    abv: safeAbv,
    body: fromSet(raw.body, bodyValues, fallback.body),
    acidity: fromSet(raw.acidity, acidityValues, fallback.acidity),
    tannin: fromSet(raw.tannin, tanninValues, fallback.tannin),
    servingTempC: String(raw.servingTempC ?? fallback.servingTempC).trim() || fallback.servingTempC,
    decant: String(raw.decant ?? fallback.decant).trim() || fallback.decant,
  };
};

const normalizeDataset = (input: unknown): PairingDataset | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as { dishes?: unknown[]; wines?: unknown[]; pairings?: unknown[] };
  if (!Array.isArray(raw.dishes) || !Array.isArray(raw.wines)) {
    return null;
  }

  const dishes = raw.dishes
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const value = item as Record<string, unknown>;
      const id = String(value.id ?? "").trim();
      const name = toLocalizedString(value.name);
      const description = toLocalizedString(value.description);
      const image = String(value.image ?? "").trim();
      const price = Number(value.price ?? 0);

      if (
        !id ||
        !isMeaningful(name) ||
        !isMeaningful(description) ||
        !image ||
        !Number.isFinite(price) ||
        price <= 0
      ) {
        return null;
      }

      return {
        id,
        name,
        description,
        image,
        price,
        tags: normalizeTags(value.tags),
      };
    })
    .filter((item) => item !== null);

  const wines = raw.wines
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const value = item as Record<string, unknown>;
      const id = String(value.id ?? "").trim();
      const name = toLocalizedString(value.name);
      const description = toLocalizedString(value.description);
      const image = String(value.image ?? "").trim();
      const region = String(value.region ?? "").trim();
      const year = Number(value.year ?? 0);
      const price = Number(value.price ?? 0);
      const rating = Number(value.rating ?? 0);
      const tags = normalizeTags(value.tags);

      if (
        !id ||
        !isMeaningful(name) ||
        !isMeaningful(description) ||
        !image ||
        !region ||
        !Number.isFinite(year) ||
        !Number.isFinite(price) ||
        !Number.isFinite(rating) ||
        year <= 0 ||
        price <= 0
      ) {
        return null;
      }

      return {
        id,
        name,
        description,
        image,
        region,
        year,
        price,
        rating,
        tags,
        passport: normalizePassport(value.passport, tags),
      };
    })
    .filter((item) => item !== null);

  if (dishes.length === 0 || wines.length === 0) {
    return null;
  }

  const dishIds = new Set(dishes.map((dish) => dish.id));
  const wineIds = new Set(wines.map((wine) => wine.id));

  const pairings = Array.isArray(raw.pairings)
    ? (raw.pairings as unknown[])
        .map((entry): CuratedPairing | null => {
          if (!entry || typeof entry !== "object") {
            return null;
          }

          const value = entry as Record<string, unknown>;
          const dishId = String(value.dishId ?? "").trim();
          const wineId = String(value.wineId ?? "").trim();
          const reason = toLocalizedString(value.reason);

          if (!dishId || !wineId || !isMeaningful(reason)) {
            return null;
          }
          if (!dishIds.has(dishId) || !wineIds.has(wineId)) {
            return null;
          }

          return { dishId, wineId, reason };
        })
        .filter((entry): entry is CuratedPairing => entry !== null)
    : [];

  return { dishes, wines, pairings };
};

const readInitialDataset = (): PairingDataset => {
  if (typeof window === "undefined") {
    return clone(seedPairingDataset);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return clone(seedPairingDataset);
    }

    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizeDataset(parsed);
    if (!normalized) {
      return clone(seedPairingDataset);
    }

    return normalized;
  } catch {
    return clone(seedPairingDataset);
  }
};

export function usePairingDataset() {
  const [dataset, setDataset] = useState<PairingDataset>(() => readInitialDataset());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    } catch {
      // Ignore storage issues in restricted browser contexts.
    }
  }, [dataset]);

  return {
    dataset,
    setDataset,
    resetDataset: () => setDataset(clone(seedPairingDataset)),
    exportDataset: () => JSON.stringify(dataset, null, 2),
    importDataset: (payload: string) => {
      try {
        const parsed = JSON.parse(payload) as unknown;
        const normalized = normalizeDataset(parsed);
        if (!normalized) {
          return false;
        }

        setDataset(normalized);
        return true;
      } catch {
        return false;
      }
    },
  };
}
