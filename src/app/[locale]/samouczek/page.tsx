import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import SamouczekClient from "./SamouczekClient";
import { siteUrl } from "@/lib/site-url";

/**
 * Rendered per request, not prerendered. ONE image serves both deployments,
 * so `SITE_MODE` is only known at runtime — a statically generated page would
 * bake in whatever mode the BUILD had (i.e. "full"), and the tutorial site
 * would ship the product nav, the bottom tab-bar and the "Open Pairing"
 * hand-off it must not show. Deciding on the client instead would either
 * break hydration or flash the wrong chrome. The page is client-heavy
 * (compass, chat), so the SSR cost here is small.
 */
export const dynamic = "force-dynamic";

// The tutorial UI is PL-primary and uses inline copy (no i18n namespace), so
// metadata strings are defined here per locale rather than via getTranslations.
const META: Record<"en" | "pl", { title: string; description: string }> = {
  en: {
    title: "Taste Tutorial · Wine Compass | Vinovigator AI",
    description:
      "Learn the Vinokompas method interactively: set base tastes, six impressions and twelve tendencies, then see which wine styles match your profile.",
  },
  pl: {
    title: "Samouczek smaku · Winokompas | Vinovigator AI",
    description:
      "Poznaj metodę Winokompasu interaktywnie: ustaw smaki bazowe, sześć wrażeń i dwanaście tendencji, a potem zobacz, które style win pasują do Twojego profilu.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const m = META[locale === "pl" ? "pl" : "en"];
  // Resolved per REQUEST, not at module load: this page is served by both
  // deployments and each must advertise its own host (site-url.ts).
  const SITE_URL = siteUrl();
  const url = `${SITE_URL}/${locale === "en" ? "" : `${locale}/`}samouczek`;

  return {
    title: m.title,
    description: m.description,
    alternates: {
      canonical: url,
      languages: { en: `${SITE_URL}/samouczek`, pl: `${SITE_URL}/pl/samouczek` },
    },
    openGraph: {
      type: "website",
      title: m.title,
      description: m.description,
      url,
      siteName: "Vinovigator AI",
      locale: locale === "pl" ? "pl_PL" : "en_US",
    },
  };
}

export default async function SamouczekPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <SamouczekClient />;
}
