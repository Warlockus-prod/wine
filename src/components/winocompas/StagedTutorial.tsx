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

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import WineBottleSVG from "@/components/v2/WineBottleSVG";
import {
  winnicaWineUrl,
  type SamouczekWine,
} from "@/data/samouczek-wines";
import { matchWines, filledDimensions } from "@/lib/samouczek-match";
import { dryness } from "@/lib/dryness";
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

// Match guardrail - mirrors the original Vinokompas calculator's "Wybierz co
// najmniej 7 skojarzeń": below MIN_FILLED set dimensions the cosine match is
// mostly noise, so we withhold confident proposals and nudge for more.
// TARGET_FILLED is a "rich enough" profile, used by the completeness meter.
const MIN_FILLED = 4;
const TARGET_FILLED = 9;

function InlineProposals({ profile }: { profile: CompassProfile }) {
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
          {/* SR announcement when proposals arrive/refresh — the visible list
              re-sorts silently otherwise. Text flips between 3 states only, so
              it never spams per-click. */}
          <span className="sr-only" role="status">
            {enough ? `${matches.length} propozycje win dopasowane do Twojego profilu` : ""}
          </span>
          <p className="pitch-eyebrow pitch-eyebrow--start">Twoje propozycje</p>
          <h3 className="pitch-display mt-2 text-xl text-white sm:text-2xl">
            {enough
              ? "Wina dopasowane do Twojego smaku"
              : filled === 0
                ? "Ustaw Vinokompas, a wina pojawią się tutaj"
                : "Jeszcze chwila — dobór się dostraja"}
          </h3>
          <p className="mt-1.5 font-serif text-sm italic text-[#e6e1d6]">
            {enough
              ? `Liczba przy winie to podobieństwo profilu w %. Twój profil opisany w ${filled}/${TARGET_FILLED} wymiarach — im pełniejszy, tym pewniejszy dobór.`
              : `Profil jest jeszcze zbyt ubogi na trafny dobór. Ustaw co najmniej ${MIN_FILLED} elementów (smaki wokół koła lub wrażenia-sektory) — masz ${filled}/${MIN_FILLED}. Jak w oryginalnym Vinokompasie: im więcej skojarzeń, tym celniej.`}
          </p>
          {/* Profile-completeness meter - richness toward a confident match. */}
          <div
            className="mt-3 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={TARGET_FILLED}
            aria-valuenow={filled}
            aria-label="Kompletność profilu"
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
          Pełny dobór
          <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
            <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {enough ? (
        <ul className="mt-5 grid gap-3 sm:grid-cols-3">
          {matches.map(({ wine, matchPct }, i) => {
            // Two grape entries can share a verbatim why_pl — showing the
            // identical italic blurb twice reads templated, so suppress a
            // card's blurb when it string-matches the previous card's.
            const showWhy = i === 0 || wine.why_pl !== matches[i - 1].wine.why_pl;
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
                      <span className="text-[10px] tracking-[0.16em] text-[#c79f69]/70 uppercase">
                        {STYLE_LABEL_PL[wine.style]}
                      </span>
                    </div>
                    <p className="mt-2 font-serif text-base leading-tight text-[#f4efe9]">
                      {wine.name_pl}
                    </p>
                    <p className="mt-0.5 text-[10px] tracking-[0.14em] text-[#c79f69]/70 uppercase">
                      {wine.region_pl}
                    </p>
                  </div>
                </div>
                {showWhy ? (
                  <p className="font-serif text-[13px] leading-snug text-[#e6e1d6] italic">
                    {wine.why_pl}
                  </p>
                ) : null}
                <div className="mt-auto flex items-center justify-between gap-2 border-t border-[rgba(199,159,105,0.16)] pt-3">
                  <span className="font-serif text-sm text-[#f4efe9]">
                    od {wine.priceFrom} zł
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
                Propozycja {i + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-[color:var(--color-accent-gold)]">
        Propozycje pochodzą z oferty{" "}
        <a
          href="https://winnica.pl/pl/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--color-accent-gold)] underline decoration-[var(--color-accent-gold)]/40 underline-offset-2 hover:decoration-[var(--color-accent-gold)]"
        >
          winnica.pl
        </a>{" "}
        — twórców metody Vinokompas. Dopasowanie liczone na żywo z Twojego profilu smaku.
      </p>
    </div>
  );
}

// ─── stage navigation row ────────────────────────────────────────────────
function StageNav({
  stage,
  setStage,
}: {
  stage: Stage;
  setStage: (s: Stage) => void;
}) {
  // subShort: the mobile slot is ~88px of tracked uppercase — "3 podstawowe
  // smaki" truncated to "3 PODSTAWO…" next to tabs 2-3 that fit (audit
  // 2026-07). Full string returns from sm: up.
  const items: { n: Stage; label: string; sub: string; subShort: string }[] = [
    { n: 1, label: "SMAK", sub: "3 osie smaku", subShort: "3 osie" },
    { n: 2, label: "WRAŻENIA", sub: "6 wrażeń", subShort: "6 wrażeń" },
    { n: 3, label: "AROMATY", sub: "12 aromatów", subShort: "12 aromatów" },
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
              className={`group flex h-full w-full min-w-0 flex-col items-start gap-1 overflow-hidden rounded-xl border px-3 py-3 text-left transition sm:px-4 ${
                active
                  ? "border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10"
                  : done
                    ? "border-[rgba(199,159,105,0.30)] bg-[#0b1f44]/50 hover:border-[var(--color-accent-gold)]/60"
                    : "border-white/10 bg-[#0b1f44]/30 hover:border-white/25"
              }`}
            >
              {/* Row 1: chip + "ETAP n" on ONE nowrap line — at 360-390px the
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
                  ETAP {it.n}
                </span>
              </span>
              {/* Row 2: plain sans 12px on phones — the serif italic + wide
                  tracking made "WRAŻENIA" 90px wide inside a 73px tab and it
                  clipped to "WRAŻENL" (audit 2026-07). Fancy styling returns
                  from sm: up where the tabs have room. */}
              <span className={`max-w-full truncate text-[12px] font-medium sm:font-serif sm:text-lg sm:font-normal sm:italic ${active ? "text-white" : done ? "text-[#f4efe9]" : "text-[#e6e1d6]/85"}`}>
                {it.label}
              </span>
              <span className="max-w-full truncate text-[10px] tracking-wider text-[#c79f69]/65 uppercase sm:text-[11px]">
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
}: Props) {
  const [stage, setStage] = useState<Stage>(1);

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

  const dr = useMemo(() => dryness(profile), [profile]);

  const goNext = () => setStage((s) => (s < 3 ? ((s + 1) as Stage) : s));
  const goPrev = () => setStage((s) => (s > 1 ? ((s - 1) as Stage) : s));

  return (
    <div>
      {/* Top: stage tabs + chat toggle. On phones the tab strip takes the
          whole row (basis-full) so labels stop bleeding across tab borders;
          the Czat toggle wraps underneath. */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1 basis-full sm:basis-0">
          <StageNav stage={stage} setStage={setStage} />
        </div>
        <ChatToggle
          disabled={chatDisabled}
          onChange={onChatDisabledChange}
        />
      </div>

      {/* Body */}
      <div className="mt-6 rounded-2xl border border-[rgba(199,159,105,0.22)] bg-[#081634] p-5 sm:p-7">
        {/* Stage controls — rendered at the TOP and BOTTOM of the card
            (client review 2026-07: "przejście do kolejnych etapów powinno
            być i na górze i na dole"). Includes the profile reset that used
            to live in the removed TWÓJ PROFIL chip bar. The top strip is
            desktop-only — on phones the pair doubled up within one screen. */}
        <StageControls
          stage={stage}
          goPrev={goPrev}
          goNext={goNext}
          onReset={() => onProfileChange({})}
          placement="top"
          className="mb-6 border-b border-[rgba(199,159,105,0.20)] pb-5"
        />

        {stage === 1 ? (
          <StageSmak
            profile={profile}
            onProfileChange={onProfileChange}
            dryness={dr}
          />
        ) : stage === 2 ? (
          <StageWrazenia profile={profile} onProfileChange={onProfileChange} />
        ) : (
          <StageAromaty profile={profile} onProfileChange={onProfileChange} />
        )}

        <StageControls
          stage={stage}
          goPrev={goPrev}
          goNext={goNext}
          onReset={() => onProfileChange({})}
          className="mt-7 border-t border-[rgba(199,159,105,0.20)] pt-5"
        />
      </div>

      {/* Live wine proposals - appear right below, update as the profile changes */}
      <InlineProposals profile={profile} />
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
}: {
  stage: Stage;
  goPrev: () => void;
  goNext: () => void;
  onReset: () => void;
  className?: string;
  placement?: "top" | "bottom";
}) {
  const rootDisplay =
    placement === "top"
      ? "hidden lg:flex"
      : "grid grid-cols-2 lg:flex";
  return (
    <div className={`${rootDisplay} flex-wrap items-center justify-between gap-2 lg:gap-3 ${className ?? ""}`}>
      {/* `contents` on mobile dissolves the group so each button becomes a
          grid cell; from lg: the wrapper reforms the left-hand flex cluster. */}
      <div className="contents lg:flex lg:flex-wrap lg:items-center lg:gap-2">
        {stage > 1 ? (
          <button
            type="button"
            onClick={goPrev}
            className="min-h-[40px] rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wider text-[#e6e1d6] uppercase transition hover:bg-white/10"
          >
            ← Poprzedni etap
          </button>
        ) : null}
        {/* Wyczyść BEFORE the long skip button: on the mobile 2-col grid the
            short pair (Poprzedni/Wyczyść) shares one row and the long "Pokaż
            dopasowane wina" gets its own full row — no 3-line wrap (audit
            2026-07). At stage 1 Wyczyść has no partner, so it goes full-width. */}
        <button
          type="button"
          onClick={onReset}
          className={`min-h-[40px] rounded-full border border-white/12 px-3.5 py-2 text-[11px] font-semibold tracking-wider text-[#e6e1d6]/60 uppercase transition hover:border-white/30 hover:text-[#e6e1d6] ${stage === 1 ? "col-span-2 lg:col-auto" : ""}`}
        >
          Wyczyść
        </button>
        {stage < 3 ? (
          <button
            type="button"
            onClick={goNext}
            className="col-span-2 min-h-[40px] rounded-full border border-[rgba(199,159,105,0.30)] bg-[#0b1f44] px-4 py-2 text-xs font-semibold tracking-wider text-[#e6e1d6]/80 uppercase transition hover:border-[var(--color-accent-gold)]/60 hover:text-[var(--color-accent-gold)] lg:col-auto"
          >
            Pokaż dopasowane wina →
          </button>
        ) : null}
      </div>
      {stage < 3 ? (
        <button
          type="button"
          onClick={goNext}
          className="pitch-cta-primary col-span-2 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs lg:col-auto"
        >
          Następny etap
          <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
            <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : (
        <Link
          href="/pairing"
          className="pitch-cta-primary col-span-2 inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-xs lg:col-auto"
        >
          Pokaż wina
          <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
            <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
    </div>
  );
}

// ─── stage 1: SMAK (3 base tastes + dryness) ──────────────────────────────
function StageSmak({
  profile,
  onProfileChange,
  dryness: dr,
}: {
  profile: CompassProfile;
  onProfileChange: (next: CompassProfile) => void;
  dryness: { score: number; label: string };
}) {
  return (
    <div>
      <header>
        {/* Stage copy = the client's round-3 texts, verbatim. The question
            heading replaces the old mechanics-first instruction ("etap 1 uczy,
            że wytrawność to coś więcej niż cukier"). */}
        <p className="pitch-eyebrow pitch-eyebrow--start">Etap I · Smak</p>
        <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">
          Jak odbierasz smak wina, które lubisz?
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          Kliknij na każdej z trzech osi. Im dalej od środka, tym mocniej odczuwasz daną cechę.
        </p>
      </header>

      <div className="mt-6">
        <InteractiveCompass
          profile={profile}
          onProfileChange={onProfileChange}
          level={1}
          autoStartTour
          // Dryness meter directly under the compass on the same card — first
          // thing visible, updates live since `dr` is recomputed each render
          // in the parent.
          belowCompass={
            <DrynessMeter
              score={dr.score}
              label={dr.label}
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
}: {
  profile: CompassProfile;
  onProfileChange: (next: CompassProfile) => void;
}) {
  return (
    <div>
      <header>
        <p className="pitch-eyebrow pitch-eyebrow--start">Etap II · Wrażenia</p>
        {/* Client round-3 copy, verbatim ("etap 2 uczy rozpoznawania
            charakteru wina", not terminology). */}
        <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">
          Jaki charakter ma wino, które lubisz?
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          Smak to dopiero początek.{" "}
          <strong className="not-italic font-semibold text-[#f4efe9]">
            Wrażenia opisują, jak odbierasz wino jako całość.
          </strong>{" "}
          Dzięki nim łatwiej nazwać to, co czujesz podczas degustacji i znaleźć wina o podobnym charakterze.
        </p>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          Ustaw siłę każdego z sześciu wrażeń. Im dalej od środka, tym bardziej dane wrażenie
          opisuje wino, które lubisz. Nie wiesz od czego zacząć?{" "}
          <strong className="not-italic font-semibold text-[#f4efe9]">Uruchom przewodnik</strong>{" "}
          lub najedź kursorem na wybrane wrażenie.
        </p>
      </header>

      <div className="mt-6">
        <InteractiveCompass
          profile={profile}
          onProfileChange={onProfileChange}
          level={2}
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
}: {
  score: number;
  label: string;
  /** True while no base smak is set — show a neutral prompt, hide the pin. */
  empty?: boolean;
}) {
  // Score 0..100 → marker position along the rail, clamped a touch off the
  // rounded ends so the pin never hangs into empty space at the extremes.
  const pos = Math.max(3, Math.min(97, score));
  return (
    <div className="mt-7 rounded-2xl border border-[rgba(199,159,105,0.22)] bg-[#0b1f44]/55 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
          Twój profil wytrawności
        </p>
        <p className="font-serif text-base italic text-white" aria-live="polite">
          {empty ? (
            <span className="text-sm text-[#e6e1d6]/70">Zaznacz osie, aby zobaczyć profil</span>
          ) : (
            label
          )}
        </p>
      </div>

      {/* Zone labels live in their own row so the marker can never collide
          with them. The centre is the dry/sweet boundary → "Półwytrawne". */}
      <div className="mt-4 flex justify-between text-xs tracking-wider text-[color:var(--color-accent-gold)] uppercase">
        <span>Bardzo wytrawne</span>
        <span className="hidden sm:inline">Półwytrawne</span>
        <span>Bardzo słodkie</span>
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

      {/* Client round-3 caption. The underlying score is still the 3-base-smak
          placeholder model (see dryness() comment) — the copy frames it as a
          profile readout, which is exactly what it is. */}
      <p className="mt-3 text-xs leading-snug text-[color:var(--color-accent-gold)]">
        Na podstawie wybranych proporcji słodyczy, kwasowości i cierpkości Vinocompas pokazuje,
        jak wytrawne jest wino o takim profilu.
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
}: {
  profile: CompassProfile;
  onProfileChange: (next: CompassProfile) => void;
}) {
  return (
    <div>
      <header>
        <p className="pitch-eyebrow pitch-eyebrow--start">Etap III · Aromaty</p>
        <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">
          Dwanaście aromatów
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          Tryb dla zaawansowanych: każde wrażenie ma dwa aromaty. Kliknij konkretny
          aromat na kole, aby dostroić profil (0-5). Po prawej — pełny opis i skojarzenia
          każdej z 12. <strong className="not-italic font-semibold text-[#f4efe9]">Auto-przewodnik</strong> pokaże je po kolei.
        </p>
      </header>

      <div className="mt-6">
        <InteractiveCompass
          profile={profile}
          onProfileChange={onProfileChange}
          level={3}
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
}: {
  disabled: boolean;
  onChange: (next: boolean) => void;
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
      title={disabled ? "Włącz przewodnika" : "Wyłącz przewodnika"}
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
      Czat
    </button>
  );
}
