"use client";

import { useLocale, useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import RestaurantFormat from "@/components/v2/RestaurantFormat";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/localized";
import type { CatalogRestaurant } from "@/lib/restaurant-directory";
import type { Locale } from "@/i18n/routing";

// Leaflet pulls `window` at module-eval, so it must be client-only.
const RestaurantMap = dynamic(() => import("@/components/v2/RestaurantMap"), {
  ssr: false,
  loading: () => (
    <div
      className="flex h-full w-full items-center justify-center rounded-[30px] border text-xs tracking-[0.22em] uppercase"
      style={{ background: "var(--surface-deep)", borderColor: "var(--hairline-strong)", color: "var(--ink-muted)" }}
    >
      Loading map…
    </div>
  ),
});

type FilterValue = "All" | string;

// Data arrives server-side from the DB→seed read-path (resolveRestaurants).
export default function HomeClient({
  initialRestaurants,
}: {
  initialRestaurants: CatalogRestaurant[];
}) {
  const locale = useLocale() as Locale;
  const tx = useTranslations("home");
  const catalogRestaurants = initialRestaurants;
  const cuisineOptions = useMemo(
    () => ["All", ...new Set(catalogRestaurants.map((restaurant) => restaurant.cuisine))],
    [catalogRestaurants],
  );
  const cityOptions = useMemo(
    () => ["All", ...new Set(catalogRestaurants.map((restaurant) => restaurant.city))],
    [catalogRestaurants],
  );
  const formatOptions = useMemo(
    () => ["All", ...new Set(catalogRestaurants.map((restaurant) => restaurant.format))],
    [catalogRestaurants],
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
    [catalogRestaurants, cityFilter, cuisineFilter, formatFilter],
  );

  const effectiveSelectedSlug = filteredRestaurants.some((restaurant) => restaurant.slug === selectedSlug)
    ? selectedSlug
    : filteredRestaurants[0]?.slug ?? "";

  const selectedRestaurant =
    filteredRestaurants.find((restaurant) => restaurant.slug === effectiveSelectedSlug) ??
    filteredRestaurants[0] ??
    null;

  // Refs to each catalog card so we can scroll the selected one into view
  // when the user picks from the map. Keyed by slug; map cleared on
  // unmount via callback ref returning undefined.
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  // Track whether the latest selection came from a USER action (map click,
  // catalog click) vs initial mount - only auto-scroll on user actions to
  // avoid jumping the page on first paint.
  const userPickedRef = useRef(false);
  const handlePick = (slug: string) => {
    userPickedRef.current = true;
    setSelectedSlug(slug);
  };

  useEffect(() => {
    if (!userPickedRef.current) return;
    if (!effectiveSelectedSlug) return;
    const el = cardRefs.current.get(effectiveSelectedSlug);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    userPickedRef.current = false;
  }, [effectiveSelectedSlug]);

  return (
    <div className="min-h-screen bg-background-dark text-gray-100">
      <Navigation />

      <main className="mobile-safe-bottom mx-auto w-full max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <section className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(209,21,52,0.18),transparent_35%),rgba(255,255,255,0.03)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.32em] text-primary uppercase">
                {tx("directoryEyebrow")}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {tx("directoryTitle")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
                {tx("directorySubtitle")}
              </p>
            </div>

            <div className="grid w-full gap-3 rounded-[24px] border border-white/10 bg-black/15 p-4 sm:min-w-[280px] sm:w-auto">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-gray-500 uppercase">{tx("statsRestaurants")}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{catalogRestaurants.length}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-gray-500 uppercase">{tx("statsCities")}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{cityOptions.length - 1}</p>
                </div>
                <div>
                  <p className="text-[11px] tracking-[0.2em] text-gray-500 uppercase">{tx("statsQrReady")}</p>
                  <p className="mt-1 text-2xl font-bold text-white">100%</p>
                </div>
              </div>
              <p className="text-xs leading-6 text-gray-400">{tx("directoryFootnote")}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-[24px] border border-white/10 bg-black/15 p-4 md:grid-cols-3">
            {[
              {
                label: tx("filters.cuisine"),
                value: cuisineFilter,
                onChange: setCuisineFilter,
                options: cuisineOptions,
              },
              {
                label: tx("filters.city"),
                value: cityFilter,
                onChange: setCityFilter,
                options: cityOptions,
              },
              {
                label: tx("filters.format"),
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
                  // Theme-aware: var(--surface-elevated) flips to white on
                  // light theme, var(--ink) keeps text readable. Drops the
                  // hardcoded #130b0df2 dark surface that punched a hole.
                  className="rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    background: "var(--surface-elevated)",
                    borderColor: "var(--gold-hairline-soft)",
                    color: "var(--ink)",
                  }}
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

        {/* Map gets a full-width row at the top so the user can actually see
            restaurant placement across Europe. The catalogue list lives in
            its own section below - the previous side-by-side cramming hid
            most map markers behind the catalog column. */}
        <section className="mt-6">
          <article className="rounded-[34px] border border-white/10 bg-black/15 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.26em] text-gray-500 uppercase">
                  {tx("mapEyebrow")}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">{tx("mapTitle")}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-300">
                {tx("visible", { count: filteredRestaurants.length })}
              </span>
            </div>

            <div
              className="relative h-[520px] overflow-hidden rounded-[30px] border sm:h-[620px] lg:h-[700px]"
              style={{ background: "var(--surface-deep)", borderColor: "var(--hairline-strong)" }}
            >
              <RestaurantMap
                restaurants={filteredRestaurants}
                selectedSlug={effectiveSelectedSlug}
                onSelect={handlePick}
              />

              <div className="pointer-events-none absolute top-3 left-3 z-[400] rounded-full border border-white/10 bg-black/55 px-2.5 py-0.5 text-[10px] font-semibold tracking-[0.22em] text-gray-200 uppercase backdrop-blur sm:top-4 sm:left-4 sm:px-3 sm:py-1 sm:text-[11px]">
                {tx("europe")}
              </div>

              {selectedRestaurant ? (
                // Selected-restaurant overlay sits on the always-dark Mapbox
                // satellite layer. Inline styles bypass the light-theme
                // text-white shim so the card stays readable in both themes.
                <div
                  className="absolute right-2 bottom-2 left-2 z-[400] rounded-[20px] border p-3 shadow-2xl backdrop-blur-md sm:right-3 sm:bottom-3 sm:left-3 sm:rounded-[26px] sm:p-4"
                  style={{
                    background: "rgba(22, 13, 15, 0.94)",
                    borderColor: "rgba(255, 255, 255, 0.10)",
                    color: "rgba(255, 255, 255, 0.92)",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold tracking-[0.22em] uppercase sm:text-[11px] sm:tracking-[0.24em]" style={{ color: "#f4c1c8" }}>
                        {tx("selectedRestaurant")}
                      </p>
                      <h3 className="mt-0.5 text-lg font-bold sm:mt-1 sm:text-2xl" style={{ color: "#ffffff" }}>
                        {t(selectedRestaurant.name, locale)}
                      </h3>
                      <p className="mt-0.5 text-[11px] sm:text-sm" style={{ color: "rgba(244, 237, 224, 0.75)" }}>
                        {selectedRestaurant.city}, {selectedRestaurant.country} •{" "}
                        {selectedRestaurant.format}
                      </p>
                    </div>
                    <div
                      className={`shrink-0 rounded-xl bg-gradient-to-r px-2.5 py-1 text-[11px] font-semibold sm:rounded-2xl sm:px-4 sm:py-2 sm:text-sm ${selectedRestaurant.coverGradient}`}
                      style={{ color: "#ffffff" }}
                    >
                      {selectedRestaurant.cuisine}
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs leading-5 sm:mt-3 sm:line-clamp-none sm:text-sm sm:leading-6" style={{ color: "rgba(244, 237, 224, 0.85)" }}>
                    {t(selectedRestaurant.description, locale)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-3">
                    <Link
                      href={`/restaurants/${selectedRestaurant.slug}`}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm"
                      style={{ background: "#ffffff", color: "#1a0f11" }}
                    >
                      {tx("openRestaurant")}
                    </Link>
                    <Link
                      href={`/pairing?restaurant=${selectedRestaurant.slug}`}
                      className="rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm"
                      style={{
                        borderColor: "rgba(209, 21, 52, 0.45)",
                        background: "rgba(209, 21, 52, 0.15)",
                        color: "#ff6680",
                      }}
                    >
                      {tx("openPairing")}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
          </article>
        </section>

        {/* Catalogue list moved to its own section below the map */}
        <section className="mt-6">
          <article className="rounded-[34px] border border-white/10 bg-black/15 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.26em] text-gray-500 uppercase">
                  {tx("filteredListEyebrow")}
                </p>
                <h2 className="mt-1 text-2xl font-bold text-white">{tx("filteredListTitle")}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-300">
                {tx("filteredListSubtitle")}
              </span>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRestaurants.map((restaurant) => {
                const selected = restaurant.slug === effectiveSelectedSlug;

                return (
                  <article
                    key={restaurant.slug}
                    ref={(el) => {
                      if (el) cardRefs.current.set(restaurant.slug, el);
                      else cardRefs.current.delete(restaurant.slug);
                    }}
                    // scroll-margin-top so smooth-scroll lands below the
                    // sticky nav (h-20 = 5rem); without it the card hides
                    // under the navbar.
                    style={{ scrollMarginTop: "6.5rem" }}
                    className={`relative rounded-[28px] border p-4 transition ${
                      selected
                        ? "border-primary/55 bg-primary/12 shadow-[0_0_0_2px_rgba(209,21,52,0.35),0_18px_40px_rgba(209,21,52,0.18)]"
                        : "border-white/8 bg-black/12 hover:border-white/20"
                    }`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <button
                        type="button"
                        onClick={() => handlePick(restaurant.slug)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <RestaurantFormat
                            format={restaurant.format}
                            typeClassName={`rounded-full bg-gradient-to-r px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-white uppercase ${restaurant.coverGradient}`}
                          />
                          <span className="text-[11px] font-semibold tracking-[0.18em] text-gray-500 uppercase">
                            {restaurant.city}, {restaurant.country}
                          </span>
                        </div>
                        <h3 className="mt-3 text-2xl font-bold text-white">{t(restaurant.name, locale)}</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-300">
                          {t(restaurant.description, locale)}
                        </p>
                      </button>

                      <div
                        className="grid shrink-0 gap-2 rounded-[22px] border p-3 text-center"
                        style={{
                          background: "var(--surface-deep)",
                          borderColor: "var(--gold-hairline-soft)",
                          color: "var(--ink-soft)",
                        }}
                      >
                        <QRCodeSVG
                          value={restaurant.restaurantUrl}
                          role="img"
                          aria-label={`QR code for ${t(restaurant.name, locale)}`}
                          bgColor="#ffffff"
                          fgColor="#150a0c"
                          level="M"
                          marginSize={0}
                          className="h-24 w-24 rounded-xl bg-white p-2"
                        />
                        <span className="text-[10px] font-semibold tracking-[0.18em] text-gray-400 uppercase">
                          {tx("scanToOpen")}
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
                        {tx("dishes", { count: restaurant.dishes.length })}
                      </span>
                      <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-gray-300">
                        {tx("wines", { count: restaurant.wines.length })}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 rounded-[24px] border border-white/8 bg-black/16 p-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold tracking-[0.22em] text-gray-500 uppercase">
                          {tx("directUrl")}
                        </p>
                        <p className="mt-1 truncate text-sm text-gray-300">{restaurant.restaurantUrl}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/restaurants/${restaurant.slug}`}
                          className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-200"
                        >
                          {tx("restaurantPageBtn")}
                        </Link>
                        <Link
                          href={`/pairing?restaurant=${restaurant.slug}`}
                          className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/18"
                        >
                          {tx("pairingBtn")}
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
