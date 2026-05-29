import { setRequestLocale } from "next-intl/server";
import { resolveRestaurants } from "@/lib/db-restaurants";
import HomeClient from "./HomeClient";

// DB-canonical directory with seed fallback. ISR: published edits surface
// within ~60s. Data is fetched server-side so the directory is in the SSR
// HTML (SEO) rather than hydrated from localStorage.
export const revalidate = 60;

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
