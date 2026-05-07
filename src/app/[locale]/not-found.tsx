import { getLocale, getTranslations } from "next-intl/server";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { catalogRestaurants } from "@/lib/restaurant-directory";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

/**
 * Editorial 404 — instead of the default Next.js text-only "Page Not
 * Found", we land the guest on an apology card and offer 3 next moves:
 * a random restaurant from the catalogue, the homepage, and the
 * Vinokompas tutorial. Server component — no client JS needed.
 */
export default async function NotFound() {
  const lng = (await getLocale()) as Locale;
  const tx = await getTranslations("notFound");

  // Pick a deterministic restaurant by route hash (locale length stable
  // server+client) so SSR/CSR agree without using Date.now (impure call
  // during render — react-hooks lint flags it).
  const featured =
    catalogRestaurants.length > 0
      ? catalogRestaurants[lng.length % catalogRestaurants.length]
      : null;

  return (
    <div
      className="pitch-grain min-h-screen"
      style={{ background: "var(--bg-radials)", color: "var(--ink)" }}
    >
      <Navigation />

      <main className="mx-auto w-full max-w-3xl px-4 pt-32 pb-24 sm:px-6">
        <section
          className="editorial-frame relative overflow-hidden rounded-[28px] border p-6 text-center sm:rounded-[36px] sm:p-12"
          style={{
            background: "var(--surface-elevated)",
            borderColor: "var(--gold-hairline)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <p className="pitch-eyebrow">{tx("eyebrow")}</p>
          <h1
            className="pitch-display mt-5 text-[clamp(2.4rem,7vw,4.4rem)]"
            style={{ color: "var(--ink-strong)" }}
          >
            404
          </h1>
          <div className="pitch-rule pitch-rule--short mt-4" />
          <h2
            className="pitch-display mt-4 text-[clamp(1.4rem,3.6vw,2.2rem)]"
            style={{ color: "var(--ink-strong)" }}
          >
            {tx("title")}
          </h2>
          <p
            className="mx-auto mt-3 max-w-md text-sm leading-relaxed sm:text-base"
            style={{ color: "var(--ink-soft)" }}
          >
            {tx("subtitle")}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="pitch-cta-primary">
              {tx("backHome")}
            </Link>
            {featured ? (
              <Link
                href={`/restaurants/${featured.slug}`}
                className="pitch-cta-ghost"
              >
                {tx("featured", { name: t(featured.name, lng) })}
              </Link>
            ) : null}
            <Link href="/samouczek" className="pitch-cta-ghost">
              {tx("openTutorial")}
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
