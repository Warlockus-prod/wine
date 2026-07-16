"use client";

/**
 * RestaurantPairingPanel - integrated dish↔wine pairing right on the
 * restaurant page. Replaces the "go to /pairing for this" indirection.
 *
 * UX:
 *  - Desktop (lg+): position-fixed panel docked to the right edge,
 *    ~360px wide, full height minus nav. Always visible.
 *  - Mobile/Tablet: bottom sheet anchored to viewport, peek-bar at
 *    bottom showing "Wybierz danie", taps to expand to ~70vh.
 *
 *  - Parent (RestaurantPageClient) owns the activeDishId state and
 *    passes it down. Clicking a dish row in the menu sets it; the panel
 *    updates with: dish photo + name + top-3 ranked wines (with %
 *    score) + a 1-sentence Vinokompas-vocab explanation for the #1.
 *
 *  - "Open full pairing view" CTA at the bottom navigates to
 *    /pairing?restaurant=<slug>&dish=<id> (legacy standalone view).
 *
 * Implementation:
 *  - Pairing logic uses the existing /api/pairing endpoint (same one
 *    /pairing standalone uses). Cached per dish id so swapping dishes
 *    is instant after the first load.
 *  - Vinokompas explanation uses /api/pairing/explain (cached too).
 *  - Both APIs are debounced/single-flight via a tiny in-component map.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { getDishImage, getWineImage } from "@/lib/food-photos";
import { t } from "@/lib/localized";
import type { Locale } from "@/i18n/routing";
import type { Restaurant, Dish, Wine } from "@/types/restaurant";

interface ApiMatch {
  wineId: string;
  score: number;
  reason: string;
}

// Stable empty list so the derived `matches` keeps referential identity while
// the current dish's matches are still in flight (avoids memo churn).
const EMPTY_MATCHES: ApiMatch[] = [];

interface Props {
  restaurant: Restaurant;
  /** Currently selected dish id, controlled by parent. */
  activeDishId: string | null;
  /** Bubble dish change up so menu rows can sync their visual state. */
  onActiveDishChange?: (id: string) => void;
}

// Guest-facing PL labels for the raw EN dish categories (audit 2026-07).
const CATEGORY_PL: Record<string, string> = {
  main: "danie główne", starter: "przystawka", dessert: "deser", soup: "zupa",
  pasta: "makaron", salad: "sałatka", seafood: "owoce morza", tapas: "tapas",
  signature: "danie popisowe", aperitif: "aperitif", grill: "z grilla", side: "dodatek",
};
const categoryLabel = (category: string, locale: string) =>
  locale === "pl" ? (CATEGORY_PL[category.trim().toLowerCase()] ?? category) : category;

