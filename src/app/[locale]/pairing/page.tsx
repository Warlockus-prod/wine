import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PairingClient from "./PairingClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wine.icoffio.com";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "pairing" });
  const title = `${t("headline")} | Vinovigator AI`;
  const description = t("subheading");
  const url = `${SITE_URL}/${locale === "en" ? "" : `${locale}/`}pairing`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: `${SITE_URL}/pairing`, pl: `${SITE_URL}/pl/pairing` },
    },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: "Vinovigator AI",
      locale: locale === "pl" ? "pl_PL" : "en_US",
    },
  };
}

export default async function PairingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ restaurant?: string }>;
}) {
  const { locale } = await params;
  const { restaurant } = await searchParams;
  setRequestLocale(locale);
  // Resolve ?restaurant= SERVER-side so the client never boots on the
  // localStorage sandbox and then swaps datasets after mount (that flash
  // also fired a throwaway /api/pairing call — audit 2026-07).
  return <PairingClient initialRestaurantSlug={restaurant ?? null} />;
}
