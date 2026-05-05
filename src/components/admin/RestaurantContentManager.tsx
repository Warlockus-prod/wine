"use client";

import { useLocale } from "next-intl";
import { useMemo, useState } from "react";
import { makeId } from "@/lib/format";
import { t } from "@/lib/localized";
import { useRestaurantCatalog } from "@/lib/restaurant-store";
import type { Locale } from "@/i18n/routing";
import type { Dish, DishPairing, Restaurant, Wine } from "@/types/restaurant";
import type { LocalizedString } from "@/types/pairing";

const mirroredLocalized = (value: string): LocalizedString => ({
  en: value,
  pl: value,
});

const setLocalized = (
  current: LocalizedString,
  locale: Locale,
  value: string,
): LocalizedString => ({
  ...current,
  [locale]: value,
});

const emptyDishForm = {
  name: "",
  category: "Signature",
  description: "",
  price: "28",
};

const emptyWineForm = {
  name: "",
  region: "",
  grape: "Blend",
  style: "White",
  vintage: "2023",
  notes: "",
};

const defaultPairingReason =
  "This pairing balances texture, acidity and aromatic intensity for the selected dish.";

export default function RestaurantContentManager() {
  const locale = useLocale() as Locale;
  const {
    catalogRestaurants,
    updateRestaurant,
    resetRestaurants,
    exportRestaurants,
    importRestaurants,
  } = useRestaurantCatalog();

  const [selectedSlug, setSelectedSlug] = useState(catalogRestaurants[0]?.slug ?? "");
  const [dishForm, setDishForm] = useState(emptyDishForm);
  const [wineForm, setWineForm] = useState(emptyWineForm);
  const [pairingDishId, setPairingDishId] = useState("");
  const [importText, setImportText] = useState("");
  const [statusText, setStatusText] = useState("");

  const selectedRestaurant = useMemo(
    () => catalogRestaurants.find((restaurant) => restaurant.slug === selectedSlug) ?? catalogRestaurants[0] ?? null,
    [catalogRestaurants, selectedSlug],
  );

  const effectivePairingDishId =
    pairingDishId && selectedRestaurant?.dishes.some((dish) => dish.id === pairingDishId)
      ? pairingDishId
      : selectedRestaurant?.dishes[0]?.id ?? "";

  const selectedPairingDish = selectedRestaurant?.dishes.find(
    (dish) => dish.id === effectivePairingDishId,
  ) ?? null;

  const pairingsByWineId = useMemo(() => {
    const map = new Map<string, DishPairing>();
    for (const pairing of selectedPairingDish?.pairings ?? []) {
      map.set(pairing.wineId, pairing);
    }
    return map;
  }, [selectedPairingDish]);

  const updateSelectedRestaurant = (updater: (restaurant: Restaurant) => Restaurant) => {
    if (!selectedRestaurant) {
      return;
    }

    updateRestaurant(selectedRestaurant.slug, updater);
  };

  const addDish = () => {
    if (!selectedRestaurant || !dishForm.name.trim() || !dishForm.description.trim()) {
      setStatusText("Fill restaurant dish name and description.");
      return;
    }

    const created: Dish = {
      id: makeId(`${selectedRestaurant.slug}-dish`),
      name: mirroredLocalized(dishForm.name.trim()),
      category: dishForm.category.trim() || "Signature",
      description: mirroredLocalized(dishForm.description.trim()),
      price: Math.max(1, Math.round(Number(dishForm.price) || 1)),
      pairings: [],
    };

    updateSelectedRestaurant((restaurant) => ({
      ...restaurant,
      dishes: [...restaurant.dishes, created],
    }));
    setPairingDishId(created.id);
    setDishForm(emptyDishForm);
    setStatusText(`Dish added to ${t(selectedRestaurant.name, locale)}.`);
  };

  const addWine = () => {
    if (!selectedRestaurant || !wineForm.name.trim() || !wineForm.region.trim() || !wineForm.notes.trim()) {
      setStatusText("Fill restaurant wine name, region and notes.");
      return;
    }

    const created: Wine = {
      id: makeId(`${selectedRestaurant.slug}-wine`),
      name: mirroredLocalized(wineForm.name.trim()),
      region: wineForm.region.trim(),
      grape: wineForm.grape.trim() || "Blend",
      style: wineForm.style.trim() || "Wine",
      vintage: wineForm.vintage.trim() || undefined,
      notes: mirroredLocalized(wineForm.notes.trim()),
    };

    updateSelectedRestaurant((restaurant) => ({
      ...restaurant,
      wines: [...restaurant.wines, created],
    }));
    setWineForm(emptyWineForm);
    setStatusText(`Wine added to ${t(selectedRestaurant.name, locale)}.`);
  };

  const updateDish = (dishId: string, patch: Partial<Dish>) => {
    updateSelectedRestaurant((restaurant) => ({
      ...restaurant,
      dishes: restaurant.dishes.map((dish) => (dish.id === dishId ? { ...dish, ...patch } : dish)),
    }));
  };

  const updateWine = (wineId: string, patch: Partial<Wine>) => {
    updateSelectedRestaurant((restaurant) => ({
      ...restaurant,
      wines: restaurant.wines.map((wine) => (wine.id === wineId ? { ...wine, ...patch } : wine)),
    }));
  };

  const removeDish = (dishId: string) => {
    if (!selectedRestaurant) {
      return;
    }

    const label = selectedRestaurant.dishes.find((dish) => dish.id === dishId)?.name;
    if (!window.confirm(`Delete ${label ? t(label, locale) : "dish"}?`)) {
      return;
    }

    updateSelectedRestaurant((restaurant) => ({
      ...restaurant,
      dishes: restaurant.dishes.filter((dish) => dish.id !== dishId),
    }));
    setStatusText("Restaurant dish removed.");
  };

  const removeWine = (wineId: string) => {
    if (!selectedRestaurant) {
      return;
    }

    const label = selectedRestaurant.wines.find((wine) => wine.id === wineId)?.name;
    if (!window.confirm(`Delete ${label ? t(label, locale) : "wine"}?`)) {
      return;
    }

    updateSelectedRestaurant((restaurant) => ({
      ...restaurant,
      wines: restaurant.wines.filter((wine) => wine.id !== wineId),
      dishes: restaurant.dishes.map((dish) => ({
        ...dish,
        pairings: dish.pairings.filter((pairing) => pairing.wineId !== wineId),
      })),
    }));
    setStatusText("Restaurant wine removed.");
  };

  const togglePairing = (wineId: string) => {
    if (!effectivePairingDishId) {
      return;
    }

    const exists = pairingsByWineId.has(wineId);
    updateSelectedRestaurant((restaurant) => ({
      ...restaurant,
      dishes: restaurant.dishes.map((dish) => {
        if (dish.id !== effectivePairingDishId) {
          return dish;
        }

        return {
          ...dish,
          pairings: exists
            ? dish.pairings.filter((pairing) => pairing.wineId !== wineId)
            : [
                ...dish.pairings,
                {
                  wineId,
                  reason: mirroredLocalized(defaultPairingReason),
                },
              ],
        };
      }),
    }));
  };

  const updatePairingReason = (wineId: string, lang: Locale, value: string) => {
    if (!effectivePairingDishId) {
      return;
    }

    updateSelectedRestaurant((restaurant) => ({
      ...restaurant,
      dishes: restaurant.dishes.map((dish) => {
        if (dish.id !== effectivePairingDishId) {
          return dish;
        }

        return {
          ...dish,
          pairings: dish.pairings.map((pairing) =>
            pairing.wineId === wineId
              ? { ...pairing, reason: setLocalized(pairing.reason, lang, value) }
              : pairing,
          ),
        };
      }),
    }));
  };

  const exportJson = () => {
    const blob = new Blob([exportRestaurants()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `restaurant-catalog-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusText("Restaurant catalog exported.");
  };

  const importJson = () => {
    const ok = importRestaurants(importText);
    if (!ok) {
      setStatusText("Import failed: expected { restaurants: [...] } or an array of restaurants.");
      return;
    }

    setImportText("");
    setStatusText("Restaurant catalog imported.");
  };

  const resetAll = () => {
    if (!window.confirm("Reset all restaurant pages to seed data?")) {
      return;
    }

    resetRestaurants();
    setStatusText("Restaurant catalog reset to seed data.");
  };

  if (!selectedRestaurant) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(209,21,52,0.16),transparent_30%),rgba(255,255,255,0.04)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <p className="mb-2 inline-flex rounded-full border border-primary/35 bg-primary/15 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            Restaurant Catalog Admin
          </p>
          <h1 className="text-3xl font-bold text-white sm:text-4xl">Restaurant content manager</h1>
          <p className="mt-2 text-sm leading-6 text-gray-300">
            Edit a selected restaurant once and the same data appears in the directory, QR restaurant page and restaurant-scoped pairing workspace.
          </p>
        </div>

        <div className="grid min-w-[260px] gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
          <label className="grid gap-2">
            <span className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
              Active restaurant
            </span>
            <select
              className="rounded-lg border border-white/15 bg-[#190f12] px-3 py-2 text-sm text-gray-100"
              value={selectedRestaurant.slug}
              onChange={(event) => setSelectedSlug(event.target.value)}
            >
              {catalogRestaurants.map((restaurant) => (
                <option key={restaurant.slug} value={restaurant.slug}>
                  {t(restaurant.name, locale)} — {restaurant.city}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2">
              <p className="text-lg font-semibold text-white">{selectedRestaurant.dishes.length}</p>
              <p className="text-[10px] tracking-wider text-gray-500 uppercase">Dishes</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2">
              <p className="text-lg font-semibold text-white">{selectedRestaurant.wines.length}</p>
              <p className="text-[10px] tracking-wider text-gray-500 uppercase">Wines</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 px-2 py-2">
              <p className="text-lg font-semibold text-white">QR</p>
              <p className="text-[10px] tracking-wider text-gray-500 uppercase">Ready</p>
            </div>
          </div>
        </div>
      </div>

      {statusText ? (
        <p className="mt-4 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {statusText}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportJson}
          className="rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold"
        >
          Export restaurants JSON
        </button>
        <button
          type="button"
          onClick={importJson}
          className="rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-semibold text-primary"
        >
          Import restaurants JSON
        </button>
        <button
          type="button"
          onClick={resetAll}
          className="rounded-lg border border-rose-500/30 bg-rose-900/20 px-3 py-2 text-xs font-semibold text-rose-300"
        >
          Reset restaurants
        </button>
      </div>

      <textarea
        className="mt-3 min-h-24 w-full rounded-xl border border-white/15 bg-[#190f12] px-3 py-2 text-sm text-gray-100"
        placeholder='Paste JSON like { "restaurants": [...] }'
        value={importText}
        onChange={(event) => setImportText(event.target.value)}
      />

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <article className="min-w-0 rounded-2xl border border-white/10 bg-black/18 p-4">
          <h2 className="text-xl font-semibold text-white">Restaurant dishes</h2>
          <p className="mt-1 text-xs text-gray-400">These are the menu items shown on the restaurant page and in pairing.</p>

          <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <input
              className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
              placeholder="Restaurant dish name"
              value={dishForm.name}
              onChange={(event) => setDishForm({ ...dishForm, name: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Category"
                value={dishForm.category}
                onChange={(event) => setDishForm({ ...dishForm, category: event.target.value })}
              />
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                type="number"
                min={1}
                placeholder="Price"
                value={dishForm.price}
                onChange={(event) => setDishForm({ ...dishForm, price: event.target.value })}
              />
            </div>
            <textarea
              className="min-h-16 rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
              placeholder="Restaurant dish description"
              value={dishForm.description}
              onChange={(event) => setDishForm({ ...dishForm, description: event.target.value })}
            />
            <button
              type="button"
              onClick={addDish}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Add restaurant dish
            </button>
          </div>

          <div className="mt-4 max-h-[560px] space-y-3 overflow-auto pr-1">
            {selectedRestaurant.dishes.map((dish) => (
              <div key={dish.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    placeholder="EN name"
                    value={dish.name.en}
                    onChange={(event) =>
                      updateDish(dish.id, { name: setLocalized(dish.name, "en", event.target.value) })
                    }
                  />
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    placeholder="PL name"
                    value={dish.name.pl}
                    onChange={(event) =>
                      updateDish(dish.id, { name: setLocalized(dish.name, "pl", event.target.value) })
                    }
                  />
                </div>
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={dish.category}
                    onChange={(event) => updateDish(dish.id, { category: event.target.value || "Menu" })}
                  />
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    type="number"
                    min={1}
                    value={dish.price}
                    onChange={(event) => updateDish(dish.id, { price: Math.max(1, Math.round(Number(event.target.value) || 1)) })}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <textarea
                    className="min-h-16 w-full rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    placeholder="EN description"
                    value={dish.description.en}
                    onChange={(event) =>
                      updateDish(dish.id, {
                        description: setLocalized(dish.description, "en", event.target.value),
                      })
                    }
                  />
                  <textarea
                    className="min-h-16 w-full rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    placeholder="PL description"
                    value={dish.description.pl}
                    onChange={(event) =>
                      updateDish(dish.id, {
                        description: setLocalized(dish.description, "pl", event.target.value),
                      })
                    }
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeDish(dish.id)}
                    className="rounded-lg border border-rose-500/30 bg-rose-900/20 px-3 py-1.5 text-xs font-semibold text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="min-w-0 rounded-2xl border border-white/10 bg-black/18 p-4">
          <h2 className="text-xl font-semibold text-white">Restaurant wines</h2>
          <p className="mt-1 text-xs text-gray-400">These labels drive ranking, wine passport and match explanations.</p>

          <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <input
              className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
              placeholder="Restaurant wine name"
              value={wineForm.name}
              onChange={(event) => setWineForm({ ...wineForm, name: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Region"
                value={wineForm.region}
                onChange={(event) => setWineForm({ ...wineForm, region: event.target.value })}
              />
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Vintage"
                value={wineForm.vintage}
                onChange={(event) => setWineForm({ ...wineForm, vintage: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Grape"
                value={wineForm.grape}
                onChange={(event) => setWineForm({ ...wineForm, grape: event.target.value })}
              />
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Style"
                value={wineForm.style}
                onChange={(event) => setWineForm({ ...wineForm, style: event.target.value })}
              />
            </div>
            <textarea
              className="min-h-16 rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
              placeholder="Restaurant wine notes"
              value={wineForm.notes}
              onChange={(event) => setWineForm({ ...wineForm, notes: event.target.value })}
            />
            <button
              type="button"
              onClick={addWine}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Add restaurant wine
            </button>
          </div>

          <div className="mt-4 max-h-[560px] space-y-3 overflow-auto pr-1">
            {selectedRestaurant.wines.map((wine) => (
              <div key={wine.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    placeholder="EN name"
                    value={wine.name.en}
                    onChange={(event) =>
                      updateWine(wine.id, { name: setLocalized(wine.name, "en", event.target.value) })
                    }
                  />
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    placeholder="PL name"
                    value={wine.name.pl}
                    onChange={(event) =>
                      updateWine(wine.id, { name: setLocalized(wine.name, "pl", event.target.value) })
                    }
                  />
                </div>
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={wine.region}
                    onChange={(event) => updateWine(wine.id, { region: event.target.value })}
                  />
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={wine.vintage ?? ""}
                    onChange={(event) => updateWine(wine.id, { vintage: event.target.value || undefined })}
                  />
                </div>
                <div className="mb-2 grid grid-cols-2 gap-2">
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={wine.grape}
                    onChange={(event) => updateWine(wine.id, { grape: event.target.value || "Blend" })}
                  />
                  <input
                    className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={wine.style}
                    onChange={(event) => updateWine(wine.id, { style: event.target.value || "Wine" })}
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <textarea
                    className="min-h-16 w-full rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    placeholder="EN notes"
                    value={wine.notes.en}
                    onChange={(event) =>
                      updateWine(wine.id, { notes: setLocalized(wine.notes, "en", event.target.value) })
                    }
                  />
                  <textarea
                    className="min-h-16 w-full rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    placeholder="PL notes"
                    value={wine.notes.pl}
                    onChange={(event) =>
                      updateWine(wine.id, { notes: setLocalized(wine.notes, "pl", event.target.value) })
                    }
                  />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeWine(wine.id)}
                    className="rounded-lg border border-rose-500/30 bg-rose-900/20 px-3 py-1.5 text-xs font-semibold text-rose-300"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <section className="mt-5 rounded-2xl border border-white/10 bg-black/18 p-4">
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-white">Restaurant curated pairings</h2>
            <p className="mt-1 text-xs text-gray-400">These pairings override generic AI scoring for this restaurant.</p>
          </div>
          <select
            className="rounded-lg border border-white/15 bg-[#190f12] px-3 py-2 text-sm text-gray-100"
            value={effectivePairingDishId}
            onChange={(event) => setPairingDishId(event.target.value)}
          >
            {selectedRestaurant.dishes.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {t(dish.name, locale)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {selectedRestaurant.wines.map((wine) => {
            const curated = pairingsByWineId.get(wine.id);
            const selected = Boolean(curated);
            return (
              <div
                key={wine.id}
                className={`rounded-xl border p-3 ${
                  selected ? "border-primary/45 bg-primary/12" : "border-white/10 bg-black/20"
                }`}
              >
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-white">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => togglePairing(wine.id)}
                  />
                  <span>{t(wine.name, locale)}</span>
                  <span className="ml-auto text-[10px] tracking-wider text-gray-400 uppercase">
                    {wine.style}
                  </span>
                </label>
                {selected && curated ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    <textarea
                      className="min-h-20 w-full rounded-lg border border-white/15 bg-[#190f12] px-3 py-2 text-sm text-gray-100"
                      placeholder="EN reason"
                      value={curated.reason.en}
                      onChange={(event) => updatePairingReason(wine.id, "en", event.target.value)}
                    />
                    <textarea
                      className="min-h-20 w-full rounded-lg border border-white/15 bg-[#190f12] px-3 py-2 text-sm text-gray-100"
                      placeholder="PL reason"
                      value={curated.reason.pl}
                      onChange={(event) => updatePairingReason(wine.id, "pl", event.target.value)}
                    />
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">Not selected for this dish.</p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
