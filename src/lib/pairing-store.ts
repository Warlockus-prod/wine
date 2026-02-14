"use client";

import { useEffect, useState } from "react";
import { seedPairingDataset } from "@/data/seed-pairing";
import type { PairingDataset } from "@/types/pairing";

const STORAGE_KEY = "web_wn_pairing_dataset_v2";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const normalizeTags = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);
};

const normalizeDataset = (input: unknown): PairingDataset | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as { dishes?: unknown[]; wines?: unknown[] };
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
      const name = String(value.name ?? "").trim();
      const description = String(value.description ?? "").trim();
      const image = String(value.image ?? "").trim();
      const price = Number(value.price ?? 0);

      if (!id || !name || !description || !image || !Number.isFinite(price) || price <= 0) {
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
      const name = String(value.name ?? "").trim();
      const description = String(value.description ?? "").trim();
      const image = String(value.image ?? "").trim();
      const region = String(value.region ?? "").trim();
      const year = Number(value.year ?? 0);
      const price = Number(value.price ?? 0);
      const rating = Number(value.rating ?? 0);

      if (
        !id ||
        !name ||
        !description ||
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
        tags: normalizeTags(value.tags),
      };
    })
    .filter((item) => item !== null);

  if (dishes.length === 0 || wines.length === 0) {
    return null;
  }

  return { dishes, wines };
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
