"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";

// Page-aware sommelier chat - docked as a collapsed FAB on /pairing so it
// never covers the wine ranking; the user expands it to converse about
// whatever dish/wine they're inspecting. The pageContext prop tells the
// bot what's on screen.
const FloatingTasteChat = dynamic(() => import("@/components/winocompas/FloatingTasteChat"), {
  ssr: false,
});
import { trackEvent } from "@/lib/analytics";
import { GENERIC_BLUR_DATA_URL } from "@/lib/image-helpers";
import { t, localizeDecant } from "@/lib/localized";
import {
  applyRestaurantPairingOverrides,
  buildPairingDatasetFromRestaurant,
  getRestaurantMatchForDishWine,
} from "@/lib/restaurant-pairing-adapter";
import { usePairingDataset } from "@/lib/pairing-store";
import useSWR from "swr";
import { swrFetcher } from "@/lib/api-client";
import Icon from "@/components/v2/Icon";
import type { CatalogRestaurant } from "@/lib/restaurant-directory";
import type { Locale } from "@/i18n/routing";
import type { PairingDish, PairingWine } from "@/types/pairing";

type MatchDetails = {
  score: number;
  reason: string;
};

// Dish/wine tags are raw English vocabulary (wine.style, dish.category,
// restaurant.cuisine and the sandbox seed tags) rendered straight onto the
// cards — WHITE/CITRUS/TAPAS read as untranslated debris in the PL locale
// (audit 2026-07 P2). Render-time dictionary; unknown DB-authored tags fall
// back to the raw value rather than hiding the chip.
const TAG_PL: Record<string, string> = {
  // wine styles + adapter-derived aroma tags
  white: "białe",
  red: "czerwone",
  rose: "różowe",
  "rosé": "różowe",
  sparkling: "musujące",
  citrus: "cytrusowe",
  mineral: "mineralne",
  "red fruit": "czerwone owoce",
  dry: "wytrawne",
  "high acid": "wysoka kwasowość",
  tannic: "taniczne",
  bold: "wyraziste",
  classic: "klasyczne",
  delicate: "delikatne",
  rich: "treściwe",
  savory: "wytrawne",
  peppery: "pieprzne",
  // dish categories (sandbox seed + restaurant adapter)
  starter: "przystawka",
  main: "danie główne",
  salad: "sałatka",
  soup: "zupa",
  grill: "z grilla",
  fried: "smażone",
  cold: "na zimno",
  game: "dziczyzna",
  raw: "na surowo",
  garlic: "czosnek",
  seafood: "owoce morza",
  pasta: "makaron",
  rice: "ryż",
  vegetarian: "wegetariańskie",
  // cuisines (restaurant adapter appends restaurant.cuisine to dish tags)
  spanish: "kuchnia hiszpańska",
  japanese: "kuchnia japońska",
  "french classic": "kuchnia francuska",
  "polish modern": "polska nowoczesna",
  "peruvian nikkei": "peruwiańska nikkei",
};

const localizeTag = (tag: string, locale: Locale, kind: "dish" | "wine" = "dish") => {
  if (locale !== "pl") return tag;
  const key = tag.trim().toLowerCase();
  // "Dessert" is both a wine style and a dish category — different PL words.
  if (key === "dessert") return kind === "wine" ? "deserowe" : "deser";
  return TAG_PL[key] ?? tag;
};

const buildFallbackMatchMap = (dish: PairingDish, wines: PairingWine[], locale: Locale) => {
  const dishText = [t(dish.name, "en"), t(dish.description, "en"), dish.tags.join(" ")]
    .join(" ")
    .toLowerCase();

  const scored = wines
    .map((wine) => {
      const wineText = [t(wine.name, "en"), t(wine.description, "en"), wine.tags.join(" ")]
        .join(" ")
        .toLowerCase();

      let score = 58;
      if (dishText.includes("duck") && wineText.includes("riesling")) {
        score += 26;
      }
      if (dishText.includes("duck") && wineText.includes("pinot")) {
        score += 18;
      }
      if ((dishText.includes("delicate") || dishText.includes("scallop")) && wineText.includes("tannic")) {
        score -= 16;
      }
      if (dishText.includes("garlic") && wineText.includes("acid")) {
        score += 14;
      }

      return {
        wineId: wine.id,
        score: Math.max(35, Math.min(98, Math.round(score))),
      };
    })
    .sort((a, b) => b.score - a.score);

  const map = new Map<string, MatchDetails>();
  const reasonHigh = locale === "pl"
    ? "Struktura i kwasowość dobrze pasują do profilu dania."
    : "Structure and acidity align well with the dish profile.";
  const reasonOk = locale === "pl"
    ? "Akceptowalne połączenie, ale mniej zbalansowane niż najlepsze dopasowania."
    : "Acceptable pairing, but may be less balanced than top matches.";
  for (const item of scored) {
    map.set(item.wineId, {
      score: item.score,
      reason: item.score >= 85 ? reasonHigh : reasonOk,
    });
  }

  return map;
};

