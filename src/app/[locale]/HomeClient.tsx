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

// Cuisine values live in EN in the seed/DB and double as filter values, so
// they must stay raw internally; guest-facing labels localize at render time.
// Unknown values fall back to the raw string so new DB entries never blank out.
const CUISINE_PL: Record<string, string> = {
  Spanish: "Hiszpańska",
  Japanese: "Japońska",
  "French Classic": "Francuska klasyka",
  Italian: "Włoska",
  Polish: "Polska",
  "Polish Modern": "Polska nowoczesna",
  "Peruvian Nikkei": "Peruwiańska Nikkei",
};

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
  // Which card shows its full-size scannable QR; null = all thumbnails.
  const [expandedQrSlug, setExpandedQrSlug] = useState<string | null>(null);

  const cuisineLabel = (value: string) => (locale === "pl" ? (CUISINE_PL[value] ?? value) : value);

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

      <main className="mobile-safe-bottom mx-auto w-full max-w-7xl overflow-x-hidden px-4 pt-24 pb-16 sm:px-6 sm:pt-28 lg:px-8">
        <section className="rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(199,159,105,0.18),transparent_35%),rgba(255,255,255,0.03)] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)] sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-3xl">
              <p className="text-xs font-semibold tracking-[0.32em] text-primary uppercase">
                {tx("directoryEyebrow")}
              </p>
              {/* pitch-display owns weight + tracking (Baskerville 400/700).
                  No <em> accent here: directoryTitle also feeds the metadata
                  <title>, so markup in the string would leak into the tab. */}
              <h1 className="pitch-display mt-2 text-[1.9rem] text-white sm:mt-3 sm:text-5xl">
                {tx("directoryTitle")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-300 sm:text-base">
                {tx("directorySubtitle")}
              </p>
              {/* Primary funnel: the tutorial converts curious guests better
                  than the raw directory, so it gets the one gold CTA. */}
              <Link href="/samouczek" className="pitch-cta-primary mt-4 sm:mt-6">
                {tx("tutorialCta")}
              </Link>
            </div>

            <div className="grid w-full gap-3 rounded-[24px] border border-white/10 bg-black/15 p-4 sm:min-w-[280px] sm:w-auto">
              {/* items-end + nowrap labels: a wrapping label ("QR GOTOWE")
                  must not push its numeral off the shared baseline. */}
              <div className="grid grid-cols-3 items-end gap-3 text-center">
                <div>
                  <p className="text-[10px] leading-tight tracking-[0.1em] text-gray-500 uppercase sm:text-[11px] sm:tracking-[0.2em] sm:whitespace-nowrap">{tx("statsRestaurants")}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{catalogRestaurants.length}</p>
                </div>
                <div>
                  <p className="text-[10px] leading-tight tracking-[0.1em] text-gray-500 uppercase sm:text-[11px] sm:tracking-[0.2em] sm:whitespace-nowrap">{tx("statsCities")}</p>
                  <p className="mt-1 text-2xl font-bold text-white">{cityOptions.length - 1}</p>
                </div>
                <div>
                  <p className="text-[10px] leading-tight tracking-[0.1em] text-gray-500 uppercase sm:text-[11px] sm:tracking-[0.2em] sm:whitespace-nowrap">{tx("statsQrReady")}</p>
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
                // Options double as filter values, so only the LABEL localizes.
                localize: cuisineLabel,
              },
              {
                label: tx("filters.city"),
                value: cityFilter,
                onChange: setCityFilter,
                options: cityOptions,
                localize: (value: string) => value,
              },
              {
                label: tx("filters.format"),
                value: formatFilter,
                onChange: setFormatFilter,
                options: formatOptions,
                localize: (value: string) => value,
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
                  // hardcoded #081634f2 dark surface that punched a hole.
                  className="w-full min-w-0 rounded-2xl border px-4 py-3 text-sm"
                  style={{
                    background: "var(--surface-elevated)",
                    borderColor: "var(--gold-hairline-soft)",
                    color: "var(--ink)",
                  }}
                >
                  {/* "All" stays the internal sentinel value; only the
                      visible label is translated. */}
                  {filter.options.map((option) => (
                    <option key={option} value={option}>
                      {option === "All" ? tx("filters.all") : filter.localize(option)}
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
            most map markers behind the catalog column. `isolate z-0` gives
            the section its own stacking context so the z-[400] map chrome
            can never paint over the fixed z-50 nav while scrolling. */}
        <section className="relative isolate z-0 mt-6">
          <article className="rounded-[34px] border border-white/10 bg-black/15 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-5 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.26em] text-gray-500 uppercase">
                  {tx("mapEyebrow")}
                </p>
                <h2 className="pitch-display mt-1 text-2xl text-white">{tx("mapTitle")}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-300">
                {tx("visible", { count: filteredRestaurants.length })}
              </span>
            </div>

            {/* Canvas + selected card share a relative wrapper so the card
                can anchor to the canvas on desktop while sitting in normal
                flow on mobile. */}
            <div className="relative">
              {/* <768px the canvas caps at 340px - the previous ~950px column
                  buried the catalogue a full screen below the fold. */}
              <div
                className="relative h-[340px] overflow-hidden rounded-[30px] border md:h-[620px] lg:h-[700px]"
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
              </div>

              {selectedRestaurant ? (
                // Selected-restaurant card: normal flow under the canvas on
                // mobile (an overlay would eat most of the 340px map), on the
                // always-dark Mapbox satellite layer from md up. Inline styles
                // bypass the light-theme text-white shim so the card stays
                // readable in both themes.
                <div
                  className="z-[400] mt-3 rounded-[20px] border p-3 shadow-2xl backdrop-blur-md sm:rounded-[26px] sm:p-4 md:absolute md:right-3 md:bottom-3 md:left-3 md:mt-0"
                  style={{
                    background: "rgba(22, 13, 15, 0.94)",
                    borderColor: "rgba(255, 255, 255, 0.10)",
                    color: "rgba(255, 255, 255, 0.92)",
                  }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold tracking-[0.22em] uppercase sm:text-[11px] sm:tracking-[0.24em]" style={{ color: "#e1d3b5" }}>
                        {tx("selectedRestaurant")}
                      </p>
                      <h3 className="pitch-display mt-0.5 text-lg sm:mt-1 sm:text-2xl" style={{ color: "#ffffff" }}>
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
                      {cuisineLabel(selectedRestaurant.cuisine)}
                    </div>
                  </div>

                  <p className="mt-2 line-clamp-2 text-xs leading-5 sm:mt-3 sm:line-clamp-none sm:text-sm sm:leading-6" style={{ color: "rgba(244, 237, 224, 0.85)" }}>
                    {t(selectedRestaurant.description, locale)}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-3">
                    <Link
                      href={`/restaurants/${selectedRestaurant.slug}`}
                      className="rounded-full inline-flex min-h-[40px] items-center justify-center px-4 py-2 text-xs font-semibold transition sm:px-5 sm:text-sm"
                      style={{ background: "#ffffff", color: "#0b1f44" }}
                    >
                      {tx("openRestaurant")}
                    </Link>
                    <Link
                      href={`/pairing?restaurant=${selectedRestaurant.slug}`}
                      className="rounded-full border inline-flex min-h-[40px] items-center justify-center px-4 py-2 text-xs font-semibold transition sm:px-5 sm:text-sm"
                      style={{
                        borderColor: "rgba(199, 159, 105, 0.45)",
                        background: "rgba(199, 159, 105, 0.15)",
                        color: "var(--color-accent-gold)",
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
                <h2 className="pitch-display mt-1 text-2xl text-white">{tx("filteredListTitle")}</h2>
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
                    className={`relative rounded-[28px] border-2 p-4 transition ${
                      selected
                        ? "border-primary/60 bg-primary/12 shadow-[0_18px_40px_rgba(199,159,105,0.18)]"
                        : "border-white/8 bg-black/12 hover:border-white/20"
                    }`}
                  >
                    {/* Column layout at ALL widths: in the 2/3-column desktop
                        grid the side-by-side QR squeezed descriptions to a
                        ~122px one-word-per-line strip (audit 2026-07). */}
                    <div className="flex flex-col gap-4">
                      <button
                        type="button"
                        onClick={() => handlePick(restaurant.slug)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <RestaurantFormat
                            format={restaurant.format}
                            typeClassName="rounded-full border border-[var(--hairline-strong)] px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-[var(--ink-soft)] uppercase"
                          />
                          <span className="text-[11px] font-semibold tracking-[0.18em] text-gray-500 uppercase">
                            {restaurant.city}, {restaurant.country}
                          </span>
                        </div>
                        <h3 className="pitch-display mt-3 text-2xl text-white">{t(restaurant.name, locale)}</h3>
                        <p className="mt-2 text-sm leading-6 text-gray-300">
                          {t(restaurant.description, locale)}
                        </p>
                      </button>

                      {/* Compact QR row: the full-size QR + raw URL read as an
                          admin console inside a guest card (audit 2026-07).
                          Tapping the thumbnail toggles the scannable size. */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedQrSlug((current) => (current === restaurant.slug ? null : restaurant.slug))
                        }
                        aria-expanded={expandedQrSlug === restaurant.slug}
                        className="flex shrink-0 items-center gap-3 rounded-[22px] border p-3 text-left"
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
                          fgColor="#081634"
                          level="M"
                          marginSize={0}
                          className={`shrink-0 rounded-xl bg-white transition-all ${
                            expandedQrSlug === restaurant.slug ? "h-32 w-32 p-2 sm:h-40 sm:w-40" : "h-[72px] w-[72px] p-1.5"
                          }`}
                        />
                        <span className="text-[10px] font-semibold tracking-[0.18em] text-gray-400 uppercase">
                          {tx("scanToOpen")}
                        </span>
                      </button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 bg-white/4 px-3 py-1 text-xs text-gray-300">
                        {cuisineLabel(restaurant.cuisine)}
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

                    {/* Raw-URL panel removed: guests scan or tap, they never
                        retype a URL (audit 2026-07). Secondary action is a
                        gold-hairline outline - the old tinted fill read as a
                        disabled button on the cream theme. */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/restaurants/${restaurant.slug}`}
                        className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:bg-gray-200"
                      >
                        {tx("restaurantPageBtn")}
                      </Link>
                      <Link
                        href={`/pairing?restaurant=${restaurant.slug}`}
                        className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-[#c79f69] bg-transparent px-4 py-2 text-sm font-semibold text-ink transition hover:bg-[#c79f69]/10"
                      >
                        {tx("pairingBtn")}
                      </Link>
                    </div>
                  </article>
                );
              })}

              {filteredRestaurants.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-white/12 bg-black/10 px-5 py-10 text-center">
                  <p className="text-lg font-semibold text-white">{tx("emptyTitle")}</p>
                  <p className="mt-2 text-sm text-gray-400">{tx("emptyBody")}</p>
                </div>
              ) : null}
            </div>
          </article>
        </section>
      </main>

      {/* Site footer stays navy in BOTH themes: keep-dark opts out of the
          light-theme surface shims (and restores text-gray-* to cream), the
          inline gradient paints the navy that class-based backgrounds would
          lose to the bg remap. mobile-safe-bottom clears the fixed tab bar. */}
      <footer
        className="keep-dark border-t border-[#c79f69]/40"
        style={{ background: "linear-gradient(180deg, #0b1f44, #081634)" }}
      >
        <div className="mobile-safe-bottom mx-auto flex min-h-[120px] w-full max-w-7xl flex-col justify-center gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="pitch-display text-2xl text-white">Vinovigator AI</p>
          <nav aria-label={tx("footer.navLabel")} className="flex flex-wrap gap-x-7 gap-y-2 text-sm">
            <Link href="/samouczek" className="text-gray-300 underline-offset-4 transition hover:underline">
              {tx("footer.tutorial")}
            </Link>
            <Link href="/pairing" className="text-gray-300 underline-offset-4 transition hover:underline">
              {tx("footer.pairing")}
            </Link>
            <Link href="/pitch" className="text-gray-300 underline-offset-4 transition hover:underline">
              {tx("footer.forRestaurants")}
            </Link>
          </nav>
        </div>
      </footer>

      <MobileTabBar />
    </div>
  );
}