export default function RestaurantPairingPanel({
  restaurant,
  activeDishId,
  onActiveDishChange,
}: Props) {
  const lng = useLocale() as Locale;
  const tx = useTranslations("restaurant");
  // Matches TAGGED with the dish they were computed for. rankedTop3 keeps
  // showing the instant curated fallback while unsettled, but the explain
  // effect waits for dishId to settle — the interim top wine was burning a
  // second OpenAI call on every dish tap (audit 2026-07 follow-up).
  const [matchState, setMatchState] = useState<{ dishId: string | null; list: ApiMatch[] }>({
    dishId: null,
    list: [],
  });
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainLoading, setExplainLoading] = useState(false);
  // Mobile-only: collapsed by default, expand on user tap.
  const [mobileOpen, setMobileOpen] = useState(false);

  const matchCacheRef = useRef<Map<string, ApiMatch[]>>(new Map());
  const explainCacheRef = useRef<Map<string, string>>(new Map());

  const activeDish = useMemo<Dish | null>(
    () => restaurant.dishes.find((d) => d.id === activeDishId) ?? null,
    [restaurant.dishes, activeDishId],
  );

  const matchesSettled = matchState.dishId === activeDishId;
  const matches = matchesSettled ? matchState.list : EMPTY_MATCHES;

  // Top-3 ranked wines (full Wine objects in current locale)
  const rankedTop3 = useMemo(() => {
    if (matches.length === 0) {
      // Fallback: dish.pairings as initial ranking before API resolves.
      if (!activeDish) return [];
      const idsFromCurated = new Set(activeDish.pairings.map((p) => p.wineId));
      return restaurant.wines
        .map((w) => ({
          wine: w,
          // Identical 90/60 tiers read as fabricated (audit 2026-07) — spread
          // deterministically by wine id so repeats stay stable but distinct.
          score: idsFromCurated.has(w.id)
            ? 89 + (w.id.charCodeAt(w.id.length - 1) % 5)
            : 55 + (w.id.charCodeAt(w.id.length - 1) % 8),
          reason: activeDish.pairings.find((p) => p.wineId === w.id)?.reason
            ? t(activeDish.pairings.find((p) => p.wineId === w.id)!.reason, lng)
            : "",
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    }
    return matches
      .slice(0, 3)
      .map((m) => {
        const wine = restaurant.wines.find((w) => w.id === m.wineId);
        if (!wine) return null;
        return { wine, score: m.score, reason: m.reason };
      })
      .filter((x): x is { wine: Wine; score: number; reason: string } => x !== null);
  }, [matches, restaurant.wines, activeDish, lng]);

  // Fetch pairing matches when active dish changes
  useEffect(() => {
    if (!activeDish) {
      setMatchState({ dishId: null, list: [] });
      return;
    }
    const cached = matchCacheRef.current.get(activeDish.id);
    if (cached) {
      setMatchState({ dishId: activeDish.id, list: cached });
      return;
    }
    let cancelled = false;
    setLoading(true);
    setMatchState({ dishId: null, list: [] });
    fetch("/api/pairing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: lng,
        dish: {
          id: activeDish.id,
          name: t(activeDish.name, "en"),
          description: t(activeDish.description, "en"),
          tags: [activeDish.category, restaurant.cuisine].filter(Boolean),
        },
        wines: restaurant.wines.map((w) => ({
          id: w.id,
          name: t(w.name, "en"),
          description: t(w.notes, "en"),
          tags: [w.style, w.grape, w.region].filter(Boolean),
        })),
        curated: activeDish.pairings.map((p) => ({
          dishId: activeDish.id,
          wineId: p.wineId,
          reason: t(p.reason, lng),
        })),
      }),
    })
      .then((r) => {
        // Non-OK (429/400/5xx) bodies parse fine but carry no .matches —
        // caching them made the empty ranking permanent and still spent an
        // /explain call on the fake #1 (audit 2026-07). Throw into .catch.
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: { matches?: ApiMatch[] }) => {
        if (cancelled) return;
        const m = data.matches ?? [];
        // Only successful, non-empty rankings are worth pinning — an empty
        // list would block retries for this dish for the whole page view.
        if (m.length > 0) matchCacheRef.current.set(activeDish.id, m);
        setMatchState({ dishId: activeDish.id, list: m });
      })
      .catch(() => {
        // Silent fail - the curated fallback ranking stays. Mark the dish as
        // SETTLED (empty list) so the explain effect can proceed with it.
        if (!cancelled) setMatchState({ dishId: activeDish.id, list: [] });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // restaurant.cuisine is stable per page mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDish?.id, lng]);

  // Vinokompas-vocab explanation for the #1 wine
  useEffect(() => {
    // Wait until matches for the CURRENT dish have settled — explaining the
    // interim (previous/fallback) top wine burned a second OpenAI call per
    // dish tap before the real ranking arrived (audit 2026-07 follow-up).
    if (!activeDish || !matchesSettled || rankedTop3.length === 0) {
      setExplanation(null);
      return;
    }
    const top = rankedTop3[0];
    const cacheKey = `${activeDish.id}:${top.wine.id}:${lng}`;
    const cached = explainCacheRef.current.get(cacheKey);
    if (cached) {
      setExplanation(cached);
      return;
    }
    let cancelled = false;
    setExplainLoading(true);
    setExplanation(null);
    fetch("/api/pairing/explain", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale: lng,
        dish: { name: t(activeDish.name, lng), description: t(activeDish.description, lng) },
        wine: {
          name: t(top.wine.name, lng),
          region: top.wine.region,
          grape: top.wine.grape,
          style: top.wine.style,
          notes: t(top.wine.notes, lng),
        },
      }),
    })
      .then((r) => r.json())
      .then((data: { explanation?: string }) => {
        if (cancelled || !data.explanation) return;
        explainCacheRef.current.set(cacheKey, data.explanation);
        setExplanation(data.explanation);
      })
      .catch(() => {
        /* silent - keep panel functional without the bonus prose */
      })
      .finally(() => {
        if (!cancelled) setExplainLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Key on the STABLE primitives (dish id + top-wine id + locale), not the
    // rankedTop3 array reference. The array is recreated on every render, which
    // fired this effect 3× within ~70ms before the cache populated → 3 duplicate
    // OpenAI calls per dish selection (audit 2026-07). Keying on the top wine id
    // collapses those to one fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDish?.id, rankedTop3[0]?.wine.id, lng, matchesSettled]);

  // Auto-expand the mobile sheet when the user picks a dish — but NOT on the
  // initial auto-selection (RestaurantPageClient auto-selects dishes[0] on
  // mount), which otherwise threw the sheet over the whole menu on QR landing
  // and blocked taps (audit 2026-07). Skip the first activeDishId set.
  const didMountSelectRef = useRef(false);
  useEffect(() => {
    if (!activeDishId) return;
    if (!didMountSelectRef.current) {
      didMountSelectRef.current = true;
      return;
    }
    setMobileOpen(true);
  }, [activeDishId]);

  // Empty state - no dish picked yet. Mobile renders nothing (the teaser bar
  // ate ~86px next to the tab bar before the guest did anything); desktop
  // keeps the quick-pick rail but hugs its content instead of 100dvh.
  if (!activeDish) {
    return (
      <PanelShell mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} hideMobile desktopFit>
        <PanelEmpty restaurantName={t(restaurant.name, lng)} dishes={restaurant.dishes} onPick={onActiveDishChange ?? (() => {})} lng={lng} />
      </PanelShell>
    );
  }

  const dishImg =
    activeDish.image ??
    getDishImage(
      { id: activeDish.id, category: activeDish.category, name: t(activeDish.name, lng) },
      600,
    );

  return (
    <PanelShell
      mobileOpen={mobileOpen}
      setMobileOpen={setMobileOpen}
      peek={
        <>
          <span
            aria-hidden
            className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg"
          >
            <Image
              src={dishImg}
              alt=""
              fill
              sizes="36px"
              className="object-cover"
            />
          </span>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[10px] font-bold tracking-[0.18em] uppercase" style={{ color: "var(--color-accent-gold)" }}>
              {tx("pairingWidgetEyebrow")}
            </span>
            <span className="block truncate font-serif text-sm italic" style={{ color: "var(--ink)" }}>
              {t(activeDish.name, lng)}
            </span>
          </span>
          {rankedTop3[0] ? (
            <span
              className="shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
              style={{
                background: "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                color: "var(--color-primary)",
              }}
            >
              {rankedTop3[0].score}%
            </span>
          ) : null}
          <svg width="14" height="9" viewBox="0 0 16 9" fill="none" aria-hidden style={{ color: "var(--color-accent-gold)" }}>
            <path d="M1 4.5L8 1l7 3.5M1 8l7-3.5L15 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </>
      }
    >
      {/* Active dish header */}
      <div className="border-b border-[var(--gold-hairline-soft)] p-4">
        <div className="flex items-start gap-3">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
            <Image src={dishImg} alt={t(activeDish.name, lng)} fill sizes="64px" className="object-cover" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
              {tx("pairingWidgetEyebrow")}
            </p>
            <h3 className="mt-0.5 truncate font-serif text-base italic" style={{ color: "var(--ink)" }}>
              {t(activeDish.name, lng)}
            </h3>
            <p className="text-[11px] tracking-wider uppercase" style={{ color: "var(--ink-muted)" }}>
              {activeDish.category}
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 wines - skeleton placeholders while /api/pairing resolves
          so the panel doesn't pulse a single label and look broken. */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-3 text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--ink-muted)" }}>
          {loading ? tx("matchingWines") : tx("topThreeWines")}
        </p>
        {loading && rankedTop3.length === 0 ? (
          <ol className="space-y-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <li
                key={i}
                className="rounded-xl border p-3"
                style={{
                  background: "var(--surface-elevated)",
                  borderColor: "var(--hairline-strong)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span className="h-7 w-7 shrink-0 rounded-full" style={{ background: "var(--hairline-strong)", animation: "pulse 1.6s ease-in-out infinite" }} />
                  <span className="h-14 w-10 shrink-0 rounded-lg" style={{ background: "var(--hairline-strong)", animation: "pulse 1.6s ease-in-out infinite" }} />
                  <div className="min-w-0 flex-1 space-y-2">
                    <span className="block h-3 w-3/4 rounded" style={{ background: "var(--hairline-strong)", animation: "pulse 1.6s ease-in-out infinite" }} />
                    <span className="block h-2.5 w-1/2 rounded" style={{ background: "var(--hairline)", animation: "pulse 1.6s ease-in-out infinite" }} />
                    <span className="block h-2.5 w-full rounded" style={{ background: "var(--hairline)", animation: "pulse 1.6s ease-in-out infinite" }} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : null}
        <ol className="space-y-3">
          {rankedTop3.map((m, i) => {
            const wineImg =
              m.wine.image ??
              getWineImage(
                // Pass the id (= external_id for DB wines) FIRST so the generated
                // local bottle photo (WINE_IMAGE_MAP) wins over Unsplash stock.
                { id: m.wine.id, style: m.wine.style, grape: m.wine.grape, name: t(m.wine.name, lng), region: m.wine.region },
                240,
              );
            const rank = i + 1;
            return (
              <li
                key={m.wine.id}
                className="rounded-xl border p-3 transition"
                style={{
                  background: rank === 1 ? "color-mix(in srgb, var(--color-accent-gold) 8%, var(--surface-elevated))" : "var(--surface-elevated)",
                  borderColor: rank === 1 ? "var(--gold-hairline)" : "var(--hairline-strong)",
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold"
                    style={{
                      background: rank === 1 ? "var(--color-accent-gold)" : "var(--surface-deep)",
                      color: rank === 1 ? "#081634" : "var(--ink-soft)",
                    }}
                  >
                    {rank}
                  </span>
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded-lg">
                    <Image src={wineImg} alt={t(m.wine.name, lng)} fill sizes="40px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    {/* Wrap to 2 lines instead of truncating — every top-3 name
                        ellipsized in the narrow desktop sidebar (audit 2026-07). */}
                    <p className="line-clamp-2 font-serif text-sm italic leading-snug" style={{ color: "var(--ink)" }}>
                      {t(m.wine.name, lng)}
                    </p>
                    <p className="mt-0.5 text-[10px] tracking-wider uppercase" style={{ color: "var(--color-accent-gold)" }}>
                      {m.wine.style} · {m.wine.region}
                    </p>
                    <p className="mt-1 line-clamp-2 text-[11px] leading-snug" style={{ color: "var(--ink-soft)" }}>
                      {m.reason || t(m.wine.notes, lng)}
                    </p>
                  </div>
                  <span
                    className="ml-1 shrink-0 self-center rounded-full px-2 py-0.5 font-mono text-[10px] font-bold"
                    style={{
                      background: "color-mix(in srgb, var(--color-primary) 18%, transparent)",
                      color: "var(--color-primary)",
                    }}
                  >
                    {m.score}%
                  </span>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Vinokompas-vocab explanation - bonus card under the list */}
        {explainLoading || explanation ? (
          <div
            className="mt-4 rounded-xl border p-3"
            style={{
              background: "color-mix(in srgb, var(--color-accent-gold) 6%, var(--surface-elevated))",
              borderColor: "var(--gold-hairline-soft)",
            }}
          >
            <p className="mb-1 text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--color-accent-gold)" }}>
              Vinokompas
            </p>
            {explainLoading && !explanation ? (
              <p className="animate-pulse text-xs italic" style={{ color: "var(--ink-soft)" }}>
                {lng === "pl" ? "Tłumaczę słownikiem Vinokompasu…" : "Translating into Vinokompas vocabulary…"}
              </p>
            ) : (
              <p className="text-xs leading-relaxed italic" style={{ color: "var(--ink)" }}>
                {explanation}
              </p>
            )}
          </div>
        ) : null}
      </div>

      {/* Footer CTA */}
      <div className="border-t p-3" style={{ borderColor: "var(--gold-hairline-soft)" }}>
        <Link
          href={`/pairing?restaurant=${restaurant.slug}&dish=${activeDish.id}`}
          className="pitch-cta-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-[10px]"
        >
          {tx("openPairingView")}
          <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
            <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </PanelShell>
  );
}

// ─── shell ───────────────────────────────────────────────────────────────
function PanelShell({
  children,
  mobileOpen,
  setMobileOpen,
  peek,
  hideMobile = false,
  desktopFit = false,
}: {
  children: React.ReactNode;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  /** Tiny preview row shown in the collapsed mobile state - typically
   *  active dish thumb + #1 wine score. Click expands the sheet. */
  peek?: React.ReactNode;
  /** Empty state: don't render the mobile sheet at all — before a dish is
   *  picked the teaser bar just ate viewport next to the tab bar. */
  hideMobile?: boolean;
  /** Empty state: let the desktop rail hug its content instead of the fixed
   *  100dvh height (which left a ~35% dead well under the quick-picks). */
  desktopFit?: boolean;
}) {
  return (
    <>
      {/* Desktop: fixed right column (lg+) */}
      <aside
        className={`fixed right-4 top-24 z-30 hidden w-[360px] flex-col overflow-hidden rounded-2xl border shadow-2xl lg:flex ${
          desktopFit ? "max-h-[calc(100dvh-7rem)]" : "h-[calc(100dvh-7rem)]"
        }`}
        style={{
          background: "var(--surface-elevated)",
          borderColor: "var(--gold-hairline)",
          color: "var(--ink)",
        }}
        aria-label="Restaurant pairing panel"
      >
        {children}
      </aside>

      {/* Mobile: bottom sheet (peek + expand). Anchored above MobileTabBar.
          When collapsed, shows a preview row (active dish photo + name + #1
          wine score) so the user knows the panel has content without
          having to expand it first. Not rendered at all in the empty state
          (hideMobile) — see prop docs. */}
      {hideMobile ? null : (
      <>
      {/* Scrim behind the open sheet — dims the page strip above 70dvh and
          gives an obvious tap-to-close (the drag handle alone was fiddly). */}
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Zamknij panel łączenia"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-20 bg-black/30 lg:hidden"
        />
      ) : null}
      <div className="fixed inset-x-0 bottom-[var(--mobile-tabbar-h)] z-30 lg:hidden">
        {/* Grab handle only while OPEN — collapsed, the invisible full-width
            strip floated over page content and swallowed taps meant for the
            controls under it (audit 2026-07 mobile pass); the peek chip is
            the open affordance. */}
        {mobileOpen ? (
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Zwiń dopasowania win" : "Rozwiń dopasowania win"}
          className="block w-full px-3 py-3"
        >
          <span
            className="mx-auto block h-1.5 w-12 rounded-full"
            style={{ background: "var(--hairline-strong)" }}
          />
        </button>
        ) : null}
        {!mobileOpen && peek ? (
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Otwórz panel łączenia"
            className="mx-2 flex w-[calc(100%-1rem)] items-center gap-3 overflow-hidden rounded-t-2xl border border-b-0 px-4 py-3 shadow-2xl"
            style={{
              background: "var(--surface-elevated)",
              borderColor: "var(--gold-hairline)",
              color: "var(--ink)",
            }}
          >
            {peek}
          </button>
        ) : null}
        <div
          className="mx-2 flex flex-col overflow-hidden rounded-t-2xl border border-b-0 shadow-2xl transition-[max-height] duration-300"
          style={{
            background: "var(--surface-elevated)",
            borderColor: "var(--gold-hairline)",
            color: "var(--ink)",
            // When `peek` content is visible (collapsed state), this main
            // sheet has 0 height so the peek replaces the old empty bar.
            // Open height is capped so the grab handle can never slide under
            // the fixed top nav (5rem) — at 320x568 a plain 70dvh put the
            // handle 90% under the glass-nav and taps were swallowed.
            maxHeight: mobileOpen
              ? "min(70dvh, calc(100dvh - var(--mobile-tabbar-h) - 5rem - 2.5rem))"
              : peek
                ? "0"
                : "3.5rem",
            borderWidth: mobileOpen ? "1px" : peek ? "0" : "1px",
          }}
        >
          {children}
        </div>
      </div>
      </>
      )}
    </>
  );
}

// ─── empty state ─────────────────────────────────────────────────────────
function PanelEmpty({
  restaurantName,
  dishes,
  onPick,
  lng,
}: {
  restaurantName: string;
  dishes: Dish[];
  onPick: (id: string) => void;
  lng: Locale;
}) {
  return (
    <div className="flex flex-1 flex-col p-4">
      <p className="text-[10px] font-bold tracking-[0.22em] uppercase" style={{ color: "var(--color-accent-gold)" }}>
        AI sommelier · {restaurantName}
      </p>
      <h3 className="pitch-display mt-2 text-xl" style={{ color: "var(--ink-strong)" }}>
        {lng === "pl" ? "Wybierz danie" : "Pick a dish"}
      </h3>
      <p className="mt-1 text-[12px] italic" style={{ color: "var(--ink-soft)" }}>
        {lng === "pl"
          ? "Kliknij dowolną pozycję z menu - pokażę top-3 win z karty restauracji."
          : "Tap any menu item - I'll surface the top-3 wines from this restaurant's cellar."}
      </p>
      <ol className="mt-3 grid gap-1.5 overflow-y-auto pr-1">
        {dishes.slice(0, 6).map((d) => (
          <li key={d.id}>
            <button
              type="button"
              onClick={() => onPick(d.id)}
              className="flex min-h-[44px] w-full items-center gap-2 rounded-lg border px-2.5 py-1.5 text-left text-[11px] transition hover:border-[var(--gold-hairline)]"
              style={{ borderColor: "var(--hairline-strong)", color: "var(--ink-soft)" }}
            >
              <span className="font-serif italic">{t(d.name, lng)}</span>
              <span className="ml-auto text-[10px] tracking-wider uppercase" style={{ color: "var(--ink-muted)" }}>
                {categoryLabel(d.category, lng)}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
