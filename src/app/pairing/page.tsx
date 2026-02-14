"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import MobileTabBar from "@/components/v2/MobileTabBar";
import { trackEvent } from "@/lib/analytics";
import { GENERIC_BLUR_DATA_URL } from "@/lib/image-helpers";

type Dish = {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  tags: string[];
};

type Wine = {
  id: string;
  name: string;
  region: string;
  year: number;
  price: number;
  rating: number;
  description: string;
  image: string;
  tags: string[];
};

type MatchDetails = {
  score: number;
  reason: string;
};

const DISHES: Dish[] = [
  {
    id: "escargots",
    name: "Escargots de Bourgogne",
    price: 18,
    description:
      "Burgundy snails with garlic herb butter, parsley and toasted baguette points.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBhlI46dafXSZ08utjSWbYOYBXZcyqovonosZ2MUis2T4FrSvjy7_Er5VMFJGAyjeWp6cx4bAhd_fI7SJMDIIwahIUPZlC02XtIhiDwCHmPSxPugT4iWUD67WMW99bbqs2xkNY5bYvdOaPa6jOirgJHjo9wV0NTJewH4our6G4GtxHwO9VnE0K3h93WLpEAD80eTfNnFdE31B3kcA4ndUFvOistF3Se_VuL9iOVmF5AN-mDj830CgfHP0aDivk8iqNlJQeBWp8M6L0",
    tags: ["Starter", "Classic", "Garlic"],
  },
  {
    id: "duck-confit",
    name: "Duck Confit",
    price: 34,
    description:
      "Slow-cooked duck leg with crispy skin, sarladaise potatoes and thyme jus.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCPhT2eBSA_1VVLpnQm9-cravzJ5Gc6FyawGxH5Takx28R2xtCFpag0eczWbZHEqE3gyaMGP0cvt9nLzATLU6A-7LS1erp38xnUTU91m3FZDe-dnxX88rni9PsT8essOHKPlgzsFX52buk-L2YJNIFb8moz3A5MaFooxURC6ri2hJ1J6sH5vfOLDCW3aU_dz9FOz9D9602DKJ_AY9GA3Z1eoG8bqbSgyRnKXiyjYHZzuIfZUVUIkLabvoLkmxtJ_IzNH_obOFeSUSQ",
    tags: ["Main", "Rich", "Savory"],
  },
  {
    id: "beef-tartare",
    name: "Beef Tartare",
    price: 22,
    description:
      "Hand-cut beef fillet, capers, shallots, egg yolk and house spice blend.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBE3Sa94YOEcabLhKzWAZ1hVizzQofzK2Z4E5bDpnb40C_Y7kjftpAIvfPRUvuRTv9i2R4yl2Jyas9yYjBSdg-TB95Y5sHjwlgXp0C5qu1WuvXdmBwrewbREclI2Qm3t1GSI7I2tRy0h0-uJWU7AE8RcD4OIZSj_MCLqex08-Yw5sMlLAY610w_NvRLCYyHK30eYl_t2qEEz-6QioSMB_5z-9TrP1ivcg5AOiYglAF-KcAtKAuyc_s8SkJBIcMDsOL9hhwBpVrU47c",
    tags: ["Starter", "Raw", "Peppery"],
  },
  {
    id: "scallops",
    name: "Seared Scallops",
    price: 28,
    description: "Jumbo scallops, cauliflower puree, truffle oil and micro greens.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAaiwxSmTLYTg2ZH3EFQxN-shWqR6ZLwQpI0z5SMPyJTaXY2mMiVVpwoVF-pqkdZU3upPy3La9j4mQfCanZGieFBcp6xyeSrSY82SN97CSDaaShFsNj7aA9cHnJxWOdNjYl13uEmlgRGlUWJTDIeFbl6lwNJQP547qRRdN-Zk43iFIZUevpZz0PNN2dQKNOgJxv0hPw1NuOXYzxB8zVyfrewxB1XetEi7on87zLHr9jOrkiMkRF0WT6CPcSqn2iO4DTpH263EN9O6A",
    tags: ["Main", "Seafood", "Delicate"],
  },
];

