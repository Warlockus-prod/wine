"use client";

/**
 * InteractiveCompass — TasteCompass + side info-panel + auto-tour.
 *
 * Two interaction modes share one panel:
 *
 *  ▶ Auto-przewodnik   The compass auto-cycles through the 6 sektory
 *                       (3 sec each), pulsing the highlighted spoke; the
 *                       side panel narrates each one (sektor name, short_pl,
 *                       associations, examples). User can pause / step.
 *  ❯ Wypełnij sam       Tour off; user hovers/clicks spokes; the side
 *                       panel updates with the focused sektor + tendencja.
 *                       Click cycles intensity 0→1→2→3→4→0 (TasteCompass
 *                       behavior).
 *
 *  CTA inside the side panel: "Otwórz przewodnika" — fires the global
 *  `wn:open-chat` event so FloatingTasteChat can pop open with the
 *  current sektor as context. (Listener is wired in the chat component.)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { BASE_TASTES, COMPASS_SECTORS } from "@/data/wine-compass-kb";
import { SENSE_IMAGE_MAP } from "@/data/sense-images";
import type { CompassLevel, CompassProfile } from "./TasteCompass";

const TasteCompass = dynamic(() => import("./TasteCompass"), { ssr: false });

interface Props {
  profile: CompassProfile;
  onProfileChange: (next: CompassProfile) => void;
  /** Tour rotation interval in ms; defaults to 2800 (≈3s/spoke). */
  tourMs?: number;
  /** Progressive-disclosure level — flows into TasteCompass and selects
   *  which IDs the auto-tour cycles through. */
  level?: CompassLevel;
  /** Auto-start the tour when the component mounts. Used so each stage
   *  greets the user with a presentation instead of a static disc. */
  autoStartTour?: boolean;
  /** Optional content rendered in the LEFT column directly under the
   *  compass + profile bar — on the SAME card. */
  belowCompass?: React.ReactNode;
  /** Optional content rendered in the LEFT column ABOVE the compass — on
   *  the same card, first thing visible. Stage 1 uses this for the dryness
   *  arrow (client request: put it on top, visible at a glance, live). */
  aboveCompass?: React.ReactNode;
}

// Tour ID sets per level — what auto-tour cycles through.
const ALL_TENDENCJE_IDS = COMPASS_SECTORS.flatMap((s) =>
  s.tendencje.map((t) => t.id),
);
const SEKTOR_IDS = COMPASS_SECTORS.map((s) => s.id);
const BASE_TOUR_IDS = ["base.cierpkosc", "base.slodycz", "base.kwasowosc"];

const tourIdsForLevel = (level: CompassLevel): string[] => {
  if (level === 1) return BASE_TOUR_IDS;
  if (level === 2) return SEKTOR_IDS;
  return ALL_TENDENCJE_IDS;
};

// Resolve a focus id (tendencja, sektor, or base.<id>) into a normalized
// shape the side panel can render. Returns null when the id is unknown.
type FocusRecord =
  | { kind: "tendencja"; sector: (typeof COMPASS_SECTORS)[number]; tendencja: (typeof COMPASS_SECTORS)[number]["tendencje"][number] }
  | { kind: "sektor"; sector: (typeof COMPASS_SECTORS)[number] }
  | { kind: "base"; baseId: string; name: string; description: string };

const findFocus = (id: string | null): FocusRecord | null => {
  if (!id) return null;
  // base.<id>?
  if (id.startsWith("base.")) {
    const baseId = id.slice(5);
    const b = BASE_TASTES.find((t) => t.id === baseId);
    return b ? { kind: "base", baseId, name: b.name_pl, description: b.description_pl } : null;
  }
  // sektor id?
  const sektor = COMPASS_SECTORS.find((s) => s.id === id);
  if (sektor) return { kind: "sektor", sector: sektor };
  // tendencja id?
  for (const s of COMPASS_SECTORS) {
    for (const t of s.tendencje) {
      if (t.id === id) return { kind: "tendencja", sector: s, tendencja: t };
    }
  }
  return null;
};

