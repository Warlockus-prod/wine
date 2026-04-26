import { setRequestLocale, getTranslations } from "next-intl/server";
import Image from "next/image";
import { notFound } from "next/navigation";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import { routing } from "@/i18n/routing";
import { catalogRestaurants, getCatalogRestaurant } from "@/lib/restaurant-directory";

export function generateStaticParams() {
  const out: Array<{ locale: string; slug: string }> = [];
  for (const locale of routing.locales) {
    for (const r of catalogRestaurants) {
      out.push({ locale, slug: r.slug });
    }
  }
  return out;
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const tx = await getTranslations("restaurant");

  const restaurant = getCatalogRestaurant(slug);

  if (!restaurant) {
    notFound();
  }

  const lng = locale as Locale;
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

      <main className="mobile-safe-bottom mx-auto w-full max-w-7xl px-4 pt-28 pb-16 sm:px-6 lg:px-8">
        <section
          className={`overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br p-6 shadow-[0_28px_100px_rgba(0,0,0,0.24)] sm:p-8 ${restaurant.coverGradient}`}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
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

              <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
                {t(restaurant.name, lng)}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/90">
                {t(restaurant.description, lng)}
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/pairing?restaurant=${restaurant.slug}`}
                  className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-background-dark transition hover:bg-gray-200"
                >
                  Open pairing
                </Link>
                <Link
                  href="/"
                  className="rounded-full border border-white/25 bg-black/16 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-black/24"
                >
                  Back to discover
                </Link>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/12 bg-black/16 p-4">
                  <p className="text-[11px] tracking-[0.2em] text-white/70 uppercase">District</p>
                  <p className="mt-1 text-xl font-bold text-white">{restaurant.district}</p>
                </div>
                <div className="rounded-[24px] border border-white/12 bg-black/16 p-4">
                  <p className="text-[11px] tracking-[0.2em] text-white/70 uppercase">Menu</p>
                  <p className="mt-1 text-xl font-bold text-white">{restaurant.dishes.length} dishes</p>
                </div>
                <div className="rounded-[24px] border border-white/12 bg-black/16 p-4">
                  <p className="text-[11px] tracking-[0.2em] text-white/70 uppercase">Wine card</p>
                  <p className="mt-1 text-xl font-bold text-white">{restaurant.wines.length} wines</p>
                </div>
              </div>
            </div>

            <aside className="rounded-[30px] border border-white/12 bg-black/16 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-semibold tracking-[0.24em] text-white/70 uppercase">
                Direct access QR
              </p>
              <div className="mt-4 flex flex-col items-center rounded-[24px] border border-white/10 bg-white/95 p-4">
                <Image
                  src={restaurant.qrUrl}
                  alt={`QR code for ${t(restaurant.name, lng)}`}
                  width={192}
                  height={192}
                  unoptimized
                  className="h-48 w-48"
                />
              </div>
              <p className="mt-4 text-sm leading-6 text-white/85">
                Scan this QR code to open the restaurant page directly on a phone.
              </p>
              <p className="mt-3 rounded-2xl border border-white/10 bg-black/18 px-3 py-3 text-xs text-white/70">
                {restaurant.restaurantUrl}
              </p>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <article className="rounded-[32px] border border-white/10 bg-black/15 p-5 shadow-[0_24px_90px_rgba(0,0,0,0.22)]">
            <div className="mb-4 flex items-end justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.24em] text-gray-500 uppercase">Menu</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Signature dishes</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-300">
                {restaurant.dishes.length} items
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
                <p className="text-xs font-semibold tracking-[0.24em] text-gray-500 uppercase">Wine list</p>
                <h2 className="mt-1 text-2xl font-bold text-white">Current cellar</h2>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-gray-300">
                {restaurant.wines.length} labels
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
              <p className="text-xs font-semibold tracking-[0.24em] text-gray-500 uppercase">Suggested pairings</p>
              <h2 className="mt-1 text-2xl font-bold text-white">Recommended combinations</h2>
            </div>
            <Link
              href={`/pairing?restaurant=${restaurant.slug}`}
              className="rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/18"
            >
              Open pairing view
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