const WINES: Wine[] = [
  {
    id: "riesling",
    name: "Trimbach Riesling",
    region: "Alsace, France",
    year: 2020,
    price: 52,
    rating: 4.8,
    description: "Bone-dry profile with mineral finish and focused citrus backbone.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuABMH3ZAPvQDWYLpx-j0KtibgdkAUtyn9irKC3oXRspQSs0L9BsBfegaa05g4i_0tSTAW2oZUOVeLU0TtyFc1K6gp9TfjjgZ7Lh0uRB-UYI67OyHB5bXgnk2CgEXCNZJm2Su_74shDXO5hQdBWcAooOCdq4ysIJzg54UF46RvRo01GL2ZqihghrKbGQqaoITAMvMzcLiiJaVn6TBq2OkAquPEoUQVI81Wgbb-9V35UAkU0E365Iug6VT10azf1carabk54uYi1aZ9Q",
    tags: ["Dry", "High Acid"],
  },
  {
    id: "pinot",
    name: "Cristom Pinot Noir",
    region: "Willamette Valley, USA",
    year: 2018,
    price: 68,
    rating: 4.2,
    description: "Red cherry fruit, bright acidity and earthy undertones.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDE5USocOgYDhITeOQgMjG7LsiFuP3dqCZ6ueQfcYZ8fhmANSDP1Ms-UZ9B9oJVJPYSOaZ3VpdtN3zyNF8TlHglSTJVg9gHSm_0tFfHPX5s97iOrE5dkxl8WQVXA0nFYyNZWuN2uKMWMhyYj5Bo2XsLZP1kAg3uWQqsMZZWtxGUHxxvebDE7WZyPDwuWr3r-VBADpbh-N9Sqxz6jI6vK_L0e7aPNXfeLMb5unfSqT2DCc9df0kvGi7FH92cvQDILKSbktOz8E-Xxjk",
    tags: ["Light Body", "Earthy"],
  },
  {
    id: "cabernet",
    name: "Stag's Leap Cabernet",
    region: "Napa Valley, USA",
    year: 2019,
    price: 85,
    rating: 4.5,
    description: "Powerful tannins and dark fruit built for heavier proteins.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0K331aFTTh8xf47OiTmQkjzYyZgsVD8dtLxHbYmrVTeRYnzM9_sxSUJNLifZ7_opq23tVHQwU759mDWEjQC09iYiQIw7WnQmDCo82059t1Elow-QvBZreisUpw7R37nPZGSPem6SAgjbQsp7J8EKLHZVJyIOg2Fa2GO67LBWEF1MdpmF3llAdkLBrQy2Wz24RK7T5Z7Jo7BthcvqGi_Gzm_KZROTfmpEl17VY34aF6paOjoGOelftLHRxt0AGBc4zkKmYCt2tB7Y",
    tags: ["Bold", "Tannic"],
  },
  {
    id: "rose",
    name: "Chateau d'Esclans Rose",
    region: "Provence, France",
    year: 2021,
    price: 45,
    rating: 4,
    description: "Crisp and floral with a light body and summer-fruit profile.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBTbxB_RLGGuNNlEY6_aWuM1r77Q-7NQwx10_8Y_xN-XYN6hS0sMOpNmzpTvTNYMpWx4NIGkf-fEv4DIhN8O8y5hsTrWAplmhMkwsEOFhpMyfLP5c5w5pID7cRlk8quUWEF70XRhU38CCLnXTghZt1pykh4bkZK0OKa3EG56NHBS3LDlOy0CXoZCORtSZZe2mSMjK7GvAntDHQWy8RVWuqVtaSUUsluhysKaKk7N_OPwl-iURyfGpR3lun0WfF_nkagtyvx7PU2kQs",
    tags: ["Crisp", "Fruity"],
  },
];