// Tour pacing presets — labeled so the UI control reads naturally.
const TOUR_SPEEDS = [
  { id: "slow", ms: 5000, label: "Wolno" },
  { id: "normal", ms: 3200, label: "Normalnie" },
  { id: "fast", ms: 1800, label: "Szybko" },
] as const;
type TourSpeedId = (typeof TOUR_SPEEDS)[number]["id"];

export default function InteractiveCompass({
  profile,
  onProfileChange,
  tourMs,
  level = 3,
  autoStartTour = false,
  belowCompass,
  aboveCompass,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  // Pinned id stays selected after the user clicks (or hovers chip in the
  // selected-profile bar). Persists until they pick a different one.
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [tourOn, setTourOn] = useState(autoStartTour);
  const [tourIdx, setTourIdx] = useState(0);
  const [tourSpeed, setTourSpeed] = useState<TourSpeedId>("normal");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Effective interval: explicit prop wins, otherwise pick from preset.
  const intervalMs =
    tourMs ?? TOUR_SPEEDS.find((s) => s.id === tourSpeed)?.ms ?? 3200;

  // Tour cycles through level-specific id set (3 base / 6 sektor / 12 spoke).
  const tourIds = useMemo(() => tourIdsForLevel(level), [level]);

  // Reset tour position when level changes — otherwise an idx of 11 from
  // a level-3 run would crash level-1's 3-item set. Auto-start the tour
  // for stages that ask for it. Lint-disable required: localStorage- and
  // prop-driven sync state is the only safe place to set it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTourIdx(0);
    if (autoStartTour) {
      setTourOn(true);
    }
  }, [level, autoStartTour]);

  // Tour ticks
  useEffect(() => {
    if (!tourOn) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    intervalRef.current = setInterval(() => {
      setTourIdx((i) => (i + 1) % tourIds.length);
    }, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tourOn, intervalMs, tourIds.length]);

  const tourId = tourOn ? tourIds[tourIdx] : null;
  // Priority: tour > hover > pinned. Tour wraps the others while playing;
  // outside of tour the pinned selection is baseline and hover provides
  // the live preview.
  const focusedId = tourId ?? hovered ?? pinnedId;
  const focused = useMemo(() => findFocus(focusedId), [focusedId]);

  // Pin whenever profile changes (i.e. user clicked a spoke / sektor / base).
  // Listens to ALL profile keys, including base.* and the per-tendencja ids,
  // so a click at any level pins the corresponding interactive target.
  const prevProfileRef = useRef(profile);
  useEffect(() => {
    const prev = prevProfileRef.current;
    prevProfileRef.current = profile;
    // Find first changed key — pick the level-appropriate display id.
    const allKeys = new Set([...Object.keys(profile), ...Object.keys(prev)]);
    for (const k of allKeys) {
      if ((profile[k] ?? 0) === (prev[k] ?? 0)) continue;
      let displayId: string;
      if (k.startsWith("base.")) {
        displayId = k;
      } else if (level === 2) {
        // Tendencja change at L2 — find its sektor and pin that.
        const s = COMPASS_SECTORS.find((sec) => sec.tendencje.some((t) => t.id === k));
        displayId = s?.id ?? k;
      } else {
        displayId = k;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPinnedId(displayId);
      break;
    }
  }, [profile, level]);

  const stepTour = useCallback(
    (dir: 1 | -1) => {
      setTourIdx((i) => {
        const n = tourIds.length;
        return (i + dir + n) % n;
      });
    },
    [tourIds.length],
  );

  const onAskGuide = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!focused) return;
    const label =
      focused.kind === "tendencja"
        ? `${focused.sector.name_pl} · ${focused.tendencja.name_pl}`
        : focused.kind === "sektor"
          ? focused.sector.name_pl
          : focused.name;
    window.dispatchEvent(
      new CustomEvent("wn:open-chat", {
        detail: {
          prefill: `Opowiedz mi więcej o wrażeniu „${label}" — czego szukać w winie?`,
        },
      }),
    );
  }, [focused]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-7">
      {/* ── Compass ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center">
        {/* Above-compass slot (e.g. live dryness arrow on stage 1) —
            first thing visible on the card. */}
        {aboveCompass ? <div className="mb-5 w-full max-w-[440px]">{aboveCompass}</div> : null}
        <div className="w-full max-w-[440px]">
          <TasteCompass
            profile={profile}
            onChange={onProfileChange}
            level={level}
            // Tour wins; pinned (last-clicked) wins over nothing — both are
            // bridged through this single prop so the spoke pulses as long
            // as that selection is "current".
            externalHighlightId={tourId ?? pinnedId}
            onHoverChange={setHovered}
            hideLegend
          />
        </div>

        {/* Tour controls */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {!tourOn ? (
            <button
              type="button"
              onClick={() => {
                setTourOn(true);
                setTourIdx(0);
              }}
              className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 px-4 py-2 text-xs font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:bg-[var(--color-accent-gold)]/20"
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                <path d="M3 2 L10 6 L3 10 Z" />
              </svg>
              Auto-przewodnik
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => stepTour(-1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#e6dccd] transition hover:bg-white/10"
                aria-label="Poprzednia tendencja"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M9 2 L2 6 L9 10 Z" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => {
                  // Pin the spoke the tour was just on so the info panel
                  // keeps showing it after pause (otherwise focusedId
                  // collapses to null and the panel reverts to the idle
                  // state — confusing UX).
                  if (tourId) setPinnedId(tourId);
                  setTourOn(false);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-500/35 bg-rose-900/20 px-4 py-2 text-xs font-semibold tracking-wider text-rose-300 uppercase transition hover:bg-rose-900/30"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
                  <rect x="2" y="2" width="3" height="8" />
                  <rect x="7" y="2" width="3" height="8" />
                </svg>
                Zatrzymaj
              </button>
              <button
                type="button"
                onClick={() => stepTour(1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[#e6dccd] transition hover:bg-white/10"
                aria-label="Następna tendencja"
              >
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M3 2 L10 6 L3 10 Z" />
                </svg>
              </button>
              <span
                className="ml-1 font-mono text-[11px] tracking-wider text-[#c5a059]/70"
                aria-live="polite"
              >
                {tourIdx + 1} / {tourIds.length}
              </span>
              {/* Speed picker — sits inline with tour controls. */}
              <div className="ml-2 flex items-center gap-0.5 rounded-full border border-[var(--gold-hairline-soft)] bg-[#1a0f12]/55 p-0.5" role="radiogroup" aria-label="Tempo przewodnika">
                {TOUR_SPEEDS.map((s) => {
                  const active = s.id === tourSpeed;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setTourSpeed(s.id)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase transition ${
                        active
                          ? "bg-[var(--color-accent-gold)] text-[#150a0c]"
                          : "text-[#e6dccd]/70 hover:text-[#f4ede0]"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] tracking-wider text-[#c5a059]/55 uppercase">
          {tourOn
            ? `Przewodnik prowadzi przez ${tourIds.length} ${
                level === 1 ? "smaki bazowe" : level === 2 ? "wrażeń" : "tendencji"
              }`
            : "Najedź lub kliknij, aby ustawić intensywność"}
        </p>

        {/* Selected-profile bar — animated chips appear as the user clicks
            spokes. Replaces TasteCompass's default legend (we hideLegend
            because this is more on-brand and uses sektor colour swatches). */}
        <SelectedProfileBar
          profile={profile}
          onClear={() => onProfileChange({})}
          onPickHover={setHovered}
        />

        {/* Stage-specific slot under the compass (e.g. the live dryness
            arrow on stage 1) — same card, always visible. */}
        {belowCompass ? <div className="mt-5 w-full max-w-[440px]">{belowCompass}</div> : null}
      </div>

      {/* ── Side info panel ─────────────────────────────────────────── */}
      <aside
        className="rounded-2xl border p-5 transition"
        style={(() => {
          const accent =
            focused?.kind === "tendencja" || focused?.kind === "sektor"
              ? focused.sector.color
              : "var(--color-accent-gold)";
          // Use the semantic surface vars so the panel flips dark/cream
          // with the page. The accent overlay (sektor color at 0x1f) reads
          // on both backgrounds; border tint stays themed.
          return {
            background: focused
              ? `linear-gradient(180deg, ${
                  focused.kind === "base" ? "rgba(197,160,89,0.12)" : accent + "1f"
                }, transparent 70%), var(--surface-elevated)`
              : "var(--surface-elevated)",
            borderColor:
              focused?.kind === "tendencja" || focused?.kind === "sektor"
                ? `${focused.sector.color}55`
                : "var(--gold-hairline)",
            color: "var(--ink)",
            boxShadow: "var(--shadow-card)",
          };
        })()}
        aria-live="polite"
      >
        {focused ? (
          <FocusedCard
            focused={focused}
            profile={profile}
            isTour={tourOn}
            onAskGuide={onAskGuide}
          />
        ) : (
          <IdleCard
            level={level}
            onStartTour={() => {
              setTourOn(true);
              setTourIdx(0);
            }}
          />
        )}
      </aside>
    </div>
  );
}

/**
 * TourText — typewriter reveal for the auto-tour descriptions. While
 * `typing` is true, the text types out char-by-char (~22ms/char) with a
 * blinking caret so the panel reads like a typewriter instead of snapping
 * between sektor descriptions. When `typing` is false (hover / pinned),
 * the full text shows instantly. Restarts whenever `text` changes.
 */
// NOTE: callers MUST pass `key={`${typing}:${text}`}` so this remounts when
// the text changes — the useState initializer then handles the reset and the
// effect only updates state from the interval callback (lint-clean).
function TourText({ text, typing }: { text: string; typing: boolean }) {
  const [shown, setShown] = useState(typing ? "" : text);

  useEffect(() => {
    if (!typing) return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) window.clearInterval(id);
    }, 22);
    return () => window.clearInterval(id);
  }, [text, typing]);

  const done = shown.length >= text.length;
  return (
    <>
      {shown}
      {typing && !done ? (
        <span
          aria-hidden
          className="ml-0.5 inline-block w-[0.5ch] animate-pulse"
          style={{ color: "var(--color-accent-gold)" }}
        >
          ▋
        </span>
      ) : null}
    </>
  );
}

/**
 * SelectionComment — the guide's live reaction to how strongly the user
 * marked the focused element. 0 = a nudge to click; 1-4 = an interpretation
 * of that intensity. Gives the panel a "the przewodnik is watching what I
 * do" feel instead of static description text.
 */
const INTENSITY_COMMENTS: Record<number, string> = {
  0: "Jeszcze nie zaznaczone — kliknij koło, aby ustawić siłę (0–4).",
  1: "Ledwo wyczuwalne — subtelny akcent w tle.",
  2: "Umiarkowane — wyraźnie obecne, ale nie dominuje.",
  3: "Mocne — jeden z głównych charakterów Twojego wina.",
  4: "Dominujące — definiuje styl, którego szukasz.",
};

function SelectionComment({
  intensity,
  accent,
  label,
}: {
  intensity: number;
  accent: string;
  label: string;
}) {
  const v = Math.max(0, Math.min(4, Math.round(intensity)));
  const comment = INTENSITY_COMMENTS[v];
  return (
    <div
      className="mt-3 flex items-start gap-2.5 rounded-xl border px-3 py-2.5"
      style={{
        borderColor: v > 0 ? `${accent}55` : "var(--gold-hairline-soft)",
        background: v > 0 ? `${accent}14` : "var(--surface-deep)",
      }}
      aria-live="polite"
    >
      {/* 4-dot intensity readout */}
      <span className="mt-0.5 inline-flex shrink-0 gap-0.5" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full"
            style={{ background: i < v ? accent : "var(--hairline-strong)" }}
          />
        ))}
      </span>
      <p className="text-[12px] leading-snug" style={{ color: "var(--ink)" }}>
        <strong className="font-semibold" style={{ color: v > 0 ? accent : "var(--ink-soft)" }}>
          {label} · {v}/4.
        </strong>{" "}
        {comment}
      </p>
    </div>
  );
}

function FocusedCard({
  focused,
  profile,
  isTour,
  onAskGuide,
}: {
  focused: FocusRecord;
  profile: CompassProfile;
  isTour: boolean;
  onAskGuide: () => void;
}) {
  // Branch the visible content per focus kind so the same panel reads
  // sensibly at level 1 (base smaki), level 2 (sektor), or level 3 (full).
  const accent =
    focused.kind === "tendencja" || focused.kind === "sektor"
      ? focused.sector.color
      : "#c5a059";

  // Title + subtitle vary per kind
  const eyebrow =
    focused.kind === "base"
      ? "Smak bazowy"
      : focused.kind === "sektor"
        ? "Wrażenie"
        : "Tendencja";
  const title =
    focused.kind === "base"
      ? focused.name
      : focused.kind === "sektor"
        ? focused.sector.name_pl
        : focused.sector.name_pl;
  const subtitle =
    focused.kind === "tendencja" ? ` · ${focused.tendencja.name_pl}` : "";

  // Still-life image for this impression (client: "też ważne są obrazki").
  // tendencja → its own image; sektor → sektor image; base → none.
  const senseImg =
    focused.kind === "tendencja"
      ? SENSE_IMAGE_MAP[focused.tendencja.id] ?? SENSE_IMAGE_MAP[focused.sector.id]
      : focused.kind === "sektor"
        ? SENSE_IMAGE_MAP[focused.sector.id]
        : undefined;

  // Intensity per focus kind (used in the value pill upper-right)
  const intensity =
    focused.kind === "base"
      ? ((profile[`base.${focused.baseId}`] ?? 0) as number)
      : focused.kind === "sektor"
        ? // sektor avg of its two tendencje
          Math.round(
            (((profile[focused.sector.tendencje[0].id] ?? 0) as number) +
              ((profile[focused.sector.tendencje[1].id] ?? 0) as number)) /
              2,
          )
        : ((profile[focused.tendencja.id] ?? 0) as number);

  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{
            background: accent,
            boxShadow: `0 0 0 2px #150a0c, 0 0 0 4px ${accent}55`,
          }}
          aria-hidden
        />
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: accent }}>
          {isTour ? "Przewodnik mówi…" : eyebrow}
        </p>
        <span className="ml-auto font-mono text-[10px] tracking-wider text-[#c5a059]/70">
          {intensity}/4
        </span>
      </div>

      {/* Still-life image of the impression — the "obrazki" from the
          canonical Vinokompas (citrus for Świeże, leather/oak for
          Szorstkie, etc.), generated to match the wine-bar aesthetic. */}
      {senseImg ? (
        <div
          className="relative mt-3 h-28 w-full overflow-hidden rounded-xl border"
          style={{ borderColor: `${accent}44` }}
        >
          <Image
            src={senseImg}
            alt={title}
            fill
            sizes="(min-width: 1024px) 340px, 90vw"
            unoptimized
            className="object-cover"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: `linear-gradient(180deg, transparent 55%, ${accent}22)` }}
          />
        </div>
      ) : null}

      <h3 className="pitch-display mt-3 text-2xl text-white">
        {title}
        {subtitle ? (
          <em className="font-serif text-base italic text-[#e6dccd]/85">{subtitle}</em>
        ) : null}
      </h3>

      {/* Live commentary on the user's selection — the guide reacts to the
          intensity they set (client: "czy ten przewodnik nie powinien
          komentować tego co zaznaczyłam?"). Updates instantly on every
          click because `intensity` is read from the profile each render. */}
      <SelectionComment intensity={intensity} accent={accent} label={title} />

      {/* Body — three paragraphs per kind. The primary description types
          out like a typewriter while the auto-tour is running (client:
          "napisy za szybko skaczą... pismem jak pisze się na maszynie"),
          and shows instantly on hover/click. */}
      {focused.kind === "base" ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[#e6dccd]">
            <TourText key={`${isTour}:${focused.description}`} text={focused.description} typing={isTour} />
          </p>
          <p className="mt-3 text-[12px] leading-relaxed text-[#cbc1b1]">
            Trzy smaki bazowe — cierpkość, słodycz, kwasowość — to
            podstawa rozumienia każdego wina. Im wyżej je zaznaczysz, tym
            wyraźniej dominują w twoim ulubionym profilu.
          </p>
        </>
      ) : focused.kind === "sektor" ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[#e6dccd]">
            <TourText key={`${isTour}:${focused.sector.short_pl}`} text={focused.sector.short_pl} typing={isTour} />
          </p>
          <dl className="mt-4 space-y-2 text-[12px] leading-relaxed">
            {focused.sector.tendencje.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 border-b border-[rgba(197,160,89,0.15)] pb-2 last:border-0"
              >
                <dt className="font-serif text-[12px] italic text-[var(--color-accent-gold)]">
                  {t.name_pl}
                </dt>
                <dd className="text-[#cbc1b1]">{t.associations_pl}</dd>
              </div>
            ))}
          </dl>
          <details className="mt-4 group">
            <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:text-[#f4ede0]">
              ❦ Pełny opis sektora
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[#cbc1b1]">
              {focused.sector.long_pl}
            </p>
          </details>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[#e6dccd]">
            <TourText key={`${isTour}:${focused.sector.short_pl}`} text={focused.sector.short_pl} typing={isTour} />
          </p>
          <dl className="mt-4 space-y-2.5 text-[13px] leading-relaxed">
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3">
              <dt className="text-[10px] font-semibold tracking-wider text-[#c5a059]/65 uppercase">Skojarzenia</dt>
              <dd className="text-[#e6dccd]/90">{focused.tendencja.associations_pl}</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3">
              <dt className="text-[10px] font-semibold tracking-wider text-[#c5a059]/65 uppercase">Przykład</dt>
              <dd className="font-serif italic text-[#e6dccd]/85">{focused.tendencja.examples_pl}</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3">
              <dt className="text-[10px] font-semibold tracking-wider text-[#c5a059]/65 uppercase">Spotkasz w</dt>
              <dd className="text-[#cbc1b1]">{focused.tendencja.found_in_pl}</dd>
            </div>
          </dl>
          <details className="mt-4 group">
            <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:text-[#f4ede0]">
              ❦ Pełny opis sektora
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[#cbc1b1]">{focused.sector.long_pl}</p>
          </details>
        </>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAskGuide}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 px-4 py-2 text-xs font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:bg-[var(--color-accent-gold)]/20"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2V5a3 3 0 0 1 3-3Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
          </svg>
          Zapytaj przewodnika
        </button>
      </div>
    </div>
  );
}

function IdleCard({ level, onStartTour }: { level: CompassLevel; onStartTour: () => void }) {
  const what =
    level === 1
      ? { count: 3, plural: "trzy smaki bazowe" }
      : level === 2
        ? { count: 6, plural: "sześć wrażeń" }
        : { count: 12, plural: "dwanaście tendencji" };
  return (
    <div>
      <p className="pitch-eyebrow pitch-eyebrow--start">Vinokompas</p>
      <h3 className="pitch-display mt-3 text-2xl text-white">
        Najedź na koło lub<br />uruchom przewodnika
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[#e6dccd]">
        Tarcza Vinokompasu pokaże opis każdego elementu. Możesz też pozwolić,
        by przewodnik przeszedł przez {what.plural} automatycznie — wystarczy nacisnąć przycisk poniżej.
      </p>
      <button
        type="button"
        onClick={onStartTour}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 px-5 py-2.5 text-xs font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:bg-[var(--color-accent-gold)]/20"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
          <path d="M3 2 L10 6 L3 10 Z" />
        </svg>
        ▶ Uruchom przewodnika
      </button>

      <ul className="mt-6 grid grid-cols-3 gap-2 text-[10px] tracking-wider uppercase">
        {COMPASS_SECTORS.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-1.5 rounded-md border border-[rgba(197,160,89,0.18)] bg-[#1a0f12]/60 px-2 py-1.5"
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="truncate text-[#e6dccd]">{s.name_pl}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── selected profile bar ────────────────────────────────────────────────
// Sits under the compass; surfaces the user's accumulated picks as a chip
// row. Mirrors what TasteCompass's old `<CompassLegend>` did but uses
// editorial typography and includes base smaki (slodycz/cierpkosc/
// kwasowosc) when set. Hovering a chip rebroadcasts hover to the compass
// via the parent (so the spoke pulses).
function SelectedProfileBar({
  profile,
  onClear,
  onPickHover,
}: {
  profile: CompassProfile;
  onClear: () => void;
  onPickHover: (id: string | null) => void;
}) {
  const tendencjaPicks = COMPASS_SECTORS.flatMap((s) =>
    s.tendencje
      .map((t) => ({
        id: t.id,
        label: t.shortLabel_pl ?? t.name_pl,
        color: s.color,
        intensity: (profile[t.id] ?? 0) as number,
      }))
      .filter((p) => p.intensity > 0),
  ).sort((a, b) => b.intensity - a.intensity);

  const basePicks = BASE_TASTES.map((b) => ({
    id: `base.${b.id}`,
    label: b.name_pl,
    intensity: (profile[`base.${b.id}`] ?? 0) as number,
  })).filter((p) => p.intensity > 0);

  const total = tendencjaPicks.length + basePicks.length;

  if (total === 0) {
    return (
      <p className="mt-5 text-center font-serif text-xs italic text-[var(--color-accent-gold)] opacity-75">
        Twój profil pojawi się tutaj — wskaż intensywność dotykiem koła.
      </p>
    );
  }

  return (
    <div className="mt-5 w-full max-w-[440px] rounded-2xl border border-[rgba(197,160,89,0.32)] bg-[#1a0f12]/55 p-3">
      <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
        <p className="text-[10px] font-bold tracking-[0.22em] text-[var(--color-accent-gold)] uppercase">
          Twój profil · {total}
        </p>
        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-rose-500/30 bg-rose-900/20 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-rose-300 uppercase transition hover:bg-rose-900/35"
        >
          Wyzeruj
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {tendencjaPicks.map((p) => (
          <span
            key={p.id}
            onMouseEnter={() => onPickHover(p.id)}
            onMouseLeave={() => onPickHover(null)}
            className="profile-chip inline-flex items-center gap-1.5 rounded-full border bg-[#1a0e10]/70 px-2.5 py-1 text-[11px] text-[#f4ede0] transition hover:scale-105"
            style={{ borderColor: `${p.color}66` }}
          >
            <span
              aria-hidden
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: p.color, boxShadow: `0 0 6px ${p.color}88` }}
            />
            <span className="font-serif italic">{p.label}</span>
            <span className="ml-0.5 inline-flex gap-0.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: i < p.intensity ? p.color : "rgba(197,160,89,0.18)" }}
                />
              ))}
            </span>
          </span>
        ))}

        {basePicks.length > 0 ? (
          <span className="mx-1 h-3 w-px bg-[var(--color-accent-gold)]/35" aria-hidden />
        ) : null}

        {basePicks.map((p) => (
          <span
            key={p.id}
            className="profile-chip inline-flex items-center gap-1.5 rounded-full border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 px-2.5 py-1 text-[11px] text-[var(--color-accent-gold)]"
          >
            <span className="font-serif italic">{p.label}</span>
            <span className="ml-0.5 inline-flex gap-0.5" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: i < p.intensity ? "var(--color-accent-gold)" : "rgba(197,160,89,0.20)" }}
                />
              ))}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
