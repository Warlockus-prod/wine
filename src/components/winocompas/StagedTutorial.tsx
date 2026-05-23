"use client";

/**
 * StagedTutorial — 3-step Vinokompas wine-finding flow.
 *
 * Author's brief (Magdalena Surgiel-Czyż / Vinocompas):
 *   1) SMAK       — fill 3 base tastes (cierpkość, słodycz, kwasowość)
 *                   then read the wytrawność (dryness) arrow.
 *   2) WRAŻENIA   — fill the 6 wrażenia (tęgość, miękkość, oleistość,
 *                   świeżość, ziemistość, szorstkość). Icons drive each.
 *   3) TENDENCJE  — advanced: fill the 12 tendencje with colour
 *                   thumbnails. Skip-able for non-experts.
 *
 * After every stage the user can preview matching wines without finishing
 * the rest of the flow. There is also a "Skip stage" button.
 *
 * Profile model:
 *   - Stage 1 writes `base.slodycz` / `.cierpkosc` / `.kwasowosc` (0-4).
 *   - Stage 2 writes a per-sektor average — the sektor value is fanned out
 *     to both tendencje under it so downstream consumers (chat, pairing)
 *     see a coherent profile even if the user never opened stage 3.
 *   - Stage 3 writes the canonical per-tendencja values directly. If the
 *     user later edits stage 2, stage-3 values are overwritten by the
 *     fanned-out average — that's intentional ("simpler input wins until
 *     you bother with the harder one").
 *
 * Dryness algorithm is a placeholder until tata + Kuba ship the real one:
 *   score = slodycz*25 − cierpkosc*5 − kwasowosc*5 + 15  (clamped 0-100)
 *   then bucketed into 6 labels.
 */

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { COMPASS_SECTORS, BASE_TASTES } from "@/data/wine-compass-kb";
import type {
  CompassProfile,
  Intensity as IntensityLevel,
} from "./TasteCompass";

// Heavy SVG dial — single instance reused across all 3 stages, level
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

// ─── icons per wrażenie (sektor) ─────────────────────────────────────────
// Inline SVG — small, theme-aware via currentColor. Each glyph is hand-
// shaped so the family of six reads as a set, not random clip-art.

function SectorIcon({ id, className }: { id: string; className?: string }) {
  // 32×32 viewBox, currentColor stroke + fill where it helps clarity.
  switch (id) {
    case "swieze": // citrus + green leaf
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="13" cy="17" r="6" />
          <path d="M13 11 L13 23 M7 17 L19 17 M9 13 L17 21 M9 21 L17 13" opacity="0.55" />
          <path d="M19 12 C 22 8, 24 6, 27 6 C 27 9, 25 11, 21 14" />
        </svg>
      );
    case "oleiste": // butter cube + droplet
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6" y="14" width="14" height="10" rx="1.5" />
          <path d="M6 18 L20 18" opacity="0.5" />
          <path d="M22 6 C 25 10, 27 13, 27 16 C 27 19, 24.5 21, 22 21 C 19.5 21, 17 19, 17 16 C 17 13, 19 10, 22 6 Z" />
        </svg>
      );
    case "miekkie": // soft berry
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="20" r="5" />
          <circle cx="20" cy="18" r="6" />
          <path d="M14 14 C 14 10, 17 7, 20 6 M22 7 C 25 8, 26 10, 26 12" />
        </svg>
      );
    case "tegie": // coffee bean / mug
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 12 L23 12 L21 24 L9 24 Z" />
          <path d="M23 14 C 27 14, 28 17, 28 19 C 28 21, 27 22, 23 22" />
          <path d="M11 6 C 11 8, 13 8, 13 10 M16 6 C 16 8, 18 8, 18 10" opacity="0.6" />
        </svg>
      );
    case "szorstkie": // dry leaf / leather
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 5 C 9 9, 6 16, 8 25 C 17 26, 25 21, 26 12 C 22 11, 19 8, 16 5 Z" />
          <path d="M14 9 L17 22 M11 14 L19 14 M12 18 L18 18" opacity="0.55" />
        </svg>
      );
    case "ziemiste": // pebble + drop
      return (
        <svg viewBox="0 0 32 32" className={className} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="13" cy="22" rx="8" ry="4.5" />
          <ellipse cx="20" cy="14" rx="5" ry="3" />
          <path d="M22 5 C 24 8, 25.5 10, 25.5 12 C 25.5 14, 24 15, 22.5 15 C 21 15, 19.5 14, 19.5 12 C 19.5 10, 20.5 8, 22 5 Z" />
        </svg>
      );
    default:
      return null;
  }
}

