"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

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

const MATCHES: Record<string, Array<{ wineId: string; score: number; reason: string }>> = {
  "duck-confit": [
    {
      wineId: "riesling",
      score: 98,
      reason: "High acidity slices through duck fat and lifts savory herbs.",
    },
    {
      wineId: "pinot",
      score: 95,
      reason: "Red-fruit and earth mirror the confit depth without overpowering.",
    },
  ],
  escargots: [
    {
      wineId: "riesling",
      score: 96,
      reason: "Citrus + minerality balance garlic butter and parsley freshness.",
    },
    {
      wineId: "rose",
      score: 74,
      reason: "Fresh but lighter than the butter texture needs.",
    },
  ],
  "beef-tartare": [
    {
      wineId: "pinot",
      score: 92,
      reason: "Bright acidity and gentle tannin support raw beef and capers.",
    },
    {
      wineId: "cabernet",
      score: 70,
      reason: "Structure works, but tannins can dominate texture.",
    },
  ],
  scallops: [
    {
      wineId: "riesling",
      score: 90,
      reason: "Mineral edge supports seafood sweetness and truffle notes.",
    },
    {
      wineId: "rose",
      score: 83,
      reason: "Light red-berry aromatics play well with delicate scallops.",
    },
  ],
};

export default function PairingPage() {
  const [activeDishId, setActiveDishId] = useState<string>("duck-confit");

  const activeDish = useMemo(
    () => DISHES.find((dish) => dish.id === activeDishId) ?? DISHES[0],
    [activeDishId],
  );

  const matchMap = useMemo(() => {
    const entries = MATCHES[activeDish.id] ?? [];
    return new Map(entries.map((item) => [item.wineId, item]));
  }, [activeDish.id]);

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-background-dark text-gray-200 selection:bg-primary selection:text-white">
      <header className="glass-nav z-20 flex h-16 shrink-0 items-center justify-between border-b border-primary/20 px-4 shadow-md sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded bg-primary text-sm font-bold text-white"
          >
            S
          </Link>
          <h1 className="text-lg font-bold tracking-tight text-white">Sommelier AI Pairing Room</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-gray-300 transition hover:text-primary">
            Discover
          </Link>
          <Link href="/v1" className="text-gray-300 transition hover:text-primary">
            Backup V1
          </Link>
        </div>
      </header>

      <main className="relative flex flex-1 flex-col overflow-hidden lg:flex-row">
        <section className="relative z-10 w-full overflow-y-auto border-b border-primary/10 bg-background-dark p-5 lg:w-1/2 lg:border-r lg:border-b-0 lg:p-8">
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
                  onClick={() => setActiveDishId(dish.id)}
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

        <section className="w-full overflow-y-auto bg-surface-darker p-5 lg:w-1/2 lg:p-8">
          <div className="sticky top-0 z-10 mb-6 border-b border-primary/10 bg-surface-darker pb-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-3 text-3xl font-bold text-white">
                Wine List
                <span className="rounded bg-primary/15 px-2 py-1 text-xs font-bold tracking-wider text-primary uppercase">
                  {activeDish.name}
                </span>
              </h2>
              <Link
                href="/v1/admin"
                className="text-xs font-semibold text-primary uppercase hover:text-rose-300"
              >
                Open Admin
              </Link>
            </div>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-1/3 animate-pulse bg-primary" />
            </div>
          </div>

          <div className="space-y-4 pb-8">
            {WINES.map((wine) => {
              const match = matchMap.get(wine.id);
              const isMatch = Boolean(match);
              const isTopMatch = (match?.score ?? 0) >= 95;

              return (
                <article
                  key={wine.id}
                  className={`relative rounded-xl border p-4 transition-all duration-300 ${
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

                  <div className="flex gap-4">
                    <div className="relative h-36 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/20">
                      <Image alt={wine.name} fill sizes="64px" src={wine.image} className="object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    </div>

                    <div className="flex-1">
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-white">{wine.name}</h3>
                          <p className="text-sm text-primary">
                            {wine.region} • {wine.year}
                          </p>
                        </div>
                        <p className="text-lg font-bold text-white">${wine.price}</p>
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

                      <p className="text-sm text-gray-400">{wine.description}</p>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          {wine.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded border border-white/10 bg-black/20 px-2 py-1 text-xs text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button
                          type="button"
                          className={`rounded-lg px-3 py-2 text-xs font-bold uppercase transition ${
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
    </div>
  );
}
