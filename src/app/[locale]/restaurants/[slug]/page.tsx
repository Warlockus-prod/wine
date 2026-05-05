import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { catalogRestaurants } from "@/lib/restaurant-directory";
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

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);

  return <RestaurantPageClient slug={slug} />;
}