const FALLBACK_MATCHES: Record<string, MatchDetails[]> = {
  "duck-confit": [
    {
      score: 98,
      reason: "High acidity slices through duck fat and lifts savory herbs.",
    },
    {
      score: 95,
      reason: "Red-fruit and earth mirror the confit depth without overpowering.",
    },
  ],
  escargots: [
    {
      score: 96,
      reason: "Citrus + minerality balance garlic butter and parsley freshness.",
    },
    {
      score: 74,
      reason: "Fresh but lighter than the butter texture needs.",
    },
  ],
  "beef-tartare": [
    {
      score: 92,
      reason: "Bright acidity and gentle tannin support raw beef and capers.",
    },
    {
      score: 70,
      reason: "Structure works, but tannins can dominate texture.",
    },
  ],
  scallops: [
    {
      score: 90,
      reason: "Mineral edge supports seafood sweetness and truffle notes.",
    },
    {
      score: 83,
      reason: "Light red-berry aromatics play well with delicate scallops.",
    },
  ],
};

const buildFallbackMatchMap = (dishId: string) => {
  const matchMap = new Map<string, MatchDetails>();
  const fallback = FALLBACK_MATCHES[dishId] ?? [];

  fallback.forEach((item, index) => {
    const wineId = WINES[index]?.id;
    if (wineId) {
      matchMap.set(wineId, item);
    }
  });

  return matchMap;
};

export default function PairingPage() {
  const [activeDishId, setActiveDishId] = useState<string>("duck-confit");
  const [matchMap, setMatchMap] = useState<Map<string, MatchDetails>>(
    () => buildFallbackMatchMap("duck-confit"),
  );
  const [aiStatus, setAiStatus] = useState<"loading" | "ready" | "fallback">("ready");
  const firstClickTracked = useRef(false);
  const openTimestamp = useRef<number>(0);
  const wineListRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    openTimestamp.current = performance.now();
    trackEvent("pairing_page_open", { device: "mobile-first" });
  }, []);

  const activeDish = useMemo(
    () => DISHES.find((dish) => dish.id === activeDishId) ?? DISHES[0],
    [activeDishId],
  );

  useEffect(() => {
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
            wines: WINES,
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
          throw new Error("AI returned empty matches");
        }

        setMatchMap(nextMap);
        setAiStatus("ready");
        trackEvent("pairing_ai_success", {
          dish_id: activeDish.id,
          top_score: Math.max(...Array.from(nextMap.values()).map((item) => item.score)),
        });
      } catch {
        const fallbackMap = buildFallbackMatchMap(activeDish.id);
        setMatchMap(fallbackMap);
        setAiStatus("fallback");
        trackEvent("pairing_ai_fallback", { dish_id: activeDish.id });
      }
    };

    void loadAiMatches();

    return () => {
      controller.abort();
    };
  }, [activeDish]);

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
    trackEvent("pairing_scroll_to_wines", { dish_id: activeDish.id });
  };

  return (
    <div className="mobile-safe-bottom flex min-h-screen flex-col overflow-hidden bg-background-dark text-gray-200 selection:bg-primary selection:text-white">
      <header className="glass-nav z-20 flex h-16 shrink-0 items-center justify-between border-b border-primary/20 px-4 shadow-md sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded bg-primary text-sm font-bold text-white"
          >
            S
          </Link>
          <h1 className="text-base font-bold tracking-tight text-white sm:text-lg">
            Sommelier AI Pairing Room
          </h1>
        </div>
        <div className="flex items-center gap-4 text-xs sm:text-sm">
          <Link href="/" className="text-gray-300 transition hover:text-primary">
            Discover
          </Link>
          <Link href="/v1/admin" className="text-gray-300 transition hover:text-primary">
            Admin
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
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
            {DISHES.map((dish) => {
              const selected = dish.id === activeDish.id;
              return (
                <button
                  key={dish.id}
                  type="button"
                  onClick={() => selectDish(dish.id, "chips")}
                  className={`whitespace-nowrap rounded-full px-3 py-2 text-xs font-semibold ${
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
            {DISHES.map((dish) => {
              const isActive = activeDishId === dish.id;

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
          className="w-full overflow-y-auto bg-surface-darker p-4 pb-28 sm:p-5 lg:w-1/2 lg:p-8"
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
            {WINES.map((wine) => {
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
                          className={`rounded-lg px-3 py-2 text-[10px] font-bold uppercase transition sm:text-xs ${
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
