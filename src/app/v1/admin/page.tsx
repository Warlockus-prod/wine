"use client";

import { useEffect, useMemo, useState } from "react";
import { useRestaurants } from "@/context/restaurants-context";
import { trackEvent } from "@/lib/analytics";
import { makeId } from "@/lib/format";
import { parseRestaurantImport } from "@/lib/restaurant-validation";
import { Dish, Restaurant, Wine } from "@/types/restaurant";

const cloneRestaurant = (restaurant: Restaurant) =>
  JSON.parse(JSON.stringify(restaurant)) as Restaurant;

const readAutosaveDraft = (restaurantId: string): Restaurant | null => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(`web_wn_v1_admin_draft_${restaurantId}`);
    if (!raw) {
      return null;
    }

    const restored = JSON.parse(raw) as Restaurant;
    if (restored?.id !== restaurantId) {
      return null;
    }

    return cloneRestaurant(restored);
  } catch {
    return null;
  }
};

const EMPTY_DISH = {
  name: "",
  category: "Main",
  description: "",
  price: "24",
};

const EMPTY_WINE = {
  name: "",
  region: "",
  grape: "",
  style: "White",
  vintage: "",
  notes: "",
};

export default function AdminPage() {
  const {
    restaurants,
    ready,
    storageIssue,
    updateRestaurant,
    resetRestaurants,
    replaceRestaurants,
    exportRestaurants,
  } = useRestaurants();
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("");
  const [importText, setImportText] = useState("");
  const [importStatus, setImportStatus] = useState<string>("");

  const effectiveRestaurantId =
    selectedRestaurantId && restaurants.some((item) => item.id === selectedRestaurantId)
      ? selectedRestaurantId
      : restaurants[0]?.id ?? "";

  const selectedRestaurant =
    restaurants.find((item) => item.id === effectiveRestaurantId) ?? null;

  const editorKey = useMemo(
    () => (selectedRestaurant ? JSON.stringify(selectedRestaurant) : "none"),
    [selectedRestaurant],
  );

  const handleExportJson = () => {
    const payload = exportRestaurants();
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `restaurants-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    trackEvent("v1_admin_export_json", { restaurants_count: restaurants.length });
  };

  const handleImportJson = () => {
    const normalized = parseRestaurantImport(importText);

    if (!normalized) {
      setImportStatus("Import failed: invalid JSON structure.");
      return;
    }

    replaceRestaurants(normalized);
    setImportStatus(`Imported ${normalized.length} restaurants.`);
    setImportText("");
    trackEvent("v1_admin_import_json", { restaurants_count: normalized.length });
  };

  if (!ready) {
    return (
      <div className="site-panel flex min-h-[40vh] items-center justify-center p-10 text-lg text-[#6b665d]">
        Loading admin workspace...
      </div>
    );
  }

  if (!selectedRestaurant) {
    return (
      <div className="site-panel p-8">
        <h1 className="text-3xl" style={{ fontFamily: "var(--font-display)" }}>
          No restaurants loaded
        </h1>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {storageIssue ? (
        <section className="rounded-2xl border border-[#f0c8b8] bg-[#fff3ed] px-4 py-3 text-sm text-[#8d3a2b]">
          {storageIssue}
        </section>
      ) : null}

      <section className="site-panel p-4 md:p-6">
        <label className="mb-2 block text-sm font-semibold text-[#6b665d]" htmlFor="restaurant">
          Restaurant
        </label>
        <select
          id="restaurant"
          className="w-full rounded-xl border border-[#d8cdbc] bg-[#fffaf2] px-3 py-2"
          value={effectiveRestaurantId}
          onChange={(event) => setSelectedRestaurantId(event.target.value)}
        >
          {restaurants.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.city})
            </option>
          ))}
        </select>
      </section>

      <section className="site-panel p-4 md:p-6">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Data transfer
        </h2>
        <p className="mt-1 text-sm text-[#6b665d]">
          Export current data to JSON for backup/demo migration. Import accepts either
          <code> {`{ restaurants: [...] }`} </code> or plain <code>[...]</code> array.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleExportJson}
            className="rounded-full border border-[#c7d9d0] bg-[#ebf6f2] px-4 py-2 text-sm font-semibold text-[#2f6a6e]"
          >
            Export JSON
          </button>
          <button
            type="button"
            onClick={handleImportJson}
            className="rounded-full border border-[#dbcdbd] bg-[#fff8ef] px-4 py-2 text-sm font-medium"
          >
            Import JSON
          </button>
        </div>
        <textarea
          className="mt-3 min-h-32 w-full rounded-xl border border-[#d8cdbc] bg-[#fffaf2] px-3 py-2 text-sm"
          placeholder="Paste JSON here"
          value={importText}
          onChange={(event) => setImportText(event.target.value)}
        />
        {importStatus ? (
          <p className="mt-2 rounded-xl border border-[#d7e7de] bg-[#edf8f3] px-3 py-2 text-sm text-[#2f6a6e]">
            {importStatus}
          </p>
        ) : null}
      </section>

      <RestaurantEditor
        key={editorKey}
        restaurant={selectedRestaurant}
        onSave={updateRestaurant}
        onResetAll={resetRestaurants}
      />
    </div>
  );
}

function RestaurantEditor({
  restaurant,
  onSave,
  onResetAll,
}: {
  restaurant: Restaurant;
  onSave: (restaurant: Restaurant) => void;
  onResetAll: () => void;
}) {
  const [draft, setDraft] = useState<Restaurant>(
    () => readAutosaveDraft(restaurant.id) ?? cloneRestaurant(restaurant),
  );
  const [dishForm, setDishForm] = useState(EMPTY_DISH);
  const [wineForm, setWineForm] = useState(EMPTY_WINE);
  const [pairingDishId, setPairingDishId] = useState<string>(() => {
    const restored = readAutosaveDraft(restaurant.id);
    return restored?.dishes[0]?.id ?? restaurant.dishes[0]?.id ?? "";
  });
  const [statusText, setStatusText] = useState<string>(() =>
    readAutosaveDraft(restaurant.id) ? "Autosaved draft restored." : "",
  );
  const [dishFilter, setDishFilter] = useState("");
  const [wineFilter, setWineFilter] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"dishes" | "wines" | "pairings">("dishes");
  const autosaveKey = `web_wn_v1_admin_draft_${restaurant.id}`;

  const effectivePairingDishId =
    pairingDishId && draft.dishes.some((item) => item.id === pairingDishId)
      ? pairingDishId
      : draft.dishes[0]?.id ?? "";

  const pairingDish =
    draft.dishes.find((item) => item.id === effectivePairingDishId) ?? null;

  const pairingMap = useMemo(
    () => new Map((pairingDish?.pairings ?? []).map((item) => [item.wineId, item.reason])),
    [pairingDish],
  );

  const filteredDishes = useMemo(() => {
    const normalized = dishFilter.trim().toLowerCase();
    if (!normalized) {
      return draft.dishes;
    }

    return draft.dishes.filter((dish) =>
      [dish.name, dish.category, dish.description].join(" ").toLowerCase().includes(normalized),
    );
  }, [dishFilter, draft.dishes]);

  const filteredWines = useMemo(() => {
    const normalized = wineFilter.trim().toLowerCase();
    if (!normalized) {
      return draft.wines;
    }

    return draft.wines.filter((wine) =>
      [wine.name, wine.region, wine.grape, wine.style, wine.notes]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [draft.wines, wineFilter]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(autosaveKey, JSON.stringify(draft));
      } catch {
        // Ignore storage write issues in private mode.
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [autosaveKey, draft]);

  const saveDraft = () => {
    onSave(draft);
    window.localStorage.removeItem(autosaveKey);
    setStatusText("Saved. Restaurant updates are live now.");
    trackEvent("v1_admin_save_restaurant", {
      restaurant_id: draft.id,
      dishes_count: draft.dishes.length,
      wines_count: draft.wines.length,
    });
  };

  const restoreFromStore = () => {
    setDraft(cloneRestaurant(restaurant));
    setPairingDishId(restaurant.dishes[0]?.id ?? "");
    window.localStorage.removeItem(autosaveKey);
    setStatusText("Reverted unsaved changes.");
    trackEvent("v1_admin_revert_restaurant", { restaurant_id: restaurant.id });
  };

  const updateDish = (dishId: string, patch: Partial<Dish>) => {
    setDraft((current) => ({
      ...current,
      dishes: current.dishes.map((dish) =>
        dish.id === dishId
          ? {
              ...dish,
              ...patch,
            }
          : dish,
      ),
    }));
  };

  const updateWine = (wineId: string, patch: Partial<Wine>) => {
    setDraft((current) => ({
      ...current,
      wines: current.wines.map((wine) =>
        wine.id === wineId
          ? {
              ...wine,
              ...patch,
            }
          : wine,
      ),
    }));
  };

  const addDish = () => {
    if (!dishForm.name.trim() || !dishForm.description.trim()) {
      return;
    }

    const created: Dish = {
      id: makeId(`${draft.id}-d`),
      name: dishForm.name.trim(),
      category: dishForm.category.trim() || "Main",
      description: dishForm.description.trim(),
      price: Number(dishForm.price) || 0,
      pairings: [],
    };

    setDraft((current) => ({
      ...current,
      dishes: [...current.dishes, created],
    }));
    setDishForm(EMPTY_DISH);
    if (!effectivePairingDishId) {
      setPairingDishId(created.id);
    }
    trackEvent("v1_admin_add_dish", { restaurant_id: draft.id, dish_id: created.id });
  };

  const removeDish = (dishId: string) => {
    const dishName = draft.dishes.find((dish) => dish.id === dishId)?.name ?? "this dish";
    if (!window.confirm(`Delete ${dishName}?`)) {
      return;
    }

    setDraft((current) => {
      const nextDishes = current.dishes.filter((dish) => dish.id !== dishId);
      if (effectivePairingDishId === dishId) {
        setPairingDishId(nextDishes[0]?.id ?? "");
      }

      return {
        ...current,
        dishes: nextDishes,
      };
    });
  };

  const addWine = () => {
    if (!wineForm.name.trim() || !wineForm.region.trim()) {
      return;
    }

    const created: Wine = {
      id: makeId(`${draft.id}-w`),
      name: wineForm.name.trim(),
      region: wineForm.region.trim(),
      grape: wineForm.grape.trim() || "Blend",
      style: wineForm.style.trim() || "White",
      vintage: wineForm.vintage.trim() || "NV",
      notes: wineForm.notes.trim() || "Pairing-ready wine.",
    };

    setDraft((current) => ({
      ...current,
      wines: [...current.wines, created],
    }));
    setWineForm(EMPTY_WINE);
    trackEvent("v1_admin_add_wine", { restaurant_id: draft.id, wine_id: created.id });
  };

  const removeWine = (wineId: string) => {
    const wineName = draft.wines.find((wine) => wine.id === wineId)?.name ?? "this wine";
    if (!window.confirm(`Delete ${wineName}? This also removes its pairings.`)) {
      return;
    }

    setDraft((current) => ({
      ...current,
      wines: current.wines.filter((wine) => wine.id !== wineId),
      dishes: current.dishes.map((dish) => ({
        ...dish,
        pairings: dish.pairings.filter((pairing) => pairing.wineId !== wineId),
      })),
    }));
  };

  const togglePairing = (wineId: string) => {
    if (!pairingDish) {
      return;
    }

    const exists = pairingDish.pairings.some((pairing) => pairing.wineId === wineId);

    updateDish(
      pairingDish.id,
      exists
        ? {
            pairings: pairingDish.pairings.filter((pairing) => pairing.wineId !== wineId),
          }
        : {
            pairings: [
              ...pairingDish.pairings,
              {
                wineId,
                reason: "Balanced acidity and texture for this dish.",
              },
            ],
          },
    );

    trackEvent("v1_admin_toggle_pairing", {
      restaurant_id: draft.id,
      dish_id: pairingDish.id,
      wine_id: wineId,
      selected: !exists,
    });
  };

  const updatePairingReason = (wineId: string, reason: string) => {
    if (!pairingDish) {
      return;
    }

    updateDish(pairingDish.id, {
      pairings: pairingDish.pairings.map((pairing) =>
        pairing.wineId === wineId ? { ...pairing, reason } : pairing,
      ),
    });
  };

  return (
    <>
      <section className="site-panel p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#8d3a2b]">Admin panel</p>
            <h1 className="text-4xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Restaurant content manager
            </h1>
            <p className="mt-2 text-[#6b665d]">
              Local-first mode for demo. You can edit dishes, wines, and pairings and instantly
              validate on public restaurant pages.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={restoreFromStore}
              className="rounded-full border border-[#dbcdbd] bg-[#fff8ef] px-4 py-2 text-sm font-medium"
            >
              Revert
            </button>
            <button
              type="button"
              onClick={saveDraft}
              className="rounded-full border border-[#35776d] bg-[#3e8f82] px-4 py-2 text-sm font-semibold text-white"
            >
              Save restaurant
            </button>
            <button
              type="button"
              onClick={() => {
                onResetAll();
                window.localStorage.removeItem(autosaveKey);
                setStatusText("All restaurants reset to initial seed data.");
                trackEvent("v1_admin_reset_all", { restaurant_id: draft.id });
              }}
              className="rounded-full border border-[#c8725c] bg-[#fff2eb] px-4 py-2 text-sm font-medium text-[#8d3a2b]"
            >
              Reset all
            </button>
          </div>
        </div>

        {statusText ? (
          <p className="mt-4 rounded-xl border border-[#cfe2d8] bg-[#eaf7f1] px-4 py-2 text-sm text-[#365a61]">
            {statusText}
          </p>
        ) : null}

        <div className="mt-3 text-xs font-medium text-[#6b665d]">
          Autosave draft is enabled for this restaurant.
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 xl:hidden">
          <button
            type="button"
            onClick={() => setMobilePanel("dishes")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              mobilePanel === "dishes"
                ? "border border-[#c8b8a6] bg-[#fff0de] text-[#8d3a2b]"
                : "border border-[#e0d2c1] bg-[#fff8ef] text-[#6b665d]"
            }`}
          >
            Dishes
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("wines")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              mobilePanel === "wines"
                ? "border border-[#b9d5c6] bg-[#e7f5ee] text-[#2f6a6e]"
                : "border border-[#d7ddd2] bg-[#f8fcfa] text-[#6b665d]"
            }`}
          >
            Wines
          </button>
          <button
            type="button"
            onClick={() => setMobilePanel("pairings")}
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${
              mobilePanel === "pairings"
                ? "border border-[#b8d7cf] bg-[#e8f4f0] text-[#2f6a6e]"
                : "border border-[#d7ddd2] bg-[#f8fcfa] text-[#6b665d]"
            }`}
          >
            Pairings
          </button>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article
          className={`site-panel p-4 md:p-6 ${
            mobilePanel !== "dishes" ? "hidden xl:block" : ""
          }`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Dishes
            </h2>
            <span className="badge">{draft.dishes.length}</span>
          </div>

          <input
            value={dishFilter}
            onChange={(event) => setDishFilter(event.target.value)}
            placeholder="Filter dishes"
            className="mb-3 w-full rounded-xl border border-[#d8cdbc] bg-[#fffaf2] px-3 py-2"
          />

          <div className="mb-4 grid gap-2 rounded-2xl border border-[#ded1c0] bg-[#fff8ef] p-3">
            <p className="text-sm font-semibold">Add dish</p>
            <input
              className="rounded-lg border border-[#d9cdbc] bg-white px-3 py-2 text-sm"
              placeholder="Dish name"
              value={dishForm.name}
              onChange={(event) => setDishForm({ ...dishForm, name: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-[#d9cdbc] bg-white px-3 py-2 text-sm"
                placeholder="Category"
                value={dishForm.category}
                onChange={(event) => setDishForm({ ...dishForm, category: event.target.value })}
              />
              <input
                className="rounded-lg border border-[#d9cdbc] bg-white px-3 py-2 text-sm"
                placeholder="Price"
                type="number"
                min={0}
                value={dishForm.price}
                onChange={(event) => setDishForm({ ...dishForm, price: event.target.value })}
              />
            </div>
            <textarea
              className="min-h-20 rounded-lg border border-[#d9cdbc] bg-white px-3 py-2 text-sm"
              placeholder="Description"
              value={dishForm.description}
              onChange={(event) =>
                setDishForm({
                  ...dishForm,
                  description: event.target.value,
                })
              }
            />
            <button
              type="button"
              onClick={addDish}
              className="rounded-full border border-[#c7d9d0] bg-[#ebf6f2] px-4 py-2 text-sm font-semibold text-[#2f6a6e]"
            >
              Add dish
            </button>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
            {filteredDishes.map((dish) => (
              <div key={dish.id} className="rounded-2xl border border-[#e0d4c4] bg-[#fffaf4] p-3">
                <div className="mb-2 grid gap-2 sm:grid-cols-[1fr_140px]">
                  <input
                    className="rounded-lg border border-[#d8ccbb] bg-white px-3 py-2 text-sm"
                    value={dish.name}
                    onChange={(event) => updateDish(dish.id, { name: event.target.value })}
                  />
                  <input
                    className="rounded-lg border border-[#d8ccbb] bg-white px-3 py-2 text-sm"
                    value={dish.category}
                    onChange={(event) => updateDish(dish.id, { category: event.target.value })}
                  />
                </div>
                <div className="mb-2 grid gap-2 sm:grid-cols-[1fr_120px]">
                  <textarea
                    className="min-h-16 rounded-lg border border-[#d8ccbb] bg-white px-3 py-2 text-sm"
                    value={dish.description}
                    onChange={(event) => updateDish(dish.id, { description: event.target.value })}
                  />
                  <input
                    className="rounded-lg border border-[#d8ccbb] bg-white px-3 py-2 text-sm"
                    type="number"
                    min={0}
                    value={dish.price}
                    onChange={(event) =>
                      updateDish(dish.id, {
                        price: Number(event.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeDish(dish.id)}
                    className="rounded-full border border-[#ebc9bf] bg-[#fff2ef] px-3 py-1 text-xs font-semibold text-[#a33f35]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredDishes.length === 0 ? (
              <p className="rounded-xl border border-[#e5d9c8] bg-[#fff9f1] p-3 text-sm text-[#7a756d]">
                No dishes for this filter.
              </p>
            ) : null}
          </div>
        </article>

        <article
          className={`site-panel p-4 md:p-6 ${mobilePanel !== "wines" ? "hidden xl:block" : ""}`}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Wines
            </h2>
            <span className="badge">{draft.wines.length}</span>
          </div>

          <input
            value={wineFilter}
            onChange={(event) => setWineFilter(event.target.value)}
            placeholder="Filter wines"
            className="mb-3 w-full rounded-xl border border-[#d8cdbc] bg-[#fffaf2] px-3 py-2"
          />

          <div className="mb-4 grid gap-2 rounded-2xl border border-[#d9ddcf] bg-[#f6fbf8] p-3">
            <p className="text-sm font-semibold">Add wine</p>
            <input
              className="rounded-lg border border-[#cadbcf] bg-white px-3 py-2 text-sm"
              placeholder="Wine name"
              value={wineForm.name}
              onChange={(event) => setWineForm({ ...wineForm, name: event.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-[#cadbcf] bg-white px-3 py-2 text-sm"
                placeholder="Region"
                value={wineForm.region}
                onChange={(event) => setWineForm({ ...wineForm, region: event.target.value })}
              />
              <input
                className="rounded-lg border border-[#cadbcf] bg-white px-3 py-2 text-sm"
                placeholder="Grape"
                value={wineForm.grape}
                onChange={(event) => setWineForm({ ...wineForm, grape: event.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="rounded-lg border border-[#cadbcf] bg-white px-3 py-2 text-sm"
                placeholder="Style (Red/White/Sparkling)"
                value={wineForm.style}
                onChange={(event) => setWineForm({ ...wineForm, style: event.target.value })}
              />
              <input
                className="rounded-lg border border-[#cadbcf] bg-white px-3 py-2 text-sm"
                placeholder="Vintage"
                value={wineForm.vintage}
                onChange={(event) => setWineForm({ ...wineForm, vintage: event.target.value })}
              />
            </div>
            <textarea
              className="min-h-20 rounded-lg border border-[#cadbcf] bg-white px-3 py-2 text-sm"
              placeholder="Tasting notes"
              value={wineForm.notes}
              onChange={(event) => setWineForm({ ...wineForm, notes: event.target.value })}
            />
            <button
              type="button"
              onClick={addWine}
              className="rounded-full border border-[#b9d5c6] bg-[#e7f5ee] px-4 py-2 text-sm font-semibold text-[#2f6a6e]"
            >
              Add wine
            </button>
          </div>

          <div className="space-y-3 max-h-[560px] overflow-auto pr-1">
            {filteredWines.map((wine) => (
              <div key={wine.id} className="rounded-2xl border border-[#d9dfd2] bg-[#fbfefc] p-3">
                <input
                  className="mb-2 w-full rounded-lg border border-[#cbd8ce] bg-white px-3 py-2 text-sm"
                  value={wine.name}
                  onChange={(event) => updateWine(wine.id, { name: event.target.value })}
                />
                <div className="mb-2 grid gap-2 sm:grid-cols-2">
                  <input
                    className="rounded-lg border border-[#cbd8ce] bg-white px-3 py-2 text-sm"
                    value={wine.region}
                    onChange={(event) => updateWine(wine.id, { region: event.target.value })}
                  />
                  <input
                    className="rounded-lg border border-[#cbd8ce] bg-white px-3 py-2 text-sm"
                    value={wine.grape}
                    onChange={(event) => updateWine(wine.id, { grape: event.target.value })}
                  />
                </div>
                <div className="mb-2 grid gap-2 sm:grid-cols-2">
                  <input
                    className="rounded-lg border border-[#cbd8ce] bg-white px-3 py-2 text-sm"
                    value={wine.style}
                    onChange={(event) => updateWine(wine.id, { style: event.target.value })}
                  />
                  <input
                    className="rounded-lg border border-[#cbd8ce] bg-white px-3 py-2 text-sm"
                    value={wine.vintage ?? ""}
                    onChange={(event) => updateWine(wine.id, { vintage: event.target.value })}
                  />
                </div>
                <textarea
                  className="min-h-16 w-full rounded-lg border border-[#cbd8ce] bg-white px-3 py-2 text-sm"
                  value={wine.notes}
                  onChange={(event) => updateWine(wine.id, { notes: event.target.value })}
                />
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => removeWine(wine.id)}
                    className="rounded-full border border-[#ebc9bf] bg-[#fff2ef] px-3 py-1 text-xs font-semibold text-[#a33f35]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {filteredWines.length === 0 ? (
              <p className="rounded-xl border border-[#e5d9c8] bg-[#fff9f1] p-3 text-sm text-[#7a756d]">
                No wines for this filter.
              </p>
            ) : null}
          </div>
        </article>
      </section>

      <section
        className={`site-panel p-4 md:p-6 ${mobilePanel !== "pairings" ? "hidden xl:block" : ""}`}
      >
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
              Pairings editor
            </h2>
            <p className="text-sm text-[#6b665d]">Select a dish and choose matching wines.</p>
          </div>
          <select
            value={effectivePairingDishId}
            onChange={(event) => setPairingDishId(event.target.value)}
            className="rounded-xl border border-[#d8cdbc] bg-[#fffaf2] px-3 py-2"
          >
            {draft.dishes.map((dish) => (
              <option key={dish.id} value={dish.id}>
                {dish.name}
              </option>
            ))}
          </select>
        </div>

        {!pairingDish ? (
          <p className="text-sm text-[#8a857d]">Add at least one dish to configure pairings.</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {draft.wines.map((wine) => {
              const selected = pairingMap.has(wine.id);
              return (
                <div
                  key={wine.id}
                  className={`rounded-2xl border p-3 ${
                    selected
                      ? "border-[#2f6a6e] bg-[#ebf7f3]"
                      : "border-[#e0d6c8] bg-[#fff9f1]"
                  }`}
                >
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => togglePairing(wine.id)}
                    />
                    {wine.name}
                  </label>
                  {selected ? (
                    <textarea
                      className="mt-2 min-h-18 w-full rounded-lg border border-[#bdd8d1] bg-white px-3 py-2 text-sm"
                      value={pairingMap.get(wine.id) ?? ""}
                      onChange={(event) => updatePairingReason(wine.id, event.target.value)}
                    />
                  ) : (
                    <p className="mt-2 text-xs text-[#7f7b73]">Not selected for this dish.</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="fixed right-4 bottom-4 z-50 xl:hidden">
        <button
          type="button"
          onClick={saveDraft}
          className="rounded-full border border-[#35776d] bg-[#3e8f82] px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(26,59,53,0.25)]"
        >
          Save
        </button>
      </div>
    </>
  );
}