// ─── 0..4 dot picker — used in stages 2 and 3 ────────────────────────────
function DotScale({
  value,
  onChange,
  color,
  ariaLabel,
}: {
  value: number;
  onChange: (v: IntensityLevel) => void;
  color: string;
  ariaLabel: string;
}) {
  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label={ariaLabel}>
      {[0, 1, 2, 3, 4].map((v) => {
        const active = v <= value && value > 0;
        return (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v as IntensityLevel)}
            className="h-5 w-5 rounded-full border transition-all hover:scale-110 active:scale-95"
            style={{
              borderColor: active ? color : "rgba(197,160,89,0.32)",
              background: active ? color : "transparent",
              boxShadow: active ? `0 0 6px ${color}66` : "none",
            }}
            aria-label={`${v}/4`}
          />
        );
      })}
    </div>
  );
}

// ─── dryness algorithm placeholder ───────────────────────────────────────
function dryness(profile: CompassProfile): {
  score: number; // 0-100, higher = sweeter
  label: string;
} {
  const s = (profile["base.slodycz"] ?? 0) as number;
  const c = (profile["base.cierpkosc"] ?? 0) as number;
  const k = (profile["base.kwasowosc"] ?? 0) as number;
  const raw = s * 25 - c * 5 - k * 5 + 15;
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

// ─── helpers ─────────────────────────────────────────────────────────────
const sectorAverage = (profile: CompassProfile, sectorId: string): number => {
  const s = COMPASS_SECTORS.find((x) => x.id === sectorId);
  if (!s) return 0;
  const a = (profile[s.tendencje[0].id] ?? 0) as number;
  const b = (profile[s.tendencje[1].id] ?? 0) as number;
  return Math.round((a + b) / 2);
};

const setSectorAverage = (
  profile: CompassProfile,
  sectorId: string,
  v: IntensityLevel,
): CompassProfile => {
  const s = COMPASS_SECTORS.find((x) => x.id === sectorId);
  if (!s) return profile;
  return {
    ...profile,
    [s.tendencje[0].id]: v,
    [s.tendencje[1].id]: v,
  };
};

const profileFilledCount = (profile: CompassProfile): number => {
  let n = 0;
  for (const s of COMPASS_SECTORS) {
    for (const t of s.tendencje) if (((profile[t.id] ?? 0) as number) > 0) n++;
  }
  for (const b of BASE_TASTES) if (((profile[`base.${b.id}`] ?? 0) as number) > 0) n++;
  return n;
};

// ─── matched-wines preview block ─────────────────────────────────────────
function MatchPreview({ profile, stage }: { profile: CompassProfile; stage: Stage }) {
  const filled = profileFilledCount(profile);
  const enough = filled >= 1;
  const widthPct = Math.min(100, filled * 7);

  return (
    <div className="mt-6 rounded-2xl border border-[rgba(197,160,89,0.32)] bg-[#170d0f] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
            Wina dopasowane do twojego smaku
          </p>
          <p className="mt-1 font-serif text-sm italic text-[#e6dccd]">
            {enough
              ? `Etap ${stage} z 3 — profil dopracowany w ${filled} parametrach.`
              : "Wskaż przynajmniej jedno wrażenie, aby zobaczyć propozycje."}
          </p>
        </div>
        <Link
          href="/pairing"
          className="pitch-cta-primary inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs"
        >
          Zobacz wszystkie
          <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
            <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      {/* Heuristic confidence bar */}
      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[var(--color-accent-gold)] to-primary transition-all duration-700"
          style={{ width: `${widthPct}%` }}
        />
      </div>

      {/* 3 placeholder wine cards — these become real cards once /pairing
          gets a profile-as-input endpoint; for now we tease the silhouette. */}
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-[rgba(197,160,89,0.18)] bg-[#1a0e10]/60 p-3"
          >
            <span
              aria-hidden
              className="h-12 w-4 shrink-0 rounded-sm bg-gradient-to-b from-[#5a0a18] to-[#1a0408]"
              style={{ boxShadow: "inset -1px 0 0 rgba(255,255,255,0.08)" }}
            />
            <div className="min-w-0">
              <p className="truncate font-serif text-sm italic text-[#f4ede0]">
                {enough ? `Propozycja ${i + 1}` : "—"}
              </p>
              <p className="mt-0.5 text-[10px] tracking-[0.18em] text-[#c5a059]/70 uppercase">
                Otwórz /pairing
              </p>
            </div>
          </div>
        ))}
      </div>
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
    { n: 3, label: "TENDENCJE", sub: "12 tendencji" },
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
                    ? "border-[rgba(197,160,89,0.30)] bg-[#1a0f12]/50 hover:border-[var(--color-accent-gold)]/60"
                    : "border-white/10 bg-[#1a0f12]/30 hover:border-white/25"
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                    active
                      ? "bg-[var(--color-accent-gold)] text-[#150a0c]"
                      : done
                        ? "bg-[rgba(197,160,89,0.30)] text-[var(--color-accent-gold)]"
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
                <span className={`font-serif text-xs italic tracking-wider ${active ? "text-[var(--color-accent-gold)]" : "text-[#e6dccd]"}`}>
                  ETAP {it.n}
                </span>
              </span>
              <span className={`font-serif text-base italic ${active ? "text-white" : done ? "text-[#f4ede0]" : "text-[#e6dccd]/85"} sm:text-lg`}>
                {it.label}
              </span>
              <span className="text-[10px] tracking-wider text-[#c5a059]/65 uppercase sm:text-[11px]">
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
      <div className="mt-6 rounded-2xl border border-[rgba(197,160,89,0.22)] bg-[#150a0c] p-5 sm:p-7">
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

        {/* Stage controls */}
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(197,160,89,0.20)] pt-5">
          <div className="flex flex-wrap items-center gap-2">
            {stage > 1 ? (
              <button
                type="button"
                onClick={goPrev}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold tracking-wider text-[#e6dccd] uppercase transition hover:bg-white/10"
              >
                ← Poprzedni etap
              </button>
            ) : null}
            {stage < 3 ? (
              <button
                type="button"
                onClick={goNext}
                className="rounded-full border border-[rgba(197,160,89,0.30)] bg-[#1a0f12] px-4 py-2 text-xs font-semibold tracking-wider text-[#e6dccd]/80 uppercase transition hover:border-[var(--color-accent-gold)]/60 hover:text-[var(--color-accent-gold)]"
              >
                Pomiń etap →
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
              Otwórz Pairing
              <svg width="12" height="9" viewBox="0 0 16 9" fill="none" aria-hidden>
                <path d="M1 4.5h13m0 0L10.5 1M14 4.5L10.5 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* After-each-stage match preview */}
      <MatchPreview profile={profile} stage={stage} />
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
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6dccd]">
          Zacznij od trzech podstawowych smaków — kliknij oś na kompasie, żeby
          zwiększyć intensywność. Auto-przewodnik pokaże każdy z nich po kolei.
        </p>
      </header>

      <div className="mt-6">
        <InteractiveCompass
          profile={profile}
          onProfileChange={onProfileChange}
          level={1}
          autoStartTour
          // Dryness arrow lives on the SAME card as the compass (client
          // request: skala wytrawności widoczna jednocześnie z Vinokompasem
          // i widać jak się zmienia). It re-renders live on every base-taste
          // change because `dr` is recomputed each render in the parent.
          belowCompass={<DrynessArrow score={dr.score} label={dr.label} />}
        />
      </div>

      {/* Sliders kept as a secondary input for users who prefer linear UI */}
      <details className="mt-5 rounded-2xl border border-[rgba(197,160,89,0.18)] bg-[#1a0f12]/40 p-4">
        <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:text-[#f4ede0]">
          Wolisz suwaki? Otwórz precyzyjne sterowanie
        </summary>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {BASE_TASTES.map((t) => (
            <BigBaseSlider
              key={t.id}
              id={t.id}
              label={t.name_pl}
              description={t.description_pl}
              value={(profile[`base.${t.id}`] ?? 0) as number}
              onChange={(v) =>
                onProfileChange({ ...profile, [`base.${t.id}`]: v as IntensityLevel })
              }
            />
          ))}
        </div>
      </details>
    </div>
  );
}

function ThreeBeamCompass({ profile }: { profile: CompassProfile }) {
  // Reads the 3 base values to draw three radiating beams whose length
  // grows with intensity. Provides a visual answer to "which direction
  // am I pointing in?". Decorative — no interaction.
  const cierp = (profile["base.cierpkosc"] ?? 0) as number;
  const slod = (profile["base.slodycz"] ?? 0) as number;
  const kwas = (profile["base.kwasowosc"] ?? 0) as number;
  const len = (v: number) => 25 + v * 14; // 25..81

  return (
    <div className="relative mx-auto w-full max-w-[260px] aspect-square">
      <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
        {/* outer ring */}
        <circle cx="100" cy="100" r="92" fill="none" stroke="var(--gold-hairline-soft)" strokeWidth="1" />
        {/* fleur-de-lis stamps */}
        <text x="100" y="14" textAnchor="middle" fontSize="14" fill="var(--color-accent-gold)" fontFamily="serif">⚜</text>
        <text x="178" y="180" fontSize="10" fill="var(--color-accent-gold)" opacity="0.6">⚜</text>
        <text x="14" y="180" fontSize="10" fill="var(--color-accent-gold)" opacity="0.6">⚜</text>

        {/* 3 beams */}
        <g stroke="#c5a059" strokeWidth="2" strokeLinecap="round" fill="none">
          <line x1="100" y1="100" x2="100" y2={100 - len(cierp)} />
          <line
            x1="100"
            y1="100"
            x2={100 + Math.cos((30 * Math.PI) / 180) * len(slod)}
            y2={100 + Math.sin((30 * Math.PI) / 180) * len(slod)}
          />
          <line
            x1="100"
            y1="100"
            x2={100 - Math.cos((30 * Math.PI) / 180) * len(kwas)}
            y2={100 + Math.sin((30 * Math.PI) / 180) * len(kwas)}
          />
        </g>

        {/* labels */}
        <text x="100" y="22" textAnchor="middle" fontSize="9" letterSpacing="2" fill="var(--ink)">
          CIERPKOŚĆ
        </text>
        <text x="180" y="160" textAnchor="end" fontSize="9" letterSpacing="2" fill="var(--ink)">
          SŁODYCZ
        </text>
        <text x="20" y="160" textAnchor="start" fontSize="9" letterSpacing="2" fill="var(--ink)">
          KWASOWOŚĆ
        </text>

        {/* center dot */}
        <circle cx="100" cy="100" r="3" fill="var(--color-accent-gold)" />
      </svg>
    </div>
  );
}

function BigBaseSlider({
  id,
  label,
  description,
  value,
  onChange,
}: {
  id: string;
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-xl border border-[rgba(197,160,89,0.16)] bg-[#1a0f12]/60 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={`bsm-${id}`} className="font-serif text-base italic text-[#f4ede0]">
          {label}
        </label>
        <span className="font-serif text-xs italic tracking-wider text-[var(--color-accent-gold)]">
          {value}/4
        </span>
      </div>
      <input
        id={`bsm-${id}`}
        type="range"
        min={0}
        max={4}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[var(--color-accent-gold)]"
        aria-label={`${label} 0..4`}
      />
      <p className="mt-2 text-[11px] leading-snug text-[#c5a059]/70">{description}</p>
    </div>
  );
}

function DrynessArrow({ score, label }: { score: number; label: string }) {
  // Score 0..100 maps onto the arrow position along the rail.
  const x = `${score}%`;
  return (
    <div className="mt-7 rounded-2xl border border-[rgba(197,160,89,0.22)] bg-[#1a0f12]/55 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
          Wytrawność wina
        </p>
        <p className="font-serif text-base italic text-white">{label}</p>
      </div>

      <div className="relative mt-4 h-12 w-full">
        {/* Rail */}
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#a01024] via-[#c5a059] to-[#5b6b3a]" />

        {/* Tick labels */}
        <div className="absolute inset-x-0 top-0 flex justify-between text-[9px] tracking-wider text-[#c5a059]/65 uppercase">
          <span>Bardzo wytrawne</span>
          <span>Półsłodkie</span>
          <span>Bardzo słodkie</span>
        </div>

        {/* Arrow */}
        <div
          className="absolute top-1/2 -translate-y-1/2 transition-all duration-500 ease-out"
          style={{ left: x, transform: `translate(-50%, -50%)` }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <circle cx="12" cy="12" r="10" fill="#fff" stroke="#c5a059" strokeWidth="2" />
            <path d="M8 12 L 16 12 M 13 9 L 16 12 L 13 15" stroke="#150a0c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* Tick marks */}
        <div className="absolute inset-x-0 bottom-0 flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <span
              key={i}
              className="h-2 w-px bg-[var(--color-accent-gold)]/40"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// (Karty | Kompas view toggle removed — every stage now uses the
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
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6dccd]">
          Kompas otwiera szóstkę sektorów — kliknij wrażenie, by ustawić jego siłę.
          Auto-przewodnik przejdzie kolejno po wszystkich sześciu z opisem.
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
        <p className="pitch-eyebrow pitch-eyebrow--start">Etap III · Tendencje</p>
        <h2 className="pitch-display mt-3 text-2xl text-white sm:text-3xl">
          Dwanaście tendencji
        </h2>
        <p className="mt-2 max-w-xl font-serif text-sm italic leading-relaxed text-[#e6dccd]">
          Najwyższa rozdzielczość — każde wrażenie ma dwie tendencje. Auto-przewodnik
          przechodzi przez każdą z 12 po kolei z opisem skojarzeń.
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
