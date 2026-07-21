"use client";

/**
 * StagedTutorial - 3-step Vinokompas wine-finding flow.
 *
 * Author's brief (Magdalena Surgiel-Czyż / Vinocompas). Three stages —
 * restored 2026-07 at the client's request after trialling a 2-stage merge:
 *   1) SMAK      - the 3 base smaki on the level-1 wheel + dryness meter.
 *   2) WRAŻENIA  - the 6 sensations on the level-2 wheel.
 *   3) AROMATY   - the 12 tendencje on the level-3 wheel.
 *
 * After every stage the user can preview matching wines without finishing
 * the rest of the flow. There is also a "Skip stage" button.
 *
 * Profile model:
 *   - Stage 1 writes `base.slodycz` / `.cierpkosc` / `.kwasowosc` (0-5) AND a
 *     per-sektor average - the sektor value is fanned out to both tendencje
 *     under it so downstream consumers (chat, pairing) see a coherent profile
 *     even if the user never opens stage 2.
 *   - Stage 2 writes the canonical per-tendencja values directly. If the
 *     user later edits stage 1's wrażenia, stage-2 values are overwritten by
 *     the fanned-out average - intentional ("simpler input wins until you
 *     bother with the harder one").
 *
 * Dryness algorithm is a placeholder until tata + Kuba ship the real one:
 *   score = slodycz*25 − cierpkosc*5 − kwasowosc*5 + 15  (clamped 0-100)
 *   then bucketed into 6 labels.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import WineBottleSVG from "@/components/v2/WineBottleSVG";
import {
  wineRegion,
  wineWhy,
  winnicaWineUrl,
  type SamouczekWine,
} from "@/data/samouczek-wines";
import { matchWines, filledDimensions } from "@/lib/samouczek-match";
import { dryness } from "@/lib/dryness";
import { pickL, type CompassLang } from "@/data/wine-compass-kb";
import type { CompassProfile } from "./TasteCompass";

// Heavy SVG dial - single instance reused across both stages, level
// changes per stage to progressively reveal layers.
const InteractiveCompass = dynamic(() => import("./InteractiveCompass"), {
  ssr: false,
  loading: () => (
    <div className="aspect-square w-full max-w-[440px] animate-pulse rounded-full bg-white/5" />
  ),
});

type Stage = 1 | 2 | 3;

interface Props {
  profile: CompassProfile;
  onProfileChange: (next: CompassProfile) => void;
  /** When true, hide the chat-launcher (passed down to FloatingTasteChat). */
  chatDisabled: boolean;
  onChatDisabledChange: (next: boolean) => void;
  /** UI language - "pl" default keeps existing call-sites (and the PL e2e
   *  surface) byte-identical; the EN /samouczek + /embed pass "en". */
  lang?: CompassLang;
  /** Reports the active stage upward so the page can tell the chat bot where
   *  the user actually is (client 2026-07-18: "чат должен понимать на какой
   *  ты странице"). Stage state stays owned here. */
  onStageChange?: (stage: 1 | 2 | 3) => void;
}

// dryness algorithm lives in @/lib/dryness (extracted for unit tests).

// ─── live wine proposals - real wines from winnica.pl ─────────────────────
const STYLE_LABEL_PL: Record<SamouczekWine["style"], string> = {
  white: "białe",
  red: "czerwone",
  rose: "różowe",
  sparkling: "musujące",
  dessert: "deserowe",
};
const STYLE_LABEL_EN: Record<SamouczekWine["style"], string> = {
  white: "white",
  red: "red",
  rose: "rosé",
  sparkling: "sparkling",
  dessert: "dessert",
};

// Match guardrail - mirrors the original Vinokompas calculator's "Wybierz co
// najmniej 7 skojarzeń": below MIN_FILLED set dimensions the cosine match is
// mostly noise, so we withhold confident proposals and nudge for more.
// TARGET_FILLED is a "rich enough" profile, used by the completeness meter.
const MIN_FILLED = 4;
const TARGET_FILLED = 9;

