"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { seedRestaurants } from "@/data/seed-restaurants";
import { toLocalizedString } from "@/lib/localized";
import { decorateRestaurants } from "@/lib/restaurant-directory";
import type { CatalogRestaurant } from "@/lib/restaurant-directory";
import type { Dish, DishPairing, Restaurant, Wine } from "@/types/restaurant";

const STORAGE_KEY = "web_wn_restaurant_catalog_v1";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const isMeaningful = (value: { en: string; pl: string }) =>
  value.en.trim().length > 0 || value.pl.trim().length > 0;

const asString = (value: unknown, fallback = "") => {
  const next = String(value ?? "").trim();
  return next || fallback;
};

const normalizePrice = (value: unknown) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 1;
};

const normalizeWine = (input: unknown): Wine | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as Record<string, unknown>;
  const id = asString(raw.id);
  const name = toLocalizedString(raw.name);
  const region = asString(raw.region);
  const grape = asString(raw.grape, "Blend");
  const style = asString(raw.style, "Wine");
  const notes = toLocalizedString(raw.notes);
  const vintage = asString(raw.vintage);

  if (!id || !isMeaningful(name) || !region || !isMeaningful(notes)) {
    return null;
  }

  return {
    id,
    name,
    region,
    grape,
    style,
    ...(vintage ? { vintage } : {}),
    notes,
  };
};

const normalizePairing = (input: unknown, wineIds: Set<string>): DishPairing | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as Record<string, unknown>;
  const wineId = asString(raw.wineId);
  const reason = toLocalizedString(raw.reason);

  if (!wineId || !wineIds.has(wineId) || !isMeaningful(reason)) {
    return null;
  }

  return { wineId, reason };
};

const normalizeDish = (input: unknown, wineIds: Set<string>): Dish | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as Record<string, unknown>;
  const id = asString(raw.id);
  const name = toLocalizedString(raw.name);
  const category = asString(raw.category, "Menu");
  const description = toLocalizedString(raw.description);
  const price = normalizePrice(raw.price);
  const pairings = Array.isArray(raw.pairings)
    ? raw.pairings
        .map((pairing) => normalizePairing(pairing, wineIds))
        .filter((pairing): pairing is DishPairing => pairing !== null)
    : [];

  if (!id || !isMeaningful(name) || !isMeaningful(description)) {
    return null;
  }

  return { id, name, category, description, price, pairings };
};

const normalizeRestaurant = (input: unknown): Restaurant | null => {
  if (!input || typeof input !== "object") {
    return null;
  }

  const raw = input as Record<string, unknown>;
  const id = asString(raw.id);
  const slug = asString(raw.slug);
  const name = toLocalizedString(raw.name);
  const cuisine = asString(raw.cuisine, "European");
  const city = asString(raw.city, "Warszawa");
  const description = toLocalizedString(raw.description);
  const coverGradient = asString(raw.coverGradient, "from-[#3b2424] via-[#7f3434] to-[#d6a15c]");
  const wines = Array.isArray(raw.wines)
    ? raw.wines.map(normalizeWine).filter((wine): wine is Wine => wine !== null)
    : [];
  const wineIds = new Set(wines.map((wine) => wine.id));
  const dishes = Array.isArray(raw.dishes)
    ? raw.dishes
        .map((dish) => normalizeDish(dish, wineIds))
        .filter((dish): dish is Dish => dish !== null)
    : [];

  if (!id || !slug || !isMeaningful(name) || !isMeaningful(description) || dishes.length === 0 || wines.length === 0) {
    return null;
  }

  return {
    id,
    slug,
    name,
    cuisine,
    city,
    description,
    coverGradient,
    dishes,
    wines,
  };
};

const normalizeRestaurants = (input: unknown): Restaurant[] | null => {
  const rawRestaurants = Array.isArray(input)
    ? input
    : input && typeof input === "object" && Array.isArray((input as Record<string, unknown>).restaurants)
      ? ((input as Record<string, unknown>).restaurants as unknown[])
      : null;

  if (!rawRestaurants) {
    return null;
  }

  const restaurants = rawRestaurants
    .map(normalizeRestaurant)
    .filter((restaurant): restaurant is Restaurant => restaurant !== null);

  return restaurants.length > 0 ? restaurants : null;
};

const readInitialRestaurants = (): Restaurant[] => {
  if (typeof window === "undefined") {
    return clone(seedRestaurants);
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return clone(seedRestaurants);
    }

    const normalized = normalizeRestaurants(JSON.parse(raw) as unknown);
    return normalized ?? clone(seedRestaurants);
  } catch {
    return clone(seedRestaurants);
  }
};

export function useRestaurantCatalog() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(() => readInitialRestaurants());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
    } catch {
      // Ignore storage issues in restricted browser contexts.
    }
  }, [restaurants]);

  const catalogRestaurants = useMemo<CatalogRestaurant[]>(
    () => decorateRestaurants(restaurants),
    [restaurants],
  );

  const updateRestaurant = useCallback(
    (slug: string, updater: (restaurant: Restaurant) => Restaurant) => {
      setRestaurants((current) =>
        current.map((restaurant) => (restaurant.slug === slug ? updater(restaurant) : restaurant)),
      );
    },
    [],
  );

  const resetRestaurants = useCallback(() => {
    setRestaurants(clone(seedRestaurants));
  }, []);

  const exportRestaurants = useCallback(
    () => JSON.stringify({ restaurants }, null, 2),
    [restaurants],
  );

  const importRestaurants = useCallback((raw: string) => {
    try {
      const normalized = normalizeRestaurants(JSON.parse(raw) as unknown);
      if (!normalized) {
        return false;
      }

      setRestaurants(normalized);
      return true;
    } catch {
      return false;
    }
  }, []);

  const getRestaurantBySlug = useCallback(
    (slug: string | null | undefined) =>
      slug ? catalogRestaurants.find((restaurant) => restaurant.slug === slug) ?? null : null,
    [catalogRestaurants],
  );

  return {
    restaurants,
    catalogRestaurants,
    setRestaurants,
    updateRestaurant,
    resetRestaurants,
    exportRestaurants,
    importRestaurants,
    getRestaurantBySlug,
  };
}
