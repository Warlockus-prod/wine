"use client";

/**
 * Per-venue page — premium editorial pass.
 *
 * Aesthetic: wine-bar tasting brochure. Hero lands with a 1s staggered
 * cascade (cuisine pills → name → description → CTAs → QR), each menu/wine
 * row has a gold underline that draws on hover, suggested pairings sit on
 * ribbon cards (gold notch + ❦ watermark). All visual placeholders are
 * inline SVG — no external images. Mobile gets a sticky pairing CTA + a
 * "Listen to sommelier" floating link on desktop top-right.
 */

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import DishMonogramSVG from "@/components/v2/DishMonogramSVG";
import WineBottleSVG from "@/components/v2/WineBottleSVG";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/localized";
import { useRestaurantCatalog } from "@/lib/restaurant-store";
import type { Locale } from "@/i18n/routing";

export default function RestaurantPageClient({ slug }: { slug: string }) {
  const tx = useTranslations("restaurant");
  const lng = useLocale() as Locale;
  const { getRestaurantBySlug } = useRestaurantCatalog();
  const restaurant = getRestaurantBySlug(slug);

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

  return (
    <div className="pitch-grain min-h-screen bg-background-dark text-gray-100">
      <Navigation />

      <main className="mobile-safe-bottom mx-auto w-full max-w-7xl overflow-x-hidden px-4 pt-24 pb-16 sm:px-6 sm:pt-28 lg:px-8">
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
                  {restaurant.cuisine}
                </span>
                <span className="rounded-full bg-black/22 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-white uppercase backdrop-blur-sm">
                  {restaurant.format}
                </span>
                <span className="rounded-full bg-black/22 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-white uppercase backdrop-blur-sm">
                  {restaurant.city}, {restaurant.country}
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

              {/* Stat strip */}
              <div className="mt-7 grid grid-cols-3 gap-2 sm:mt-9 sm:gap-3">
                {[
                  { label: tx("district"), value: restaurant.district },
                  { label: tx("menuStat"), value: tx("items", { count: restaurant.dishes.length }) },
                  { label: tx("wineCard"), value: tx("labels", { count: restaurant.wines.length }) },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="rounded-[18px] border border-white/12 bg-black/22 p-3 backdrop-blur-sm sm:rounded-[24px] sm:p-4"
                  >
                    <p className="text-[10px] tracking-[0.18em] text-white/70 uppercase sm:text-[11px] sm:tracking-[0.2em]">
                      {s.label}
                    </p>
                    <p className="mt-1 font-serif text-base italic text-white sm:text-xl">
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
                  <Image
                    src={restaurant.qrUrl}
                    alt={`QR code for ${t(restaurant.name, lng)}`}
                    width={192}
                    height={192}
                    unoptimized
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
                  <p className="mt-2 truncate rounded-xl border border-white/10 bg-black/24 px-2 py-1.5 font-mono text-[10px] text-white/70 sm:mt-3 sm:rounded-2xl sm:px-3 sm:py-3 sm:text-xs">
                    {restaurant.restaurantUrl}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* ─────────── MENU + WINE LIST ─────────── */}
        <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          {/* Menu — editorial list with monograms + drop-cap */}
          <article className="surface-parchment rounded-[28px] border border-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6">
            <header className="mb-4 flex items-end justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="pitch-eyebrow pitch-eyebrow--start">{tx("menu")}</p>
                <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">{tx("menuTitle")}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold tracking-wide text-gray-300">
                {tx("items", { count: restaurant.dishes.length })}
              </span>
            </header>

            <ul className="first-cap divide-y divide-white/5">
              {restaurant.dishes.map((dish) => (
                <li key={dish.id} className="menu-row group flex items-start gap-4 py-5 pl-4 pr-5 sm:gap-5">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[rgba(197,160,89,0.32)] bg-black/30 text-[var(--color-accent-gold)] transition-colors group-hover:border-[var(--color-accent-gold)] group-hover:text-white">
                    <DishMonogramSVG category={dish.category} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <h3 className="font-serif text-lg leading-snug text-white sm:text-xl">
                        {t(dish.name, lng)}
                      </h3>
                      <span className="font-mono text-sm font-bold text-primary tabular-nums">
                        ${dish.price}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-[var(--color-accent-gold)] uppercase">
                      {dish.category}
                    </p>
                    <p className="menu-row__desc mt-2 text-sm leading-7 text-gray-300/95">
                      {t(dish.description, lng)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          {/* Wines — bottle silhouettes + region/grape eyebrow */}
          <article className="surface-parchment-strong rounded-[28px] border border-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6">
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
              {restaurant.wines.map((wine) => (
                <li key={wine.id} className="menu-row group flex items-start gap-4 py-5 pl-4 pr-5 sm:gap-5">
                  <div className="relative h-20 w-12 shrink-0 sm:h-24 sm:w-14">
                    <WineBottleSVG
                      style={wine.style}
                      grape={wine.grape}
                      vintage={wine.vintage ?? undefined}
                      className="h-full w-full transition-transform duration-500 group-hover:-translate-y-0.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-lg leading-snug text-white sm:text-xl">
                      {t(wine.name, lng)}
                    </h3>
                    <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-[var(--color-accent-gold)] uppercase">
                      {wine.style} · {wine.grape}
                    </p>
                    <p className="mt-1 font-serif text-xs italic text-gray-400">
                      {wine.region}{wine.vintage ? ` · ${wine.vintage}` : ""}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-300/90">{t(wine.notes, lng)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </section>

        {/* ─────────── SUGGESTED PAIRINGS — TASTING NOTEBOOK RIBBONS ─────────── */}
        <section className="mt-8 rounded-[28px] border border-white/10 bg-[#150a0c] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-7">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              <p className="pitch-eyebrow pitch-eyebrow--start">{tx("suggestedPairings")}</p>
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
                <p className="text-[10px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                  {item.dish.category}
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

      {/* Desktop floating "ask the sommelier" link — top-right, after main nav */}
      <Link
        href={`/pairing?restaurant=${restaurant.slug}`}
        className="fixed top-24 right-5 z-30 hidden items-center gap-2 rounded-full border border-[rgba(197,160,89,0.45)] bg-[#170d0fcc] px-3.5 py-2 font-serif text-xs italic text-[var(--color-accent-gold)] shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur transition hover:border-[var(--color-accent-gold)] hover:text-white lg:inline-flex"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2V5a3 3 0 0 1 3-3Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
        </svg>
        {tx("openPairingView")}
      </Link>

      {/* Sticky mobile-only CTA — kept from previous polish, restyled */}
      <Link
        href={`/pairing?restaurant=${restaurant.slug}`}
        className="fixed right-4 bottom-20 z-40 inline-flex h-12 items-center gap-2 rounded-full border border-[rgba(197,160,89,0.55)] bg-gradient-to-br from-primary to-primary-dark px-5 text-sm font-bold text-white shadow-[0_18px_36px_rgba(209,21,52,0.45)] transition-transform hover:scale-[1.02] active:scale-95 lg:hidden"
        aria-label={tx("openPairing")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 2L7 11h10l-5-9zM3 13l4 9 5-9 5 9 4-9H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
        {tx("openPairing")}
      </Link>

      <MobileTabBar />
    </div>
  );
}
