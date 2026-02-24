"use client";

import { useMemo, useState } from "react";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { trackEvent } from "@/lib/analytics";
import { makeId } from "@/lib/format";
import { usePairingDataset } from "@/lib/pairing-store";
import type {
  PairingDataset,
  PairingDish,
  PairingWine,
  WineAcidity,
  WineBody,
  WineTannin,
} from "@/types/pairing";

type ApiResponse = {
  matches?: Array<{ wineId: string; score: number; reason: string }>;
  error?: string;
};

const parseTags = (input: string) =>
  input
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .slice(0, 8);

const toTagInput = (tags: string[]) => tags.join(", ");

const bodyOptions: WineBody[] = ["light", "medium", "full"];
const acidityOptions: WineAcidity[] = ["low", "medium", "high"];
const tanninOptions: WineTannin[] = ["none", "soft", "medium", "high"];

export default function AdminPage() {
  const { dataset, setDataset, resetDataset, exportDataset, importDataset } = usePairingDataset();

  const [dishForm, setDishForm] = useState({
    name: "",
    price: "24",
    description: "",
    image: "",
    tags: "Main, Signature",
  });

  const [wineForm, setWineForm] = useState({
    name: "",
    region: "",
    year: "2021",
    price: "52",
    rating: "4.3",
    description: "",
    image: "",
    tags: "Balanced, Pairing",
    grape: "Blend",
    abv: "13",
    body: "medium" as WineBody,
    acidity: "medium" as WineAcidity,
    tannin: "soft" as WineTannin,
    servingTempC: "10-14",
    decant: "No decant.",
  });

  const [apiDishId, setApiDishId] = useState<string>(dataset.dishes[0]?.id ?? "");
  const [apiSelectedWineIds, setApiSelectedWineIds] = useState<string[]>(
    dataset.wines.map((wine) => wine.id),
  );
  const [apiStatus, setApiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [importText, setImportText] = useState("");
  const [statusText, setStatusText] = useState("");
  const [mobileTab, setMobileTab] = useState<"dishes" | "wines">("dishes");

  const effectiveDishId =
    apiDishId && dataset.dishes.some((dish) => dish.id === apiDishId)
      ? apiDishId
      : dataset.dishes[0]?.id ?? "";

  const effectiveWineIds = useMemo(() => {
    const validIds = new Set(dataset.wines.map((wine) => wine.id));
    const filtered = apiSelectedWineIds.filter((id) => validIds.has(id));
    return filtered.length > 0 ? filtered : dataset.wines.map((wine) => wine.id);
  }, [apiSelectedWineIds, dataset.wines]);

  const selectedDish =
    dataset.dishes.find((dish) => dish.id === effectiveDishId) ?? dataset.dishes[0] ?? null;

  const selectedWines = dataset.wines.filter((wine) => effectiveWineIds.includes(wine.id));

  const updateDataset = (
    updater: (current: PairingDataset) => PairingDataset,
    eventName: string,
    payload: Record<string, string | number>,
  ) => {
    setDataset((current) => {
      const next = updater(current);
      return next;
    });

    trackEvent(eventName, payload);
  };

  const addDish = () => {
    if (!dishForm.name.trim() || !dishForm.description.trim() || !dishForm.image.trim()) {
      setStatusText("Fill dish name, description and image URL.");
      return;
    }

    const created: PairingDish = {
      id: makeId("dish"),
      name: dishForm.name.trim(),
      price: Math.max(1, Number(dishForm.price) || 1),
      description: dishForm.description.trim(),
      image: dishForm.image.trim(),
      tags: parseTags(dishForm.tags),
    };

    updateDataset(
      (current) => ({
        ...current,
        dishes: [...current.dishes, created],
      }),
      "v2_admin_add_dish",
      { dish_id: created.id },
    );

    setDishForm({
      name: "",
      price: "24",
      description: "",
      image: "",
      tags: "Main, Signature",
    });
    setApiDishId(created.id);
    setStatusText("Dish added.");
  };

  const addWine = () => {
    if (!wineForm.name.trim() || !wineForm.region.trim() || !wineForm.image.trim()) {
      setStatusText("Fill wine name, region and image URL.");
      return;
    }

    const created: PairingWine = {
      id: makeId("wine"),
      name: wineForm.name.trim(),
      region: wineForm.region.trim(),
      year: Math.max(1900, Number(wineForm.year) || 2021),
      price: Math.max(1, Number(wineForm.price) || 1),
      rating: Math.min(5, Math.max(1, Number(wineForm.rating) || 4)),
      description: wineForm.description.trim() || "Pairing-friendly wine profile.",
      image: wineForm.image.trim(),
      tags: parseTags(wineForm.tags),
      passport: {
        grape: wineForm.grape.trim() || "Blend",
        abv: Math.max(5, Math.min(20, Number(wineForm.abv) || 13)),
        body: wineForm.body,
        acidity: wineForm.acidity,
        tannin: wineForm.tannin,
        servingTempC: wineForm.servingTempC.trim() || "10-14",
        decant: wineForm.decant.trim() || "No decant.",
      },
    };

    updateDataset(
      (current) => ({
        ...current,
        wines: [...current.wines, created],
      }),
      "v2_admin_add_wine",
      { wine_id: created.id },
    );

    setWineForm({
      name: "",
      region: "",
      year: "2021",
      price: "52",
      rating: "4.3",
      description: "",
      image: "",
      tags: "Balanced, Pairing",
      grape: "Blend",
      abv: "13",
      body: "medium",
      acidity: "medium",
      tannin: "soft",
      servingTempC: "10-14",
      decant: "No decant.",
    });
    setApiSelectedWineIds((current) => [...current, created.id]);
    setStatusText("Wine added.");
  };

  const updateDish = (dishId: string, patch: Partial<PairingDish>) => {
    updateDataset(
      (current) => ({
        ...current,
        dishes: current.dishes.map((dish) => (dish.id === dishId ? { ...dish, ...patch } : dish)),
      }),
      "v2_admin_update_dish",
      { dish_id: dishId },
    );
  };

  const updateWine = (wineId: string, patch: Partial<PairingWine>) => {
    updateDataset(
      (current) => ({
        ...current,
        wines: current.wines.map((wine) => (wine.id === wineId ? { ...wine, ...patch } : wine)),
      }),
      "v2_admin_update_wine",
      { wine_id: wineId },
    );
  };

  const removeDish = (dishId: string) => {
    const label = dataset.dishes.find((dish) => dish.id === dishId)?.name ?? "dish";
    if (!window.confirm(`Delete ${label}?`)) {
      return;
    }

    updateDataset(
      (current) => ({
        ...current,
        dishes: current.dishes.filter((dish) => dish.id !== dishId),
      }),
      "v2_admin_remove_dish",
      { dish_id: dishId },
    );

    setStatusText("Dish removed.");
  };

  const removeWine = (wineId: string) => {
    const label = dataset.wines.find((wine) => wine.id === wineId)?.name ?? "wine";
    if (!window.confirm(`Delete ${label}?`)) {
      return;
    }

    updateDataset(
      (current) => ({
        ...current,
        wines: current.wines.filter((wine) => wine.id !== wineId),
      }),
      "v2_admin_remove_wine",
      { wine_id: wineId },
    );

    setApiSelectedWineIds((current) => current.filter((id) => id !== wineId));
    setStatusText("Wine removed.");
  };

  const runApiPairing = async () => {
    if (!selectedDish || selectedWines.length === 0) {
      setApiStatus("error");
      setApiResponse({ error: "Choose at least one dish and one wine." });
      return;
    }

    setApiStatus("loading");
    setApiResponse(null);

    trackEvent("v2_admin_run_api_pairing", {
      dish_id: selectedDish.id,
      wines_count: selectedWines.length,
    });

    try {
      const response = await fetch("/api/pairing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dish: selectedDish,
          wines: selectedWines,
        }),
      });

      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(payload.error || "API request failed");
      }

      setApiResponse(payload);
      setApiStatus("ready");
      setStatusText("API pairing completed.");
    } catch {
      setApiStatus("error");
      setApiResponse({ error: "API error. Check payload and try again." });
    }
  };

  const exportJson = () => {
    const blob = new Blob([exportDataset()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pairing-dataset-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    trackEvent("v2_admin_export_json", { dishes: dataset.dishes.length, wines: dataset.wines.length });
  };

  const importJson = () => {
    const ok = importDataset(importText);
    if (!ok) {
      setStatusText("Import failed: invalid JSON format.");
      return;
    }

    setImportText("");
    setStatusText("Dataset imported.");
    trackEvent("v2_admin_import_json", { chars: importText.length });
  };

  const resetAll = () => {
    if (!window.confirm("Reset dishes and wines to default seed data?")) {
      return;
    }

    resetDataset();
    setStatusText("Dataset reset to defaults.");
    trackEvent("v2_admin_reset_dataset", {});
  };

  return (
    <div className="mobile-safe-bottom min-h-screen overflow-x-hidden bg-background-dark text-gray-100">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <section className="glass-panel rounded-2xl p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 inline-flex rounded-full border border-primary/35 bg-primary/15 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
                New Style Admin
              </p>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">V2 Admin Studio</h1>
              <p className="mt-2 text-sm text-gray-300">
                Manage pairing API data: add/edit dishes and wines, then run live API checks.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center sm:grid-cols-3">
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-lg font-semibold text-white">{dataset.dishes.length}</p>
                <p className="text-[10px] tracking-wider text-gray-400 uppercase">Dishes</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p className="text-lg font-semibold text-white">{dataset.wines.length}</p>
                <p className="text-[10px] tracking-wider text-gray-400 uppercase">Wines</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 col-span-2 sm:col-span-1">
                <p className="text-lg font-semibold text-white">/api/pairing</p>
                <p className="text-[10px] tracking-wider text-gray-400 uppercase">Endpoint</p>
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
              Export JSON
            </button>
            <button
              type="button"
              onClick={importJson}
              className="rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-semibold text-primary"
            >
              Import JSON
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-lg border border-rose-500/30 bg-rose-900/20 px-3 py-2 text-xs font-semibold text-rose-300"
            >
              Reset to Seed
            </button>
          </div>

          <textarea
            className="mt-3 min-h-28 w-full rounded-xl border border-white/15 bg-[#190f12] px-3 py-2 text-sm text-gray-100"
            placeholder='Paste JSON like { "dishes": [...], "wines": [...] }'
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
        </section>

        <div className="sticky top-20 z-30 mt-6 flex gap-2 border-b border-white/10 bg-background-dark pb-3 xl:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("dishes")}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              mobileTab === "dishes"
                ? "bg-primary text-white"
                : "border border-white/10 bg-surface-dark text-gray-300"
            }`}
          >
            Dishes ({dataset.dishes.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("wines")}
            className={`flex-1 rounded-lg px-4 py-3 text-sm font-semibold transition ${
              mobileTab === "wines"
                ? "bg-primary text-white"
                : "border border-white/10 bg-surface-dark text-gray-300"
            }`}
          >
            Wines ({dataset.wines.length})
          </button>
        </div>

        <section className="mt-4 grid grid-cols-1 gap-6 xl:mt-6 xl:grid-cols-2">
          <article className={`min-w-0 rounded-2xl border border-white/10 bg-surface-dark/80 p-4 sm:p-5 ${mobileTab !== "dishes" ? "hidden xl:block" : ""}`}>
            <h2 className="text-xl font-semibold text-white">Dishes</h2>
            <p className="mt-1 text-xs text-gray-400">Add menu items used by pairing AI.</p>

            <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Dish name"
                value={dishForm.name}
                onChange={(event) => setDishForm({ ...dishForm, name: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  type="number"
                  min={1}
                  placeholder="Price"
                  value={dishForm.price}
                  onChange={(event) => setDishForm({ ...dishForm, price: event.target.value })}
                />
                <input
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  placeholder="Tags (comma separated)"
                  value={dishForm.tags}
                  onChange={(event) => setDishForm({ ...dishForm, tags: event.target.value })}
                />
              </div>
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Image URL"
                value={dishForm.image}
                onChange={(event) => setDishForm({ ...dishForm, image: event.target.value })}
              />
              <textarea
                className="min-h-16 rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Dish description"
                value={dishForm.description}
                onChange={(event) => setDishForm({ ...dishForm, description: event.target.value })}
              />
              <button
                type="button"
                onClick={addDish}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Add Dish
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[560px] overflow-auto pr-1">
              {dataset.dishes.map((dish) => (
                <div key={dish.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <input
                    className="mb-2 w-full min-w-0 rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={dish.name}
                    onChange={(event) => updateDish(dish.id, { name: event.target.value })}
                  />
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      type="number"
                      min={1}
                      value={dish.price}
                      onChange={(event) =>
                        updateDish(dish.id, { price: Math.max(1, Number(event.target.value) || 1) })
                      }
                    />
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      value={toTagInput(dish.tags)}
                      onChange={(event) => updateDish(dish.id, { tags: parseTags(event.target.value) })}
                    />
                  </div>
                  <input
                    className="mb-2 w-full rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={dish.image}
                    onChange={(event) => updateDish(dish.id, { image: event.target.value })}
                  />
                  <textarea
                    className="min-h-14 w-full min-w-0 rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={dish.description}
                    onChange={(event) => updateDish(dish.id, { description: event.target.value })}
                  />
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

          <article className={`min-w-0 rounded-2xl border border-white/10 bg-surface-dark/80 p-4 sm:p-5 ${mobileTab !== "wines" ? "hidden xl:block" : ""}`}>
            <h2 className="text-xl font-semibold text-white">Wines</h2>
            <p className="mt-1 text-xs text-gray-400">Manage cellar options for AI scoring.</p>

            <div className="mt-4 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Wine name"
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
                  type="number"
                  min={1900}
                  max={2100}
                  placeholder="Year"
                  value={wineForm.year}
                  onChange={(event) => setWineForm({ ...wineForm, year: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  type="number"
                  min={1}
                  placeholder="Price"
                  value={wineForm.price}
                  onChange={(event) => setWineForm({ ...wineForm, price: event.target.value })}
                />
                <input
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  type="number"
                  min={1}
                  max={5}
                  step={0.1}
                  placeholder="Rating"
                  value={wineForm.rating}
                  onChange={(event) => setWineForm({ ...wineForm, rating: event.target.value })}
                />
              </div>
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Image URL"
                value={wineForm.image}
                onChange={(event) => setWineForm({ ...wineForm, image: event.target.value })}
              />
              <input
                className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Tags (comma separated)"
                value={wineForm.tags}
                onChange={(event) => setWineForm({ ...wineForm, tags: event.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  placeholder="Grape"
                  value={wineForm.grape}
                  onChange={(event) => setWineForm({ ...wineForm, grape: event.target.value })}
                />
                <input
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  type="number"
                  step={0.1}
                  min={5}
                  max={20}
                  placeholder="ABV %"
                  value={wineForm.abv}
                  onChange={(event) => setWineForm({ ...wineForm, abv: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  value={wineForm.body}
                  onChange={(event) =>
                    setWineForm({ ...wineForm, body: event.target.value as WineBody })
                  }
                >
                  {bodyOptions.map((option) => (
                    <option key={option} value={option}>
                      Body: {option}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  value={wineForm.acidity}
                  onChange={(event) =>
                    setWineForm({ ...wineForm, acidity: event.target.value as WineAcidity })
                  }
                >
                  {acidityOptions.map((option) => (
                    <option key={option} value={option}>
                      Acidity: {option}
                    </option>
                  ))}
                </select>
                <select
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  value={wineForm.tannin}
                  onChange={(event) =>
                    setWineForm({ ...wineForm, tannin: event.target.value as WineTannin })
                  }
                >
                  {tanninOptions.map((option) => (
                    <option key={option} value={option}>
                      Tannin: {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  placeholder="Serving temp C (e.g. 8-10)"
                  value={wineForm.servingTempC}
                  onChange={(event) =>
                    setWineForm({ ...wineForm, servingTempC: event.target.value })
                  }
                />
                <input
                  className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                  placeholder="Decant notes"
                  value={wineForm.decant}
                  onChange={(event) => setWineForm({ ...wineForm, decant: event.target.value })}
                />
              </div>
              <textarea
                className="min-h-16 rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                placeholder="Wine description"
                value={wineForm.description}
                onChange={(event) => setWineForm({ ...wineForm, description: event.target.value })}
              />
              <button
                type="button"
                onClick={addWine}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
              >
                Add Wine
              </button>
            </div>

            <div className="mt-4 space-y-3 max-h-[560px] overflow-auto pr-1">
              {dataset.wines.map((wine) => (
                <div key={wine.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <input
                    className="mb-2 w-full min-w-0 rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={wine.name}
                    onChange={(event) => updateWine(wine.id, { name: event.target.value })}
                  />
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      value={wine.region}
                      onChange={(event) => updateWine(wine.id, { region: event.target.value })}
                    />
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      type="number"
                      min={1900}
                      max={2100}
                      value={wine.year}
                      onChange={(event) => updateWine(wine.id, { year: Number(event.target.value) || 2021 })}
                    />
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      type="number"
                      min={1}
                      value={wine.price}
                      onChange={(event) => updateWine(wine.id, { price: Math.max(1, Number(event.target.value) || 1) })}
                    />
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      value={wine.rating}
                      onChange={(event) =>
                        updateWine(wine.id, { rating: Math.min(5, Math.max(1, Number(event.target.value) || 4)) })
                      }
                    />
                  </div>
                  <input
                    className="mb-2 w-full min-w-0 rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={wine.image}
                    onChange={(event) => updateWine(wine.id, { image: event.target.value })}
                  />
                  <input
                    className="mb-2 w-full rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={toTagInput(wine.tags)}
                    onChange={(event) => updateWine(wine.id, { tags: parseTags(event.target.value) })}
                  />
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      value={wine.passport.grape}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          passport: { ...wine.passport, grape: event.target.value || "Blend" },
                        })
                      }
                    />
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      type="number"
                      min={5}
                      max={20}
                      step={0.1}
                      value={wine.passport.abv}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          passport: {
                            ...wine.passport,
                            abv: Math.max(5, Math.min(20, Number(event.target.value) || 13)),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="mb-2 grid grid-cols-3 gap-2">
                    <select
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      value={wine.passport.body}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          passport: { ...wine.passport, body: event.target.value as WineBody },
                        })
                      }
                    >
                      {bodyOptions.map((option) => (
                        <option key={option} value={option}>
                          Body: {option}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      value={wine.passport.acidity}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          passport: { ...wine.passport, acidity: event.target.value as WineAcidity },
                        })
                      }
                    >
                      {acidityOptions.map((option) => (
                        <option key={option} value={option}>
                          Acidity: {option}
                        </option>
                      ))}
                    </select>
                    <select
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      value={wine.passport.tannin}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          passport: { ...wine.passport, tannin: event.target.value as WineTannin },
                        })
                      }
                    >
                      {tanninOptions.map((option) => (
                        <option key={option} value={option}>
                          Tannin: {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      value={wine.passport.servingTempC}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          passport: {
                            ...wine.passport,
                            servingTempC: event.target.value || "10-14",
                          },
                        })
                      }
                    />
                    <input
                      className="rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                      value={wine.passport.decant}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          passport: { ...wine.passport, decant: event.target.value || "No decant." },
                        })
                      }
                    />
                  </div>
                  <textarea
                    className="min-h-14 w-full min-w-0 rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                    value={wine.description}
                    onChange={(event) => updateWine(wine.id, { description: event.target.value })}
                  />
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
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-surface-dark/80 p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-white">API Playground</h2>
              <p className="mt-1 text-xs text-gray-400">Run `/api/pairing` with custom payload from current dataset.</p>
            </div>
            <button
              type="button"
              onClick={runApiPairing}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              {apiStatus === "loading" ? "Running..." : "Run /api/pairing"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
            <article className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Dish</p>
              <select
                className="w-full rounded-lg border border-white/10 bg-[#1a0f12] px-3 py-2 text-sm"
                value={effectiveDishId}
                onChange={(event) => setApiDishId(event.target.value)}
              >
                {dataset.dishes.map((dish) => (
                  <option key={dish.id} value={dish.id}>
                    {dish.name}
                  </option>
                ))}
              </select>
            </article>

            <article className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Wines</p>
              <div className="max-h-44 space-y-2 overflow-auto pr-1">
                {dataset.wines.map((wine) => {
                  const checked = effectiveWineIds.includes(wine.id);
                  return (
                    <label key={wine.id} className="flex cursor-pointer items-center gap-2 text-sm text-gray-200">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          setApiSelectedWineIds((current) =>
                            checked
                              ? current.filter((id) => id !== wine.id)
                              : [...current, wine.id],
                          );
                        }}
                      />
                      <span>{wine.name}</span>
                    </label>
                  );
                })}
              </div>
            </article>

            <article className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3">
              <p className="mb-2 text-xs font-semibold tracking-wider text-gray-400 uppercase">Result</p>
              {apiResponse?.matches?.length ? (
                <div className="space-y-2">
                  {apiResponse.matches.map((item) => {
                    const wineName = dataset.wines.find((wine) => wine.id === item.wineId)?.name ?? item.wineId;
                    return (
                      <div key={item.wineId} className="rounded-lg border border-primary/20 bg-primary/10 p-2">
                        <p className="text-sm font-semibold text-white">{wineName} • {item.score}%</p>
                        <p className="text-xs text-gray-300">{item.reason}</p>
                      </div>
                    );
                  })}
                </div>
              ) : apiResponse?.error ? (
                <p className="rounded-lg border border-rose-500/30 bg-rose-900/20 p-2 text-sm text-rose-300">
                  {apiResponse.error}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Run API to see pairing response.</p>
              )}

              <pre className="mt-3 max-h-40 w-full max-w-full overflow-auto whitespace-pre-wrap break-all rounded-lg border border-white/10 bg-[#140c0f] p-2 text-xs text-gray-300">
                {JSON.stringify(
                  {
                    dish: selectedDish,
                    wines: selectedWines,
                    response: apiResponse,
                  },
                  null,
                  2,
                )}
              </pre>
            </article>
          </div>
        </section>
      </main>

      <MobileTabBar />
    </div>
  );
}
