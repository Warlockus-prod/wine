"use client";

/**
 * /admin/restaurants - picker for the per-restaurant editor.
 *
 * Lists all restaurants from the public read API (always reflects DB) so
 * the operator picks the one to edit. Each card shows row counts pulled
 * lazily by SWR - no waterfall, parallel request per card.
 */

import useSWR from "swr";
import { useLocale } from "next-intl";
import MobileTabBar from "@/components/v2/MobileTabBar";
import Navigation from "@/components/v2/Navigation";
import { Link } from "@/i18n/navigation";
import { swrFetcher } from "@/lib/api-client";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import type { Restaurant } from "@/types/restaurant";

interface ListResponse {
  data: (Restaurant & { restaurantUrl: string; pairingUrl: string; qrUrl: string; city: string })[];
  source: "db" | "seed";
  count: number;
}

export default function AdminRestaurantsPage() {
  const locale = useLocale() as Locale;
  const { data, error, isLoading } = useSWR<ListResponse>("/api/restaurants", swrFetcher);

  return (
    <div className="pitch-grain mobile-safe-bottom min-h-screen bg-background-dark text-[#f4efe9]">
      <Navigation />

      <main className="mx-auto w-full max-w-7xl px-4 pt-24 pb-24 sm:px-6 lg:px-8">
        <header className="mb-8 grid gap-4 lg:grid-cols-[10rem_minmax(0,1fr)] lg:gap-12">
          <span className="pitch-roman">Admin</span>
          <div>
            <h1 className="pitch-display text-[clamp(1.8rem,4.4vw,3rem)] text-white">
              Per-restaurant edytor
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#cbc1b1]">
              Wybierz restaurację, by edytować dania, wina i kuratorskie połączenia. Zmiany trafiają od razu do bazy - pojawiają się u gości w widoku Pairing po odświeżeniu.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-[rgba(199,159,105,0.3)] bg-[rgba(199,159,105,0.06)] px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] text-[var(--color-accent-gold)] uppercase">
              {data?.source === "db" ? "DB live" : "Seed fallback"}
            </p>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-900/20 p-5 text-sm text-rose-200">
            Błąd pobierania listy restauracji: {String(error.message ?? error)}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-44 animate-pulse rounded-3xl bg-white/5" />
            ))}
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data?.data.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/admin/restaurants/${r.slug}`}
                  className={`group block h-full rounded-3xl border border-white/10 bg-[#081634] p-5 transition-colors hover:border-[var(--color-accent-gold)] hover:bg-[#122446]`}
                >
                  <p className="text-[10px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
                    {r.city}
                  </p>
                  <h2 className="pitch-display mt-2 text-2xl text-white">{t(r.name, locale)}</h2>
                  <p className="mt-2 line-clamp-2 text-sm text-[#cbc1b1]">{t(r.description, locale)}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-gray-300">
                    <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1">
                      {r.dishes.length} dishes
                    </span>
                    <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1">
                      {r.wines.length} wines
                    </span>
                    <span className="rounded-full border border-primary/30 bg-primary/15 px-2.5 py-1 text-primary">
                      Edytuj →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>

      <MobileTabBar />
    </div>
  );
}
