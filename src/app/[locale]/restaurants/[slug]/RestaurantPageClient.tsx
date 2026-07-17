"use client";

/**
 * Per-venue page - premium editorial pass.
 *
 * Aesthetic: wine-bar tasting brochure. Hero lands with a 1s staggered
 * cascade (cuisine pills → name → description → CTAs → QR), each menu/wine
 * row has a gold underline that draws on hover, suggested pairings sit on
 * ribbon cards (gold notch + ❦ watermark). All visual placeholders are
 * inline SVG - no external images. Mobile gets a sticky pairing CTA + a
 * "Listen to sommelier" floating link on desktop top-right.
 */

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import RestaurantFormat from "@/components/v2/RestaurantFormat";
import { useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import DishMonogramSVG from "@/components/v2/DishMonogramSVG";
import WineBottleSVG from "@/components/v2/WineBottleSVG";
import RestaurantPairingPanel from "@/components/v2/RestaurantPairingPanel";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/localized";
import { getDishImage, getWineImage } from "@/lib/food-photos";
import type { CatalogRestaurant } from "@/lib/restaurant-directory";
import type { Locale } from "@/i18n/routing";

// Dish categories arrive as raw EN vocabulary (MAIN/DESSERT/...) and were
// printed verbatim on the PL guest menu (audit 2026-07). Render-time map,
// unknown values fall back to the raw string.
const CATEGORY_PL: Record<string, string> = {
  main: "danie główne",
  starter: "przystawka",
  dessert: "deser",
  soup: "zupa",
  pasta: "makaron",
  salad: "sałatka",
  seafood: "owoce morza",
  tapas: "tapas",
  signature: "danie popisowe",
  aperitif: "aperitif",
  grill: "z grilla",
  side: "dodatek",
  cold: "na zimno",
  fried: "smażone",
  game: "dziczyzna",
  rice: "ryż",
  vegetarian: "wegetariańskie",
  noodles: "makaron ryżowy",
  sushi: "sushi",
};
const categoryLabel = (category: string, locale: string) =>
  locale === "pl" ? (CATEGORY_PL[category.trim().toLowerCase()] ?? category) : category;

// Cuisine + country eyebrows are raw EN in the seed/DB (SPANISH, Spain…) and
// leaked on the PL hero (audit 2026-07 re-run). Same render-time pattern.
const CUISINE_PL: Record<string, string> = {
  spanish: "hiszpańska", japanese: "japońska", "french classic": "francuska klasyka",
  italian: "włoska", polish: "polska", "polish modern": "polska nowoczesna",
  "peruvian nikkei": "peruwiańska nikkei",
};
const COUNTRY_PL: Record<string, string> = {
  spain: "Hiszpania", japan: "Japonia", france: "Francja", italy: "Włochy",
  poland: "Polska", peru: "Peru", germany: "Niemcy", portugal: "Portugalia",
};
const cuisineLabel = (v: string, locale: string) =>
  locale === "pl" ? (CUISINE_PL[v.trim().toLowerCase()] ?? v) : v;
const countryLabel = (v: string, locale: string) =>
  locale === "pl" ? (COUNTRY_PL[v.trim().toLowerCase()] ?? v) : v;


export default function RestaurantPageClient({
  slug,
  restaurant,
}: {
  slug: string;
  restaurant: CatalogRestaurant | null;
}) {
  const tx = useTranslations("restaurant");
  const lng = useLocale() as Locale;
  // Pairing panel is integrated; track which dish the user clicked from
  // the menu list. Starts EMPTY on purpose: auto-selecting dishes[0] kept
  // the mobile peek chip permanently stacked on the tab bar (~23% of a
  // 390px viewport before any interaction — audit 2026-07). The panel's
  // empty state invites the first pick instead.
  const [activeDishId, setActiveDishId] = useState<string | null>(null);

  // Owner-dashboard signal: a guest opened this restaurant's page (the QR
  // landing). Once per mount; slug resolves to restaurant_id server-side.
  useEffect(() => {
    if (!restaurant) return;
    // ?table=N comes from the printed per-table QR codes — lets the owner
    // dashboard attribute scans to tables.
    const table = new URLSearchParams(window.location.search).get("table");
    trackEvent("restaurant_view", {
      restaurant_slug: slug,
      ...(table ? { table } : {}),
    });
  }, [slug, restaurant]);

  const pickDish = (dishId: string) => {
    setActiveDishId(dishId);
    trackEvent("dish_select", { restaurant_slug: slug, dish_ext_id: dishId });
  };

  if (!restaurant) {
    return (
      <div className="mobile-safe-bottom min-h-screen bg-background-dark text-gray-100">
        <Navigation />
        <main className="mx-auto max-w-3xl px-6 pt-28 pb-20 text-center">
          <p className="mb-3 inline-flex rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold tracking-wider text-primary uppercase">
            Restaurant not found
          </p>
          <h1 className="text-3xl font-bold text-white">This restaurant is not available</h1>
          <p className="mt-3 text-sm text-gray-300">
            Open the directory or import the restaurant catalog in admin.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gray-200"
          >
            Back to directory
          </Link>
        </main>
        <MobileTabBar />
      </div>
    );
  }

  const fallbackReason = tx("suggestedByWorkflow");

  const highlightedPairings = restaurant.dishes.slice(0, 4).map((dish) => {
    const primaryPairing = dish.pairings[0];
    const wine = restaurant.wines.find((item) => item.id === primaryPairing?.wineId) ?? null;
    return {
      dish,
      wine,
      reason: primaryPairing ? t(primaryPairing.reason, lng) : fallbackReason,
    };
  });

  // The drop cap (first-cap) decorates the first menu row's description -
  // but under ~120 chars the text wraps only 1-2 lines and the floated
  // capital breaks it apart ("C/hrupiące…" — audit 2026-07). Only opt the
  // list in when the intro is long enough to flow around the cap.
  const firstDishDescription = restaurant.dishes[0]
    ? t(restaurant.dishes[0].description, lng)
    : "";
  const showDropCap = firstDishDescription.length >= 120;

  return (
    <div className="pitch-grain min-h-screen bg-background-dark text-gray-100">
      <Navigation />

      {/* lg:pr-[400px] reserves room for the always-visible pairing panel
          docked to the right edge. Bottom padding = tab bar height + the
          collapsed peek-chip stack, so the last menu rows always scroll
          clear of BOTH fixed layers (mobile-safe-bottom alone left them
          covered by the chip — audit 2026-07). */}
      <main className="mx-auto w-full max-w-7xl overflow-x-hidden px-4 pt-24 pb-[calc(var(--mobile-tabbar-h)+8rem)] sm:px-6 sm:pt-28 lg:px-8 lg:pr-[400px] lg:pb-16">
        {/* ─────────── HERO ─────────── */}
        <section
          className={`editorial-frame relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br p-5 shadow-[0_28px_100px_rgba(0,0,0,0.32)] sm:rounded-[36px] sm:p-10 lg:p-14 ${restaurant.coverGradient}`}
        >
          {/* Magazine corners */}
          <span className="pitch-corner pitch-corner--tl hidden lg:block" aria-hidden />
          <span className="pitch-corner pitch-corner--br hidden lg:block" aria-hidden />

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            {/* Left: stagger group */}
            <div className="hero-stagger flex min-w-0 flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/22 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-white uppercase backdrop-blur-sm">
                  {cuisineLabel(restaurant.cuisine, lng)}
                </span>
                <RestaurantFormat
                  format={restaurant.format}
                  typeClassName="rounded-full bg-black/22 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-white uppercase backdrop-blur-sm"
                />
                <span className="rounded-full bg-black/22 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-white uppercase backdrop-blur-sm">
                  {restaurant.city}, {countryLabel(restaurant.country, lng)}
                </span>
              </div>

              <h1 className="pitch-display mt-5 max-w-3xl text-[clamp(2rem,7vw,4.5rem)] tracking-tight text-white sm:mt-6">
                {t(restaurant.name, lng)}
              </h1>

              <div className="mt-4 hairline-diamond max-w-md sm:mt-5" aria-hidden>
                <span />
              </div>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/95 sm:text-base sm:leading-8">
                {t(restaurant.description, lng)}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href={`/pairing?restaurant=${restaurant.slug}`}
                  className="pitch-cta-primary"
                >
                  {tx("openPairing")}
                  <svg width="14" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
                    <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
                <Link
                  href="/"
                  className="pitch-cta-ghost border-white/35 text-white hover:border-white hover:text-white"
                >
                  {tx("backToDiscover")}
                </Link>
              </div>

              {/* Stat strip - sits over the dark cover gradient in BOTH
                  themes. keep-dark + inline navy background (the shim
                  contract for stay-dark panels): the old translucent-taupe
                  tiles with 78%-white 11px labels read ~2.2:1 / disabled
                  (audit 2026-07). Gold eyebrow + solid navy ≥ 4.5:1. */}
              <div className="mt-7 grid grid-cols-3 gap-2 sm:mt-9 sm:gap-3">
                {[
                  { label: tx("district"), value: restaurant.district },
                  { label: tx("menuStat"), value: tx("items", { count: restaurant.dishes.length }) },
                  { label: tx("wineCard"), value: tx("labels", { count: restaurant.wines.length }) },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="keep-dark rounded-[18px] border p-3 backdrop-blur-sm sm:rounded-[24px] sm:p-4"
                    style={{
                      background: "rgba(11, 31, 68, 0.88)",
                      borderColor: "rgba(199, 159, 105, 0.4)",
                    }}
                  >
                    <p className="text-[10px] font-semibold tracking-[0.1em] uppercase sm:text-[11px] sm:tracking-[0.2em]" style={{ color: "#c79f69" }}>
                      {s.label}
                    </p>
                    <p className="mt-1 font-serif text-base italic sm:text-xl" style={{ color: "#ffffff" }}>
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: QR aside */}
            <aside className="hero-qr-rise rounded-[26px] border border-white/12 bg-black/22 p-4 backdrop-blur-sm sm:rounded-[30px] sm:p-5">
              <div className="flex items-center gap-4 xl:flex-col xl:items-stretch">
                <div className="relative flex shrink-0 flex-col items-center rounded-[18px] border border-white/10 bg-white/95 p-2 sm:rounded-[24px] sm:p-4">
                  <QRCodeSVG
                    value={restaurant.restaurantUrl}
                    role="img"
                    aria-label={`QR code for ${t(restaurant.name, lng)}`}
                    bgColor="#ffffff"
                    fgColor="#081634"
                    level="M"
                    marginSize={0}
                    className="h-24 w-24 sm:h-36 sm:w-36 xl:h-48 xl:w-48"
                  />
                  {/* Gold corner brackets framing the QR */}
                  <span className="absolute top-1 left-1 h-2 w-2 border-t border-l border-[var(--color-accent-gold)]" aria-hidden />
                  <span className="absolute top-1 right-1 h-2 w-2 border-t border-r border-[var(--color-accent-gold)]" aria-hidden />
                  <span className="absolute bottom-1 left-1 h-2 w-2 border-b border-l border-[var(--color-accent-gold)]" aria-hidden />
                  <span className="absolute bottom-1 right-1 h-2 w-2 border-b border-r border-[var(--color-accent-gold)]" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-white/70 uppercase sm:text-[11px] sm:tracking-[0.24em]">
                    {tx("qrTitle")}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/90 sm:text-sm sm:leading-6">
                    {tx("qrHint")}
                  </p>
                  {/* Host-only small-caps caption instead of the raw URL
                      (the full monospace URL broke mid-token in the narrow
                      aside — audit 2026-07). Full URL stays available to
                      tooltips + screen readers. */}
                  <p className="mt-2 text-sm sm:mt-3" title={restaurant.restaurantUrl}>
                    <span
                      aria-hidden
                      className="tracking-[0.08em]"
                      style={{ color: "#c79f69", fontVariantCaps: "small-caps" }}
                    >
                      {restaurant.restaurantUrl.replace(/^https?:\/\//, "").split("/")[0]}
                    </span>
                    <span className="sr-only">{restaurant.restaurantUrl}</span>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ─────────── PAIRING WIDGET (always visible, above the menu) ─────
             Big, gold-bordered, two-column row that announces the AI
             pairing flow. The previous experience hid this affordance
             behind a tiny QR-aside button - easy to miss. */}
        <section className="mt-8">
          <Link
            href={`/pairing?restaurant=${restaurant.slug}`}
            className="group relative block overflow-hidden rounded-[28px] border border-[var(--color-accent-gold)]/45 bg-gradient-to-br from-[#122446] via-[#1d0f12] to-[#0b1f44] p-5 shadow-[0_18px_60px_rgba(199,159,105,0.20)] transition hover:border-[var(--color-accent-gold)]/85 sm:p-6"
          >
            <div className="grid items-center gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[var(--color-accent-gold)]/40 bg-[var(--color-accent-gold)]/12 text-[var(--color-accent-gold)] sm:h-16 sm:w-16">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="pitch-eyebrow pitch-eyebrow--start">{tx("pairingWidgetEyebrow")}</p>
                <h3 className="pitch-display mt-2 text-xl text-white sm:text-2xl">
                  {tx("pairingWidgetTitle")}
                </h3>
                <p className="mt-1.5 text-sm leading-6 text-[#cbc1b1] sm:text-base">
                  {tx("pairingWidgetSub")}
                </p>
              </div>
              <span className="pitch-cta-primary inline-flex shrink-0 items-center justify-center self-start rounded-full px-5 py-2.5 text-xs sm:self-center">
                {tx("openPairingView")}
                <svg width="14" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
                  <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
          </Link>
        </section>

        {/* ─────────── MENU + WINE LIST ─────────── */}
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* Menu - editorial list with monograms + drop-cap.
              self-start on both columns: the default equal-height stretch
              left a ~350px blank well under the shorter card at 1440px
              (audit 2026-07). */}
          <article className="surface-parchment self-start rounded-[28px] border border-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6">
            <header className="mb-4 flex items-end justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="pitch-eyebrow pitch-eyebrow--start">{tx("menu")}</p>
                <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">{tx("menuTitle")}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-gray-300">
                {tx("items", { count: restaurant.dishes.length })}
              </span>
            </header>

            <ul className={`${showDropCap ? "first-cap " : ""}divide-y divide-white/5`}>
              {restaurant.dishes.map((dish) => {
                const photo =
                  dish.image ??
                  getDishImage(
                    { id: dish.id, category: dish.category, name: t(dish.name, lng) },
                    240,
                  );
                const dishName = t(dish.name, lng);
                const isActive = activeDishId === dish.id;
                return (
                  <li
                    key={dish.id}
                    onClick={() => pickDish(dish.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        pickDish(dish.id);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isActive}
                    className={`menu-row group flex cursor-pointer items-start gap-3 py-5 pl-3 pr-3 transition sm:gap-5 sm:pl-4 sm:pr-5 ${
                      isActive
                        ? "bg-[var(--color-accent-gold)]/8 ring-1 ring-[var(--gold-hairline)] ring-inset"
                        : ""
                    }`}
                  >
                    {/* Real Unsplash photo + monogram fallback if it 404s.
                        72×72 (mobile) → 96×96 (desktop). */}
                    <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl border border-[rgba(199,159,105,0.32)] bg-black/30 sm:h-24 sm:w-24">
                      <Image
                        src={photo}
                        alt={dishName}
                        fill
                        sizes="(min-width: 640px) 96px, 72px"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Gold-foil corner monogram overlay - anchors the brand
                          look on top of the photo without obscuring it. */}
                      <div className="absolute right-1 bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[var(--color-accent-gold)] backdrop-blur">
                        <DishMonogramSVG category={dish.category} className="h-3 w-3" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      {/* Non-wrapping two-column header: a 2-line dish name
                          used to push the price below the title, flush-left
                          (audit 2026-07). Price stays pinned to the right
                          column, baseline-aligned with the first title line,
                          and renders "N zł" to match the wine card (dishes
                          showed "$" on a Polish page for a Kraków venue). */}
                      <div className="flex items-baseline gap-3">
                        <h3 className="min-w-0 flex-1 font-serif text-lg leading-snug text-white sm:text-xl">
                          {dishName}
                        </h3>
                        <span className="flex-none font-serif text-sm whitespace-nowrap text-[var(--color-accent-gold)] tabular-nums">
                          {dish.price} zł
                        </span>
                      </div>
                      <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-[var(--color-accent-gold)] uppercase">
                        {categoryLabel(dish.category, lng)}
                      </p>
                      <p className="menu-row__desc mt-2 text-sm leading-6 text-gray-300/95 sm:leading-7">
                        {t(dish.description, lng)}
                      </p>
                      {/* Active-state hint: pairing panel on the right (or
                          mobile bottom-sheet) is already showing top-3 wines
                          for this dish - no per-row CTA needed anymore. */}
                      {isActive ? (
                        <p className="mt-2 inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.18em] text-[var(--color-accent-gold)] uppercase">
                          <span aria-hidden>→</span>
                          {/* The right rail is lg-only — on phones the wines
                              live in the bottom sheet, so point there. */}
                          <span className="lg:hidden">{tx("activeDishHintMobile")}</span>
                          <span className="hidden lg:inline">{tx("activeDishHint")}</span>
                        </p>
                      ) : (
                        /* Tap affordance: navy ink at 12px + gold arrow. The
                           old 10px muted-grey caps read ~2.2:1 on parchment,
                           i.e. disabled (audit 2026-07). */
                        <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.14em] text-[var(--ink)] uppercase">
                          {tx("tapToPair")}
                          <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden className="text-[var(--color-accent-gold)]">
                            <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>

          {/* Wines - bottle silhouettes + region/grape eyebrow */}
          <article className="surface-parchment-strong self-start rounded-[28px] border border-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6">
            <header className="mb-4 flex items-end justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="pitch-eyebrow pitch-eyebrow--start">{tx("wineList")}</p>
                <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">{tx("wineListTitle")}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-gray-300">
                {tx("labels", { count: restaurant.wines.length })}
              </span>
            </header>

            <ul className="divide-y divide-white/5">
              {restaurant.wines.map((wine) => {
                const photo =
                  wine.image ??
                  getWineImage(
                    {
                      id: wine.id,
                      style: wine.style,
                      grape: wine.grape,
                      name: t(wine.name, lng),
                      region: wine.region,
                    },
                    240,
                  );
                const wineName = t(wine.name, lng);
                return (
                  <li
                    key={wine.id}
                    className="menu-row group flex items-start gap-3 py-5 pl-3 pr-3 sm:gap-5 sm:pl-4 sm:pr-5"
                  >
                    {/* Real wine photo + tiny SVG bottle overlay (gold-foil
                        corner) so the silhouette identity is preserved. */}
                    <div className="relative h-[88px] w-[60px] shrink-0 overflow-hidden rounded-2xl border border-[rgba(199,159,105,0.32)] bg-black/30 sm:h-[112px] sm:w-[76px]">
                      <Image
                        src={photo}
                        alt={wineName}
                        fill
                        sizes="(min-width: 640px) 76px, 60px"
                        className="object-cover transition-transform duration-500 group-hover:-translate-y-0.5"
                        loading="lazy"
                      />
                      <div className="absolute right-1 bottom-1 h-7 w-3 sm:h-9 sm:w-4">
                        <WineBottleSVG
                          style={wine.style}
                          grape={wine.grape}
                          vintage={wine.vintage ?? undefined}
                          className="h-full w-full opacity-90"
                        />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-serif text-base leading-snug text-white sm:text-xl">
                        {wineName}
                      </h3>
                      <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-[var(--color-accent-gold)] uppercase">
                        {wine.style} · {wine.grape}
                      </p>
                      <p className="mt-1 font-serif text-xs italic text-gray-400">
                        {wine.region}{wine.vintage ? ` · ${wine.vintage}` : ""}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-gray-300/90">{t(wine.notes, lng)}</p>
                      {/* Operator-entered bottle price (DB editor). Hidden when
                          unset — we never show a fabricated number. */}
                      {wine.price ? (
                        <p className="mt-2 font-serif text-sm text-[var(--color-accent-gold)] tabular-nums">
                          {wine.price} zł
                        </p>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        </section>

        {/* ─────────── SUGGESTED PAIRINGS - TASTING NOTEBOOK RIBBONS ─────────── */}
        <section className="mt-8 rounded-[28px] border border-white/10 bg-[#081634] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-7">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              {/* max-[420px]:after:hidden — the eyebrow wraps to 2 lines on
                  narrow phones and the trailing gold hairline detached to
                  its own row (audit 2026-07). */}
              <p className="pitch-eyebrow pitch-eyebrow--start max-[420px]:after:hidden">{tx("suggestedPairings")}</p>
              <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">{tx("recommendedCombinations")}</h2>
            </div>
            <Link
              href={`/pairing?restaurant=${restaurant.slug}`}
              className="pitch-cta-ghost"
            >
              {tx("openPairingView")}
            </Link>
          </header>

          <div className="grid gap-5 lg:grid-cols-2">
            {highlightedPairings.map((item) => (
              <article key={item.dish.id} className="ribbon-card pl-7">
                {/* pl-7 clears the gold bookmark notch (ribbon-card::before,
                    ~16px wide at the top-left) — it overlapped the category
                    eyebrow text (audit 2026-07). Only this first line sits
                    at ribbon height; title + reason below stay flush. */}
                <p className="pl-7 text-[10px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                  {categoryLabel(item.dish.category, lng)}
                </p>
                <h3 className="pitch-display mt-2 text-xl text-white sm:text-2xl">
                  {t(item.dish.name, lng)}
                </h3>
                <p className="mt-1 font-serif text-sm italic text-[#cbc1b1]">
                  ✦ {item.wine ? t(item.wine.name, lng) : tx("sommelierSelection")}
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-200">{item.reason}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      {/* Integrated pairing panel - desktop docked right, mobile bottom-sheet.
          Replaces the previous floating "ask sommelier" link and the sticky
          mobile CTA: both pointed to /pairing as a separate page. Now the
          pairing UX lives inline. The standalone /pairing route still works
          for those who land there directly (e.g. via QR-coded link). */}
      <RestaurantPairingPanel
        restaurant={restaurant}
        activeDishId={activeDishId}
        onActiveDishChange={pickDish}
      />

      <MobileTabBar />
    </div>
  );
}
