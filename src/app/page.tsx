"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { catalogRestaurants } from "@/lib/restaurant-directory";

type FilterValue = "All" | string;

export default function Home() {
  const cuisineOptions = useMemo(
    () => ["All", ...new Set(catalogRestaurants.map((restaurant) => restaurant.cuisine))],
    [],
  );
  const cityOptions = useMemo(
    () => ["All", ...new Set(catalogRestaurants.map((restaurant) => restaurant.city))],
    [],
  );
  const formatOptions = useMemo(
    () => ["All", ...new Set(catalogRestaurants.map((restaurant) => restaurant.format))],
    [],
  );

  const [cuisineFilter, setCuisineFilter] = useState<FilterValue>("All");
  const [cityFilter, setCityFilter] = useState<FilterValue>("All");
  const [formatFilter, setFormatFilter] = useState<FilterValue>("All");
  const [selectedSlug, setSelectedSlug] = useState<string>(catalogRestaurants[0]?.slug ?? "");

  const filteredRestaurants = useMemo(
    () =>
      catalogRestaurants.filter((restaurant) => {
        const cuisinePass = cuisineFilter === "All" || restaurant.cuisine === cuisineFilter;
        const cityPass = cityFilter === "All" || restaurant.city === cityFilter;
        const formatPass = formatFilter === "All" || restaurant.format === formatFilter;

        return cuisinePass && cityPass && formatPass;
      }),
    [cityFilter, cuisineFilter, formatFilter],
  );

  const effectiveSelectedSlug = filteredRestaurants.some((restaurant) => restaurant.slug === selectedSlug)
    ? selectedSlug
    : filteredRestaurants[0]?.slug ?? "";

  const selectedRestaurant =
    filteredRestaurants.find((restaurant) => restaurant.slug === effectiveSelectedSlug) ??
    filteredRestaurants[0] ??
    null;

  return (
    <div className="min-h-screen bg-background-dark text-gray-100">
      <Navigation />

      <main className="mobile-safe-bottom mx-auto w-full max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <section className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(209,21,52,0.18),transparent_35%),rgba(255,255,255,0.03)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.32em] text-primary uppercase">
                Restaurant Directory
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Map restaurants across Europe, filter the list, open a restaurant page, or jump
                directly into pairing.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
                Each restaurant has a unique subpage and its own QR code. Scan the code and open
                the page directly on a phone without passing through the homepage.
              </p>
            </div>

            <div className="grid min-w-[280px] gap-3 rounded-[24px] border border-white/10 bg-black/15 p-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-gray-500 uppercase">Restaurants</p>
                  <p className="mt-1 text-2xl font-bold text-white">{catalogRestaurants.length}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-gray-500 uppercase">Cities</p>
                  <p className="mt-1 text-2xl font-bold text-white">{cityOptions.length - 1}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-gray-500 uppercase">QR Ready</p>
                  <p className="mt-1 text-2xl font-bold text-white">100%</p>
                </div>
              </div>
              <p className="text-xs leading-6 text-gray-400">
                Current seed covers Italy, France, Spain, Denmark, and Portugal with cuisine mix
                and dedicated URLs.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-[24px] border border-white/10 bg-black/15 p-4 md:grid-cols-3">
            {[
              {
                label: "Cuisine",
                value: cuisineFilter,
                onChange: setCuisineFilter,
                options: cuisineOptions,
              },
              {
                label: "City",
                value: cityFilter,
                onChange: setCityFilter,
                options: cityOptions,
              },
              {
                label: "Format",
                value: formatFilter,
                onChange: setFormatFilter,
                options: formatOptions,
              },
            ].map((filter) => (
              <label key={filter.label} className="grid gap-2">
                <span className="text-[11px] font-semibold tracking-[0.22em] text-gray-500 uppercase">
                  {filter.label}
                </span>
                <select
                  value={filter.value}
                  onChange={(event) => filter.onChange(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-[#130b0df2] px-4 py-3 text-sm text-white"
                >
                  {filter.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,0.98fr)_minmax(0,1.02fr)]">
          <article className="rounded-[34px] border border-white/10 bg-black/15 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.26em] text-gray-500 uppercase">
                  Map
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">Europe overview</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-300">
                {filteredRestaurants.length} visible
              </span>
            </div>

            <div className="relative aspect-[4/3] overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_18%_22%,rgba(209,21,52,0.22),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(197,160,89,0.18),transparent_30%),linear-gradient(180deg,#221316_0%,#130a0b_100%)]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px]" />
              <svg
                viewBox="0 0 100 70"
                className="absolute inset-0 h-full w-full opacity-50"
                aria-hidden="true"
              >
                <path
                  d="M10 52 L18 43 L26 44 L32 36 L41 36 L46 29 L57 25 L63 17 L73 18 L78 24 L84 25 L86 32 L80 36 L74 36 L70 40 L63 40 L58 47 L48 51 L39 50 L34 56 L27 58 L18 58 Z"
                  fill="rgba(255,255,255,0.06)"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="0.9"
                />
                <path
                  d="M15 61 L19 63 L21 66 L18 68 L13 66 Z"
                  fill="rgba(255,255,255,0.05)"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="0.8"
                />
                <path
                  d="M60 44 L64 47 L69 46 L72 49 L68 53 L61 52 Z"
                  fill="rgba(255,255,255,0.04)"
                  stroke="rgba(255,255,255,0.08)"
                  strokeWidth="0.8"
                />
              </svg>

              <div className="absolute top-4 left-4 rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-gray-300 uppercase">
                Europe
              </div>

              {filteredRestaurants.map((restaurant) => {
                const selected = restaurant.slug === effectiveSelectedSlug;

                return (
                  <button
                    key={restaurant.slug}
                    type="button"
                    onClick={() => setSelectedSlug(restaurant.slug)}
                    className="group absolute -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${restaurant.mapX}%`, top: `${restaurant.mapY}%` }}
                  >
                    <span
                      className={`absolute -inset-3 rounded-full transition ${
                        selected ? "bg-primary/18 blur-md" : "bg-transparent"
                      }`}
                    />
                    <span
                      className={`relative flex h-4 w-4 items-center justify-center rounded-full border-2 transition ${
                        selected
                          ? "border-white bg-primary"
                          : "border-white/60 bg-black/50 group-hover:bg-primary/80"
                      }`}
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    </span>
                  </button>
                );
              })}

              {selectedRestaurant ? (
                <div className="absolute right-3 bottom-3 left-3 rounded-[26px] border border-white/10 bg-[#160d0ff0] p-4 shadow-2xl backdrop-blur-md">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.24em] text-primary uppercase">
                        Selected restaurant
                      </p>
                      <h3 className="mt-1 text-2xl font-bold text-white">
                        {selectedRestaurant.name}
                      </h3>
                      <p className="mt-1 text-sm text-gray-400">
                        {selectedRestaurant.city}, {selectedRestaurant.country} • {" "}
                        {selectedRestaurant.format}
                      </p>
                    </div>
                    <div
                      className={`rounded-2xl bg-gradient-to-r px-4 py-2 text-sm font-semibold text-white ${selectedRestaurant.coverGradient}`}
                    >
                      {selectedRestaurant.cuisine}
                    </div>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-gray-300">
                    {selectedRestaurant.description}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/restaurants/${selectedRestaurant.slug}`}
                      className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-background-dark transition hover:bg-gray-200"
                    >
                      Open restaurant page
                    </Link>
                    <Link
                      href={`/pairing?restaurant=${selectedRestaurant.slug}`}
                      className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/18"
                    >
                      Open pairing
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </article>

          <article className="rounded-[34px] border border-white/10 bg-black/15 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.26em] text-gray-500 uppercase">
                  Filtered list
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">Restaurants</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-300">
                Unique URLs + QR
              </span>
            </div>

            <div className="hide-scrollbar flex max-h-[820px] flex-col gap-4 overflow-y-auto pr-1">
              {filteredRestaurants.map((restaurant) => {
                const selected = restaurant.slug === effectiveSelectedSlug;

                return (
                  <article
                    key={restaurant.slug}
                    className={`rounded-[28px] border p-4 transition ${
                      selected
                        ? "border-primary/35 bg-primary/8 shadow-[0_0_0_1px_rgba(209,21,52,0.2)]"
                        : "border-white/8 bg-black/12"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => setSelectedSlug(restaurant.slug)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`rounded-full bg-gradient-to-r px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-white uppercase ${restaurant.coverGradient}`}
                          >
                            {restaurant.format}
                          </span>
                          <span className="text-[11px] font-semibold tracking-[0.18em] text-gray-500 uppercase">
                            {restaurant.city}, {restaurant.country}
                          </span>
                        </div>
                        <h3 className="mt-3 text-2xl font-bold text-white">{restaurant.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-300">
                          {restaurant.description}
                        </p>
                      </button>

                      <div className="grid shrink-0 gap-2 rounded-[22px] border border-white/10 bg-[#130b0df0] p-3 text-center">
                        <Image
                          src={restaurant.qrUrl}
                          alt={`QR code for ${restaurant.name}`}
                          width={96}
                          height={96}
                          unoptimized
                          className="h-24 w-24 rounded-xl bg-white p-2"
                        />
                        <span className="text-[10px] font-semibold tracking-[0.18em] text-gray-400 uppercase">
                          Scan to open
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-gray-300">
                        {restaurant.cuisine}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-gray-300">
                        {restaurant.district}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-gray-300">
                        {restaurant.dishes.length} dishes
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-gray-300">
                        {restaurant.wines.length} wines
                      </span>
                    </div>

                    <div className="mt-4 grid gap-3 rounded-[24px] border border-white/8 bg-black/16 p-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.22em] text-gray-500 uppercase">
                          Direct URL
                        </p>
                        <p className="mt-1 truncate text-sm text-gray-300">{restaurant.restaurantUrl}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/restaurants/${restaurant.slug}`}
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-background-dark transition hover:bg-gray-200"
                        >
                          Restaurant page
                        </Link>
                        <Link
                          href={`/pairing?restaurant=${restaurant.slug}`}
                          className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/18"
                        >
                          Pairing
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}

              {filteredRestaurants.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/12 bg-black/10 px-5 py-10 text-center">
                  <p className="text-lg font-semibold text-white">No restaurants match the current filters.</p>
                  <p className="mt-2 text-sm text-gray-400">
                    Reset one of the filters and the list will repopulate.
                  </p>
                </div>
              ) : null}
            </div>
          </article>
        </section>
      </main>

      <MobileTabBar />
    </div>
  );
}
