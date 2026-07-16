"use client";

import { useLocale } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import ApiPlayground from "@/components/admin/ApiPlayground";
import AtelierHeader from "@/components/admin/AtelierHeader";
import CuratedPairingsSection from "@/components/admin/CuratedPairingsSection";
import DishesPanel from "@/components/admin/DishesPanel";
import MobileNotebookTabs from "@/components/admin/MobileNotebookTabs";
import ProductionEditorCta from "@/components/admin/ProductionEditorCta";
import WinesPanel from "@/components/admin/WinesPanel";
import {
  type AdminMobileTab, type ApiResponse, type ApiStatus,
  buildDish, buildWine, initialDishForm, initialWineForm, mirroredLocalized, setLocalized,
} from "@/components/admin/shared";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { trackEvent } from "@/lib/analytics";
import { t } from "@/lib/localized";
import { usePairingDataset } from "@/lib/pairing-store";
import type { Locale } from "@/i18n/routing";
import type { CuratedPairing, PairingDataset, PairingDish, PairingWine } from "@/types/pairing";

export default function AdminPage() {
  const { dataset, setDataset, resetDataset, exportDataset, importDataset } = usePairingDataset();
  const locale = useLocale() as Locale;

  const [dishForm, setDishForm] = useState(initialDishForm);
  const [wineForm, setWineForm] = useState(initialWineForm);
  const [pairingDishId, setPairingDishId] = useState<string>(dataset.dishes[0]?.id ?? "");
  const [apiDishId, setApiDishId] = useState<string>(dataset.dishes[0]?.id ?? "");
  const [apiSelectedWineIds, setApiSelectedWineIds] = useState<string[]>(dataset.wines.map((wine) => wine.id));
  const [apiStatus, setApiStatus] = useState<ApiStatus>("idle");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [importText, setImportText] = useState("");
  const [statusText, setStatusText] = useState("");
  const [statusKey, setStatusKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<AdminMobileTab>("dishes");

  // Auto-clear status pill after 3.5s - keeps the chrome feeling alive instead
  // of static. The keyed re-mount restarts the checkmark draw on every change.
  useEffect(() => {
    if (!statusText) return;
    const timer = window.setTimeout(() => setStatusText(""), 3500);
    return () => window.clearTimeout(timer);
  }, [statusText, statusKey]);

  const setStatus = (text: string) => {
    setStatusText(text);
    setStatusKey((k) => k + 1);
  };

  const effectiveDishId =
    apiDishId && dataset.dishes.some((dish) => dish.id === apiDishId) ? apiDishId : dataset.dishes[0]?.id ?? "";

  const effectiveWineIds = useMemo(() => {
    const validIds = new Set(dataset.wines.map((wine) => wine.id));
    const filtered = apiSelectedWineIds.filter((id) => validIds.has(id));
    return filtered.length > 0 ? filtered : dataset.wines.map((wine) => wine.id);
  }, [apiSelectedWineIds, dataset.wines]);

  const selectedDish = dataset.dishes.find((dish) => dish.id === effectiveDishId) ?? dataset.dishes[0] ?? null;

  const selectedWines = dataset.wines.filter((wine) => effectiveWineIds.includes(wine.id));

  const updateDataset = (
    updater: (current: PairingDataset) => PairingDataset,
    eventName: string, payload: Record<string, string | number>,
  ) => {
    setDataset((current) => { const next = updater(current); return next; });
    trackEvent(eventName, payload);
  };

  const addDish = () => {
    if (!dishForm.name.trim() || !dishForm.description.trim() || !dishForm.image.trim()) {
      setStatus("Fill dish name, description and image URL.");
      return;
    }
    const created = buildDish(dishForm);
    updateDataset((current) => ({ ...current, dishes: [...current.dishes, created] }), "v2_admin_add_dish", { dish_id: created.id });
    setDishForm(initialDishForm);
    setApiDishId(created.id);
    setStatus("Dish added.");
  };

  const addWine = () => {
    if (!wineForm.name.trim() || !wineForm.region.trim() || !wineForm.image.trim()) {
      setStatus("Fill wine name, region and image URL.");
      return;
    }
    const created = buildWine(wineForm);
    updateDataset((current) => ({ ...current, wines: [...current.wines, created] }), "v2_admin_add_wine", { wine_id: created.id });
    setWineForm(initialWineForm);
    setApiSelectedWineIds((current) => [...current, created.id]);
    setStatus("Wine added.");
  };

  const updateDish = (dishId: string, patch: Partial<PairingDish>) => {
    updateDataset(
      (current) => ({ ...current, dishes: current.dishes.map((dish) => (dish.id === dishId ? { ...dish, ...patch } : dish)) }),
      "v2_admin_update_dish",
      { dish_id: dishId },
    );
  };

  const updateWine = (wineId: string, patch: Partial<PairingWine>) => {
    updateDataset(
      (current) => ({ ...current, wines: current.wines.map((wine) => (wine.id === wineId ? { ...wine, ...patch } : wine)) }),
      "v2_admin_update_wine",
      { wine_id: wineId },
    );
  };

  const removeDish = (dishId: string) => {
    const label = dataset.dishes.find((dish) => dish.id === dishId)?.name ?? "dish";
    if (!window.confirm(`Delete ${t(label, locale)}?`)) return;
    updateDataset(
      (current) => ({
        ...current,
        dishes: current.dishes.filter((dish) => dish.id !== dishId),
        pairings: current.pairings.filter((pairing) => pairing.dishId !== dishId),
      }),
      "v2_admin_remove_dish",
      { dish_id: dishId },
    );
    setStatus("Dish removed.");
  };

  const removeWine = (wineId: string) => {
    const label = dataset.wines.find((wine) => wine.id === wineId)?.name ?? "wine";
    if (!window.confirm(`Delete ${t(label, locale)}?`)) return;
    updateDataset(
      (current) => ({
        ...current,
        wines: current.wines.filter((wine) => wine.id !== wineId),
        pairings: current.pairings.filter((pairing) => pairing.wineId !== wineId),
      }),
      "v2_admin_remove_wine",
      { wine_id: wineId },
    );
    setApiSelectedWineIds((current) => current.filter((id) => id !== wineId));
    setStatus("Wine removed.");
  };

  const effectivePairingDishId =
    pairingDishId && dataset.dishes.some((dish) => dish.id === pairingDishId) ? pairingDishId : dataset.dishes[0]?.id ?? "";

  const pairingsByWineId = useMemo(() => {
    const map = new Map<string, CuratedPairing>();
    for (const pairing of dataset.pairings) {
      if (pairing.dishId === effectivePairingDishId) {
        map.set(pairing.wineId, pairing);
      }
    }
    return map;
  }, [dataset.pairings, effectivePairingDishId]);

  const togglePairing = (wineId: string) => {
    if (!effectivePairingDishId) return;
    const exists = pairingsByWineId.has(wineId);
    updateDataset(
      (current) => ({
        ...current,
        pairings: exists
          ? current.pairings.filter((pairing) => !(pairing.dishId === effectivePairingDishId && pairing.wineId === wineId))
          : [...current.pairings, { dishId: effectivePairingDishId, wineId, reason: mirroredLocalized("Balanced acidity and texture for this dish.") }],
      }),
      "v2_admin_toggle_pairing",
      { dish_id: effectivePairingDishId, wine_id: wineId, selected: exists ? 0 : 1 },
    );
  };

  const updatePairingReason = (wineId: string, lang: Locale, value: string) => {
    if (!effectivePairingDishId) return;
    updateDataset(
      (current) => ({
        ...current,
        pairings: current.pairings.map((pairing) =>
          pairing.dishId === effectivePairingDishId && pairing.wineId === wineId
            ? { ...pairing, reason: setLocalized(pairing.reason, lang, value) }
            : pairing,
        ),
      }),
      "v2_admin_update_pairing_reason",
      { dish_id: effectivePairingDishId, wine_id: wineId, lang },
    );
  };

  const runApiPairing = async () => {
    if (!selectedDish || selectedWines.length === 0) {
      setApiStatus("error");
      setApiResponse({ error: "Choose at least one dish and one wine." });
      return;
    }
    setApiStatus("loading");
    setApiResponse(null);
    trackEvent("v2_admin_run_api_pairing", { dish_id: selectedDish.id, wines_count: selectedWines.length });
    try {
      const response = await fetch("/api/pairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dish: selectedDish, wines: selectedWines }),
      });
      const payload = (await response.json()) as ApiResponse;
      if (!response.ok) {
        throw new Error(payload.error || "API request failed");
      }
      setApiResponse(payload);
      setApiStatus("ready");
      setStatus("API pairing completed.");
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
      setStatus("Import failed: invalid JSON format.");
      return;
    }
    setImportText("");
    setStatus("Dataset imported.");
    trackEvent("v2_admin_import_json", { chars: importText.length });
  };

  const resetAll = () => {
    if (!window.confirm("Reset dishes and wines to default seed data?")) return;
    resetDataset();
    setStatus("Dataset reset to defaults.");
    trackEvent("v2_admin_reset_dataset", {});
  };

  return (
    <div className="mobile-safe-bottom min-h-screen overflow-x-hidden bg-background-dark text-gray-100">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <ProductionEditorCta />

        {/* ── Editorial header ────────────────────────────────────────── */}
        <AtelierHeader
          dataset={dataset} statusText={statusText} statusKey={statusKey}
          importText={importText} setImportText={setImportText}
          exportJson={exportJson} importJson={importJson} resetAll={resetAll}
        />

        {/* ── Mobile notebook tabs ────────────────────────────────────── */}
        <MobileNotebookTabs dataset={dataset} mobileTab={mobileTab} setMobileTab={setMobileTab} />

        {/* ── Twin panels: Dishes | Wines ─────────────────────────────── */}
        <section className="mt-4 grid grid-cols-1 gap-6 xl:mt-6 xl:grid-cols-2">
          <DishesPanel
            dataset={dataset} locale={locale} mobileTab={mobileTab}
            dishForm={dishForm} setDishForm={setDishForm}
            addDish={addDish} updateDish={updateDish} removeDish={removeDish}
          />
          <WinesPanel
            dataset={dataset} locale={locale} mobileTab={mobileTab}
            wineForm={wineForm} setWineForm={setWineForm}
            addWine={addWine} updateWine={updateWine} removeWine={removeWine}
          />
        </section>

        {/* ── Sommelier Notes (Curated Pairings) ──────────────────────── */}
        <CuratedPairingsSection
          dataset={dataset} locale={locale}
          effectivePairingDishId={effectivePairingDishId} setPairingDishId={setPairingDishId}
          pairingsByWineId={pairingsByWineId} togglePairing={togglePairing} updatePairingReason={updatePairingReason}
        />

        {/* ── API Playground (terminal-styled, de-emphasized) ─────────── */}
        <ApiPlayground
          dataset={dataset} locale={locale}
          effectiveDishId={effectiveDishId} setApiDishId={setApiDishId}
          effectiveWineIds={effectiveWineIds} setApiSelectedWineIds={setApiSelectedWineIds}
          apiStatus={apiStatus} apiResponse={apiResponse} runApiPairing={runApiPairing}
          selectedDish={selectedDish} selectedWines={selectedWines}
        />
      </main>

      <MobileTabBar />
    </div>
  );
}
