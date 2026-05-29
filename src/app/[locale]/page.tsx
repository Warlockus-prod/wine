import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { resolveRestaurants } from "@/lib/db-restaurants";
import HomeClient from "./HomeClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wine.icoffio.com";

// DB-canonical directory with seed fallback. ISR: published edits surface
// within ~60s. Data is fetched server-side so the directory is in the SSR
// HTML (SEO) rather than hydrated from localStorage.
export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const title = `${t("directoryTitle")} | Vinovigator AI`;
  const description = t("directorySubtitle");
  const url = `${SITE_URL}/${locale === "en" ? "" : `${locale}`}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: { en: `${SITE_URL}/`, pl: `${SITE_URL}/pl` },
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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const { data } = await resolveRestaurants();

  return <HomeClient initialRestaurants={data} />;
}
