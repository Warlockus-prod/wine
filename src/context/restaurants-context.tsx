"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { seedRestaurants } from "@/data/seed-restaurants";
import {
  normalizeRestaurant,
  normalizeRestaurants,
  restaurantsToExport,
} from "@/lib/restaurant-validation";
import { Restaurant } from "@/types/restaurant";

const STORAGE_KEY = "web_wn_restaurants_v2";

type RestaurantsContextValue = {
  restaurants: Restaurant[];
  ready: boolean;
  storageIssue: string | null;
  updateRestaurant: (restaurant: Restaurant) => void;
  replaceRestaurants: (restaurants: Restaurant[]) => void;
  resetRestaurants: () => void;
  exportRestaurants: () => string;
};

const RestaurantsContext = createContext<RestaurantsContextValue | undefined>(
  undefined,
);

const clone = <T,>(value: T): T => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value)) as T;
};

const fallbackSeed = clone(seedRestaurants);

export function RestaurantsProvider({ children }: { children: ReactNode }) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(fallbackSeed);
  const [ready, setReady] = useState(false);
  const [storageIssue, setStorageIssue] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as unknown;
      const normalized = normalizeRestaurants(parsed);

      if (!normalized) {
        setStorageIssue("Saved data was invalid and has been reset to defaults.");
        return;
      }

      setRestaurants(normalized);
    } catch {
      setStorageIssue("Could not read saved data. Using defaults.");
      setRestaurants(clone(seedRestaurants));
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
      if (storageIssue?.startsWith("Could not save")) {
        setStorageIssue(null);
      }
    } catch {
      setStorageIssue("Could not save data locally in this browser session.");
    }
  }, [ready, restaurants, storageIssue]);

  const value = useMemo<RestaurantsContextValue>(
    () => ({
      restaurants,
      ready,
      storageIssue,
      updateRestaurant: (restaurant: Restaurant) => {
        const normalized = normalizeRestaurant(restaurant);
        if (!normalized) {
          return;
        }

        setRestaurants((previous) => {
          const found = previous.some((item) => item.id === normalized.id);

          if (!found) {
            return [...previous, clone(normalized)];
          }

          return previous.map((item) =>
            item.id === normalized.id ? clone(normalized) : item,
          );
        });
      },
      replaceRestaurants: (nextRestaurants: Restaurant[]) => {
        const normalized = normalizeRestaurants(nextRestaurants);
        if (!normalized) {
          setStorageIssue("Import failed: file has invalid structure.");
          return;
        }

        setRestaurants(normalized);
        setStorageIssue(null);
      },
      resetRestaurants: () => {
        setRestaurants(clone(seedRestaurants));
        setStorageIssue(null);
      },
      exportRestaurants: () => restaurantsToExport(restaurants),
    }),
    [ready, restaurants, storageIssue],
  );

  return (
    <RestaurantsContext.Provider value={value}>
      {children}
    </RestaurantsContext.Provider>
  );
}

export const useRestaurants = () => {
  const context = useContext(RestaurantsContext);

  if (!context) {
    throw new Error("useRestaurants must be used inside RestaurantsProvider");
  }

  return context;
};
