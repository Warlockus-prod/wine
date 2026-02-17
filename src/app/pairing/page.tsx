"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { trackEvent } from "@/lib/analytics";
import { GENERIC_BLUR_DATA_URL } from "@/lib/image-helpers";
import { usePairingDataset } from "@/lib/pairing-store";
import type { PairingDish, PairingWine } from "@/types/pairing";

type MatchDetails = {
  score: number;
  reason: string;
};

const buildFallbackMatchMap = (dish: PairingDish, wines: PairingWine[]) => {
  const dishText = [dish.name, dish.description, dish.tags.join(" ")].join(" ").toLowerCase();

  const scored = wines
    .map((wine) => {
      const wineText = [wine.name, wine.description, wine.tags.join(" ")]
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
  for (const item of scored) {
    map.set(item.wineId, {
      score: item.score,
      reason:
        item.score >= 85
          ? "Structure and acidity align well with the dish profile."
          : "Acceptable pairing, but may be less balanced than top matches.",
    });
  }

  return map;
};

export default function PairingPage() {
  const { dataset } = usePairingDataset();
  const dishes = dataset.dishes;
  const wines = dataset.wines;

  const [activeDishId, setActiveDishId] = useState<string>(dishes[0]?.id ?? "");
  const [matchMap, setMatchMap] = useState<Map<string, MatchDetails>>(new Map());
  const [aiStatus, setAiStatus] = useState<"loading" | "ready" | "fallback">("ready");
  const firstClickTracked = useRef(false);
  const openTimestamp = useRef<number>(0);
  const wineListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    openTimestamp.current = performance.now();
    trackEvent("pairing_page_open", { device: "mobile-first" });
  }, []);

  const effectiveDishId =
    activeDishId && dishes.some((dish) => dish.id === activeDishId)
      ? activeDishId
      : dishes[0]?.id ?? "";

  const activeDish = useMemo(
    () => dishes.find((dish) => dish.id === effectiveDishId) ?? dishes[0] ?? null,
    [effectiveDishId, dishes],
  );

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
              name: activeDish.name,
              description: activeDish.description,
              tags: activeDish.tags,
            },
            wines,
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

        setMatchMap(nextMap);
        setAiStatus("ready");

        const topScore = Math.max(...Array.from(nextMap.values()).map((item) => item.score));
        trackEvent("pairing_ai_success", {
          dish_id: activeDish.id,
          top_score: topScore,
          wines_count: wines.length,
        });
      } catch {
        const fallbackMap = buildFallbackMatchMap(activeDish, wines);
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
  }, [activeDish, wines]);

  const selectDish = (dishId: string, source: "cards" | "chips") => {
    setActiveDishId(dishId);
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
            <Link
              href="/v1/admin"
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-gray-200"
            >
              Open Backup V1 Admin
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

      <main className="relative flex flex-1 flex-col overflow-hidden pt-20 lg:flex-row">
        <section className="border-b border-primary/10 bg-background-dark px-4 pt-4 pb-5 lg:hidden">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">Choose Dish</h2>
            <button
              type="button"
              onClick={scrollToWineList}
              className="rounded-full border border-primary/40 px-3 py-1 text-[11px] font-semibold tracking-wide text-primary uppercase"
            >
              To Wines
            </button>
          </div>

          <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
            {dishes.map((dish) => {
              const selected = dish.id === activeDish.id;
              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => selectDish(dish.id, "chips")}
                  className={`whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold ${
                    selected
                      ? "border border-primary/30 bg-primary/15 text-primary"
                      : "border border-white/10 bg-surface-dark text-gray-300"
                  }`}
                >
                  {dish.name}
                </button>
              );
            })}
          </div>

          <article className="mt-3 rounded-xl border border-primary/25 bg-surface-dark p-3">
            <div className="flex gap-3">
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={activeDish.image}
                  alt={activeDish.name}
                  fill
                  quality={66}
                  placeholder="blur"
                  blurDataURL={GENERIC_BLUR_DATA_URL}
                  sizes="64px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">{activeDish.name}</p>
                <p className="line-clamp-2 text-xs text-gray-400">{activeDish.description}</p>
                <p className="mt-1 text-xs font-semibold text-primary">${activeDish.price}</p>
              </div>
            </div>
          </article>
        </section>

        <section className="relative z-10 hidden w-full overflow-y-auto border-b border-primary/10 bg-background-dark p-5 lg:block lg:w-1/2 lg:border-r lg:border-b-0 lg:p-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-3xl font-bold text-white">Menu</h2>
              <p className="text-sm text-gray-400">Select a dish to highlight matching wines.</p>
            </div>
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-white uppercase">
              AI Live
            </span>
          </div>

          <div className="space-y-4 pb-6">
            {dishes.map((dish) => {
              const isActive = dish.id === activeDish.id;

              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => selectDish(dish.id, "cards")}
                  className={`relative flex w-full gap-4 rounded-xl border p-4 text-left shadow-sm transition-all duration-300 ${
                    isActive
                      ? "active-dish-glow border-primary bg-surface-dark"
                      : "border-transparent bg-surface-dark/70 opacity-45 hover:border-primary/30 hover:opacity-100"
                  }`}
                >
                  {isActive ? (
                    <span className="absolute -top-3 -right-2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white">
                      Selected
                    </span>
                  ) : null}

                  <div className={`relative overflow-hidden rounded-lg ${isActive ? "h-32 w-32" : "h-24 w-24"}`}>
                    <Image
                      alt={dish.name}
                      fill
                      quality={66}
                      placeholder="blur"
                      blurDataURL={GENERIC_BLUR_DATA_URL}
                      sizes="128px"
                      src={dish.image}
                      className="object-cover"
                    />
                  </div>

                  <div className="flex flex-1 flex-col justify-between">
                    <div>
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className={`font-bold text-white ${isActive ? "text-xl" : "text-lg"}`}>
                          {dish.name}
                        </h3>
                        <span className="text-lg font-bold text-primary">${dish.price}</span>
                      </div>
                      <p className="text-sm text-gray-400">{dish.description}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {dish.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`rounded px-2 py-0.5 text-[10px] tracking-wider uppercase ${
                            isActive
                              ? "border border-primary/40 bg-primary/10 text-primary"
                              : "border border-gray-700 text-gray-500"
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
          className="w-full overflow-y-auto bg-surface-darker p-4 pb-44 sm:p-5 sm:pb-44 lg:w-1/2 lg:p-8 lg:pb-8"
        >
          <div className="sticky top-0 z-10 mb-4 border-b border-primary/10 bg-surface-darker pb-4 sm:mb-6 sm:pb-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 sm:gap-3">
              <h2 className="flex items-center gap-2 text-xl font-bold text-white sm:gap-3 sm:text-3xl">
                Wine List
                <span className="rounded bg-primary/15 px-2 py-1 text-[10px] font-bold tracking-wider text-primary uppercase sm:text-xs">
                  {activeDish.name}
                </span>
              </h2>
              <span
                className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                  aiStatus === "loading"
                    ? "bg-white/10 text-gray-300"
                    : aiStatus === "fallback"
                      ? "bg-amber-900/35 text-amber-300"
                      : "bg-emerald-900/30 text-emerald-300"
                }`}
              >
                {aiStatus === "loading"
                  ? "AI analyzing"
                  : aiStatus === "fallback"
                    ? "Fallback mode"
                    : "AI ready"}
              </span>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className={`h-full bg-primary ${aiStatus === "loading" ? "w-1/3 animate-pulse" : "w-3/4"}`} />
            </div>
          </div>

          <div className="space-y-3 pb-8 sm:space-y-4">
            {wines.map((wine) => {
              const match = matchMap.get(wine.id);
              const isMatch = Boolean(match);
              const isTopMatch = (match?.score ?? 0) >= 92;

              return (
                <article
                  key={wine.id}
                  className={`relative rounded-xl border p-3 transition-all duration-300 sm:p-4 ${
                    isMatch
                      ? isTopMatch
                        ? "ai-match-glow border-primary bg-surface-dark"
                        : "border-primary/50 bg-surface-dark shadow-[0_0_12px_rgba(209,21,52,0.2)]"
                      : "border-transparent bg-surface-dark/70 opacity-35 grayscale hover:opacity-80"
                  }`}
                >
                  {match ? (
                    <div
                      className={`mb-3 rounded-lg px-3 py-2 text-xs ${
                        isTopMatch
                          ? "border border-primary/20 bg-gradient-to-r from-primary/95 to-rose-600 text-white"
                          : "border border-primary/30 bg-primary/10 text-gray-200"
                      }`}
                    >
                      <p className="font-bold uppercase tracking-wider">AI Match {match.score}%</p>
                      <p className="mt-1 text-sm normal-case tracking-normal">{match.reason}</p>
                    </div>
                  ) : null}

                  <div className="flex gap-3 sm:gap-4">
                    <div className="relative h-28 w-14 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20 sm:h-36 sm:w-16">
                      <Image
                        alt={wine.name}
                        fill
                        quality={64}
                        placeholder="blur"
                        blurDataURL={GENERIC_BLUR_DATA_URL}
                        sizes="64px"
                        src={wine.image}
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    </div>

                    <div className="flex-1">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-base font-bold text-white sm:text-lg">{wine.name}</h3>
                          <p className="text-xs text-primary sm:text-sm">
                            {wine.region} • {wine.year}
                          </p>
                        </div>
                        <p className="text-base font-bold text-white sm:text-lg">${wine.price}</p>
                      </div>

                      <div className="mb-2 flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`material-icons text-xs ${
                              star <= Math.round(wine.rating) ? "text-yellow-500" : "text-gray-700"
                            }`}
                          >
                            star
                          </span>
                        ))}
                        <span className="ml-1 text-xs text-gray-500">({wine.rating})</span>
                      </div>

                      <p className="text-xs text-gray-400 sm:text-sm">{wine.description}</p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          {wine.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded border border-white/10 bg-black/20 px-2 py-1 text-[10px] text-gray-300 sm:text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            trackEvent("pairing_wine_action_click", {
                              dish_id: activeDish.id,
                              wine_id: wine.id,
                              action: isMatch ? "add" : "skip",
                            })
                          }
                          className={`rounded-lg px-4 py-2.5 text-xs font-bold uppercase transition ${
                            isMatch
                              ? "bg-primary text-white hover:bg-primary-dark"
                              : "border border-white/10 text-gray-400 hover:text-white"
                          }`}
                        >
                          {isMatch ? "Add" : "Skip"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <div className="fixed right-3 left-3 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[65] rounded-xl border border-primary/30 bg-[#1a0f11e6] p-2 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={scrollToWineList}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Choose wine for {activeDish.name}
        </button>
      </div>

      <MobileTabBar />
    </div>
  );
}
