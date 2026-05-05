"use client";

import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/localized";
import { useRestaurantCatalog } from "@/lib/restaurant-store";
import type { Locale } from "@/i18n/routing";

export default function RestaurantPageClient({
  slug,
}: {
  slug: string;
}) {
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
    <div className="min-h-screen bg-background-dark text-gray-100">
      <Navigation />

      <main className="mobile-safe-bottom mx-auto w-full max-w-7xl px-4 pt-24 pb-16 sm:px-6 sm:pt-28 lg:px-8">
        <section
          className={`overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br p-5 shadow-[0_28px_100px_rgba(0,0,0,0.24)] sm:rounded-[36px] sm:p-8 ${restaurant.coverGradient}`}
        >
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-black/18 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-white uppercase">
                  {restaurant.cuisine}
                </span>
                <span className="rounded-full bg-black/18 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-white uppercase">
                  {restaurant.format}
                </span>
                <span className="rounded-full bg-black/18 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-white uppercase">
                  {restaurant.city}, {restaurant.country}
                </span>
              </div>

              <h1 className="mt-4 max-w-3xl text-3xl font-bold tracking-tight text-white sm:mt-5 sm:text-5xl">
                {t(restaurant.name, lng)}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:mt-4 sm:text-base sm:leading-7">
                {t(restaurant.description, lng)}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/pairing?restaurant=${restaurant.slug}`}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-gray-200"
                >
                  {tx("openPairing")}
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-white/25 bg-black/16 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/24"
                >
                  {tx("backToDiscover")}
                </Link>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
                <div className="rounded-[18px] border border-white/12 bg-black/16 p-3 sm:rounded-[24px] sm:p-4">
                  <p className="text-[10px] tracking-[0.18em] text-white/70 uppercase sm:text-[11px] sm:tracking-[0.2em]">{tx("district")}</p>
                  <p className="mt-1 text-sm font-bold text-white sm:text-xl">{restaurant.district}</p>
                </div>
                <div className="rounded-[18px] border border-white/12 bg-black/16 p-3 sm:rounded-[24px] sm:p-4">
                  <p className="text-[10px] tracking-[0.18em] text-white/70 uppercase sm:text-[11px] sm:tracking-[0.2em]">{tx("menuStat")}</p>
                  <p className="mt-1 text-sm font-bold text-white sm:text-xl">{tx("items", { count: restaurant.dishes.length })}</p>
                </div>
                <div className="rounded-[18px] border border-white/12 bg-black/16 p-3 sm:rounded-[24px] sm:p-4">
                  <p className="text-[10px] tracking-[0.18em] text-white/70 uppercase sm:text-[11px] sm:tracking-[0.2em]">{tx("wineCard")}</p>
                  <p className="mt-1 text-sm font-bold text-white sm:text-xl">{tx("labels", { count: restaurant.wines.length })}</p>
                </div>
              </div>
            </div>

            {/* QR aside — bottom on mobile, right column on xl+ */}
            <aside className="rounded-[24px] border border-white/12 bg-black/16 p-4 backdrop-blur-sm sm:rounded-[30px] sm:p-5">
              <div className="flex items-center gap-4 xl:flex-col xl:items-stretch">
                <div className="flex shrink-0 flex-col items-center rounded-[18px] border border-white/10 bg-white/95 p-2 sm:rounded-[24px] sm:p-4">
                  <Image
                    src={restaurant.qrUrl}
                    alt={`QR code for ${t(restaurant.name, lng)}`}
                    width={192}
                    height={192}
                    unoptimized
                    className="h-24 w-24 sm:h-36 sm:w-36 xl:h-48 xl:w-48"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold tracking-[0.22em] text-white/70 uppercase sm:text-[11px] sm:tracking-[0.24em]">
                    {tx("qrTitle")}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/85 sm:text-sm sm:leading-6">
                    {tx("qrHint")}
                  </p>
                  <p className="mt-2 truncate rounded-xl border border-white/10 bg-black/18 px-2 py-1.5 text-[10px] text-white/70 sm:mt-3 sm:rounded-2xl sm:px-3 sm:py-3 sm:text-xs">
                    {restaurant.restaurantUrl}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="rounded-[32px] border border-white/10 bg-black/15 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.24em] text-gray-500 uppercase">{tx("menu")}</p>
                <h2 className="mt-1 text-2xl font-bold text-white">{tx("menuTitle")}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-300">
                {tx("items", { count: restaurant.dishes.length })}
              </span>
            </div>

            <div className="grid gap-3">
              {restaurant.dishes.map((dish) => (
                <article
                  key={dish.id}
                  className="rounded-[24px] border border-white/8 bg-black/16 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{t(dish.name, lng)}</p>
                      <p className="mt-1 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                        {dish.category}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-gray-300">{t(dish.description, lng)}</p>
                    </div>
                    <span className="text-base font-bold text-primary">${dish.price}</span>
                  </div>
                </article>
              ))}
            </div>
          </article>

          <article className="rounded-[32px] border border-white/10 bg-black/15 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.24em] text-gray-500 uppercase">{tx("wineList")}</p>
                <h2 className="mt-1 text-2xl font-bold text-white">{tx("wineListTitle")}</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-300">
                {tx("labels", { count: restaurant.wines.length })}
              </span>
            </div>

            <div className="grid gap-3">
              {restaurant.wines.map((wine) => (
                <article
                  key={wine.id}
                  className="rounded-[24px] border border-white/8 bg-black/16 px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-white">{t(wine.name, lng)}</p>
                      <p className="mt-1 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
                        {wine.style} • {wine.grape}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-gray-300">
                        {wine.region} {wine.vintage ? `• ${wine.vintage}` : ""}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-gray-400">{t(wine.notes, lng)}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-[32px] border border-white/10 bg-black/15 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
          <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/8 pb-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-gray-500 uppercase">{tx("suggestedPairings")}</p>
              <h2 className="mt-1 text-2xl font-bold text-white">{tx("recommendedCombinations")}</h2>
            </div>
            <Link
              href={`/pairing?restaurant=${restaurant.slug}`}
              className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/18"
            >
              {tx("openPairingView")}
            </Link>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {highlightedPairings.map((item) => (
              <article
                key={item.dish.id}
                className="rounded-[26px] border border-primary/18 bg-primary/6 p-4"
              >
                <p className="text-[11px] font-semibold tracking-[0.22em] text-primary uppercase">
                  {item.dish.category}
                </p>
                <h3 className="mt-2 text-xl font-bold text-white">{t(item.dish.name, lng)}</h3>
                <p className="mt-2 text-sm text-gray-300">
                  {item.wine ? t(item.wine.name, lng) : tx("sommelierSelection")}
                </p>
                <p className="mt-3 text-sm leading-6 text-gray-200">{item.reason}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <MobileTabBar />
    </div>
  );
}
