"use client";

/**
 * InteractiveCompass - TasteCompass + side info-panel + auto-tour.
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
 *  CTA inside the side panel: "Otwórz przewodnika" - fires the global
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
  /** Progressive-disclosure level - flows into TasteCompass and selects
   *  which IDs the auto-tour cycles through. */
  level?: CompassLevel;
  /** Auto-start the tour when the component mounts. Used so each stage
   *  greets the user with a presentation instead of a static disc. */
  autoStartTour?: boolean;
  /** Optional content rendered in the LEFT column directly under the
   *  compass + profile bar - on the SAME card. Stage 1 uses this for the
   *  live dryness meter (moved here per feedback: under the compass). */
  belowCompass?: React.ReactNode;
  /** Forwarded to TasteCompass - makes the 3 base-smak rim labels clickable
   *  (used by the merged Vinokompas stage so base tastes + 6 wrażenia are
   *  both settable on one wheel). */
  baseInteractive?: boolean;
}

// Tour ID sets per level - what auto-tour cycles through.
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


export default function InteractiveCompass({
  profile,
  onProfileChange,
  tourMs,
  level = 3,
  autoStartTour = false,
  belowCompass,
  baseInteractive = false,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  // Pinned id stays selected after the user clicks (or hovers chip in the
  // selected-profile bar). Persists until they pick a different one.
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [tourOn, setTourOn] = useState(autoStartTour);
  const [tourIdx, setTourIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Clicking the compass during the tour interrupts it: pause, show the
  // user's selection + comment, then auto-resume after 3s.
  const [interrupt, setInterrupt] = useState(false);
  const resumeRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Demo intensity preview level (0..5), ramps while a sektor is narrated.
  const [demoLevel, setDemoLevel] = useState(0);
  const tourActive = tourOn && !interrupt;

  // Effective interval: explicit prop wins, otherwise pick from preset.
  const intervalMs = tourMs ?? 4000;

  // Tour cycles through level-specific id set (3 base / 6 sektor / 12 spoke).
  const tourIds = useMemo(() => tourIdsForLevel(level), [level]);

  // Reset tour position when level changes - otherwise an idx of 11 from
  // a level-3 run would crash level-1's 3-item set. Auto-start the tour
  // for stages that ask for it. Lint-disable required: localStorage- and
  // prop-driven sync state is the only safe place to set it.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTourIdx(0);
    if (!autoStartTour) return;
    setTourOn(true);
    // Brief auto-presentation: play one pass then hand over to the user — no
    // manual controls (feedback: "просто пару секунд презентация анимация").
    const count = tourIdsForLevel(level).length;
    const stop = window.setTimeout(() => setTourOn(false), count * 4000 + 250);
    return () => window.clearTimeout(stop);
  }, [level, autoStartTour]);

  // Tour ticks - paused while interrupted (user is interacting).
  useEffect(() => {
    if (!tourActive) {
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
  }, [tourActive, intervalMs, tourIds.length]);

  // Clear any pending resume timer on unmount.
  useEffect(() => () => {
    if (resumeRef.current) clearTimeout(resumeRef.current);
  }, []);

  // Mobile "?" bottom-sheet with the focused item's description.
  const [mobileInfoOpen, setMobileInfoOpen] = useState(false);

  const tourId = tourActive ? tourIds[tourIdx] : null;
  // Priority: tour > hover > pinned. Tour wraps the others while playing;
  // outside of tour the pinned selection is baseline and hover provides
  // the live preview.
  const focusedId = tourId ?? hovered ?? pinnedId;
  const focused = useMemo(() => findFocus(focusedId), [focusedId]);
  const focusedTitle = focused
    ? focused.kind === "base"
      ? focused.name
      : focused.kind === "sektor"
        ? focused.sector.name_pl
        : focused.tendencja.name_pl
    : "";

  // Pin whenever profile changes (i.e. user clicked a spoke / sektor / base).
  // Listens to ALL profile keys, including base.* and the per-tendencja ids,
  // so a click at any level pins the corresponding interactive target.
  const prevProfileRef = useRef(profile);
  useEffect(() => {
    const prev = prevProfileRef.current;
    prevProfileRef.current = profile;
    // Find first changed key - pick the level-appropriate display id.
    const allKeys = new Set([...Object.keys(profile), ...Object.keys(prev)]);
    for (const k of allKeys) {
      if ((profile[k] ?? 0) === (prev[k] ?? 0)) continue;
      let displayId: string;
      if (k.startsWith("base.")) {
        displayId = k;
      } else if (level === 2) {
        // Tendencja change at L2 - find its sektor and pin that.
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

  // Demo intensity ramp: while the tour narrates a sektor/tendencja, animate
  // a 0→5 preview on the compass to show that intensity varies. Visual only.
  useEffect(() => {
    // All setDemoLevel calls run inside rAF/interval callbacks (not the effect
    // body) so they don't trip react-hooks/set-state-in-effect.
    if (!tourActive || !tourId || tourId.startsWith("base.")) {
      const raf = requestAnimationFrame(() => setDemoLevel(0));
      return () => cancelAnimationFrame(raf);
    }
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const raf = requestAnimationFrame(() => setDemoLevel(3));
      return () => cancelAnimationFrame(raf);
    }
    const raf = requestAnimationFrame(() => setDemoLevel(0));
    // Fill speed tracks the tour speed (WOLNO/NORMALNIE/SZYBKO): one ring per
    // ~1/6 of the narration window, so 0→5 fills smoothly over most of it.
    const demoStep = Math.max(300, Math.round(intervalMs / 6));
    let lvl = 0;
    const id = setInterval(() => {
      lvl += 1;
      setDemoLevel(lvl);
      if (lvl >= 5) clearInterval(id);
    }, demoStep);
    return () => {
      cancelAnimationFrame(raf);
      clearInterval(id);
    };
  }, [tourActive, tourId, intervalMs]);

  // Compass interaction - applies the change, then (during the tour) pauses on
  // the clicked item, comments on its intensity, and auto-resumes after 3s.
  const handleCompassChange = (next: CompassProfile) => {
    onProfileChange(next);
    if (!tourOn) return;
    let changedId: string | null = null;
    const keys = new Set([...Object.keys(next), ...Object.keys(profile)]);
    for (const k of keys) {
      if ((next[k] ?? 0) !== (profile[k] ?? 0)) {
        changedId = k;
        break;
      }
    }
    if (changedId) {
      let displayId = changedId;
      if (level === 2 && !changedId.startsWith("base.")) {
        const s = COMPASS_SECTORS.find((sec) =>
          sec.tendencje.some((t) => t.id === changedId),
        );
        displayId = s?.id ?? changedId;
      }
      const idx = tourIds.indexOf(displayId);
      if (idx >= 0) setTourIdx(idx);
    }
    setInterrupt(true);
    if (resumeRef.current) clearTimeout(resumeRef.current);
    resumeRef.current = setTimeout(() => setInterrupt(false), 3000);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-7">
      {/* ── Compass ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[440px]">
          <TasteCompass
            profile={profile}
            onChange={handleCompassChange}
            level={level}
            baseInteractive={baseInteractive}
            // Tour wins; pinned (last-clicked) wins over nothing - both are
            // bridged through this single prop so the spoke pulses as long
            // as that selection is "current".
            externalHighlightId={tourId ?? pinnedId}
            demoFill={
              tourActive && tourId && !tourId.startsWith("base.") && demoLevel > 0
                ? { id: tourId, level: demoLevel }
                : null
            }
            onHoverChange={setHovered}
            hideLegend
          />
        </div>
        {/* Dryness meter — directly under the compass dial, above TWÓJ PROFIL. */}
        {belowCompass ? <div className="mt-5 w-full max-w-[440px]">{belowCompass}</div> : null}

        {tourActive ? (
          <p className="mt-2 max-w-[440px] text-center text-xs leading-snug text-[var(--ink-soft)]">
            Każdą tendencję ustawiasz od 1 (ledwo wyczuwalna) do 5 (dominująca) —
            kliknij koło, aby wybrać siłę.
          </p>
        ) : null}

        {/* "Najedź lub kliknij" hint + the TWÓJ PROFIL chip bar removed
            2026-07 per client review — the wheel itself carries the state
            and the chips duplicated it below the fold. */}

        {/* Mobile: the always-on side panel is gone (client review) — a "?"
            disclosure opens the description as a bottom sheet instead. */}
        <div className="mt-3 w-full max-w-[440px] lg:hidden">
          {focused ? (
            <button
              type="button"
              onClick={() => setMobileInfoOpen(true)}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-[var(--gold-hairline)] px-4 py-2 text-[12px] font-semibold tracking-wider uppercase text-[var(--color-accent-gold)] transition hover:border-[var(--color-accent-gold)]"
            >
              <span
                aria-hidden
                className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]"
              >
                ?
              </span>
              Co oznacza „{focusedTitle}”?
            </button>
          ) : null}
        </div>
      </div>

      {/* Mobile bottom-sheet with the focused description (replaces the
          always-visible panel on phones). */}
      {mobileInfoOpen && focused ? (
        <div className="fixed inset-0 z-[80] flex items-end lg:hidden">
          <button
            type="button"
            aria-label="Zamknij opis"
            onClick={() => setMobileInfoOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <div
            role="dialog"
            aria-label={`Opis: ${focusedTitle}`}
            className="relative max-h-[75dvh] w-full overflow-y-auto rounded-t-3xl border-t border-[var(--gold-hairline)] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            style={{ background: "var(--surface-elevated)", color: "var(--ink)" }}
          >
            <button
              type="button"
              onClick={() => setMobileInfoOpen(false)}
              aria-label="Zamknij"
              className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--ink-soft)]"
            >
              ✕
            </button>
            <FocusedCard
              key={`m-${focusedId ?? "idle"}`}
              focused={focused}
              profile={profile}
              isTour={false}
              onAskGuide={onAskGuide}
            />
          </div>
        </div>
      ) : null}

      {/* ── Side info panel — desktop only (mobile uses the "?" sheet).
          Chrome is BRAND GOLD regardless of the focused sector (client
          review 2026-07: drop the red accent). self-start keeps the card
          content-height (it used to stretch to the wheel column, ~60%
          empty); sticky keeps it in view alongside the tall wheel. */}
      <aside
        className="hidden self-start rounded-2xl border p-5 transition lg:sticky lg:top-24 lg:block"
        style={{
          background: focused
            ? "linear-gradient(180deg, rgba(199,159,105,0.12), transparent 70%), var(--surface-elevated)"
            : "var(--surface-elevated)",
          borderColor: "var(--gold-hairline)",
          color: "var(--ink)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {/* SR announcement: the FULL description once per focus change. The
            visible TourText types char-by-char — keeping aria-live on the whole
            aside made screen readers spell out every character (audit 2026-07). */}
        <span className="sr-only" role="status">
          {focused
            ? focused.kind === "base"
              ? `${focused.name}. ${focused.description}`
              : `${focused.sector.name_pl}. ${focused.sector.short_pl}`
            : ""}
        </span>
        {focused ? (
          <FocusedCard
            key={focusedId ?? "idle"}
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
        {/* Restart entry point — the IdleCard's "Uruchom przewodnika" vanishes
            forever after the first wheel tap pins a selection (audit 2026-07).
            Small persistent control brings the auto-tour back. */}
        {!tourOn && focused ? (
          <button
            type="button"
            onClick={() => {
              setInterrupt(false);
              setTourIdx(0);
              setTourOn(true);
            }}
            className="mt-4 inline-flex min-h-[40px] items-center gap-1.5 rounded-full border border-[var(--gold-hairline-soft)] px-3.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase transition hover:border-[var(--color-accent-gold)]"
            style={{ color: "var(--color-accent-gold)" }}
          >
            ▶ Przewodnik od nowa
          </button>
        ) : null}
      </aside>
    </div>
  );
}

/**
 * TourText - typewriter reveal for the auto-tour descriptions. While
 * `typing` is true, the text types out char-by-char (~22ms/char) with a
 * blinking caret so the panel reads like a typewriter instead of snapping
 * between sektor descriptions. When `typing` is false (hover / pinned),
 * the full text shows instantly. Restarts whenever `text` changes.
 */
// NOTE: callers MUST pass `key={`${typing}:${text}`}` so this remounts when
// the text changes - the useState initializer then handles the reset and the
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
 * SelectionComment - the guide's live reaction to how strongly the user
 * marked the focused element. 0 = a nudge to click; 1-4 = an interpretation
 * of that intensity. Gives the panel a "the przewodnik is watching what I
 * do" feel instead of static description text.
 */
const INTENSITY_COMMENTS: Record<number, string> = {
  0: "Jeszcze nie zaznaczone — kliknij koło, aby ustawić siłę (0-5).",
  1: "Ledwo wyczuwalne — subtelny akcent w tle.",
  2: "Delikatne — lekko zaznaczone.",
  3: "Umiarkowane — wyraźnie obecne, ale nie dominuje.",
  4: "Mocne — jeden z głównych charakterów Twojego wina.",
  5: "Dominujące — definiuje styl, którego szukasz.",
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
  const v = Math.max(0, Math.min(5, Math.round(intensity)));
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
      {/* 5-dot intensity readout */}
      <span className="mt-0.5 inline-flex shrink-0 gap-0.5" aria-hidden>
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full"
            style={{ background: i < v ? accent : "var(--hairline-strong)" }}
          />
        ))}
      </span>
      <p className="text-[12px] leading-snug" style={{ color: "var(--ink)" }}>
        <strong className="font-semibold" style={{ color: v > 0 ? accent : "var(--ink-soft)" }}>
          {label} · {v}/5.
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
  // Panel chrome stays BRAND CAMEL for every sector — the client asked to
  // drop the sector-coloured (esp. red) accent from this card (2026-07);
  // sector colours live on the wheel only.
  const accent = "#c79f69";

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
    <div className="vk-swap">
      <div className="flex items-baseline gap-3">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{
            background: accent,
            boxShadow: `0 0 0 2px #081634, 0 0 0 4px ${accent}55`,
          }}
          aria-hidden
        />
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: accent }}>
          {isTour ? "Przewodnik mówi…" : eyebrow}
        </p>
        <span className="ml-auto font-mono text-[10px] tracking-wider text-[#c79f69]/70">
          {intensity}/5
        </span>
      </div>

      {/* Still-life image of the impression - the "obrazki" from the
          canonical Vinokompas (citrus for Świeże, leather/oak for
          Szorstkie, etc.), generated to match the wine-bar aesthetic. */}
      {senseImg ? (
        <div
          className="relative mt-3 h-28 w-full overflow-hidden rounded-xl border"
          style={{ borderColor: `${accent}44`, background: `linear-gradient(135deg, ${accent}26, transparent 70%)` }}
        >
          <Image
            src={senseImg}
            alt={title}
            fill
            sizes="(min-width: 1024px) 340px, 90vw"
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
          <em className="font-serif text-base italic text-[#e6e1d6]/85">{subtitle}</em>
        ) : null}
      </h3>

      {/* Live commentary on the user's selection - the guide reacts to the
          intensity they set (client: "czy ten przewodnik nie powinien
          komentować tego co zaznaczyłam?"). Updates instantly on every
          click because `intensity` is read from the profile each render. */}
      <SelectionComment intensity={intensity} accent={accent} label={title} />

      {/* Body - three paragraphs per kind. The primary description types
          out like a typewriter while the auto-tour is running (client:
          "napisy za szybko skaczą... pismem jak pisze się na maszynie"),
          and shows instantly on hover/click. */}
      {focused.kind === "base" ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[#e6e1d6]">
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
          <p className="mt-2 text-sm leading-relaxed text-[#e6e1d6]">
            <TourText key={`${isTour}:${focused.sector.short_pl}`} text={focused.sector.short_pl} typing={isTour} />
          </p>
          <dl className="mt-4 space-y-2 text-[12px] leading-relaxed">
            {focused.sector.tendencje.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 border-b border-[rgba(199,159,105,0.15)] pb-2 last:border-0"
              >
                <dt className="font-serif text-[12px] italic text-[var(--color-accent-gold)]">
                  {t.name_pl}
                </dt>
                <dd className="text-[#cbc1b1]">{t.associations_pl}</dd>
              </div>
            ))}
          </dl>
          <details className="mt-4 group">
            <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:text-[#f4efe9]">
              ❦ Pełny opis wrażenia
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[#cbc1b1]">
              {focused.sector.long_pl}
            </p>
          </details>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[#e6e1d6]">
            <TourText key={`${isTour}:${focused.sector.short_pl}`} text={focused.sector.short_pl} typing={isTour} />
          </p>
          <dl className="mt-4 divide-y divide-[rgba(199,159,105,0.16)] text-[13px] leading-relaxed">
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[10px] font-semibold tracking-wider text-[#c79f69]/65 uppercase">Skojarzenia</dt>
              <dd className="text-[#e6e1d6]/90">{focused.tendencja.associations_pl}</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[10px] font-semibold tracking-wider text-[#c79f69]/65 uppercase">Przykład</dt>
              <dd className="font-serif italic text-[#e6e1d6]/85">{focused.tendencja.examples_pl}</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[10px] font-semibold tracking-wider text-[#c79f69]/65 uppercase">Spotkasz w</dt>
              <dd className="text-[#cbc1b1]">{focused.tendencja.found_in_pl}</dd>
            </div>
          </dl>
          <details className="mt-4 group">
            <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:text-[#f4efe9]">
              ❦ Pełny opis wrażenia
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
          Zapytaj Vinovigatora
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
      <p className="mt-3 text-sm leading-relaxed text-[#e6e1d6]">
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

      <ul className="mt-6 grid grid-cols-2 gap-2 text-[10px] tracking-wider uppercase">
        {COMPASS_SECTORS.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-1.5 rounded-md border border-[rgba(199,159,105,0.18)] bg-[#0b1f44]/60 px-2 py-1.5"
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            <span className="truncate text-[#e6e1d6]">{s.name_pl}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// (SelectedProfileBar removed 2026-07 per client review — the chip row
// duplicated the wheel state below the fold; reset now lives in the stage
// controls strip.)
