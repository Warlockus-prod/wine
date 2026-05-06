/**
 * SWR hooks for the per-restaurant editor in /admin/restaurants/[slug].
 *
 * Hooks are thin wrappers around the write API so the editor UI talks to
 * the database (not localStorage). Optimistic updates via SWR's mutate
 * keep the UI snappy without a round-trip wait.
 */

"use client";

import useSWR, { mutate } from "swr";
import { apiFetch, swrFetcher } from "@/lib/api-client";
import type { LocalizedString } from "@/types/pairing";

export interface ApiDish {
  id: string;
  restaurantId: string;
  externalId: string | null;
  name: LocalizedString;
  description: LocalizedString;
  category: string;
  price: string;
  imageUrl: string | null;
  tags: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiWine {
  id: string;
  restaurantId: string;
  externalId: string | null;
  name: LocalizedString;
  region: string;
  grape: string;
  style: string;
  vintage: string | null;
  year: number | null;
  price: string;
  rating: string | null;
  imageUrl: string | null;
  notes: LocalizedString;
  tags: string[];
  body: "light" | "medium" | "full";
  acidity: "low" | "medium" | "high";
  tannin: "none" | "soft" | "medium" | "high";
  abv: string | null;
  servingTempC: string | null;
  decant: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiPairing {
  id: string;
  restaurantId: string;
  dishId: string;
  wineId: string;
  reason: LocalizedString;
  boost: number;
  createdAt: string;
  updatedAt: string;
}

const dishesKey = (slug: string) => `/api/restaurants/${slug}/dishes`;
const winesKey = (slug: string) => `/api/restaurants/${slug}/wines`;
const pairingsKey = (slug: string) => `/api/restaurants/${slug}/pairings`;

export function useDishes(slug: string | null) {
  const { data, error, isLoading } = useSWR<{ data: ApiDish[] }>(
    slug ? dishesKey(slug) : null,
    swrFetcher,
  );
  return { dishes: data?.data ?? [], error, isLoading };
}

export function useWines(slug: string | null) {
  const { data, error, isLoading } = useSWR<{ data: ApiWine[] }>(
    slug ? winesKey(slug) : null,
    swrFetcher,
  );
  return { wines: data?.data ?? [], error, isLoading };
}

export function usePairings(slug: string | null) {
  const { data, error, isLoading } = useSWR<{ data: ApiPairing[] }>(
    slug ? pairingsKey(slug) : null,
    swrFetcher,
  );
  return { pairings: data?.data ?? [], error, isLoading };
}

// ─── Mutators ────────────────────────────────────────────────────────────

export interface DishCreate {
  name: LocalizedString | string;
  description: LocalizedString | string;
  category: string;
  price: number;
  imageUrl?: string;
  tags?: string[];
  externalId?: string;
  sortOrder?: number;
}

export async function createDish(slug: string, payload: DishCreate) {
  const res = await apiFetch<{ data: ApiDish }>(dishesKey(slug), {
    method: "POST",
    json: payload,
  });
  await mutate(dishesKey(slug));
  return res.data;
}

export async function updateDish(slug: string, id: string, patch: Partial<DishCreate>) {
  const res = await apiFetch<{ data: ApiDish }>(`${dishesKey(slug)}/${id}`, {
    method: "PUT",
    json: patch,
  });
  await mutate(dishesKey(slug));
  return res.data;
}

export async function deleteDish(slug: string, id: string) {
  await apiFetch(`${dishesKey(slug)}/${id}`, { method: "DELETE" });
  await mutate(dishesKey(slug));
  // Also invalidate pairings — server cascade may have removed some
  await mutate(pairingsKey(slug));
}

export interface WineCreate {
  name: LocalizedString | string;
  region: string;
  grape: string;
  style: string;
  notes: LocalizedString | string;
  vintage?: string;
  year?: number;
  price: number;
  rating?: number;
  imageUrl?: string;
  tags?: string[];
  body?: "light" | "medium" | "full";
  acidity?: "low" | "medium" | "high";
  tannin?: "none" | "soft" | "medium" | "high";
  abv?: number;
  servingTempC?: string;
  decant?: string;
  externalId?: string;
  sortOrder?: number;
}

export async function createWine(slug: string, payload: WineCreate) {
  const res = await apiFetch<{ data: ApiWine }>(winesKey(slug), {
    method: "POST",
    json: payload,
  });
  await mutate(winesKey(slug));
  return res.data;
}

export async function updateWine(slug: string, id: string, patch: Partial<WineCreate>) {
  const res = await apiFetch<{ data: ApiWine }>(`${winesKey(slug)}/${id}`, {
    method: "PUT",
    json: patch,
  });
  await mutate(winesKey(slug));
  return res.data;
}

export async function deleteWine(slug: string, id: string) {
  await apiFetch(`${winesKey(slug)}/${id}`, { method: "DELETE" });
  await mutate(winesKey(slug));
  await mutate(pairingsKey(slug));
}

export interface PairingUpsert {
  dishId: string;
  wineId: string;
  reason: LocalizedString | string;
  boost?: number;
}

export async function upsertPairing(slug: string, payload: PairingUpsert) {
  const res = await apiFetch<{ data: ApiPairing }>(pairingsKey(slug), {
    method: "POST",
    json: payload,
  });
  await mutate(pairingsKey(slug));
  return res.data;
}

export async function deletePairing(slug: string, dishId: string, wineId: string) {
  await apiFetch(
    `${pairingsKey(slug)}?dishId=${encodeURIComponent(dishId)}&wineId=${encodeURIComponent(wineId)}`,
    { method: "DELETE" },
  );
  await mutate(pairingsKey(slug));
}
