"use client";

import { Link } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import RestaurantContentManager from "@/components/admin/RestaurantContentManager";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { trackEvent } from "@/lib/analytics";
import { makeId } from "@/lib/format";
import { t } from "@/lib/localized";
import { usePairingDataset } from "@/lib/pairing-store";
import type { Locale } from "@/i18n/routing";
import type {
  CuratedPairing,
  LocalizedString,
  PairingDataset,
  PairingDish,
  PairingWine,
  WineAcidity,
  WineBody,
  WineTannin,
} from "@/types/pairing";

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

const ROMAN = [
  "",
  "I",
  "II",
  "III",
  "IV",
  "V",
  "VI",
  "VII",
  "VIII",
  "IX",
  "X",
  "XI",
  "XII",
  "XIII",
  "XIV",
  "XV",
  "XVI",
  "XVII",
  "XVIII",
  "XIX",
  "XX",
];
const toRoman = (n: number): string => {
  if (n <= 20) return ROMAN[n] ?? String(n);
  // simple fallback for larger lists
  const map: Array<[number, string]> = [
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let out = "";
  let v = n;
  for (const [val, sym] of map) {
    while (v >= val) {
      out += sym;
      v -= val;
    }
  }
  return out;
};

function SavedPill({ text }: { text: string }) {
  return (
    <span className="saved-pill" role="status" aria-live="polite">
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none" aria-hidden>
        <path
          d="M3 9.4L7.2 13.6L15 5.5"
          stroke="#b6e8c2"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {text}
    </span>
  );
}

function TendrilCorner({ side = "right" }: { side?: "left" | "right" }) {
  const flip = side === "left" ? " scale(-1, 1)" : "";
  return (
    <svg
      className="tendril-corner"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      style={{
        top: 12,
        [side]: 12,
        transform: `rotate(0deg)${flip}`,
      } as React.CSSProperties}
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M10 60 C 30 30, 60 30, 80 50 S 110 80, 100 110" />
        <path d="M40 38 C 35 30, 28 28, 22 32" />
        <path d="M65 36 C 65 28, 70 22, 78 22" />
        <path d="M88 56 C 95 52, 102 54, 106 60" />
        <ellipse cx="22" cy="32" rx="3.5" ry="1.4" transform="rotate(-30 22 32)" />
        <ellipse cx="78" cy="22" rx="3.5" ry="1.4" transform="rotate(35 78 22)" />
        <ellipse cx="106" cy="60" rx="3.5" ry="1.4" transform="rotate(70 106 60)" />
      </g>
    </svg>
  );
}

export default function AdminPage() {
  const { dataset, setDataset, resetDataset, exportDataset, importDataset } = usePairingDataset();
  const locale = useLocale() as Locale;
  const tx = useTranslations("admin");

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

  const [pairingDishId, setPairingDishId] = useState<string>(dataset.dishes[0]?.id ?? "");
  const [apiDishId, setApiDishId] = useState<string>(dataset.dishes[0]?.id ?? "");
  const [apiSelectedWineIds, setApiSelectedWineIds] = useState<string[]>(
    dataset.wines.map((wine) => wine.id),
  );
  const [apiStatus, setApiStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [apiResponse, setApiResponse] = useState<ApiResponse | null>(null);
  const [importText, setImportText] = useState("");
  const [statusText, setStatusText] = useState("");
  const [statusKey, setStatusKey] = useState(0);
  const [mobileTab, setMobileTab] = useState<"dishes" | "wines">("dishes");

  // Auto-clear status pill after 3.5s — keeps the chrome feeling alive instead
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
      setStatus("Fill dish name, description and image URL.");
      return;
    }

    const created: PairingDish = {
      id: makeId("dish"),
      name: mirroredLocalized(dishForm.name.trim()),
      price: Math.max(1, Number(dishForm.price) || 1),
      description: mirroredLocalized(dishForm.description.trim()),
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
    setStatus("Dish added.");
  };

  const addWine = () => {
    if (!wineForm.name.trim() || !wineForm.region.trim() || !wineForm.image.trim()) {
      setStatus("Fill wine name, region and image URL.");
      return;
    }

    const created: PairingWine = {
      id: makeId("wine"),
      name: mirroredLocalized(wineForm.name.trim()),
      region: wineForm.region.trim(),
      year: Math.max(1900, Number(wineForm.year) || 2021),
      price: Math.max(1, Number(wineForm.price) || 1),
      rating: Math.min(5, Math.max(1, Number(wineForm.rating) || 4)),
      description: mirroredLocalized(
        wineForm.description.trim() || "Pairing-friendly wine profile.",
      ),
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
    setStatus("Wine added.");
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
    if (!window.confirm(`Delete ${t(label, locale)}?`)) {
      return;
    }

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
    if (!window.confirm(`Delete ${t(label, locale)}?`)) {
      return;
    }

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
    pairingDishId && dataset.dishes.some((dish) => dish.id === pairingDishId)
      ? pairingDishId
      : dataset.dishes[0]?.id ?? "";

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
    if (!effectivePairingDishId) {
      return;
    }

    const exists = pairingsByWineId.has(wineId);

    updateDataset(
      (current) => ({
        ...current,
        pairings: exists
          ? current.pairings.filter(
              (pairing) =>
                !(pairing.dishId === effectivePairingDishId && pairing.wineId === wineId),
            )
          : [
              ...current.pairings,
              {
                dishId: effectivePairingDishId,
                wineId,
                reason: mirroredLocalized("Balanced acidity and texture for this dish."),
              },
            ],
      }),
      "v2_admin_toggle_pairing",
      { dish_id: effectivePairingDishId, wine_id: wineId, selected: exists ? 0 : 1 },
    );
  };

  const updatePairingReason = (wineId: string, lang: Locale, value: string) => {
    if (!effectivePairingDishId) {
      return;
    }

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
    if (!window.confirm("Reset dishes and wines to default seed data?")) {
      return;
    }

    resetDataset();
    setStatus("Dataset reset to defaults.");
    trackEvent("v2_admin_reset_dataset", {});
  };

  return (
    <div className="mobile-safe-bottom min-h-screen overflow-x-hidden bg-background-dark text-gray-100">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <RestaurantContentManager />

        {/* ── Editorial header ────────────────────────────────────────── */}
        <section
          className="editorial-frame pitch-grain relative mt-6 overflow-hidden rounded-2xl border border-[rgba(197,160,89,0.18)] bg-[#150a0c]/85 p-6 sm:p-8"
        >
          <TendrilCorner side="right" />

          <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <p className="pitch-eyebrow">Sandbox · Library</p>
              <h1 className="pitch-display mt-3 text-4xl text-white sm:text-5xl">
                Sommelier&rsquo;s <em className="italic text-[var(--color-accent-gold)]">Atelier</em>
              </h1>
              <div className="pitch-rule pitch-rule--short mt-4" />
              <p className="mt-4 max-w-xl font-serif text-base italic leading-relaxed text-[#e6dccd]">
                Globalna pracownia łączeń — dodawaj dania i wina, kuruj rekomendacje,
                testuj odpowiedzi modelu API. Edycja konkretnej restauracji w bazie produkcyjnej:
              </p>
              <Link
                href="/admin/restaurants"
                className="pitch-cta-ghost mt-5 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
              >
                Per-restaurant editor &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-[rgba(197,160,89,0.22)] bg-[#1a0f12]/70 px-4 py-3">
                <p className="font-serif text-2xl italic text-[var(--color-accent-gold)]">
                  {dataset.dishes.length}
                </p>
                <p className="mt-1 text-[10px] tracking-[0.2em] text-gray-400 uppercase">Dishes</p>
              </div>
              <div className="rounded-xl border border-[rgba(197,160,89,0.22)] bg-[#1a0f12]/70 px-4 py-3">
                <p className="font-serif text-2xl italic text-[var(--color-accent-gold)]">
                  {dataset.wines.length}
                </p>
                <p className="mt-1 text-[10px] tracking-[0.2em] text-gray-400 uppercase">Wines</p>
              </div>
              <div className="rounded-xl border border-[rgba(197,160,89,0.22)] bg-[#1a0f12]/70 px-4 py-3">
                <p className="font-serif text-2xl italic text-[var(--color-accent-gold)]">
                  {dataset.pairings.length}
                </p>
                <p className="mt-1 text-[10px] tracking-[0.2em] text-gray-400 uppercase">Pairings</p>
              </div>
            </div>
          </div>

          {/* Toolbar — cream pill row */}
          <div className="relative z-10 mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={exportJson}
              className="rounded-full border border-[rgba(197,160,89,0.35)] bg-[#1a0f12] px-4 py-2 text-xs font-semibold tracking-wider text-[#f4ede0] uppercase transition hover:bg-[#1f1316]"
            >
              Export JSON
            </button>
            <button
              type="button"
              onClick={importJson}
              className="rounded-full border border-[rgba(197,160,89,0.55)] bg-[var(--color-accent-gold)]/15 px-4 py-2 text-xs font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:bg-[var(--color-accent-gold)]/25"
            >
              Import JSON
            </button>
            <button
              type="button"
              onClick={resetAll}
              className="rounded-full border border-rose-500/30 bg-rose-900/20 px-4 py-2 text-xs font-semibold tracking-wider text-rose-300 uppercase transition hover:bg-rose-900/30"
            >
              Reset to Seed
            </button>

            {statusText ? (
              <span key={statusKey} className="ml-auto">
                <SavedPill text={statusText} />
              </span>
            ) : null}
          </div>

          <textarea
            className="field-refined relative z-10 mt-4 min-h-28 w-full"
            placeholder='Paste JSON like { "dishes": [...], "wines": [...] }'
            value={importText}
            onChange={(event) => setImportText(event.target.value)}
          />
        </section>

        {/* ── Mobile notebook tabs ────────────────────────────────────── */}
        <div className="notebook-tabs sticky top-20 z-30 mt-6 flex gap-0 bg-background-dark pb-3 xl:hidden">
          <button
            type="button"
            onClick={() => setMobileTab("dishes")}
            className={`notebook-tab flex-1 ${mobileTab === "dishes" ? "notebook-tab--active" : ""}`}
          >
            Dishes ({dataset.dishes.length})
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("wines")}
            className={`notebook-tab flex-1 ${mobileTab === "wines" ? "notebook-tab--active" : ""}`}
          >
            Wines ({dataset.wines.length})
          </button>
        </div>

        {/* ── Twin panels: Dishes | Wines ─────────────────────────────── */}
        <section className="mt-4 grid grid-cols-1 gap-6 xl:mt-6 xl:grid-cols-2">
          {/* ───────── Dishes panel ───────── */}
          <article
            className={`surface-parchment editorial-frame relative min-w-0 rounded-2xl p-5 sm:p-6 ${
              mobileTab !== "dishes" ? "hidden xl:block" : ""
            }`}
          >
            <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-[rgba(197,160,89,0.18)] pb-3">
              <div>
                <p className="pitch-eyebrow">Tasting Log · I</p>
                <h2 className="pitch-display mt-1 text-2xl text-white">Dishes</h2>
              </div>
              <p className="font-serif text-xs italic text-[#c5a059]/80">
                {dataset.dishes.length} entries
              </p>
            </header>

            {/* New entry */}
            <div className="rounded-xl border border-[rgba(197,160,89,0.20)] bg-[#1a0f12]/55 p-4">
              <p className="font-serif text-xs italic tracking-wider text-[var(--color-accent-gold)] uppercase">
                ❦ New entry
              </p>
              <div className="mt-3 grid gap-3">
                <div>
                  <label className="field-label">Name</label>
                  <input
                    className="field-refined w-full"
                    placeholder="Dish name" aria-label="Dish name"
                    value={dishForm.name}
                    onChange={(event) => setDishForm({ ...dishForm, name: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Price</label>
                    <input
                      className="field-refined w-full"
                      type="number"
                      min={1}
                      placeholder="Price" aria-label="Price"
                      value={dishForm.price}
                      onChange={(event) => setDishForm({ ...dishForm, price: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label">Tags</label>
                    <input
                      className="field-refined w-full"
                      placeholder="Tags (comma separated)" aria-label="Tags (comma separated)"
                      value={dishForm.tags}
                      onChange={(event) => setDishForm({ ...dishForm, tags: event.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Image URL</label>
                  <input
                    className="field-refined w-full"
                    placeholder="Image URL" aria-label="Image URL"
                    value={dishForm.image}
                    onChange={(event) => setDishForm({ ...dishForm, image: event.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Description</label>
                  <textarea
                    className="field-refined min-h-16 w-full"
                    placeholder="Dish description" aria-label="Dish description"
                    value={dishForm.description}
                    onChange={(event) => setDishForm({ ...dishForm, description: event.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={addDish}
                  className="pitch-cta-primary mt-1 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
                >
                  + Add Dish
                </button>
              </div>
            </div>

            {/* Existing entries */}
            <div className="mt-5 space-y-4 max-h-[640px] overflow-auto pr-1">
              {dataset.dishes.map((dish, idx) => (
                <div
                  key={dish.id}
                  className="rounded-xl border border-[rgba(197,160,89,0.14)] bg-[#1a0f12]/40 p-4 transition hover:border-[rgba(197,160,89,0.30)]"
                >
                  <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-[rgba(197,160,89,0.12)] pb-2">
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-sm italic text-[var(--color-accent-gold)]">
                        {toRoman(idx + 1)}.
                      </span>
                      <span className="font-serif text-base italic text-[#f4ede0]">
                        {t(dish.name, locale) || "Untitled"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDish(dish.id)}
                      className="rounded-full border border-rose-500/30 bg-rose-900/15 px-3 py-1 text-[10px] font-semibold tracking-wider text-rose-300 uppercase transition hover:bg-rose-900/30"
                    >
                      Delete
                    </button>
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="field-refined w-full"
                      placeholder="EN name" aria-label="EN name"
                      value={dish.name.en}
                      onChange={(event) =>
                        updateDish(dish.id, { name: setLocalized(dish.name, "en", event.target.value) })
                      }
                    />
                    <input
                      className="field-refined w-full"
                      placeholder="PL nazwa" aria-label="PL nazwa"
                      value={dish.name.pl}
                      onChange={(event) =>
                        updateDish(dish.id, { name: setLocalized(dish.name, "pl", event.target.value) })
                      }
                    />
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="field-refined w-full"
                      type="number"
                      min={1}
                      value={dish.price}
                      onChange={(event) =>
                        updateDish(dish.id, { price: Math.max(1, Number(event.target.value) || 1) })
                      }
                    />
                    <input
                      className="field-refined w-full"
                      value={toTagInput(dish.tags)}
                      onChange={(event) => updateDish(dish.id, { tags: parseTags(event.target.value) })}
                    />
                  </div>
                  <input
                    className="field-refined mb-2 w-full"
                    value={dish.image}
                    onChange={(event) => updateDish(dish.id, { image: event.target.value })}
                  />
                  <div className="mb-1 grid gap-2 sm:grid-cols-2">
                    <textarea
                      className="field-refined min-h-14 w-full min-w-0"
                      placeholder="EN description" aria-label="EN description"
                      value={dish.description.en}
                      onChange={(event) =>
                        updateDish(dish.id, {
                          description: setLocalized(dish.description, "en", event.target.value),
                        })
                      }
                    />
                    <textarea
                      className="field-refined min-h-14 w-full min-w-0"
                      placeholder="PL opis" aria-label="PL opis"
                      value={dish.description.pl}
                      onChange={(event) =>
                        updateDish(dish.id, {
                          description: setLocalized(dish.description, "pl", event.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          {/* ───────── Wines panel ───────── */}
          <article
            className={`surface-parchment editorial-frame relative min-w-0 rounded-2xl p-5 sm:p-6 ${
              mobileTab !== "wines" ? "hidden xl:block" : ""
            }`}
          >
            <header className="mb-4 flex items-baseline justify-between gap-3 border-b border-[rgba(197,160,89,0.18)] pb-3">
              <div>
                <p className="pitch-eyebrow">Cellar Log · II</p>
                <h2 className="pitch-display mt-1 text-2xl text-white">Wines</h2>
              </div>
              <p className="font-serif text-xs italic text-[#c5a059]/80">
                {dataset.wines.length} entries
              </p>
            </header>

            {/* New entry */}
            <div className="rounded-xl border border-[rgba(197,160,89,0.20)] bg-[#1a0f12]/55 p-4">
              <p className="font-serif text-xs italic tracking-wider text-[var(--color-accent-gold)] uppercase">
                ❦ New entry
              </p>
              <div className="mt-3 grid gap-3">
                <div>
                  <label className="field-label">Name</label>
                  <input
                    className="field-refined w-full"
                    placeholder="Wine name" aria-label="Wine name"
                    value={wineForm.name}
                    onChange={(event) => setWineForm({ ...wineForm, name: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Region</label>
                    <input
                      className="field-refined w-full"
                      placeholder="Region" aria-label="Region"
                      value={wineForm.region}
                      onChange={(event) => setWineForm({ ...wineForm, region: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label">Year</label>
                    <input
                      className="field-refined w-full"
                      type="number"
                      min={1900}
                      max={2100}
                      placeholder="Year" aria-label="Year"
                      value={wineForm.year}
                      onChange={(event) => setWineForm({ ...wineForm, year: event.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Price</label>
                    <input
                      className="field-refined w-full"
                      type="number"
                      min={1}
                      placeholder="Price" aria-label="Price"
                      value={wineForm.price}
                      onChange={(event) => setWineForm({ ...wineForm, price: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label">Rating</label>
                    <input
                      className="field-refined w-full"
                      type="number"
                      min={1}
                      max={5}
                      step={0.1}
                      placeholder="Rating" aria-label="Rating"
                      value={wineForm.rating}
                      onChange={(event) => setWineForm({ ...wineForm, rating: event.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Image URL</label>
                  <input
                    className="field-refined w-full"
                    placeholder="Image URL" aria-label="Image URL"
                    value={wineForm.image}
                    onChange={(event) => setWineForm({ ...wineForm, image: event.target.value })}
                  />
                </div>
                <div>
                  <label className="field-label">Tags</label>
                  <input
                    className="field-refined w-full"
                    placeholder="Tags (comma separated)" aria-label="Tags (comma separated)"
                    value={wineForm.tags}
                    onChange={(event) => setWineForm({ ...wineForm, tags: event.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Grape</label>
                    <input
                      className="field-refined w-full"
                      placeholder="Grape" aria-label="Grape"
                      value={wineForm.grape}
                      onChange={(event) => setWineForm({ ...wineForm, grape: event.target.value })}
                    />
                  </div>
                  <div>
                    <label className="field-label">ABV %</label>
                    <input
                      className="field-refined w-full"
                      type="number"
                      step={0.1}
                      min={5}
                      max={20}
                      placeholder="ABV %" aria-label="ABV %"
                      value={wineForm.abv}
                      onChange={(event) => setWineForm({ ...wineForm, abv: event.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="field-label">Body</label>
                    <select
                      className="field-refined w-full"
                      value={wineForm.body}
                      onChange={(event) =>
                        setWineForm({ ...wineForm, body: event.target.value as WineBody })
                      }
                    >
                      {bodyOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Acidity</label>
                    <select
                      className="field-refined w-full"
                      value={wineForm.acidity}
                      onChange={(event) =>
                        setWineForm({ ...wineForm, acidity: event.target.value as WineAcidity })
                      }
                    >
                      {acidityOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Tannin</label>
                    <select
                      className="field-refined w-full"
                      value={wineForm.tannin}
                      onChange={(event) =>
                        setWineForm({ ...wineForm, tannin: event.target.value as WineTannin })
                      }
                    >
                      {tanninOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label">Serving °C</label>
                    <input
                      className="field-refined w-full"
                      placeholder="Serving temp C (e.g. 8-10)" aria-label="Serving temp C (e.g. 8-10)"
                      value={wineForm.servingTempC}
                      onChange={(event) =>
                        setWineForm({ ...wineForm, servingTempC: event.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">Decant</label>
                    <input
                      className="field-refined w-full"
                      placeholder="Decant notes" aria-label="Decant notes"
                      value={wineForm.decant}
                      onChange={(event) => setWineForm({ ...wineForm, decant: event.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label">Description</label>
                  <textarea
                    className="field-refined min-h-16 w-full"
                    placeholder="Wine description" aria-label="Wine description"
                    value={wineForm.description}
                    onChange={(event) => setWineForm({ ...wineForm, description: event.target.value })}
                  />
                </div>
                <button
                  type="button"
                  onClick={addWine}
                  className="pitch-cta-primary mt-1 inline-flex items-center justify-center rounded-full px-5 py-2.5 text-xs font-semibold tracking-wider uppercase"
                >
                  + Add Wine
                </button>
              </div>
            </div>

            {/* Existing entries */}
            <div className="mt-5 space-y-4 max-h-[640px] overflow-auto pr-1">
              {dataset.wines.map((wine, idx) => (
                <div
                  key={wine.id}
                  className="rounded-xl border border-[rgba(197,160,89,0.14)] bg-[#1a0f12]/40 p-4 transition hover:border-[rgba(197,160,89,0.30)]"
                >
                  <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-[rgba(197,160,89,0.12)] pb-2">
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-sm italic text-[var(--color-accent-gold)]">
                        {toRoman(idx + 1)}.
                      </span>
                      <span className="font-serif text-base italic text-[#f4ede0]">
                        {t(wine.name, locale) || "Untitled"}
                      </span>
                      <span className="font-serif text-[10px] italic tracking-wider text-[#c5a059]/70 uppercase">
                        {wine.region} · {wine.year}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWine(wine.id)}
                      className="rounded-full border border-rose-500/30 bg-rose-900/15 px-3 py-1 text-[10px] font-semibold tracking-wider text-rose-300 uppercase transition hover:bg-rose-900/30"
                    >
                      Delete
                    </button>
                  </div>

                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="field-refined w-full"
                      placeholder="EN name" aria-label="EN name"
                      value={wine.name.en}
                      onChange={(event) =>
                        updateWine(wine.id, { name: setLocalized(wine.name, "en", event.target.value) })
                      }
                    />
                    <input
                      className="field-refined w-full"
                      placeholder="PL nazwa" aria-label="PL nazwa"
                      value={wine.name.pl}
                      onChange={(event) =>
                        updateWine(wine.id, { name: setLocalized(wine.name, "pl", event.target.value) })
                      }
                    />
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="field-refined w-full"
                      value={wine.region}
                      onChange={(event) => updateWine(wine.id, { region: event.target.value })}
                    />
                    <input
                      className="field-refined w-full"
                      type="number"
                      min={1900}
                      max={2100}
                      value={wine.year}
                      onChange={(event) => updateWine(wine.id, { year: Number(event.target.value) || 2021 })}
                    />
                  </div>
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="field-refined w-full"
                      type="number"
                      min={1}
                      value={wine.price}
                      onChange={(event) => updateWine(wine.id, { price: Math.max(1, Number(event.target.value) || 1) })}
                    />
                    <input
                      className="field-refined w-full"
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
                    className="field-refined mb-2 w-full min-w-0"
                    value={wine.image}
                    onChange={(event) => updateWine(wine.id, { image: event.target.value })}
                  />
                  <input
                    className="field-refined mb-2 w-full"
                    value={toTagInput(wine.tags)}
                    onChange={(event) => updateWine(wine.id, { tags: parseTags(event.target.value) })}
                  />
                  <div className="mb-2 grid grid-cols-2 gap-2">
                    <input
                      className="field-refined w-full"
                      value={wine.passport.grape}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          passport: { ...wine.passport, grape: event.target.value || "Blend" },
                        })
                      }
                    />
                    <input
                      className="field-refined w-full"
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
                      className="field-refined w-full"
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
                      className="field-refined w-full"
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
                      className="field-refined w-full"
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
                      className="field-refined w-full"
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
                      className="field-refined w-full"
                      value={wine.passport.decant}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          passport: { ...wine.passport, decant: event.target.value || "No decant." },
                        })
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <textarea
                      className="field-refined min-h-14 w-full min-w-0"
                      placeholder="EN description" aria-label="EN description"
                      value={wine.description.en}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          description: setLocalized(wine.description, "en", event.target.value),
                        })
                      }
                    />
                    <textarea
                      className="field-refined min-h-14 w-full min-w-0"
                      placeholder="PL opis" aria-label="PL opis"
                      value={wine.description.pl}
                      onChange={(event) =>
                        updateWine(wine.id, {
                          description: setLocalized(wine.description, "pl", event.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        {/* ── Sommelier Notes (Curated Pairings) ──────────────────────── */}
        <section className="surface-parchment editorial-frame relative mt-6 overflow-hidden rounded-2xl p-5 sm:p-7">
          <TendrilCorner side="left" />
          <header className="relative z-10 mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[rgba(197,160,89,0.18)] pb-3">
            <div>
              <p className="pitch-eyebrow">Sommelier&rsquo;s Notes · III</p>
              <h2 className="pitch-display mt-1 text-3xl text-white">{tx("curatedPairings.title")}</h2>
              <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6dccd]/85">
                {tx("curatedPairings.subtitle")}
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <span className="field-label">Dish</span>
              <select
                className="field-refined min-w-[14rem]"
                value={effectivePairingDishId}
                onChange={(event) => setPairingDishId(event.target.value)}
              >
                {dataset.dishes.map((dish) => (
                  <option key={dish.id} value={dish.id}>
                    {t(dish.name, locale)}
                  </option>
                ))}
              </select>
            </div>
          </header>

          {dataset.dishes.length === 0 ? (
            <p className="rounded-xl border border-[rgba(197,160,89,0.18)] bg-[#1a0f12]/55 p-3 text-sm italic text-[#e6dccd]">
              {tx("curatedPairings.noDishes")}
            </p>
          ) : (
            <div className="relative z-10 grid gap-3 md:grid-cols-2">
              {dataset.wines.map((wine) => {
                const curated = pairingsByWineId.get(wine.id);
                const selected = Boolean(curated);
                return (
                  <div
                    key={wine.id}
                    className={`rounded-xl border p-3 transition ${
                      selected
                        ? "border-[rgba(197,160,89,0.55)] bg-[var(--color-accent-gold)]/10"
                        : "border-[rgba(197,160,89,0.16)] bg-[#1a0f12]/40 hover:border-[rgba(197,160,89,0.30)]"
                    }`}
                  >
                    <label className="flex cursor-pointer items-center gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => togglePairing(wine.id)}
                        className="h-4 w-4 cursor-pointer accent-[var(--color-accent-gold)]"
                      />
                      <span
                        className={`font-serif italic ${
                          selected ? "text-[#f4ede0]" : "text-[#e6dccd]/85"
                        }`}
                      >
                        {t(wine.name, locale)}
                      </span>
                      <span className="ml-auto font-serif text-[10px] italic tracking-[0.18em] text-[#c5a059]/70 uppercase">
                        {wine.region}
                      </span>
                    </label>
                    {selected && curated ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        <textarea
                          className="field-refined min-h-20 w-full"
                          placeholder={tx("curatedPairings.reasonEnPlaceholder")}
                          value={curated.reason.en}
                          onChange={(event) =>
                            updatePairingReason(wine.id, "en", event.target.value)
                          }
                        />
                        <textarea
                          className="field-refined min-h-20 w-full"
                          placeholder={tx("curatedPairings.reasonPlPlaceholder")}
                          value={curated.reason.pl}
                          onChange={(event) =>
                            updatePairingReason(wine.id, "pl", event.target.value)
                          }
                        />
                      </div>
                    ) : (
                      <p className="mt-2 font-serif text-xs italic text-[#c5a059]/60">
                        {tx("curatedPairings.notCurated")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── API Playground (terminal-styled, de-emphasized) ─────────── */}
        <section className="mt-8 rounded-2xl border border-[rgba(197,160,89,0.14)] bg-[#0a0506] p-5 sm:p-6">
          <header className="mb-4 flex flex-wrap items-end justify-between gap-3 border-b border-[rgba(197,160,89,0.14)] pb-3">
            <div>
              <p className="pitch-eyebrow">Workshop · IV</p>
              <h2 className="font-mono text-base text-[var(--color-accent-gold)]">
                <span className="text-gray-500">$</span> /api/pairing
              </h2>
              <p className="mt-1 font-mono text-[11px] text-gray-500">
                Run live pairing API with current dataset payload.
              </p>
            </div>
            <button
              type="button"
              onClick={runApiPairing}
              className="rounded-md border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 px-4 py-2 font-mono text-xs font-semibold text-[var(--color-accent-gold)] transition hover:bg-[var(--color-accent-gold)]/20"
            >
              {apiStatus === "loading" ? "▸ running…" : "▸ execute"}
            </button>
          </header>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]">
            <article className="terminal-block min-w-0">
              <p className="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
                <span className="prompt">›</span> dish
              </p>
              <select
                className="mt-2 w-full rounded border border-[rgba(197,160,89,0.18)] bg-[#0d0809] px-3 py-2 font-mono text-xs text-[#d4cabc]"
                value={effectiveDishId}
                onChange={(event) => setApiDishId(event.target.value)}
              >
                {dataset.dishes.map((dish) => (
                  <option key={dish.id} value={dish.id}>
                    {t(dish.name, locale)}
                  </option>
                ))}
              </select>
            </article>

            <article className="terminal-block min-w-0">
              <p className="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
                <span className="prompt">›</span> wines[ ]
              </p>
              <div className="mt-2 max-h-44 space-y-1.5 overflow-auto pr-1">
                {dataset.wines.map((wine) => {
                  const checked = effectiveWineIds.includes(wine.id);
                  return (
                    <label
                      key={wine.id}
                      className="flex cursor-pointer items-center gap-2 font-mono text-xs text-[#d4cabc]"
                    >
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
                        className="accent-[var(--color-accent-gold)]"
                      />
                      <span>{t(wine.name, locale)}</span>
                    </label>
                  );
                })}
              </div>
            </article>

            <article className="terminal-block min-w-0">
              <p className="font-mono text-[10px] tracking-wider text-gray-500 uppercase">
                <span className="prompt">›</span> response
              </p>
              <div className="mt-2 space-y-2">
                {apiResponse?.matches?.length ? (
                  apiResponse.matches.map((item) => {
                    const wineMatch = dataset.wines.find((wine) => wine.id === item.wineId);
                    const wineName = wineMatch ? t(wineMatch.name, locale) : item.wineId;
                    return (
                      <div
                        key={item.wineId}
                        className="rounded border border-[var(--color-accent-gold)]/25 bg-[var(--color-accent-gold)]/5 p-2"
                      >
                        <p className="font-mono text-xs text-[#f4ede0]">
                          <span className="num">{item.score}%</span>{" "}
                          <span className="str">{wineName}</span>
                        </p>
                        <p className="mt-1 font-mono text-[11px] text-gray-400">{item.reason}</p>
                      </div>
                    );
                  })
                ) : apiResponse?.error ? (
                  <p className="rounded border border-rose-500/30 bg-rose-900/10 p-2 font-mono text-xs text-rose-300">
                    ✗ {apiResponse.error}
                  </p>
                ) : (
                  <p className="font-mono text-xs text-gray-500">
                    {apiStatus === "loading" ? "// awaiting response…" : "// idle"}
                  </p>
                )}
              </div>

              <pre className="mt-3 max-h-40 w-full max-w-full overflow-auto whitespace-pre-wrap break-all rounded border border-[rgba(197,160,89,0.10)] bg-[#0d0809] p-2 font-mono text-[10px] text-gray-500">
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
