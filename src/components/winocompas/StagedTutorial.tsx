"use client";

/**
 * StagedTutorial - 3-step Vinokompas wine-finding flow.
 *
 * Author's brief (Magdalena Surgiel-Czyż / Vinocompas):
 *   1) SMAK       - fill 3 base tastes (cierpkość, słodycz, kwasowość)
 *                   then read the wytrawność (dryness) meter.
 *   2) WRAŻENIA   - fill the 6 wrażenia (tęgość, miękkość, oleistość,
 *                   świeżość, ziemistość, szorstkość). Icons drive each.
 *   3) TENDENCJE  - advanced: fill the 12 tendencje with colour
 *                   thumbnails. Skip-able for non-experts.
 *
 * After every stage the user can preview matching wines without finishing
 * the rest of the flow. There is also a "Skip stage" button.
 *
 * Profile model:
 *   - Stage 1 writes `base.slodycz` / `.cierpkosc` / `.kwasowosc` (0-5).
 *   - Stage 2 writes a per-sektor average - the sektor value is fanned out
 *     to both tendencje under it so downstream consumers (chat, pairing)
 *     see a coherent profile even if the user never opened stage 3.
 *   - Stage 3 writes the canonical per-tendencja values directly. If the
 *     user later edits stage 2, stage-3 values are overwritten by the
 *     fanned-out average - that's intentional ("simpler input wins until
 *     you bother with the harder one").
 *
 * Dryness algorithm is a placeholder until tata + Kuba ship the real one:
 *   score = slodycz*25 − cierpkosc*5 − kwasowosc*5 + 15  (clamped 0-100)
 *   then bucketed into 6 labels.
 */

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import WineBottleSVG from "@/components/v2/WineBottleSVG";
import {
  winnicaSearchUrl,
  type SamouczekWine,
} from "@/data/samouczek-wines";
import { matchWines, filledDimensions } from "@/lib/samouczek-match";
import type { CompassProfile } from "./TasteCompass";

// Heavy SVG dial - single instance reused across all 3 stages, level
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

// ─── dryness algorithm placeholder ───────────────────────────────────────
function dryness(profile: CompassProfile): {
  score: number; // 0-100, higher = sweeter
  label: string;
} {
  const s = (profile["base.slodycz"] ?? 0) as number;
  const c = (profile["base.cierpkosc"] ?? 0) as number;
  const k = (profile["base.kwasowosc"] ?? 0) as number;
  const raw = s * 18 - c * 3 - k * 3 + 10;
  const score = Math.max(0, Math.min(100, raw));
  let label: string;
  if (score < 8) label = "Bardzo wytrawne";
  else if (score < 25) label = "Wytrawne";
  else if (score < 45) label = "Półwytrawne";
  else if (score < 65) label = "Półsłodkie";
  else if (score < 85) label = "Słodkie";
  else label = "Bardzo słodkie";
  return { score, label };
}

// ─── live wine proposals - real wines from winnica.pl ─────────────────────
const STYLE_LABEL_PL: Record<SamouczekWine["style"], string> = {
  white: "białe",
  red: "czerwone",
  rose: "różowe",
  sparkling: "musujące",
  dessert: "deserowe",
};

