import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import Navigation from "@/components/v2/Navigation";
import MobileTabBar from "@/components/v2/MobileTabBar";
import { Link } from "@/i18n/navigation";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";

/**
 * /admin/restaurants/[slug]/stats — owner analytics dashboard.
 *
 * Server component: reads the events table directly (no client fetch, no API
 * surface to secure separately — same /admin gate as the editor). Renders
 * pure-CSS bars so no chart library ships to the client.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAYS = 30;

interface TypeCount {
  event_type: string;
  n: number;
}
interface DayCount {
  day: string;
  n: number;
}
interface ExtCount {
  ext: string | null;
  n: number;
}

export default async function StatsPage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const lng = locale as Locale;

  const [restaurant] = await db
    .select({ id: schema.restaurants.id, name: schema.restaurants.name })
    .from(schema.restaurants)
    .where(eq(schema.restaurants.slug, slug))
    .limit(1);
  if (!restaurant) notFound();

  const rid = restaurant.id;

  // All four reads in parallel; raw SQL for the group-bys (drizzle builders
  // don't cover date_trunc/jsonb extraction cleanly).
  const [totals, daily, topDishes, topWines, dishRows, wineRows] = await Promise.all([
    db.execute(sql`
      SELECT event_type, count(*)::int AS n
      FROM events
      WHERE restaurant_id = ${rid} AND ts > now() - interval '${sql.raw(String(DAYS))} days'
      GROUP BY event_type
    `) as unknown as Promise<TypeCount[]>,
    db.execute(sql`
      SELECT to_char(date_trunc('day', ts), 'MM-DD') AS day, count(*)::int AS n
      FROM events
      WHERE restaurant_id = ${rid}
        AND event_type IN ('restaurant_view', 'page_view')
        AND ts > now() - interval '14 days'
      GROUP BY 1 ORDER BY 1
    `) as unknown as Promise<DayCount[]>,
    db.execute(sql`
      SELECT coalesce(props->>'dish_ext_id', props->>'dish_id') AS ext, count(*)::int AS n
      FROM events
      WHERE restaurant_id = ${rid} AND event_type = 'dish_select'
        AND ts > now() - interval '${sql.raw(String(DAYS))} days'
      GROUP BY 1 ORDER BY n DESC LIMIT 8
    `) as unknown as Promise<ExtCount[]>,
    db.execute(sql`
      SELECT props->>'wine_id' AS ext, count(*)::int AS n
      FROM events
      WHERE restaurant_id = ${rid} AND event_type = 'wine_select'
        AND ts > now() - interval '${sql.raw(String(DAYS))} days'
      GROUP BY 1 ORDER BY n DESC LIMIT 8
    `) as unknown as Promise<ExtCount[]>,
    db
      .select({ ext: schema.dishes.externalId, name: schema.dishes.name })
      .from(schema.dishes)
      .where(eq(schema.dishes.restaurantId, rid)),
    db
      .select({ ext: schema.wines.externalId, name: schema.wines.name })
      .from(schema.wines)
      .where(eq(schema.wines.restaurantId, rid)),
  ]);

  const count = (type: string) => totals.find((x) => x.event_type === type)?.n ?? 0;
  const dishName = new Map(dishRows.map((d) => [d.ext, t(d.name as { en: string; pl: string }, lng)]));
  const wineName = new Map(wineRows.map((w) => [w.ext, t(w.name as { en: string; pl: string }, lng)]));

  const views = count("restaurant_view") + count("page_view");
  const dishSelects = count("dish_select");
  const wineSelects = count("wine_select");
  const pairingReqs = count("pairing_request");
  const maxDay = Math.max(1, ...daily.map((d) => d.n));
  const maxDish = Math.max(1, ...topDishes.map((d) => d.n));
  const maxWine = Math.max(1, ...topWines.map((d) => d.n));
  const hasData = views + dishSelects + wineSelects + pairingReqs > 0;

  const tiles = [
    { label: "Wyświetlenia strony", value: views, hint: "skany QR + wejścia" },
    { label: "Wybory dań", value: dishSelects, hint: "kliknięcia w menu" },
    { label: "Wybory win", value: wineSelects, hint: "kliknięcia w karcie win" },
    { label: "Dobory par", value: pairingReqs, hint: "zapytania o dopasowanie" },
  ];

  return (
    <div className="pitch-grain mobile-safe-bottom min-h-screen bg-background-dark text-[color:var(--ink)]">
      <Navigation />
      <main className="mx-auto w-full max-w-5xl px-4 pt-24 pb-24 sm:px-6">
        <header className="mb-8">
          <Link
            href={`/admin/restaurants/${slug}`}
            className="inline-flex min-h-[40px] items-center text-[12px] font-semibold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase hover:text-[color:var(--ink)]"
          >
            ← Edytor restauracji
          </Link>
          <h1 className="pitch-display mt-2 text-[clamp(1.6rem,4vw,2.6rem)] text-white">
            {t(restaurant.name as { en: string; pl: string }, lng)}{" "}
            <em className="font-serif italic text-[var(--color-accent-gold)]">· statystyki</em>
          </h1>
          <p className="mt-1 text-sm text-gray-400">
            Ostatnie {DAYS} dni · dane odświeżają się przy każdym wejściu
          </p>
        </header>

        {/* Tiles */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((tile) => (
            <div
              key={tile.label}
              className="rounded-2xl border border-[var(--gold-hairline-soft)] bg-[#0b1f44]/60 p-4"
            >
              <p className="text-[11px] font-semibold tracking-[0.16em] text-gray-400 uppercase">
                {tile.label}
              </p>
              <p className="pitch-display mt-2 text-3xl text-white tabular-nums">{tile.value}</p>
              <p className="mt-1 text-[11px] text-gray-500">{tile.hint}</p>
            </div>
          ))}
        </section>

        {!hasData ? (
          <section className="mt-8 rounded-2xl border border-dashed border-[var(--gold-hairline-soft)] bg-[#0b1f44]/40 p-8 text-center">
            <p className="pitch-display text-xl text-white">Jeszcze cisza przed burzą</p>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-400">
              Statystyki wypełnią się, gdy goście zaczną skanować kod QR i wybierać dania.
              Wydrukuj kody QR na stoliki i obserwuj, co wybierają.
            </p>
            <Link
              href={`/admin/restaurants/${slug}/qr`}
              className="mt-5 inline-flex min-h-[44px] items-center rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-[color:var(--on-primary)]"
            >
              Drukuj kody QR →
            </Link>
          </section>
        ) : (
          <>
            {/* Daily views, last 14 days */}
            <section className="mt-8 rounded-2xl border border-[var(--gold-hairline-soft)] bg-[#0b1f44]/60 p-5">
              <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[var(--color-accent-gold)] uppercase">
                Wyświetlenia dziennie · 14 dni
              </h2>
              <div className="mt-4 flex h-28 items-end gap-1.5" role="img" aria-label="Wykres wyświetleń dziennych">
                {daily.length === 0 ? (
                  <p className="text-sm text-gray-500">Brak wyświetleń w tym oknie.</p>
                ) : (
                  daily.map((d) => (
                    <div key={d.day} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-400 tabular-nums">{d.n}</span>
                      <div
                        className="w-full rounded-t bg-[var(--color-accent-gold)]/70"
                        style={{ height: `${Math.max(6, (d.n / maxDay) * 80)}px` }}
                      />
                      <span className="text-[9px] text-gray-500">{d.day}</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            {/* Top dishes / wines */}
            <section className="mt-6 grid gap-6 md:grid-cols-2">
              {[
                { title: "Najczęściej wybierane dania", rows: topDishes, names: dishName, max: maxDish },
                { title: "Najczęściej wybierane wina", rows: topWines, names: wineName, max: maxWine },
              ].map((block) => (
                <div
                  key={block.title}
                  className="rounded-2xl border border-[var(--gold-hairline-soft)] bg-[#0b1f44]/60 p-5"
                >
                  <h2 className="text-[11px] font-semibold tracking-[0.2em] text-[var(--color-accent-gold)] uppercase">
                    {block.title}
                  </h2>
                  {block.rows.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">Jeszcze brak wyborów.</p>
                  ) : (
                    <ol className="mt-4 space-y-2.5">
                      {block.rows.map((r, i) => (
                        <li key={r.ext ?? i} className="min-w-0">
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="truncate font-serif text-sm italic text-[color:var(--ink)]">
                              {i + 1}. {block.names.get(r.ext ?? "") ?? r.ext ?? "—"}
                            </span>
                            <span className="shrink-0 text-xs text-gray-400 tabular-nums">{r.n}</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                            <div
                              className="h-full rounded-full bg-[var(--color-accent-gold)]/70"
                              style={{ width: `${Math.max(4, (r.n / block.max) * 100)}%` }}
                            />
                          </div>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </section>
          </>
        )}
      </main>
      <MobileTabBar />
    </div>
  );
}