function InlineProposals({ profile, lang }: { profile: CompassProfile; lang: CompassLang }) {
  const filled = filledDimensions(profile);
  const matches = matchWines(profile, 3);
  const enough = filled >= MIN_FILLED && matches.length > 0;
  const completeness = Math.min(100, Math.round((filled / TARGET_FILLED) * 100));
  // When embedded in an iframe (shop integration) open the shop in the TOP
  // window so the buying flow stays in one tab/session; standalone → new tab.
  const linkTarget =
    typeof window !== "undefined" && window.self !== window.top ? "_top" : "_blank";

  return (
    <div className="mt-6 rounded-2xl border border-[rgba(199,159,105,0.32)] bg-[#0b1f44] p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {/* SR announcement when proposals arrive/refresh - the visible list
              re-sorts silently otherwise. Text flips between 3 states only, so
              it never spams per-click. */}
          <span className="sr-only" role="status">
            {enough
              ? pickL(
                  lang,
                  `${matches.length} propozycje win dopasowane do Twojego profilu`,
                  `${matches.length} wine suggestions matched to your profile`,
                )
              : ""}
          </span>
          <p className="pitch-eyebrow pitch-eyebrow--start">
            {pickL(lang, "Twoje wina", "Your wines")}
          </p>
          <h3 className="pitch-display pitch-display--roomy mt-2 text-xl text-white sm:text-2xl">
            {enough
              ? pickL(lang, "Twój winiarski gust", "Your taste in wine")
              : filled === 0
                ? pickL(
                    lang,
                    "Ustaw Vinocompas, a wina pojawią się tutaj",
                    "Set your Vinocompas and the wines will appear here",
                  )
                : pickL(
                    lang,
                    "Jeszcze chwila - dobór się dostraja",
                    "Almost there — the matching is fine-tuning",
                  )}
          </h3>
          <p className="mt-1.5 font-serif text-sm italic text-[#e6e1d6]">
            {enough
              ? pickL(
                  lang,
                  `Procent pokazuje, jak dobrze dane wino odpowiada Twoim odpowiedziom. Im wyższy wynik, tym większe dopasowanie.`,
                  `The percentage shows how well a wine matches your answers. The higher the score, the closer the match.`,
                )
              : pickL(
                  lang,
                  `Profil jest jeszcze zbyt ubogi na trafny dobór. Ustaw co najmniej ${MIN_FILLED} elementów (smaki wokół koła lub wrażenia-sektory) - masz ${filled}/${MIN_FILLED}. Jak w oryginalnym Vinocompasie: im więcej skojarzeń, tym celniej.`,
                  `Your profile is still too sparse for an accurate match. Set at least ${MIN_FILLED} elements (the tastes around the wheel, or the sensation sectors) — you have ${filled}/${MIN_FILLED}. Just like the original Vinocompas: the more associations, the sharper the aim.`,
                )}
          </p>
          {/* Profile-completeness meter - richness toward a confident match. */}
          <div
            className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={TARGET_FILLED}
            aria-valuenow={filled}
            aria-label={pickL(lang, "Kompletność profilu", "Profile completeness")}
          >
            <div
              className={`h-full rounded-full transition-[width] duration-500 ${enough ? "bg-[var(--color-accent-gold)]" : "bg-[var(--color-accent-gold)]/45"}`}
              style={{ width: `${Math.max(5, completeness)}%` }}
            />
          </div>
        </div>
        <Link
          href="/pairing"
          className="pitch-cta-ghost inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-xs"
        >
          {pickL(lang, "Zobacz wszystkie wina", "See all wines")}
          <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
            <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {enough ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {matches.map(({ wine, matchPct }, i) => {
            // Two grape entries can share a verbatim why — showing the
            // identical italic blurb twice reads templated, so suppress a
            // card's blurb when it string-matches the previous card's.
            // Compared on the RENDERED (locale-picked) text: the EN generic
            // fallback can collide even when the PL originals differ.
            const whyText = wineWhy(wine, lang);
            const showWhy = i === 0 || whyText !== wineWhy(matches[i - 1].wine, lang);
            return (
            <li key={wine.id} className="vk-rise" style={{ animationDelay: `${i * 80}ms` }}>
              <a
                href={winnicaWineUrl(wine)}
                target={linkTarget}
                rel="noopener noreferrer"
                className="group flex h-full flex-col gap-3 rounded-xl border border-[rgba(199,159,105,0.20)] bg-[#122446]/70 p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-accent-gold)]/60 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="relative flex h-20 w-12 shrink-0 items-end justify-center overflow-hidden rounded-md"
                    aria-hidden
                  >
                    {wine.imageUrl ? (
                      // Real bottle shot from winnica.pl (generated catalogue);
                      // silhouette stays as the fallback for legacy entries.
                      <Image
                        src={wine.imageUrl}
                        alt=""
                        fill
                        sizes="48px"
                        className="object-contain"
                      />
                    ) : (
                      <WineBottleSVG
                        hint={wine.style}
                        style={wine.style}
                        grape={wine.grape}
                        className="h-20 w-auto drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/12 px-2 py-0.5 font-serif text-xs font-semibold text-[var(--color-accent-gold)] tabular-nums">
                        {matchPct}%
                      </span>
                      <span className="text-[10px] tracking-[0.16em] text-[color:var(--ink-muted)] uppercase">
                        {lang === "pl" ? STYLE_LABEL_PL[wine.style] : STYLE_LABEL_EN[wine.style]}
                      </span>
                    </div>
                    <p className="mt-2 font-serif text-base leading-tight text-[#f4efe9]">
                      {wine.name_pl}
                    </p>
                    <p className="mt-0.5 text-[10px] tracking-[0.14em] text-[color:var(--ink-muted)] uppercase">
                      {wineRegion(wine, lang)}
                    </p>
                  </div>
                </div>
                {showWhy ? (
                  <p className="font-serif text-[13px] leading-snug text-[#e6e1d6] italic">
                    {whyText}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-[rgba(199,159,105,0.16)] pt-3">
                  <span className="font-serif text-sm text-[#f4efe9]">
                    {pickL(lang, "od", "from")} {wine.priceFrom} zł
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.14em] text-[var(--color-accent-gold)] uppercase transition group-hover:gap-1.5">
                    winnica.pl
                    <svg width="11" height="8" viewBox="0 0 16 9" fill="none" aria-hidden>
                      <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </div>
              </a>
            </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {/* Intentional-looking placeholders: ghosted bottle silhouettes +
              numbered captions. The old dark-gradient swatch with a lone "-"
              read as broken cards on the cream theme (audit 2026-07). */}
          {(["red", "white", "sparkling"] as const).map((style, i) => (
            <div
              key={style}
              className="flex items-center gap-3 rounded-xl border border-dashed border-[rgba(199,159,105,0.35)] bg-[color:var(--paper-tint)] p-4"
            >
              <span className="flex h-16 w-8 shrink-0 items-end justify-center opacity-30" aria-hidden>
                <WineBottleSVG style={style} className="h-16 w-auto" />
              </span>
              <span className="font-serif text-sm italic text-[color:var(--ink-muted)]">
                {pickL(lang, "Propozycja", "Suggestion")} {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-[color:var(--color-accent-gold)]">
        {pickL(lang, "Rekomendacje pochodzą z oferty", "Recommendations come from the range at")}{" "}
        <a
          href="https://winnica.pl/pl/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--color-accent-gold)] underline decoration-[var(--color-accent-gold)]/40 underline-offset-2 hover:decoration-[var(--color-accent-gold)]"
        >
          winnica.pl
        </a>{" "}
        {pickL(
          lang,
          "i są dopasowywane na bieżąco na podstawie Twoich odpowiedzi w Vinocompasie.",
          "and are matched live to your answers in the Vinocompas.",
        )}
      </p>
    </div>
  );
}

// ─── stage navigation row ────────────────────────────────────────────────
function StageNav({
  stage,
  setStage,
  lang,
}: {
  stage: Stage;
  setStage: (s: Stage) => void;
  lang: CompassLang;
}) {
  // subShort: the mobile slot is ~88px of tracked uppercase — "3 podstawowe
  // smaki" truncated to "3 PODSTAWO…" next to tabs 2-3 that fit (audit
  // 2026-07). Full string returns from sm: up.
  const items: { n: Stage; label: string; sub: string; subShort: string }[] =
    lang === "pl"
      ? [
          { n: 1, label: "SMAK", sub: "3 osie smaku", subShort: "3 osie" },
          { n: 2, label: "WRAŻENIA", sub: "6 wrażeń", subShort: "6 wrażeń" },
          { n: 3, label: "TENDENCJE", sub: "12 grup aromatów", subShort: "12 grup" },
        ]
      : [
          { n: 1, label: "TASTE", sub: "3 taste axes", subShort: "3 axes" },
          { n: 2, label: "SENSATIONS", sub: "6 sensations", subShort: "6 sensations" },
          { n: 3, label: "TENDENCIES", sub: "12 aroma groups", subShort: "12 groups" },
        ];
  return (
    <ol className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((it) => {
        const active = it.n === stage;
        const done = it.n < stage;
        return (
          <li key={it.n} className="min-w-0">
            <button
              type="button"
              onClick={() => setStage(it.n)}
              aria-current={active ? "step" : undefined}
              className={`group flex h-full w-full min-w-0 flex-col items-start gap-1 overflow-hidden rounded-xl border px-3 py-3 text-left transition sm:px-4 ${
                active
                  ? "border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10"
                  : done
                    ? "border-[rgba(199,159,105,0.30)] bg-[#0b1f44]/50 hover:border-[var(--color-accent-gold)]/60"
                    : "border-white/10 bg-[#0b1f44]/30 hover:border-white/25"
              }`}
            >
              {/* Row 1: chip + "ETAP n" on ONE nowrap line - at 360-390px the
                  digit used to wrap under "ETAP" (audit 2026-07). */}
              <span className="flex min-w-0 items-center gap-1.5 whitespace-nowrap sm:gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    active
                      ? "bg-[var(--color-accent-gold)] text-[#081634]"
                      : done
                        ? "bg-[rgba(199,159,105,0.30)] text-[var(--color-accent-gold)]"
                        : "bg-white/10 text-white/70"
                  }`}
                >
                  {done ? (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6.5L5 9.5L10 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    it.n
                  )}
                </span>
                <span className={`text-[11px] tracking-wide sm:font-serif sm:text-xs sm:italic sm:tracking-wider ${active ? "text-[var(--color-accent-gold)]" : "text-[#e6e1d6]"}`}>
                  {pickL(lang, "ETAP", "STAGE")} {it.n}
                </span>
              </span>
              {/* Row 2: plain sans 12px on phones - the serif italic + wide
                  tracking made "WRAŻENIA" 90px wide inside a 73px tab and it
                  clipped to "WRAŻENL" (audit 2026-07). Fancy styling returns
                  from sm: up where the tabs have room. */}
              <span className={`max-w-full truncate text-[12px] font-medium sm:font-serif sm:text-lg sm:font-normal sm:italic ${active ? "text-white" : done ? "text-[#f4efe9]" : "text-[#e6e1d6]/85"}`}>
                {it.label}
              </span>
              <span className="max-w-full truncate text-[10px] tracking-wider text-[color:var(--ink-muted)] uppercase sm:text-[11px]">
                <span className="sm:hidden">{it.subShort}</span>
                <span className="hidden sm:inline">{it.sub}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ─── main component ──────────────────────────────────────────────────────

export default function StagedTutorial({
  profile,
  onProfileChange,
  chatDisabled,
  onChatDisabledChange,
  lang = "pl",
  onStageChange,
}: Props) {
  const [stage, setStage] = useState<Stage>(1);
  useEffect(() => {
    onStageChange?.(stage);
    // onStageChange is a stable page-level setter; excluding it keeps this
    // from re-firing on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // Persist current stage in sessionStorage so a refresh while filling
  // stage 2 doesn't snap the user back to stage 1.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const v = window.sessionStorage.getItem("wn_tutorial_stage");
      if (v === "1" || v === "2") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStage(Number(v) as Stage);
      } else if (v === "3") {
        setStage(3);
      }
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem("wn_tutorial_stage", String(stage));
    } catch {
      /* ignore */
    }
  }, [stage]);

  const dr = useMemo(() => dryness(profile, lang), [profile, lang]);

  // Deterministic landing after a stage switch: always scroll to the tab
  // strip (client 16.07: "przeskakuje czasem za daleko, czasem za blisko" -
  // the layout height changes between stages, so the browser's own scroll
  // anchoring was random). Skipped on first mount.
  const rootRef = useRef<HTMLDivElement | null>(null);
  const mountedRef = useRef(false);
  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    rootRef.current?.scrollIntoView({ block: "start", behavior: "smooth" });
  }, [stage]);

  const goNext = () => setStage((s) => (s < 3 ? ((s + 1) as Stage) : s));
  const goPrev = () => setStage((s) => (s > 1 ? ((s - 1) as Stage) : s));

  return (
    <div ref={rootRef} className="scroll-mt-[5.5rem]">
      {/* Top: stage tabs + chat toggle. On phones the tab strip takes the
          whole row (basis-full) so labels stop bleeding across tab borders;
          the Czat toggle wraps underneath. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 basis-full sm:basis-0">
          <StageNav stage={stage} setStage={setStage} lang={lang} />
        </div>
        <ChatToggle
          disabled={chatDisabled}
          onChange={onChatDisabledChange}
          lang={lang}
        />
      </div>

      {/* Body */}
      <div className="mt-5 rounded-2xl border border-[rgba(199,159,105,0.22)] bg-[#081634] p-5 sm:p-6">
        {/* Stage controls - rendered at the TOP and BOTTOM of the card
            (client review 2026-07: "przejście do kolejnych etapów powinno
            być i na górze i na dole"). Includes the profile reset that used
            to live in the removed TWÓJ PROFIL chip bar. The top strip is
            desktop-only - on phones the pair doubled up within one screen.
            STICKY since 2026-07-18 (client: the next-stage buttons scroll
            out of sight while looking at the compass — "зафиксировать их
            постоянно как в приложении"): it pins just below the fixed site
            nav (5rem) and floats over the card on its own navy ground while
            the wheel scrolls beneath. */}
        <StageControls
          stage={stage}
          goPrev={goPrev}
          goNext={goNext}
          onReset={() => onProfileChange({})}
          placement="top"
          className="sticky top-[5.25rem] z-30 -mx-2 mb-4 rounded-xl border-b border-[rgba(199,159,105,0.20)] bg-[#081634]/95 px-2 pt-2 pb-3 backdrop-blur-sm"
          lang={lang}
        />

        {stage === 1 ? (
          <StageSmak
            chatDisabled={chatDisabled}
            profile={profile}
            onProfileChange={onProfileChange}
            dryness={dr}
            lang={lang}
          />
        ) : stage === 2 ? (
          <StageWrazenia profile={profile} onProfileChange={onProfileChange} lang={lang} chatDisabled={chatDisabled} />
        ) : (
          <StageAromaty profile={profile} onProfileChange={onProfileChange} lang={lang} chatDisabled={chatDisabled} />
        )}

        {/* Mobile app-style pinned quick-nav (client 2026-07-18: "Następny
            etap" is below the fold while looking at the compass —
            "зафиксировать кнопки как в приложении которые постоянно внизу").
            sticky bottom: floats just ABOVE the fixed MobileTabBar
            (--mobile-tabbar-h, z-70) while the card is in view, then settles
            above the full strip at the card's end. Centred so it never
            crowds the FloatingTasteChat launcher in the right corner;
            pointer-events pass through the transparent wrapper. */}
        <div className="pointer-events-none sticky bottom-[calc(var(--mobile-tabbar-h)+0.75rem)] z-30 mt-5 flex justify-center gap-2 lg:hidden">
          {stage > 1 ? (
            <button
              type="button"
              onClick={goPrev}
              aria-label={pickL(lang, "Poprzedni etap", "Previous stage")}
              className="pointer-events-auto min-h-[42px] rounded-full border border-white/25 bg-[#081634]/95 px-4 text-sm font-semibold text-[#e6e1d6] shadow-lg backdrop-blur-sm"
            >
              ←
            </button>
          ) : null}
          <button
            type="button"
            onClick={
              stage < 3
                ? goNext
                : () => document.getElementById("propozycje")?.scrollIntoView({ block: "start" })
            }
            className="pitch-cta-primary pointer-events-auto inline-flex min-h-[42px] items-center gap-2 rounded-full px-5! text-[11.5px] shadow-lg"
          >
            {stage < 3
              ? pickL(lang, "Następny etap", "Next stage")
              : pickL(lang, "Pokaż wina", "Show wines")}
            <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
              <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <StageControls
          stage={stage}
          goPrev={goPrev}
          goNext={goNext}
          onReset={() => onProfileChange({})}
          className="mt-7 border-t border-[rgba(199,159,105,0.20)] pt-5"
          lang={lang}
        />
      </div>

      {/* Live wine proposals - appear right below, update as the profile changes */}
      <div id="propozycje" className="scroll-mt-[5.5rem]">
        <InlineProposals profile={profile} lang={lang} />
      </div>
    </div>
  );
}

// ─── stage controls strip (rendered top AND bottom of the card) ───────────
// On phones only the BOTTOM strip renders (the doubled 4-button block ate a
// screenful, audit 2026-07); desktop keeps both since they sit a viewport
// apart. The bottom strip becomes a tidy 2-col grid on mobile: secondary
// pair on one row, full-width primary below.
function StageControls({
  stage,
  goPrev,
  goNext,
  onReset,
  className,
  placement = "bottom",
  lang,
}: {
  stage: Stage;
  goPrev: () => void;
  goNext: () => void;
  onReset: () => void;
  className?: string;
  placement?: "top" | "bottom";
  lang: CompassLang;
}) {
  const rootDisplay =
    placement === "top"
      ? "hidden lg:flex"
      : "grid grid-cols-2 lg:flex";
  return (
    <div className={`${rootDisplay} flex-wrap items-center justify-between gap-1.5 lg:gap-2 ${className ?? ""}`}>
      {/* `contents` on mobile dissolves the group so each button becomes a
          grid cell; from lg: the wrapper reforms the left-hand flex cluster. */}
      <div className="contents lg:flex lg:flex-wrap lg:items-center lg:gap-2">
        {stage > 1 ? (
          <button
            type="button"
            onClick={goPrev}
            className="min-h-[32px] rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10.5px] font-semibold tracking-wider text-[#e6e1d6] uppercase transition hover:bg-white/10"
          >
            ← {pickL(lang, "Poprzedni etap", "Previous stage")}
          </button>
        ) : null}
        {/* Wyczyść BEFORE the long skip button: on the mobile 2-col grid the
            short pair (Poprzedni/Wyczyść) shares one row and the long "Pokaż
            dopasowane wina" gets its own full row - no 3-line wrap (audit
            2026-07). At stage 1 Wyczyść has no partner, so it goes full-width. */}
        <button
          type="button"
          onClick={onReset}
          className={`min-h-[32px] rounded-full border border-white/12 px-3 py-1 text-[10.5px] font-semibold tracking-wider text-[#e6e1d6]/60 uppercase transition hover:border-white/30 hover:text-[#e6e1d6] ${stage === 1 ? "col-span-2 lg:col-auto" : ""}`}
        >
          {pickL(lang, "Wyczyść", "Clear")}
        </button>
        {stage < 3 ? (
          <button
            type="button"
            onClick={() =>
              document.getElementById("propozycje")?.scrollIntoView({ block: "start" })
            }
            className="order-last col-span-2 min-h-[32px] rounded-full border border-[rgba(199,159,105,0.30)] lg:order-none bg-[#0b1f44] px-3 py-1 text-[10.5px] font-semibold tracking-wider text-[#e6e1d6]/80 uppercase transition hover:border-[var(--color-accent-gold)]/60 hover:text-[var(--color-accent-gold)] lg:col-auto"
          >
            {pickL(lang, "Pokaż dopasowane wina", "Show matched wines")} →
          </button>
        ) : null}
      </div>
      {stage < 3 ? (
        <button
          type="button"
          onClick={goNext}
          className="pitch-cta-primary col-span-2 inline-flex min-h-[34px] items-center justify-center gap-2 rounded-full px-3.5! py-1! text-[11px] lg:col-auto"
        >
          {pickL(lang, "Następny etap", "Next stage")}
          <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
            <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <button
          type="button"
          onClick={() =>
            document.getElementById("propozycje")?.scrollIntoView({ block: "start" })
          }
          className="pitch-cta-primary col-span-2 inline-flex min-h-[34px] items-center justify-center gap-2 rounded-full px-3.5! py-1! text-[11px] lg:col-auto"
        >
          {pickL(lang, "Pokaż wina", "Show wines")}
          <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
            <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── stage 1: SMAK (3 base tastes + dryness) ──────────────────────────────
function StageSmak({
  profile,
  onProfileChange,
  dryness: dr,
  lang,
  chatDisabled,
}: {
  profile: CompassProfile;
  onProfileChange: (next: CompassProfile) => void;
  dryness: { score: number; label: string };
  lang: CompassLang;
  chatDisabled?: boolean;
}) {
  return (
    <div>
      <header>
        {/* Stage copy = the client's round-3 texts, verbatim (EN = faithful
            rendering). The question heading replaces the old mechanics-first
            instruction ("etap 1 uczy, że wytrawność to coś więcej niż cukier"). */}
        <p className="pitch-eyebrow pitch-eyebrow--start">
          {pickL(lang, "Etap I · Smak", "Stage I · Taste")}
        </p>
        <h2 className="pitch-display pitch-display--roomy mt-2 text-xl text-white sm:text-2xl">
          {pickL(
            lang,
            "Jak odbierasz smak wina, które lubisz?",
            "How do you experience the taste of a wine you love?",
          )}
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          {pickL(
            lang,
            "Kliknij na każdej z trzech osi. Im dalej od środka, tym mocniej odczuwasz daną cechę.",
            "Tap each of the three axes. The further from the centre, the more strongly you feel that trait.",
          )}
        </p>
      </header>

      <div className="mt-4">
        <InteractiveCompass
          chatDisabled={chatDisabled}
          profile={profile}
          onProfileChange={onProfileChange}
          level={1}
          lang={lang}
          autoStartTour
          // Dryness meter directly under the compass on the same card — first
          // thing visible, updates live since `dr` is recomputed each render
          // in the parent.
          belowCompass={
            <DrynessMeter
              score={dr.score}
              label={dr.label}
              lang={lang}
              // No verdict before the user touches an axis — an all-zero
              // profile scored "Wytrawne", contradicting the caption's
              // "na podstawie WYBRANYCH proporcji" (audit 2026-07).
              empty={!["base.slodycz", "base.cierpkosc", "base.kwasowosc"].some(
                (k) => ((profile[k] ?? 0) as number) > 0,
              )}
            />
          }
        />
      </div>
    </div>
  );
}

// ─── stage 2: WRAŻENIA (6 sensations) ─────────────────────────────────────
function StageWrazenia({
  profile,
  onProfileChange,
  lang,
  chatDisabled,
}: {
  profile: CompassProfile;
  onProfileChange: (next: CompassProfile) => void;
  lang: CompassLang;
  chatDisabled?: boolean;
}) {
  return (
    <div>
      <header>
        <p className="pitch-eyebrow pitch-eyebrow--start">
          {pickL(lang, "Etap II · Wrażenia", "Stage II · Sensations")}
        </p>
        {/* Client round-3 copy, verbatim ("etap 2 uczy rozpoznawania
            charakteru wina", not terminology). */}
        <h2 className="pitch-display pitch-display--roomy mt-2 text-xl text-white sm:text-2xl">
          {pickL(
            lang,
            "Jaki charakter ma wino, które lubisz?",
            "What character does a wine you love have?",
          )}
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          {pickL(lang, "Smak to dopiero początek.", "Taste is only the beginning.")}{" "}
          <strong className="not-italic font-semibold text-[#f4efe9]">
            {pickL(
              lang,
              "Wrażenia opisują, jak odbierasz wino jako całość.",
              "Sensations describe how you experience a wine as a whole.",
            )}
          </strong>{" "}
          {pickL(
            lang,
            "Dzięki nim łatwiej nazwać to, co czujesz podczas degustacji i znaleźć wina o podobnym charakterze.",
            "They make it easier to name what you feel while tasting and to find wines with a similar character.",
          )}
        </p>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          {pickL(
            lang,
            "Ustaw siłę każdego z sześciu wrażeń. Im dalej od środka, tym bardziej dane wrażenie opisuje wino, które lubisz. Nie wiesz od czego zacząć?",
            "Set the strength of each of the six sensations. The further from the centre, the more that sensation describes the wine you love. Not sure where to begin?",
          )}{" "}
          <strong className="not-italic font-semibold text-[#f4efe9]">
            {pickL(lang, "Uruchom przewodnik", "Start the guide")}
          </strong>{" "}
          {pickL(
            lang,
            "lub najedź kursorem na wybrane wrażenie.",
            "or hover over a sensation.",
          )}
        </p>
      </header>

      <div className="mt-4">
        <InteractiveCompass
          chatDisabled={chatDisabled}
          profile={profile}
          onProfileChange={onProfileChange}
          level={2}
          lang={lang}
          autoStartTour
        />
      </div>
    </div>
  );
}

function DrynessMeter({
  score,
  label,
  empty = false,
  lang,
}: {
  score: number;
  label: string;
  /** True while no base smak is set — show a neutral prompt, hide the pin. */
  empty?: boolean;
  lang: CompassLang;
}) {
  // Score 0..100 → marker position along the rail, clamped a touch off the
  // rounded ends so the pin never hangs into empty space at the extremes.
  const pos = Math.max(3, Math.min(97, score));
  return (
    <div className="mt-7 rounded-2xl border border-[rgba(199,159,105,0.22)] bg-[#0b1f44]/55 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
          {pickL(lang, "Twój profil wytrawności", "Your dryness profile")}
        </p>
        <p className="font-serif text-base italic text-white" aria-live="polite">
          {empty ? (
            <span className="text-sm text-[#e6e1d6]/70">
              {pickL(lang, "Zaznacz osie, aby zobaczyć profil", "Mark the axes to see your profile")}
            </span>
          ) : (
            label
          )}
        </p>
      </div>

      {/* Every interval labelled (client sketch 2026-07-21): five equal
          fifths, names alternating ABOVE (W, P.S) and BELOW (B.W, P.W, S)
          the rail exactly like the drawing, so five full words fit even on
          narrow screens. The sketch's B.W/P.S legend is not rendered —
          full names on the axis. */}
      <div className="relative mt-4 h-4 text-[9px] tracking-wider text-[color:var(--color-accent-gold)] uppercase sm:text-[10px]">
        <span className="absolute left-[30%] -translate-x-1/2 whitespace-nowrap">
          {pickL(lang, "Wytrawne", "Dry")}
        </span>
        <span className="absolute left-[70%] -translate-x-1/2 whitespace-nowrap">
          {pickL(lang, "Półsłodkie", "Medium sweet")}
        </span>
      </div>

      {/* Rail + position pin */}
      <div className="relative mt-5 h-8 w-full">
        {/* Rail */}
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#2f4a6b] via-[#c79f69] to-[#5b6b3a]" />

        {/* Tick marks under the rail */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="h-1.5 w-px bg-[var(--color-accent-gold)]/35" />
          ))}
        </div>

        {/* Position pin - a teardrop whose tip rests on the rail, marking
            the exact point. Reads as "you are here", not a button. */}
        <div
          className={`absolute top-1/2 transition-[left,opacity] duration-500 ease-out ${empty ? "opacity-0" : "opacity-100"}`}
          style={{ left: `${pos}%`, transform: "translate(-50%, -100%)" }}
        >
          <svg width="19" height="24" viewBox="0 0 24 30" fill="none" aria-hidden>
            <path
              d="M12 1.5a8.5 8.5 0 0 1 8.5 8.5c0 6.2-8.5 18.5-8.5 18.5S3.5 16.2 3.5 10A8.5 8.5 0 0 1 12 1.5z"
              fill="#f4efe9"
              stroke="#c79f69"
              strokeWidth="2"
            />
            <circle cx="12" cy="10" r="3.1" fill="#16294f" />
          </svg>
        </div>
      </div>

      <div className="relative mt-2 h-7 sm:h-4 text-[9px] tracking-wider text-[color:var(--color-accent-gold)] uppercase sm:text-[10px]">
        <span className="absolute left-0 max-w-[4.5rem] whitespace-normal leading-tight sm:max-w-none sm:whitespace-nowrap">
          {pickL(lang, "Bardzo wytrawne", "Bone dry")}
        </span>
        <span className="absolute left-[56%] -translate-x-1/2 whitespace-nowrap sm:left-1/2">
          {pickL(lang, "Półwytrawne", "Off-dry")}
        </span>
        <span className="absolute right-0 whitespace-nowrap">
          {pickL(lang, "Słodkie", "Sweet")}
        </span>
      </div>

      {/* Client round-3 caption. The underlying score is still the 3-base-smak
          placeholder model (see dryness() comment) - the copy frames it as a
          profile readout, which is exactly what it is. */}
      <p className="mt-3 text-xs leading-snug text-[color:var(--color-accent-gold)]">
        {pickL(
          lang,
          "Na podstawie wybranych proporcji słodyczy, kwasowości i cierpkości Vinocompas pokazuje, jak wytrawne jest wino o takim profilu.",
          "Based on the proportions of sweetness, acidity and astringency you have chosen, Vinocompas shows how dry a wine with this profile is.",
        )}
      </p>
    </div>
  );
}

// (Karty | Kompas view toggle removed - every stage now uses the
//  interactive compass directly. Cards mode is no longer needed.)

// ─── stage 2: AROMATY (12 tendencje, advanced) ───────────────────────────
function StageAromaty({
  profile,
  onProfileChange,
  lang,
  chatDisabled,
}: {
  profile: CompassProfile;
  onProfileChange: (next: CompassProfile) => void;
  lang: CompassLang;
  chatDisabled?: boolean;
}) {
  return (
    <div>
      <header>
        <p className="pitch-eyebrow pitch-eyebrow--start">
          {pickL(lang, "Etap III · Tendencje", "Stage III · Tendencies")}
        </p>
        <h2 className="pitch-display pitch-display--roomy mt-3 text-2xl text-white sm:text-3xl">
          {pickL(lang, "Doprecyzuj swój winiarski gust", "Fine-tune your taste in wine")}
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          {pickL(
            lang,
            "Każde wrażenie ma dwie tendencje - dwie grupy aromatów, które pomagają jeszcze lepiej opisać wino. Wybierz te, które najlepiej pasują do win, które lubisz.",
            "Each sensation has two tendencies - two groups of aromas that help describe a wine even better. Choose the ones that best fit the wines you love.",
          )}
        </p>
      </header>

      <div className="mt-4">
        <InteractiveCompass
          chatDisabled={chatDisabled}
          profile={profile}
          onProfileChange={onProfileChange}
          level={3}
          lang={lang}
          autoStartTour
        />
      </div>
    </div>
  );
}

// ─── chat enable/disable toggle ──────────────────────────────────────────
function ChatToggle({
  disabled,
  onChange,
  lang,
}: {
  disabled: boolean;
  onChange: (next: boolean) => void;
  lang: CompassLang;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!disabled)}
      aria-pressed={!disabled}
      className={`inline-flex min-h-[40px] items-center gap-2 rounded-full border px-3.5 py-2 text-[12px] font-semibold tracking-wider uppercase transition ${
        disabled
          ? "border-white/15 bg-white/5 text-[#cbc1b1]"
          : "border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 text-[var(--color-accent-gold)]"
      }`}
      title={
        disabled
          ? pickL(lang, "Włącz przewodnika", "Turn the guide on")
          : pickL(lang, "Wyłącz przewodnika", "Turn the guide off")
      }
    >
      <span
        aria-hidden
        className={`relative flex h-3.5 w-7 items-center rounded-full border ${
          disabled ? "border-white/20 bg-white/10" : "border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/30"
        }`}
      >
        <span
          className={`absolute h-2.5 w-2.5 rounded-full bg-white transition-transform ${
            disabled ? "translate-x-0.5" : "translate-x-3.5"
          }`}
        />
      </span>
      {pickL(lang, "Czat", "Chat")}
    </button>
  );
}
