"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { trackEvent } from "@/lib/analytics";
import { GENERIC_BLUR_DATA_URL } from "@/lib/image-helpers";
import { t } from "@/lib/localized";
import { getCatalogRestaurant } from "@/lib/restaurant-directory";
import {
  applyRestaurantPairingOverrides,
  buildPairingDatasetFromRestaurant,
  getRestaurantMatchForDishWine,
} from "@/lib/restaurant-pairing-adapter";
import { usePairingDataset } from "@/lib/pairing-store";
import type { Locale } from "@/i18n/routing";
import type { PairingDish, PairingWine } from "@/types/pairing";

type MatchDetails = {
  score: number;
  reason: string;
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

export default function PairingPage() {
  const { dataset } = usePairingDataset();
  const locale = useLocale() as Locale;
  const tx = useTranslations("pairing");
  const [restaurantContextSlug, setRestaurantContextSlug] = useState<string | null>(null);
  const restaurantContext = restaurantContextSlug
    ? getCatalogRestaurant(restaurantContextSlug)
    : null;
  const activeDataset = useMemo(
    () => (restaurantContext ? buildPairingDatasetFromRestaurant(restaurantContext) : dataset),
    [dataset, restaurantContext],
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
  const firstClickTracked = useRef(false);
  const openTimestamp = useRef<number>(0);
  const wineListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    openTimestamp.current = performance.now();
    trackEvent("pairing_page_open", { device: "mobile-first" });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const nextSlug = new URLSearchParams(window.location.search).get("restaurant");
    setRestaurantContextSlug(nextSlug);
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
        });
      } catch {
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
        });
      }
    };

    void loadAiMatches();

    return () => {
      controller.abort();
    };
  }, [activeDish, restaurantContext, wines, curatedPairings, locale]);

  const selectDish = (dishId: string, source: "cards" | "chips") => {
    setActiveDishId(dishId);
    setSelectedWineId(null);
    trackEvent("pairing_dish_selected", { dish_id: dishId, source });

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

  const selectWine = (wineId: string, source: "list" | "top-3") => {
    setSelectedWineId(wineId);
    if (activeDish) {
      trackEvent("pairing_wine_selected", {
        dish_id: activeDish.id,
        wine_id: wineId,
        source,
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

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 pt-24 pb-8 sm:px-6 lg:px-8">
        <header className="mb-6 rounded-[28px] border border-white/10 bg-black/15 px-4 py-5 shadow-[0_20px_80px_rgba(0,0,0,0.25)] backdrop-blur-sm sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                {tx("workspace")}
              </p>
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{tx("headline")}</h1>
              <p className="mt-2 max-w-3xl text-sm text-gray-400 sm:text-base">
                {tx("subheading")}
              </p>
              {restaurantContext ? (
                <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold tracking-[0.14em] text-gray-200 uppercase">
                  {tx("context", {
                    name: t(restaurantContext.name, locale),
                    city: restaurantContext.city,
                  })}
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              <button
                type="button"
                onClick={scrollToWineList}
                className="rounded-full border border-primary/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase lg:hidden"
              >
                {tx("jumpToWines")}
              </button>
            </div>
          </div>
        </header>

        <div className="grid flex-1 gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <section className="rounded-[30px] border border-white/10 bg-black/15 p-4 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-5">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.25em] text-gray-500 uppercase">
                  {tx("column1")}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">{tx("menu")}</h2>
                <p className="mt-1 text-sm text-gray-400">
                  {tx("reorderedFor", {
                    name: selectedWine ? t(selectedWine.name, locale) : tx("selectedWine"),
                  })}
                </p>
              </div>
              <span className="rounded-full bg-white/6 px-3 py-1 text-[11px] font-semibold text-gray-300">
                {tx("dishesCount", { count: dishes.length })}
              </span>
            </div>

            <div className="hide-scrollbar flex max-h-[62vh] flex-col gap-3 overflow-y-auto pr-1">
              {sortedDishes.map((dish) => {
                const isActive = dish.id === activeDish.id;
                const ranking = selectedWine ? dishRankings.get(dish.id) : null;

                return (
                  <button
                    key={dish.id}
                    type="button"
                    onClick={() => selectDish(dish.id, "cards")}
                    className={`group flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${
                      isActive
                        ? "active-dish-glow border-primary bg-gradient-to-r from-primary/18 to-white/5"
                        : "border-white/8 bg-black/18 opacity-65 hover:border-white/16 hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`mt-5 h-2.5 w-2.5 shrink-0 rounded-full transition ${
                        isActive ? "bg-primary shadow-[0_0_12px_rgba(209,21,52,0.7)]" : "bg-white/20"
                      }`}
                    />

                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Image
                        alt={t(dish.name, locale)}
                        fill
                        quality={66}
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
                          <p className="truncate text-base font-semibold text-white">{t(dish.name, locale)}</p>
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
                              {ranking.score}% fit
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
                                ? "border border-primary/35 bg-primary/12 text-primary"
                                : "border border-white/10 bg-white/4 text-gray-400"
                            }`}
                          >
                            {tag}
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
            className="rounded-[30px] border border-white/10 bg-[#120a0ccc] p-4 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-5"
          >
            <div className="mb-4 border-b border-white/8 pb-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold tracking-[0.25em] text-gray-500 uppercase">
                    {tx("column2")}
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-white">{tx("wineList")}</h2>
                  <p className="mt-1 text-sm text-gray-400">
                    {tx("rankedFor", { name: t(activeDish.name, locale) })}
                  </p>
                </div>
                <span className="rounded-full bg-primary/12 px-3 py-1 text-[11px] font-semibold text-primary">
                  {tx("winesCount", { count: sortedWines.length })}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {[
                  { rank: "#1", label: tx("bestMatch"), item: rankedMatches.best, tone: "border-primary/40 bg-primary/10" },
                  {
                    rank: "#2",
                    label: tx("alternative"),
                    item: rankedMatches.alternative,
                    tone: "border-sky-300/25 bg-sky-300/10",
                  },
                  {
                    rank: "#3",
                    label: tx("budgetPick"),
                    item: rankedMatches.budget,
                    tone: "border-emerald-400/30 bg-emerald-500/10",
                  },
                ].map((entry) => (
                  <button
                    key={entry.rank}
                    type="button"
                    onClick={() => entry.item && selectWine(entry.item.wine.id, "top-3")}
                    disabled={!entry.item}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      entry.item
                        ? `${entry.tone} ${
                            selectedWineId === entry.item.wine.id
                              ? "ring-2 ring-white/65"
                              : "hover:border-primary/45"
                          }`
                        : "border-white/10 bg-black/20 opacity-45"
                    }`}
                  >
                    <p className="text-[10px] font-semibold tracking-wider text-gray-400 uppercase">
                      {entry.rank} {entry.label}
                    </p>
                    {entry.item ? (
                      <>
                        <p className="mt-1 line-clamp-1 text-sm font-semibold text-white">
                          {t(entry.item.wine.name, locale)}
                        </p>
                        <p className="text-xs text-gray-300">
                          {tx("matchPercent", { score: entry.item.match.score })} • ${entry.item.wine.price}
                        </p>
                      </>
                    ) : (
                      <p className="mt-1 text-xs text-gray-500">{tx("noRankedWine")}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="hide-scrollbar flex max-h-[62vh] flex-col gap-3 overflow-y-auto pr-1">
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

                const toneClass =
                  isSelected
                    ? "border-white/40 bg-gradient-to-r from-white/10 to-primary/10 shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_16px_32px_rgba(0,0,0,0.18)] opacity-100"
                    : topRank === 1
                      ? "border-amber-200/65 bg-amber-300/10 opacity-100"
                      : topRank === 2
                        ? "border-sky-300/50 bg-sky-300/10 opacity-95"
                        : topRank === 3
                          ? "border-emerald-300/50 bg-emerald-300/10 opacity-90"
                          : isMatch
                            ? "border-primary/20 bg-white/4 opacity-72 hover:opacity-100"
                            : "border-white/6 bg-black/14 opacity-35 grayscale hover:opacity-55";

                return (
                  <button
                    key={wine.id}
                    type="button"
                    onClick={() => selectWine(wine.id, "list")}
                    className={`relative flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-300 ${toneClass}`}
                  >
                    {topRank ? (
                      <span className="absolute top-2 right-2 rounded-full border border-black/10 bg-white px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-black uppercase">
                        #{topRank}
                      </span>
                    ) : null}

                    <span
                      className={`mt-5 h-2.5 w-2.5 shrink-0 rounded-full transition ${
                        isSelected
                          ? "bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                          : isMatch
                            ? "bg-primary"
                            : "bg-white/18"
                      }`}
                    />

                    <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl border border-white/10">
                      <Image
                        alt={t(wine.name, locale)}
                        fill
                        quality={64}
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
                          <p className="truncate text-base font-semibold text-white">{t(wine.name, locale)}</p>
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
                          <span className="rounded-full border border-primary/30 bg-primary/12 px-2 py-1 text-[10px] font-semibold tracking-wide text-primary uppercase">
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
                          <span className="text-[11px] font-semibold text-white/85">{rankLabel}</span>
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
          <section className="mt-6 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(209,21,52,0.18),transparent_28%),rgba(0,0,0,0.18)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)] backdrop-blur-sm sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.28em] text-primary uppercase">
                  {tx("explanationKicker")}
                </p>
                <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                  {t(activeDish.name, locale)} × {t(selectedWine.name, locale)}
                </h2>
                <p className="mt-2 text-sm text-gray-400">{tx("explanationLine")}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase ${
                  resolvedSelectedWineMatch
                    ? "bg-primary/15 text-primary"
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
                      quality={68}
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
                      quality={64}
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
              <article className="rounded-[28px] border border-primary/16 bg-[#170d0ff0] p-5">
                <div className="flex items-center gap-3 border-b border-white/8 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/18 text-primary">
                    <span className="material-icons text-lg">smart_toy</span>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold tracking-[0.22em] text-primary uppercase">
                      {tx("sommelierBot")}
                    </p>
                    <p className="text-sm text-gray-400">{tx("sommelierBotSubtitle")}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="max-w-[88%] rounded-[22px] rounded-bl-md border border-white/10 bg-black/22 px-4 py-3">
                    <p className="text-sm leading-6 text-gray-100">
                      {tx.rich("botCompare", {
                        dish: t(activeDish.name, locale),
                        wine: t(selectedWine.name, locale),
                        hl: (chunks) => <span className="font-semibold text-white">{chunks}</span>,
                      })}
                    </p>
                  </div>

                  <div className="max-w-[92%] rounded-[22px] rounded-bl-md border border-primary/20 bg-primary/10 px-4 py-3">
                    <p className="text-sm leading-6 text-gray-100">
                      {resolvedSelectedWineMatch
                        ? resolvedSelectedWineMatch.reason
                        : tx("botFallbackReason")}
                    </p>
                  </div>

                  <div className="max-w-[84%] rounded-[22px] rounded-bl-md border border-white/10 bg-black/22 px-4 py-3">
                    <p className="text-sm leading-6 text-gray-100">
                      {tx("botServiceNote", {
                        temp: selectedWine.passport.servingTempC,
                        decant: selectedWine.passport.decant,
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
                      {tag}
                    </span>
                  ))}
                </div>
              </article>

              <article className="rounded-[28px] border border-white/10 bg-black/18 p-5">
                <p className="text-[11px] font-semibold tracking-[0.22em] text-gray-500 uppercase">
                  {tx("winePassport")}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase">{tx("passport.grape")}</p>
                    <p className="mt-1 text-white">{selectedWine.passport.grape}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase">{tx("passport.abv")}</p>
                    <p className="mt-1 text-white">{selectedWine.passport.abv}%</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase">{tx("passport.body")}</p>
                    <p className="mt-1 text-white">{tx(`body.${selectedWine.passport.body}`)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase">{tx("passport.acidity")}</p>
                    <p className="mt-1 text-white">{tx(`acidity.${selectedWine.passport.acidity}`)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase">{tx("passport.tannin")}</p>
                    <p className="mt-1 text-white">{tx(`tannin.${selectedWine.passport.tannin}`)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <p className="text-[10px] tracking-wider text-gray-400 uppercase">{tx("passport.serve")}</p>
                    <p className="mt-1 text-white">{selectedWine.passport.servingTempC}°C</p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-white/10 bg-black/25 p-3">
                  <p className="text-[10px] tracking-wider text-gray-400 uppercase">{tx("passport.decant")}</p>
                  <p className="mt-1 text-sm text-gray-100">{selectedWine.passport.decant}</p>
                </div>
              </article>
            </div>
          </section>
        ) : null}
      </main>

      <MobileTabBar />
    </div>
  );
}
