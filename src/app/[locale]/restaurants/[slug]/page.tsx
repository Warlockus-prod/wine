import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { catalogRestaurants } from "@/lib/restaurant-directory";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import RestaurantPageClient from "./RestaurantPageClient";

export function generateStaticParams() {
  const out: Array<{ locale: string; slug: string }> = [];
  for (const locale of routing.locales) {
    for (const restaurant of catalogRestaurants) {
      out.push({ locale, slug: restaurant.slug });
    }
  }
  return out;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wine.icoffio.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const lng = locale as Locale;
  const restaurant = catalogRestaurants.find((r) => r.slug === slug);
  if (!restaurant) {
    return {
      title: "Restaurant — Vinovigator AI",
      description:
        lng === "pl"
          ? "Restauracja niedostępna. Otwórz stronę główną."
          : "Restaurant not available. Open the home page.",
    };
  }

  const name = t(restaurant.name, lng);
  const description = t(restaurant.description, lng);
  const title = `${name} · ${restaurant.cuisine} · ${restaurant.city} | Vinovigator AI`;
  const ogImage = restaurant.coverImage;
  const url = `${SITE_URL}/${lng === "en" ? "" : `${lng}/`}restaurants/${slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: {
        en: `${SITE_URL}/restaurants/${slug}`,
        pl: `${SITE_URL}/pl/restaurants/${slug}`,
      },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "Vinovigator AI",
      locale: lng === "pl" ? "pl_PL" : "en_US",
      images: [{ url: ogImage, width: 1200, height: 630, alt: name }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  return <RestaurantPageClient slug={slug} />;
}