function InlineProposals({ profile, stage }: { profile: CompassProfile; stage: Stage }) {
  const filled = filledDimensions(profile);
  const matches = matchWines(profile, 3);
  const enough = matches.length > 0;
  // When embedded in an iframe (shop integration) open the shop in the TOP
  // window so the buying flow stays in one tab/session; standalone → new tab.
  const linkTarget =
    typeof window !== "undefined" && window.self !== window.top ? "_top" : "_blank";

  return (
    <div className="mt-6 rounded-2xl border border-[rgba(199,159,105,0.32)] bg-[#0b1f44] p-5 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="pitch-eyebrow pitch-eyebrow--start">Twoje propozycje</p>
          <h3 className="pitch-display mt-2 text-xl text-white sm:text-2xl">
            {enough ? "Wina dopasowane do Twojego smaku" : "Zaznacz smak, a wina pojawią się tutaj"}
          </h3>
          <p className="mt-1.5 font-serif text-sm italic text-[#e6e1d6]">
            {enough
              ? `Etap ${stage} z 3 - profil opisany w ${filled} ${filled === 1 ? "parametrze" : "parametrach"}. Im więcej zaznaczysz, tym celniejsze dopasowanie.`
              : "Kliknij smaki, wrażenia lub aromaty powyżej - propozycje wyliczą się od razu pod spodem."}
          </p>
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
          {matches.map(({ wine, matchPct }, i) => (
            <li key={wine.id} className="vk-rise" style={{ animationDelay: `${i * 80}ms` }}>
              <a
                href={winnicaSearchUrl(wine.query)}
                target={linkTarget}
                rel="noopener noreferrer"
                className="group flex h-full flex-col gap-3 rounded-xl border border-[rgba(199,159,105,0.20)] bg-[#122446]/70 p-4 transition hover:-translate-y-0.5 hover:border-[var(--color-accent-gold)]/60 hover:shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-20 w-8 shrink-0 items-end justify-center" aria-hidden>
                    <WineBottleSVG
                      hint={wine.style}
                      style={wine.style}
                      grape={wine.grape}
                      className="h-20 w-auto drop-shadow-[0_3px_6px_rgba(0,0,0,0.4)]"
                    />
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
                <p className="font-serif text-[13px] leading-snug text-[#e6e1d6] italic">
                  {wine.why_pl}
                </p>
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
          ))}
        </ul>
      ) : (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-xl border border-dashed border-[rgba(199,159,105,0.20)] bg-[#122446]/40 p-4"
            >
              <span className="h-16 w-6 shrink-0 rounded-sm bg-gradient-to-b from-[#3a2a1c] to-[#122446]" aria-hidden />
              <span className="font-serif text-sm italic text-[#c79f69]/55">-</span>
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-[#c79f69]/65">
        Propozycje pochodzą z oferty{" "}
        <a
          href="https://winnica.pl/pl/"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[var(--color-accent-gold)] underline decoration-[var(--color-accent-gold)]/40 underline-offset-2 hover:decoration-[var(--color-accent-gold)]"
        >
          winnica.pl
        </a>{" "}
        - twórców metody Vinokompas. Dopasowanie liczone na żywo z Twojego profilu smaku.
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
  const items: { n: Stage; label: string; sub: string }[] = [
    { n: 1, label: "SMAK", sub: "3 podstawowe smaki" },
    { n: 2, label: "WRAŻENIA", sub: "6 wrażeń" },
    { n: 3, label: "AROMATY", sub: "12 aromatów" },
  ];
  return (
    <ol className="grid grid-cols-3 gap-2 sm:gap-3">
      {items.map((it) => {
        const active = it.n === stage;
        const done = it.n < stage;
        return (
          <li key={it.n}>
            <button
              type="button"
              onClick={() => setStage(it.n)}
              className={`group flex w-full flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left transition sm:px-4 ${
                active
                  ? "border-[var(--color-accent-gold)] bg-[var(--color-accent-gold)]/10"
                  : done
                    ? "border-[rgba(199,159,105,0.30)] bg-[#0b1f44]/50 hover:border-[var(--color-accent-gold)]/60"
                    : "border-white/10 bg-[#0b1f44]/30 hover:border-white/25"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
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
                <span className={`font-serif text-xs italic tracking-wider ${active ? "text-[var(--color-accent-gold)]" : "text-[#e6e1d6]"}`}>
                  ETAP {it.n}
                </span>
              </span>
              <span className={`font-serif text-base italic ${active ? "text-white" : done ? "text-[#f4efe9]" : "text-[#e6e1d6]/85"} sm:text-lg`}>
                {it.label}
              </span>
              <span className="text-[10px] tracking-wider text-[#c79f69]/65 uppercase sm:text-[11px]">
                {it.sub}
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
      if (v === "1" || v === "2" || v === "3") {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setStage(Number(v) as Stage);
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
      {/* Top: stage tabs + chat toggle */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <StageNav stage={stage} setStage={setStage} />
        </div>
        <ChatToggle
          disabled={chatDisabled}
          onChange={onChatDisabledChange}
        />
      </div>

      {/* Body */}
      <div className="mt-6 rounded-2xl border border-[rgba(199,159,105,0.22)] bg-[#081634] p-5 sm:p-7">
        {/* Stage controls - pinned at the TOP of the card so "next etap /
            skip to wines" is always reachable without scrolling past the
            tall compass dial (client: "muszę zjechać do nich, ten guzik
            powinien być wyżej"). */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[rgba(199,159,105,0.20)] pb-5">
          <div className="flex flex-wrap items-center gap-2">
            {stage > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wider text-[#e6e1d6] uppercase transition hover:bg-white/10"
              >
                ← Poprzedni etap
              </button>
            ) : null}
            {stage < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full border border-[rgba(199,159,105,0.30)] bg-[#0b1f44] px-4 py-2 text-xs font-semibold tracking-wider text-[#e6e1d6]/80 uppercase transition hover:border-[var(--color-accent-gold)]/60 hover:text-[var(--color-accent-gold)]"
              >
                Pomiń etap, pokaż wina →
              </button>
            ) : null}
          </div>
          {stage < 3 ? (
            <button
              type="button"
              onClick={goNext}
              className="pitch-cta-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs"
            >
              Następny etap
              <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
                <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <Link
              href="/pairing"
              className="pitch-cta-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs"
            >
              Pokaż wina
              <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
                <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>

        {stage === 1 ? (
          <Stage1
            profile={profile}
            onProfileChange={onProfileChange}
            dryness={dr}
          />
        ) : stage === 2 ? (
          <Stage2 profile={profile} onProfileChange={onProfileChange} />
        ) : (
          <Stage3 profile={profile} onProfileChange={onProfileChange} />
        )}
      </div>

      {/* Live wine proposals - appear right below, update as the profile changes */}
      <InlineProposals profile={profile} stage={stage} />
    </div>
  );
}

// ─── stage 1: SMAK ───────────────────────────────────────────────────────
function Stage1({
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
        <p className="pitch-eyebrow pitch-eyebrow--start">Etap I · Smak</p>
        <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">
          Trzy smaki bazowe
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          Kliknij jedną z trzech osi - <strong className="not-italic font-semibold text-[#f4efe9]">Słodycz</strong>,{" "}
          <strong className="not-italic font-semibold text-[#f4efe9]">Cierpkość</strong> lub{" "}
          <strong className="not-italic font-semibold text-[#f4efe9]">Kwasowość</strong> - kilka razy, aby ustawić jej
          siłę od 0 do 5. Wskaźnik pod kołem od razu pokazuje, jak wytrawne jest Twoje wino.
        </p>
      </header>

      <div className="mt-6">
        <InteractiveCompass
          profile={profile}
          onProfileChange={onProfileChange}
          level={1}
          autoStartTour
          // Dryness meter ABOVE the compass on the same card (client:
          // "ja bym ją wręcz dała nad") - first thing visible, updates
          // live as the user adjusts the base tastes since `dr` is
          // recomputed each render in the parent.
          belowCompass={<DrynessMeter score={dr.score} label={dr.label} />}
        />
      </div>
    </div>
  );
}

function DrynessMeter({ score, label }: { score: number; label: string }) {
  // Score 0..100 → marker position along the rail, clamped a touch off the
  // rounded ends so the pin never hangs into empty space at the extremes.
  const pos = Math.max(3, Math.min(97, score));
  return (
    <div className="mt-7 rounded-2xl border border-[rgba(199,159,105,0.22)] bg-[#0b1f44]/55 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
          Wytrawność wina
        </p>
        <p className="font-serif text-base italic text-white" aria-live="polite">
          {label}
        </p>
      </div>

      {/* Zone labels live in their own row so the marker can never collide
          with them. The centre is the dry/sweet boundary → "Półwytrawne". */}
      <div className="mt-4 flex justify-between text-[9px] tracking-wider text-[#c79f69]/65 uppercase">
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
          className="absolute top-1/2 transition-[left] duration-500 ease-out"
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
    </div>
  );
}

// (Karty | Kompas view toggle removed - every stage now uses the
//  interactive compass directly. Cards mode is no longer needed.)

// ─── stage 2: WRAŻENIA ───────────────────────────────────────────────────
function Stage2({
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
        <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">
          Sześć wrażeń
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6e1d6]">
          Kliknij wybrane wrażenie na kole, aby zwiększyć jego siłę (0-5) - kropki pokażą poziom.
          Po prawej pojawi się opis tego wrażenia. Nie wiesz od czego zacząć? Włącz{" "}
          <strong className="not-italic font-semibold text-[#f4efe9]">Auto-przewodnika</strong>, który oprowadzi Cię po wszystkich sześciu.
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

// ─── stage 3: TENDENCJE ──────────────────────────────────────────────────
function Stage3({
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
          aromat na kole, aby dostroić profil (0-5). Po prawej - pełny opis i skojarzenia
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
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold tracking-wider uppercase transition ${
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