export default function PairingClient({
  initialRestaurantSlug = null,
}: {
  /** `?restaurant=` slug, read server-side by page.tsx. Prop (not a
   *  post-mount window.location read) so the scoped view renders with the
   *  right dataset from the very first client render. */
  initialRestaurantSlug?: string | null;
}) {
  const { dataset } = usePairingDataset();
  const locale = useLocale() as Locale;
  const tx = useTranslations("pairing");
  // Derived straight from the server-resolved prop — no post-mount URL read,
  // no sandbox-dataset flash while the slug "loads".
  const restaurantContextSlug = initialRestaurantSlug;
  // Restaurant-scoped context now reads the DB→seed read-path via the API
  // (was the localStorage catalog). Global sandbox mode still uses
  // usePairingDataset. SWR resolves async; until then context is null and
  // the page shows the sandbox dataset, then swaps in the scoped one.
  const { data: ctxResp } = useSWR<{ data: CatalogRestaurant | null }>(
    restaurantContextSlug ? `/api/restaurants/${restaurantContextSlug}` : null,
    swrFetcher,
  );
  const restaurantContext = ctxResp?.data ?? null;
  // While the scoped restaurant is still loading, render an EMPTY dataset —
  // never the localStorage sandbox. The sandbox flash showed a stranger's
  // wines for ~300ms and fired their (remote) images + a throwaway /api/pairing
  // call on every scoped visit (audit 2026-07).
  const scopedLoading = Boolean(restaurantContextSlug) && !restaurantContext;
  const activeDataset = useMemo(
    () =>
      restaurantContext
        ? buildPairingDatasetFromRestaurant(restaurantContext)
        : scopedLoading
          ? { dishes: [], wines: [], pairings: [] }
          : dataset,
    [dataset, restaurantContext, scopedLoading],
  );
  const dishes = activeDataset.dishes;
  const wines = activeDataset.wines;
  const curatedPairings = useMemo(
    () => (restaurantContext ? [] : (dataset.pairings ?? [])),
    [restaurantContext, dataset.pairings],
  );

  const [activeDishId, setActiveDishId] = useState<string>(dishes[0]?.id ?? "");
  const [matchMap, setMatchMap] = useState<Map<string, MatchDetails>>(new Map());
  const [selectedWineId, setSelectedWineId] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<"loading" | "ready" | "fallback">("ready");
  // Vinokompas-vocabulary explanation for the *currently active* dish×wine
  // pair. Generated on demand from /api/pairing/explain. Cached per (dish,
  // wine) so re-selecting doesn't re-spend tokens.
  const [vinokompasExplanation, setVinokompasExplanation] = useState<string | null>(null);
  const [vinokompasLoading, setVinokompasLoading] = useState(false);
  const vinokompasCacheRef = useRef(new Map<string, string>());
  const firstClickTracked = useRef(false);
  const openTimestamp = useRef<number>(0);
  const wineListRef = useRef<HTMLDivElement | null>(null);
  // Mobile feedback loop (audit 2026-07 P3): on a phone, tapping a dish
  // re-ranks a wine list ~2200px below the thumb with zero feedback nearby.
  // Tracks the LAST selection gesture so a sticky result bar above the
  // tab-bar can answer immediately — dish tap → jump to the #1 wine card,
  // wine tap → jump to the rationale panel. Null until the user acts (the
  // auto-select effects below don't set it), null again when dismissed.
  const [mobileResultSource, setMobileResultSource] = useState<"dish" | "wine" | null>(null);

  useEffect(() => {
    openTimestamp.current = performance.now();
    trackEvent("pairing_page_open", {
      device: "mobile-first",
      restaurant_slug: initialRestaurantSlug ?? undefined,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const effectiveDishId =
    activeDishId && dishes.some((dish) => dish.id === activeDishId)
      ? activeDishId
      : dishes[0]?.id ?? "";

  const activeDish = useMemo(
    () => dishes.find((dish) => dish.id === effectiveDishId) ?? dishes[0] ?? null,
    [effectiveDishId, dishes],
  );

  const rankedMatches = useMemo(() => {
    const ranked = wines
      .map((wine) => {
        const match = matchMap.get(wine.id);
        if (!match) {
          return null;
        }
        return { wine, match };
      })
      .filter((item): item is { wine: PairingWine; match: MatchDetails } => item !== null)
      .sort((a, b) => b.match.score - a.match.score);

    const best = ranked[0] ?? null;
    const alternative =
      ranked.find((item) => item.wine.id !== best?.wine.id) ?? null;

    const excludedIds = new Set([best?.wine.id, alternative?.wine.id].filter(Boolean));
    const budgetPool = ranked.filter(
      (item) => item.match.score >= 70 && !excludedIds.has(item.wine.id),
    );
    const budgetSource = budgetPool.length > 0 ? budgetPool : ranked;
    const budget =
      budgetSource.length > 0
        ? [...budgetSource].sort((a, b) => a.wine.price - b.wine.price)[0]
        : null;

    const rankByWineId = new Map<string, 1 | 2 | 3>();
    if (best) {
      rankByWineId.set(best.wine.id, 1);
    }
    if (alternative && !rankByWineId.has(alternative.wine.id)) {
      rankByWineId.set(alternative.wine.id, 2);
    }
    if (budget && !rankByWineId.has(budget.wine.id)) {
      rankByWineId.set(budget.wine.id, 3);
    }

    return { best, alternative, budget, rankByWineId };
  }, [wines, matchMap]);

  const sortedWines = useMemo(() => {
    const list = [...wines];
    list.sort((a, b) => {
      const rankA = rankedMatches.rankByWineId.get(a.id) ?? 99;
      const rankB = rankedMatches.rankByWineId.get(b.id) ?? 99;
      if (rankA !== rankB) {
        return rankA - rankB;
      }

      const matchA = matchMap.get(a.id);
      const matchB = matchMap.get(b.id);
      if (Boolean(matchA) !== Boolean(matchB)) {
        return matchA ? -1 : 1;
      }

      const scoreA = matchA?.score ?? -1;
      const scoreB = matchB?.score ?? -1;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return a.price - b.price;
    });

    return list;
  }, [wines, matchMap, rankedMatches.rankByWineId]);

  const selectedWine = useMemo(
    () => wines.find((wine) => wine.id === selectedWineId) ?? null,
    [selectedWineId, wines],
  );
  const selectedWineMatch = selectedWine ? matchMap.get(selectedWine.id) : null;

  const dishRankings = useMemo(() => {
    if (!selectedWine) {
      return new Map<string, MatchDetails>();
    }

    const nextMap = new Map<string, MatchDetails>();
    for (const dish of dishes) {
      const details =
        getRestaurantMatchForDishWine(restaurantContext, dish.id, selectedWine.id, locale) ??
        buildFallbackMatchMap(dish, [selectedWine], locale).get(selectedWine.id);
      if (details) {
        nextMap.set(dish.id, details);
      }
    }

    return nextMap;
  }, [dishes, restaurantContext, selectedWine, locale]);

  const sortedDishes = useMemo(() => {
    const list = [...dishes];
    if (!selectedWine) {
      return list;
    }

    list.sort((a, b) => {
      const scoreA = dishRankings.get(a.id)?.score ?? -1;
      const scoreB = dishRankings.get(b.id)?.score ?? -1;
      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      return t(a.name, locale).localeCompare(t(b.name, locale));
    });

    return list;
  }, [dishes, dishRankings, selectedWine, locale]);

  const resolvedSelectedWineMatch = useMemo(() => {
    if (!selectedWine || !activeDish) {
      return null;
    }

    return (
      selectedWineMatch ??
      buildFallbackMatchMap(activeDish, [selectedWine], locale).get(selectedWine.id) ??
      null
    );
  }, [activeDish, selectedWine, selectedWineMatch, locale]);

  useEffect(() => {
    if (selectedWineId && !wines.some((wine) => wine.id === selectedWineId)) {
      setSelectedWineId(null);
    }
  }, [selectedWineId, wines]);

  useEffect(() => {
    if (!activeDish || wines.length === 0) {
      setMatchMap(new Map());
      return;
    }

    const controller = new AbortController();

    const loadAiMatches = async () => {
      setAiStatus("loading");

      try {
        const response = await fetch("/api/pairing", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // Locale flows to the API so algorithmic reasons come back
            // already translated. Curated reasons are picked per locale
            // on the client side (see `t(c.reason, locale)` below).
            locale,
            dish: {
              id: activeDish.id,
              name: t(activeDish.name, "en"),
              description: t(activeDish.description, "en"),
              tags: activeDish.tags,
            },
            wines: wines.map((wine) => ({
              ...wine,
              name: t(wine.name, "en"),
              description: t(wine.description, "en"),
            })),
            curated: curatedPairings.map((c) => ({
              dishId: c.dishId,
              wineId: c.wineId,
              reason: t(c.reason, locale),
            })),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("AI pairing failed");
        }

        const data = (await response.json()) as {
          matches?: Array<{ wineId: string; score: number; reason: string }>;
        };

        const nextMap = new Map<string, MatchDetails>();
        for (const result of data.matches ?? []) {
          nextMap.set(result.wineId, { score: result.score, reason: result.reason });
        }

        if (nextMap.size === 0) {
          throw new Error("AI returned no matches");
        }

        setMatchMap(
          applyRestaurantPairingOverrides(nextMap, restaurantContext, activeDish.id, wines, locale),
        );
        setAiStatus("ready");

        const topScore = Math.max(...Array.from(nextMap.values()).map((item) => item.score));
        trackEvent("pairing_ai_success", {
          dish_id: activeDish.id,
          top_score: topScore,
          wines_count: wines.length,
          restaurant_slug: restaurantContextSlug ?? undefined,
        });
      } catch (err) {
        // Deliberate aborts (dish switch / unmount) are NOT failures — the old
        // bare catch flashed the fallback ranking and logged a spurious
        // pairing_ai_fallback event on every dish change (audit 2026-07).
        if (
          controller.signal.aborted ||
          (err instanceof DOMException && err.name === "AbortError")
        ) {
          return;
        }
        const fallbackMap = applyRestaurantPairingOverrides(
          buildFallbackMatchMap(activeDish, wines, locale),
          restaurantContext,
          activeDish.id,
          wines,
          locale,
        );
        setMatchMap(fallbackMap);
        setAiStatus("fallback");
        trackEvent("pairing_ai_fallback", {
          dish_id: activeDish.id,
          wines_count: wines.length,
          restaurant_slug: restaurantContextSlug ?? undefined,
        });
      }
    };

    void loadAiMatches();

    return () => {
      controller.abort();
    };
  }, [activeDish, restaurantContext, restaurantContextSlug, wines, curatedPairings, locale]);

  // Fetch Vinokompas-vocabulary 2-sentence explanation whenever the user
  // settles on a (dish, wine) pair. Cached per pair to avoid token spend
  // on UI churn (sortedDishes re-flow, etc).
  useEffect(() => {
    if (!activeDish || !selectedWine) {
      setVinokompasExplanation(null);
      return;
    }
    const cacheKey = `${activeDish.id}|${selectedWine.id}|${locale}`;
    const cached = vinokompasCacheRef.current.get(cacheKey);
    if (cached) {
      setVinokompasExplanation(cached);
      return;
    }
    setVinokompasExplanation(null);
    setVinokompasLoading(true);
    const controller = new AbortController();
    void (async () => {
      try {
        const res = await fetch("/api/pairing/explain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            dish: {
              name: t(activeDish.name, locale),
              description: t(activeDish.description, locale),
            },
            wine: {
              name: t(selectedWine.name, locale),
              description: t(selectedWine.description, locale),
              grape: selectedWine.passport?.grape,
              region: selectedWine.region,
            },
            locale,
          }),
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { explanation?: string };
        if (data.explanation) {
          vinokompasCacheRef.current.set(cacheKey, data.explanation);
          setVinokompasExplanation(data.explanation);
        }
      } catch {
        /* soft-fail: bubble doesn't render, regular reasons still shown */
      } finally {
        setVinokompasLoading(false);
      }
    })();
    return () => {
      controller.abort();
    };
  }, [activeDish, selectedWine, locale]);

  const selectDish = (dishId: string, source: "cards" | "chips") => {
    userPickedDishRef.current = true;
    setActiveDishId(dishId);
    setSelectedWineId(null);
    setMobileResultSource("dish");
    trackEvent("pairing_dish_selected", {
      dish_id: dishId,
      source,
      restaurant_slug: restaurantContextSlug ?? undefined,
    });

    if (!firstClickTracked.current && openTimestamp.current > 0) {
      firstClickTracked.current = true;
      const elapsed = Math.round(performance.now() - openTimestamp.current);
      trackEvent("pairing_time_to_first_selection_ms", { elapsed });
    }
  };

  const scrollToWineList = () => {
    wineListRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (activeDish) {
      trackEvent("pairing_scroll_to_wines", { dish_id: activeDish.id });
    }
  };

  // "Zobacz →" on the mobile result bar. Dish gesture → the #1 wine card;
  // wine gesture → the rationale section (both carry an id anchor below).
  const scrollToMobileResult = () => {
    const targetId = mobileResultSource === "wine" ? "pairing-explanation" : "pairing-top-wine";
    document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectWine = (wineId: string, source: "list" | "top-3") => {
    setSelectedWineId(wineId);
    setMobileResultSource("wine");
    if (activeDish) {
      trackEvent("pairing_wine_selected", {
        dish_id: activeDish.id,
        wine_id: wineId,
        source,
        restaurant_slug: restaurantContextSlug ?? undefined,
      });
    }
  };

  useEffect(() => {
    if (selectedWineId && wines.some((wine) => wine.id === selectedWineId)) {
      return;
    }

    const nextWineId = rankedMatches.best?.wine.id ?? null;
    if (nextWineId) {
      setSelectedWineId(nextWineId);
    }
  }, [rankedMatches.best, selectedWineId, wines]);

  // Mirror-image of the auto-select-best-wine effect above. When the guest
  // picks a wine first (or before they have engaged with a dish), surface
  // the dish that pairs best with that wine so the chat panel reads as
  // "X (top dish for this wine) × Y (selected wine)" without forcing a
  // second tap. activeDishHasBeenChosen tracks whether the user already
  // pointed at a dish - we only re-pick when no explicit dish choice is in
  // play, otherwise we'd fight their selection.
  const userPickedDishRef = useRef(false);
  useEffect(() => {
    if (!selectedWine || dishRankings.size === 0 || userPickedDishRef.current) return;
    let bestDishId: string | null = null;
    let bestScore = -Infinity;
    for (const [dishId, m] of dishRankings) {
      if (m.score > bestScore) {
        bestScore = m.score;
        bestDishId = dishId;
      }
    }
    if (bestDishId && bestDishId !== activeDishId) {
      setActiveDishId(bestDishId);
    }
  }, [selectedWine, dishRankings, activeDishId]);

  if (!activeDish || wines.length === 0) {
    return (
      <div className="mobile-safe-bottom min-h-screen bg-background-dark text-white">
        <main className="mx-auto max-w-3xl px-6 pt-28 pb-20 text-center">
          <p className="mb-3 inline-flex rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            Pairing Data Required
          </p>
          <h1 className="text-3xl font-bold">No pairing data available</h1>
          <p className="mt-3 text-sm text-gray-300">
            Add dishes and wines from the new admin panel, then return to the pairing screen.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/admin" className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold">
              Open Admin
            </Link>
          </div>
        </main>
        <MobileTabBar />
      </div>
    );
  }

  return (
    <div className="mobile-safe-bottom flex min-h-screen flex-col overflow-hidden bg-background-dark text-gray-200 selection:bg-primary selection:text-white">
      <Navigation />

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col overflow-x-hidden px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-[28px] border border-white/10 bg-black/15 px-4 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                {tx("workspace")}
              </p>
              {/* Mobile gets the short headline; the full three-sentence form
                  is desktop-only (audit 2026-07 P3: the hero ate ~1.5
                  viewports at 390px before the first dish). */}
              <h1 className="pitch-display mt-2 text-3xl text-white sm:text-4xl">
                <span className="md:hidden">{tx("headlineShort")}</span>
                <span className="hidden md:inline">{tx("headline")}</span>
              </h1>
              <p className="mt-2 hidden max-w-3xl text-sm text-gray-400 sm:text-base md:block">
                {tx("subheading")}
              </p>
              {/* Explicit numbered steps so the flow is obvious (feedback:
                  "nie jest jasne jak przejść do win"). Mobile: one compact
                  horizontal row, no arrows; desktop wraps with arrows. */}
              <div className="hide-scrollbar mt-4 flex items-center gap-2 overflow-x-auto text-[11px] font-semibold tracking-[0.14em] uppercase md:flex-wrap md:overflow-x-visible">
                <span className="shrink-0 rounded-full border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/12 px-3 py-1.5 whitespace-nowrap text-[var(--color-accent-gold)]">{tx("step1")}</span>
                <span aria-hidden className="hidden text-gray-500 md:inline">→</span>
                <span className="shrink-0 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 whitespace-nowrap text-gray-200">{tx("step2")}</span>
                <span aria-hidden className="hidden text-gray-500 md:inline">→</span>
                <span className="shrink-0 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 whitespace-nowrap text-gray-200">{tx("step3")}</span>
              </div>
              {/* KONTEKST + AI status merged into a single meta line — they
                  used to stack as two rows on mobile. */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {restaurantContext ? (
                  <p className="inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-gray-200 uppercase">
                    {tx("context", {
                      name: t(restaurantContext.name, locale),
                      city: restaurantContext.city,
                    })}
                  </p>
                ) : null}
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${
                    aiStatus === "loading"
                      ? "bg-white/10 text-gray-300"
                      : aiStatus === "fallback"
                        ? "bg-amber-900/35 text-amber-300"
                        : "bg-emerald-900/30 text-emerald-300"
                  }`}
                >
                  {aiStatus === "loading"
                    ? tx("aiAnalyzing")
                    : aiStatus === "fallback"
                      ? tx("fallbackMode")
                      : tx("aiReady")}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={scrollToWineList}
                className="inline-flex h-9 items-center rounded-full border border-primary/40 px-3.5 text-[11px] font-semibold tracking-wide text-primary uppercase lg:hidden"
              >
                {tx("jumpToWines")}
              </button>
            </div>
          </div>
        </header>

        <div className="grid min-w-0 flex-1 gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="min-w-0 rounded-[30px] border border-white/10 bg-black/15 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-5">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <h2 className="pitch-display text-2xl text-white">{tx("menu")}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {tx("reorderedFor", {
                    name: selectedWine ? t(selectedWine.name, locale) : tx("selectedWine"),
                  })}
                </p>
              </div>
              <span className="rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-gray-300">
                {tx("dishesCount", { count: dishes.length })}
              </span>
            </div>

            <div className="hide-scrollbar -mx-1.5 flex flex-col gap-3 px-1.5 py-1.5 lg:max-h-[62vh] lg:overflow-y-auto">
              {sortedDishes.map((dish) => {
                const isActive = dish.id === activeDish.id;
                const ranking = selectedWine ? dishRankings.get(dish.id) : null;

                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => selectDish(dish.id, "cards")}
                    className={`group flex w-full items-start gap-3 rounded-2xl border-2 px-3 py-3 text-left transition-all duration-300 ${
                      isActive
                        ? "-translate-y-0.5 border-primary bg-gradient-to-r from-primary/30 via-primary/12 to-white/5 shadow-[0_2px_0_rgba(156,117,54,0.15)]"
                        : "border-white/8 bg-black/18 opacity-80 hover:border-white/22 hover:opacity-100"
                    }`}
                  >
                    {/* Radio grammar shared with the wine column: idle = ink
                        outline, selected = gold fill + tiny scale-in. */}
                    <span
                      className={`mt-5 h-3 w-3 shrink-0 rounded-full transition-all duration-200 ${
                        isActive
                          ? "scale-110 border border-[#c79f69] bg-[#c79f69]"
                          : "border-[1.5px] border-[color:var(--ink-muted)] bg-transparent"
                      }`}
                    />

                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Image
                        alt={t(dish.name, locale)}
                        fill
                        placeholder="blur"
                        blurDataURL={GENERIC_BLUR_DATA_URL}
                        sizes="64px"
                        src={dish.image}
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-base font-semibold text-white">{t(dish.name, locale)}</p>
                          <p className="mt-1 line-clamp-2 text-xs text-gray-400 sm:text-sm">
                            {t(dish.description, locale)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="block text-sm font-bold text-primary sm:text-base">
                            ${dish.price}
                          </span>
                          {ranking ? (
                            <span className="mt-1 block text-[10px] font-semibold tracking-wide text-white/70 uppercase">
                              {tx("matchPercent", { score: ranking.score })}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {dish.tags.map((tag) => (
                          <span
                            key={tag}
                            className={`rounded-full px-2 py-1 text-[10px] tracking-wide uppercase ${
                              isActive
                                ? "border border-[color:var(--gold-hairline)] bg-[var(--color-accent-gold)]/10 text-primary"
                                : "border border-white/10 bg-white/4 text-gray-400"
                            }`}
                          >
                            {localizeTag(tag, locale, "dish")}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            ref={wineListRef}
            className="min-w-0 rounded-[30px] border border-white/10 bg-black/15 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-5"
          >
            <div className="mb-4 border-b border-white/8 pb-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="pitch-display text-2xl text-white">{tx("wineList")}</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {tx("rankedFor", { name: t(activeDish.name, locale) })}
                  </p>
                </div>
                <span className="rounded-full border border-[color:var(--gold-hairline)] bg-[var(--color-accent-gold)]/10 px-3 py-1 text-[11px] font-semibold whitespace-nowrap text-primary">
                  {tx("winesCount", { count: sortedWines.length })}
                </span>
              </div>
            </div>

            {/* pb-24 (mobile only): breathing room below the last card so the
                floating chat FAB never parks on top of its price. */}
            <div className="hide-scrollbar -mx-1.5 flex flex-col gap-3 px-1.5 pt-1.5 pb-24 lg:max-h-[62vh] lg:overflow-y-auto lg:pb-1.5">
              {sortedWines.map((wine) => {
                const match = matchMap.get(wine.id);
                const isMatch = Boolean(match);
                const isSelected = wine.id === selectedWineId;
                const topRank = rankedMatches.rankByWineId.get(wine.id) ?? null;
                const rankLabel =
                  topRank === 1
                    ? tx("bestMatch")
                    : topRank === 2
                      ? tx("alternative")
                      : topRank === 3
                        ? tx("budgetPick")
                        : null;

                // Mirror the Menu column's card styling so the two columns
                // read as one consistent surface (the wine column used to be a
                // dark panel with per-rank gold/blue/green tints that clashed
                // with the light Menu column and hurt readability). Only the
                // selected/best wine gets the gold highlight (crisp hairline
                // ring — the blurred glow smudged on parchment, audit 2026-07);
                // the rest are neutral and theme-aware; rank is conveyed by
                // the #1/#2/#3 badge below, not the whole-card colour.
                const toneClass =
                  isSelected
                    ? "-translate-y-0.5 border-2 border-[var(--color-accent-gold)] bg-gradient-to-r from-[var(--color-accent-gold)]/22 via-primary/12 to-[var(--color-accent-gold)]/10 shadow-[0_0_0_3px_rgba(156,117,54,0.12),0_2px_0_rgba(156,117,54,0.15)] opacity-100"
                    : isMatch
                      ? "border-2 border-white/8 bg-black/18 opacity-90 hover:border-white/22 hover:opacity-100"
                      : "border-2 border-white/6 bg-black/14 opacity-70 grayscale-[0.4] hover:opacity-100 hover:grayscale-0";

                return (
                  <button
                    key={wine.id}
                    type="button"
                    // Anchor for the mobile result bar's "Zobacz →" jump.
                    id={topRank === 1 ? "pairing-top-wine" : undefined}
                    onClick={() => selectWine(wine.id, "list")}
                    className={`relative flex w-full scroll-mt-24 items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${toneClass}`}
                  >
                    {/* Same radio grammar as the dish column: idle = ink
                        outline, selected = gold fill + tiny scale-in (dots
                        used to be inverted between the columns). */}
                    <span
                      className={`mt-5 h-3 w-3 shrink-0 rounded-full transition-all duration-200 ${
                        isSelected
                          ? "scale-110 border border-[#c79f69] bg-[#c79f69]"
                          : "border-[1.5px] border-[color:var(--ink-muted)] bg-transparent"
                      }`}
                    />

                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Image
                        alt={t(wine.name, locale)}
                        fill
                        placeholder="blur"
                        blurDataURL={GENERIC_BLUR_DATA_URL}
                        sizes="48px"
                        src={wine.image}
                        className="object-cover"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-base font-semibold text-white">{t(wine.name, locale)}</p>
                          <p className="mt-1 text-xs text-gray-400 sm:text-sm">
                            {wine.region} • {wine.vintageLabel ?? wine.year}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-bold text-white sm:text-base">
                          ${wine.price}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {match ? (
                          <span className="rounded-full border border-[color:var(--gold-hairline)] bg-[var(--color-accent-gold)]/10 px-2 py-1 text-[10px] font-semibold tracking-wide text-primary uppercase shadow-[0_2px_0_rgba(156,117,54,0.15)]">
                            {tx("matchPercent", { score: match.score })}
                          </span>
                        ) : (
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-semibold tracking-wide text-gray-500 uppercase">
                            {tx("exploratory")}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400">
                          {wine.passport.grape}
                        </span>
                        {rankLabel ? (
                          <span className="text-[11px] font-semibold text-white/85">#{topRank} · {rankLabel}</span>
                        ) : null}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        {selectedWine ? (
          <section
            id="pairing-explanation"
            className="mt-6 scroll-mt-24 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(199,159,105,0.18),transparent_28%),rgba(0,0,0,0.18)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                  {tx("explanationKicker")}
                </p>
                {/* pitch-display styles the <em> as gold italic — the "× wine"
                    half reads as the editorial counterpoint to the dish. */}
                <h2 className="pitch-display mt-2 text-2xl text-white sm:text-3xl">
                  {t(activeDish.name, locale)} <em>× {t(selectedWine.name, locale)}</em>
                </h2>
                <p className="mt-2 text-sm text-gray-400">{tx("explanationLine")}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${
                  resolvedSelectedWineMatch
                    ? "border border-[color:var(--gold-hairline)] bg-[var(--color-accent-gold)]/10 text-primary shadow-[0_2px_0_rgba(156,117,54,0.15)]"
                    : "bg-white/8 text-gray-300"
                }`}
              >
                {resolvedSelectedWineMatch
                  ? tx("matched", { score: resolvedSelectedWineMatch.score })
                  : tx("manualSelection")}
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <article className="rounded-[26px] border border-white/10 bg-black/18 p-4">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-gray-500 uppercase">
                  {tx("menuItem")}
                </p>
                <div className="mt-3 flex items-start gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-white/10">
                    <Image
                      src={activeDish.image}
                      alt={t(activeDish.name, locale)}
                      fill
                      placeholder="blur"
                      blurDataURL={GENERIC_BLUR_DATA_URL}
                      sizes="96px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-white">{t(activeDish.name, locale)}</h3>
                    <p className="mt-2 text-sm text-gray-400">{t(activeDish.description, locale)}</p>
                    <p className="mt-3 text-sm font-bold text-primary">${activeDish.price}</p>
                  </div>
                </div>
              </article>

              <article className="rounded-[26px] border border-white/10 bg-black/18 p-4">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-gray-500 uppercase">
                  {tx("wineSelection")}
                </p>
                <div className="mt-3 flex items-start gap-4">
                  <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/10">
                    <Image
                      src={selectedWine.image}
                      alt={t(selectedWine.name, locale)}
                      fill
                      placeholder="blur"
                      blurDataURL={GENERIC_BLUR_DATA_URL}
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xl font-semibold text-white">{t(selectedWine.name, locale)}</h3>
                    <p className="mt-1 text-sm text-primary">
                      {selectedWine.region} • {selectedWine.vintageLabel ?? selectedWine.year}
                    </p>
                    <p className="mt-2 text-sm text-gray-400">{t(selectedWine.description, locale)}</p>
                    <p className="mt-3 text-sm font-bold text-white">${selectedWine.price}</p>
                  </div>
                </div>
              </article>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
              <article className="rounded-[28px] border border-primary/16 bg-black/15 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-accent-gold)]/15 text-primary">
                    <Icon name="smart_toy" className="text-lg" />
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.22em] text-primary uppercase">
                      {tx("sommelierBot")}
                    </p>
                    <p className="text-sm text-gray-400">{tx("sommelierBotSubtitle")}</p>
                  </div>
                </div>

                {/* Keyed on the pair so the four bubbles replay their staggered
                    fade-up (~120ms apart, vk-rise handles reduced-motion) on
                    every new dish×wine — the panel used to snap in as one
                    static block. Presentation only: the explain fetch/cache
                    above is untouched. */}
                <div key={`${activeDish.id}|${selectedWine.id}`} className="mt-4 space-y-3">
                  <div className="vk-rise max-w-[88%] rounded-[22px] rounded-bl-md border border-white/10 bg-black/22 px-4 py-3">
                    <p className="text-sm leading-6 text-gray-100">
                      {tx.rich("botCompare", {
                        dish: t(activeDish.name, locale),
                        wine: t(selectedWine.name, locale),
                        hl: (chunks) => <span className="font-semibold text-white">{chunks}</span>,
                      })}
                    </p>
                  </div>

                  <div className="vk-rise max-w-[92%] rounded-[22px] rounded-bl-md border border-[color:var(--gold-hairline-soft)] bg-[var(--color-accent-gold)]/8 px-4 py-3 [animation-delay:120ms]">
                    <p className="text-sm leading-6 text-gray-100">
                      {resolvedSelectedWineMatch
                        ? resolvedSelectedWineMatch.reason
                        : tx("botFallbackReason")}
                    </p>
                  </div>

                  {(vinokompasLoading || vinokompasExplanation) ? (
                    <div className="vk-rise max-w-[92%] rounded-[22px] rounded-bl-md border border-[rgba(199,159,105,0.32)] bg-[rgba(199,159,105,0.08)] px-4 py-3 [animation-delay:240ms]">
                      <p className="mb-1 text-[10px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                        Vinokompas
                      </p>
                      {vinokompasLoading && !vinokompasExplanation ? (
                        /* Typing indicator - the AI text swaps in place inside
                           this same bubble, so nothing below shifts. */
                        <span
                          role="status"
                          aria-label={locale === "pl" ? "Bot pisze…" : "Bot is typing…"}
                          className="inline-flex items-center gap-1.5 py-1.5"
                        >
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent-gold)] motion-reduce:animate-none" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent-gold)] [animation-delay:150ms] motion-reduce:animate-none" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[var(--color-accent-gold)] [animation-delay:300ms] motion-reduce:animate-none" />
                        </span>
                      ) : (
                        <>
                          <p className="text-sm leading-6 text-gray-100">{vinokompasExplanation}</p>
                          {/* "Talk to AI sommelier" - fires wn:open-chat with
                              a prefill that asks the bot to elaborate on this
                              specific dish×wine. The chat panel opens (or
                              activates if collapsed) and auto-sends. */}
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof window === "undefined") return;
                              const dish = t(activeDish.name, locale);
                              const wine = t(selectedWine.name, locale);
                              const prefill =
                                locale === "pl"
                                  ? `Opowiedz mi więcej o połączeniu „${dish}" z „${wine}". Co warto zauważyć w pierwszym łyku?`
                                  : `Tell me more about pairing "${dish}" with "${wine}". What should I notice in the first sip?`;
                              window.dispatchEvent(
                                new CustomEvent("wn:open-chat", { detail: { prefill } }),
                              );
                            }}
                            className="mt-3 inline-flex min-h-[40px] items-center gap-2 rounded-full border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 px-3.5 py-2 text-[11px] font-semibold tracking-[0.18em] text-[var(--color-accent-gold)] uppercase transition hover:bg-[var(--color-accent-gold)]/20"
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                              <path d="M12 2a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2V5a3 3 0 0 1 3-3Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
                            </svg>
                            {locale === "pl" ? "Porozmawiaj z AI sommelierem" : "Talk to AI sommelier"}
                          </button>
                        </>
                      )}
                    </div>
                  ) : null}

                  <div className="vk-rise max-w-[84%] rounded-[22px] rounded-bl-md border border-white/10 bg-black/22 px-4 py-3 [animation-delay:360ms]">
                    <p className="text-sm leading-6 text-gray-100">
                      {tx("botServiceNote", {
                        temp: selectedWine.passport.servingTempC,
                        decant: localizeDecant(selectedWine.passport.decant, locale),
                      })}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedWine.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] tracking-wide text-gray-300 uppercase"
                    >
                      {localizeTag(tag, locale, "wine")}
                    </span>
                  ))}
                </div>
              </article>

              <article className="rounded-[28px] border border-white/10 bg-black/18 p-5">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-gray-500 uppercase">
                  {tx("winePassport")}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                  <div className="rounded-xl border border-[color:var(--gold-hairline,rgba(156,117,54,0.45))] bg-[#f7f2ea] p-3">
                    <p className="text-[10px] font-semibold tracking-wider text-[#0b1f44]/75 uppercase">{tx("passport.grape")}</p>
                    <p className="mt-1 font-serif italic text-[#0b1f44]">{selectedWine.passport.grape}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--gold-hairline,rgba(156,117,54,0.45))] bg-[#f7f2ea] p-3">
                    <p className="text-[10px] font-semibold tracking-wider text-[#0b1f44]/75 uppercase">{tx("passport.abv")}</p>
                    <p className="mt-1 font-serif italic text-[#0b1f44]">{selectedWine.passport.abv}%</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--gold-hairline,rgba(156,117,54,0.45))] bg-[#f7f2ea] p-3">
                    <p className="text-[10px] font-semibold tracking-wider text-[#0b1f44]/75 uppercase">{tx("passport.body")}</p>
                    <p className="mt-1 font-serif italic text-[#0b1f44]">{tx(`body.${selectedWine.passport.body}`)}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--gold-hairline,rgba(156,117,54,0.45))] bg-[#f7f2ea] p-3">
                    <p className="text-[10px] font-semibold tracking-wider text-[#0b1f44]/75 uppercase">{tx("passport.acidity")}</p>
                    <p className="mt-1 font-serif italic text-[#0b1f44]">{tx(`acidity.${selectedWine.passport.acidity}`)}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--gold-hairline,rgba(156,117,54,0.45))] bg-[#f7f2ea] p-3">
                    <p className="text-[10px] font-semibold tracking-wider text-[#0b1f44]/75 uppercase">{tx("passport.tannin")}</p>
                    <p className="mt-1 font-serif italic text-[#0b1f44]">{tx(`tannin.${selectedWine.passport.tannin}`)}</p>
                  </div>
                  <div className="rounded-xl border border-[color:var(--gold-hairline,rgba(156,117,54,0.45))] bg-[#f7f2ea] p-3">
                    <p className="text-[10px] font-semibold tracking-wider text-[#0b1f44]/75 uppercase">{tx("passport.serve")}</p>
                    <p className="mt-1 font-serif italic text-[#0b1f44]">{selectedWine.passport.servingTempC}°C</p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[color:var(--gold-hairline,rgba(156,117,54,0.45))] bg-[#f7f2ea] p-3">
                  <p className="text-[10px] font-semibold tracking-wider text-[#0b1f44]/75 uppercase">{tx("passport.decant")}</p>
                  <p className="mt-1 font-serif text-sm italic text-[#0b1f44]">{localizeDecant(selectedWine.passport.decant, locale)}</p>
                </div>
              </article>
            </div>
          </section>
        ) : null}
      </main>

      {/* Mobile result bar — instant feedback next to the thumb after a
          selection (the re-ranked list lives ~2200px lower at 390px). Navy
          keep-dark strip pinned above the tab-bar; "Zobacz →" jumps to the
          #1 wine card (dish tap) or the rationale panel (wine tap). Right
          padding clears the chat FAB parked in the same corner. */}
      {mobileResultSource && rankedMatches.best ? (
        <div
          className="keep-dark fixed inset-x-0 z-[35] border-t border-[color:var(--gold-hairline)] md:hidden"
          style={{ bottom: "var(--mobile-tabbar-h)", background: "#0b1f44" }}
        >
          <div className="flex items-center gap-2 py-2 pr-[4.75rem] pl-4">
            <p className="min-w-0 flex-1 truncate text-sm text-white">
              <span aria-hidden className="text-[var(--color-accent-gold)]">★ </span>
              <span className="font-semibold">
                {t(
                  (mobileResultSource === "wine" && selectedWine
                    ? selectedWine
                    : rankedMatches.best.wine
                  ).name,
                  locale,
                )}
              </span>
              <span className="text-gray-300">
                {" · "}
                {mobileResultSource === "wine" && selectedWine
                  ? (resolvedSelectedWineMatch?.score ?? rankedMatches.best.match.score)
                  : rankedMatches.best.match.score}
                %
              </span>
            </p>
            <button
              type="button"
              onClick={scrollToMobileResult}
              className="inline-flex min-h-[36px] shrink-0 items-center gap-1 rounded-full border border-[color:var(--gold-hairline)] bg-[var(--color-accent-gold)]/12 px-3 text-[11px] font-semibold tracking-[0.14em] whitespace-nowrap text-[var(--color-accent-gold)] uppercase"
            >
              {tx("resultBarCta")} →
            </button>
            <button
              type="button"
              onClick={() => setMobileResultSource(null)}
              aria-label={tx("resultBarDismiss")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:text-white"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      ) : null}

      <MobileTabBar />

      {/* Page-aware sommelier chat - starts as a docked FAB (defaultCollapsed;
          the auto-expanded panel used to cover the top of the wine column on
          desktop). The pageContext string is rebuilt every render so the bot
          always knows the currently focused dish + wine + restaurant. Stored
          conversation key is shared with the rest of the app so the
          history follows the user. */}
      <FloatingTasteChat
        defaultCollapsed
        pageContext={[
          restaurantContext
            ? `Restauracja: ${t(restaurantContext.name, locale)} (${restaurantContext.city}, ${restaurantContext.country}).`
            : null,
          activeDish ? `Wybrane danie: ${t(activeDish.name, locale)}.` : null,
          selectedWine ? `Sugerowane wino: ${t(selectedWine.name, locale)} (${selectedWine.region}).` : null,
        ]
          .filter(Boolean)
          .join(" ")}
      />
    </div>
  );
}
