import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import PairingClient from "./PairingClient";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wine.icoffio.com";

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
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PairingClient />;
}
