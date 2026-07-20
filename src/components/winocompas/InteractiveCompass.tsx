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
import {
  BASE_TASTES,
  COMPASS_SECTORS,
  pickL,
  type CompassLang,
} from "@/data/wine-compass-kb";
import { ringSpritesFor } from "@/data/sense-images";
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
  /** UI language - "pl" default keeps every existing call-site (and the PL
   *  e2e surface) byte-identical; the EN /samouczek passes "en". */
  lang?: CompassLang;
  /** When the floating chat is disabled its wn:open-chat listener unmounts -
   *  the "Zapytaj Vinovigatora" CTA would be a silent no-op, so hide it. */
  chatDisabled?: boolean;
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

const findFocus = (id: string | null, lang: CompassLang): FocusRecord | null => {
  if (!id) return null;
  // base.<id>?
  if (id.startsWith("base.")) {
    const baseId = id.slice(5);
    const b = BASE_TASTES.find((t) => t.id === baseId);
    return b
      ? {
          kind: "base",
          baseId,
          name: pickL(lang, b.name_pl, b.name_en),
          description: pickL(lang, b.description_pl, b.description_en),
        }
      : null;
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
  lang = "pl",
  chatDisabled = false,
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
  // Mobile "?" button: after a wedge tap it can rest under the fixed tab bar
  // (320x568 measured 39 of its 44px occluded — taps landed on the bar).
  // Nudge it into view whenever the focus target changes; scroll-mb on the
  // button keeps it clear of the bar.
  const mobileInfoBtnRef = useRef<HTMLButtonElement | null>(null);

  const tourId = tourActive ? tourIds[tourIdx] : null;
  // Priority: tour > hover > pinned. Tour wraps the others while playing;
  // outside of tour the pinned selection is baseline and hover provides
  // the live preview.
  const focusedId = tourId ?? hovered ?? pinnedId;
  const focused = useMemo(() => findFocus(focusedId, lang), [focusedId, lang]);
  const focusedTitle = focused
    ? focused.kind === "base"
      ? focused.name
      : focused.kind === "sektor"
        ? pickL(lang, focused.sector.name_pl, focused.sector.name_en)
        : pickL(lang, focused.tendencja.name_pl, focused.tendencja.name_en)
    : "";

  // Keep the mobile "?" disclosure reachable: when the focus target changes
  // on a phone, scroll it clear of the fixed tab bar (scroll-mb on the
  // button provides the clearance; "nearest" avoids jumping when visible).
  useEffect(() => {
    if (!focusedId || typeof window === "undefined") return;
    if (window.innerWidth >= 1024) return;
    // USER interactions only. The auto-tour changes focus every 4s — nudging
    // then yanked the page back to the wheel wherever the user had scrolled
    // (the client's "przeskakuje czasem za daleko, czasem za blisko").
    if (tourId) return;
    mobileInfoBtnRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedId]);

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
    // The chat panel (z-60) opens UNDER this sheet (z-80) - close the sheet
    // first or the prefill auto-sends an invisible OpenAI call (audit HIGH).
    setMobileInfoOpen(false);
    const label =
      focused.kind === "tendencja"
        ? `${pickL(lang, focused.sector.name_pl, focused.sector.name_en)} · ${pickL(lang, focused.tendencja.name_pl, focused.tendencja.name_en)}`
        : focused.kind === "sektor"
          ? pickL(lang, focused.sector.name_pl, focused.sector.name_en)
          : focused.name;
    window.dispatchEvent(
      new CustomEvent("wn:open-chat", {
        detail: {
          prefill: pickL(
            lang,
            `Opowiedz mi więcej o wrażeniu „${label}" - czego szukać w winie?`,
            `Tell me more about the "${label}" sensation — what should I look for in a wine?`,
          ),
        },
      }),
    );
  }, [focused, lang]);

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
        <div className="w-full max-w-[440px] lg:max-w-[400px]">
          <TasteCompass
            profile={profile}
            onChange={handleCompassChange}
            level={level}
            lang={lang}
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
            // Image-ring medallions are informative buttons: click pins the
            // tendencja description; on phones (no side panel) it opens the
            // bottom sheet right away (client 2026-07: "kliknij obrazek,
            // zobacz informację").
            onMedallionSelect={(id) => {
              setPinnedId(id);
              // Pause the auto-tour like any other interaction, otherwise the
              // tour's own target would override the clicked medallion in the
              // panel/sheet (tourId wins over pinnedId in focusedId).
              setInterrupt(true);
              if (resumeRef.current) clearTimeout(resumeRef.current);
              resumeRef.current = setTimeout(() => setInterrupt(false), 8000);
              if (typeof window !== "undefined" && window.innerWidth < 1024) {
                setMobileInfoOpen(true);
              }
            }}
          />
        </div>
        {/* Dryness meter - directly under the compass dial, above TWÓJ PROFIL. */}
        {belowCompass ? <div className="mt-5 w-full max-w-[440px]">{belowCompass}</div> : null}

        {tourActive ? (
          /* Client 16.07: "po włączeniu przewodnika nie da się go wyłączyć"
             - an explicit stop, not just the 3s interaction pause. */
          <button
            type="button"
            onClick={() => setTourOn(false)}
            className="mt-3 inline-flex min-h-[36px] items-center gap-2 rounded-full border border-[var(--gold-hairline)] px-4 text-xs font-semibold tracking-wider text-[color:var(--ink)] uppercase transition hover:border-[var(--color-accent-gold)]"
          >
            ■ {pickL(lang, "Zatrzymaj przewodnik", "Stop the guide")}
          </button>
        ) : null}
        {tourActive ? (
          /* Level-aware vocabulary: etap 1 talks only about the 3 smaki —
             "tendencja" is stage-3 jargon (client's guiding principle). */
          <p className="mt-2 max-w-[440px] text-center text-xs leading-snug text-[var(--ink-soft)]">
            {level === 1
              ? pickL(
                  lang,
                  "Każdy smak ustawiasz od 1 (ledwo wyczuwalny) do 5 (dominujący) - kliknij oś, aby wybrać siłę.",
                  "You set each taste from 1 (barely perceptible) to 5 (dominant) - tap the axis to choose the strength.",
                )
              : level === 2
                ? pickL(
                    lang,
                    "Każde wrażenie ustawiasz od 1 (ledwo wyczuwalne) do 5 (dominujące) - kliknij koło, aby wybrać siłę.",
                    "You set each sensation from 1 (barely perceptible) to 5 (dominant) - tap the wheel to choose the strength.",
                  )
                : pickL(
                    lang,
                    "Każdą tendencję ustawiasz od 1 (ledwo wyczuwalna) do 5 (dominująca) - kliknij koło, aby wybrać siłę.",
                    "You set each tendency from 1 (barely perceptible) to 5 (dominant) — tap the wheel to choose the strength.",
                  )}
          </p>
        ) : null}

        {/* "Najedź lub kliknij" hint + the TWÓJ PROFIL chip bar removed
            2026-07 per client review - the wheel itself carries the state
            and the chips duplicated it below the fold. */}

        {/* Mobile: the always-on side panel is gone (client review) - a "?"
            disclosure opens the description as a bottom sheet instead. */}
        <div className="mt-3 w-full max-w-[440px] lg:hidden">
          {focused ? (
            <button
              type="button"
              ref={mobileInfoBtnRef}
              onClick={() => setMobileInfoOpen(true)}
              className="inline-flex min-h-[44px] w-full scroll-mb-[calc(var(--mobile-tabbar-h)+12px)] items-center justify-center gap-2 rounded-full border border-[var(--gold-hairline)] px-4 py-2 text-[12px] font-semibold tracking-wider uppercase text-[var(--color-accent-gold)] transition hover:border-[var(--color-accent-gold)]"
            >
              <span
                aria-hidden
                className="flex h-5 w-5 items-center justify-center rounded-full border border-current text-[11px]"
              >
                ?
              </span>
              {lang === "pl" ? <>Co oznacza „{focusedTitle}”?</> : <>What does “{focusedTitle}” mean?</>}
            </button>
          ) : null}
        </div>
      </div>

      {/* Mobile bottom-sheet with the focused description (replaces the
          always-visible panel on phones). */}
      {mobileInfoOpen && focused ? (
        <div
          className="fixed inset-0 z-[80] flex items-end lg:hidden"
          onKeyDown={(e) => {
            if (e.key === "Escape") setMobileInfoOpen(false);
          }}
        >
          <button
            type="button"
            aria-label={pickL(lang, "Zamknij opis", "Close description")}
            onClick={() => setMobileInfoOpen(false)}
            className="absolute inset-0 bg-black/45"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${pickL(lang, "Opis", "Description")}: ${focusedTitle}`}
            className="relative max-h-[75dvh] w-full overflow-y-auto rounded-t-3xl border-t border-[var(--gold-hairline)] p-5 pt-4 pr-16 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
            style={{ background: "var(--surface-elevated)", color: "var(--ink)" }}
          >
            <button
              type="button"
              autoFocus
              onClick={() => setMobileInfoOpen(false)}
              aria-label={pickL(lang, "Zamknij", "Close")}
              className="absolute top-3 right-3 flex h-10 w-10 items-center justify-center rounded-full border border-[var(--hairline-strong)] text-[var(--ink-soft)]"
            >
              ✕
            </button>
            <FocusedCard
              key={`m-${focusedId ?? "idle"}`}
              focused={focused}
              profile={profile}
              isTour={false}
              onAskGuide={chatDisabled ? undefined : onAskGuide}
              lang={lang}
            />
          </div>
        </div>
      ) : null}

      {/* ── Side info panel - desktop only (mobile uses the "?" sheet).
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
            visible TourText types char-by-char - keeping aria-live on the whole
            aside made screen readers spell out every character (audit 2026-07). */}
        <span className="sr-only" role="status">
          {focused
            ? focused.kind === "base"
              ? `${focused.name}. ${focused.description}`
              : `${pickL(lang, focused.sector.name_pl, focused.sector.name_en)}. ${pickL(lang, focused.sector.short_pl, focused.sector.short_en)}`
            : ""}
        </span>
        {focused ? (
          <FocusedCard
            key={focusedId ?? "idle"}
            focused={focused}
            profile={profile}
            isTour={tourOn}
            onAskGuide={chatDisabled ? undefined : onAskGuide}
            lang={lang}
          />
        ) : (
          <IdleCard
            level={level}
            lang={lang}
            onStartTour={() => {
              setTourOn(true);
              setTourIdx(0);
            }}
          />
        )}
        {/* Restart entry point - the IdleCard's "Uruchom przewodnika" vanishes
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
            ▶ {pickL(lang, "Przewodnik od nowa", "Restart the guide")}
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
const INTENSITY_COMMENTS: Record<CompassLang, Record<number, string>> = {
  pl: {
    0: "Jeszcze nie zaznaczone - kliknij koło, aby ustawić siłę (0-5).",
    1: "Ledwo wyczuwalne - subtelny akcent w tle.",
    2: "Delikatne - lekko zaznaczone.",
    3: "Umiarkowane - wyraźnie obecne, ale nie dominuje.",
    4: "Mocne - jedno z głównych wrażeń Twojego wina.",
    5: "Dominujące - definiuje styl, którego szukasz.",
  },
  en: {
    0: "Not set yet — tap the wheel to set the strength (0-5).",
    1: "Barely perceptible — a subtle accent in the background.",
    2: "Gentle — lightly present.",
    3: "Moderate — clearly present, but not dominating.",
    4: "Strong - one of your wine's defining sensations.",
    5: "Dominant — it defines the style you're after.",
  },
};

function SelectionComment({
  intensity,
  accent,
  label,
  lang,
}: {
  intensity: number;
  accent: string;
  label: string;
  lang: CompassLang;
}) {
  const v = Math.max(0, Math.min(5, Math.round(intensity)));
  const comment = INTENSITY_COMMENTS[lang][v];
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
  lang,
}: {
  focused: FocusRecord;
  profile: CompassProfile;
  isTour: boolean;
  onAskGuide?: () => void;
  lang: CompassLang;
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
      ? pickL(lang, "Smak bazowy", "Base taste")
      : focused.kind === "sektor"
        ? pickL(lang, "Wrażenie", "Sensation")
        : pickL(lang, "Tendencja", "Tendency");
  const title =
    focused.kind === "base"
      ? focused.name
      : pickL(lang, focused.sector.name_pl, focused.sector.name_en);
  const subtitle =
    focused.kind === "tendencja"
      ? ` · ${pickL(lang, focused.tendencja.name_pl, focused.tendencja.name_en)}`
      : "";

  // Association artwork for this impression (client: "też ważne są obrazki").
  // Uses the CLIENT'S OWN objects — the same ones ringing the wheel — instead
  // of the dark AI still-lifes, which were unreadable in this card (client
  // 2026-07-18). tendencja → its objects; sektor → both children; base → none.
  const senseImgs =
    focused.kind === "tendencja"
      ? ringSpritesFor(focused.tendencja.id)
      : focused.kind === "sektor"
        ? ringSpritesFor(focused.sector.id)
        : [];

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
          {isTour ? pickL(lang, "Przewodnik mówi…", "The guide says…") : eyebrow}
        </p>
        <span className="ml-auto font-mono text-[10px] tracking-wider text-[#c79f69]/70">
          {intensity}/5
        </span>
      </div>

      {/* Still-life image of the impression - the "obrazki" from the
          canonical Vinokompas (citrus for Świeże, leather/oak for
          Szorstkie, etc.), generated to match the wine-bar aesthetic. */}
      {senseImgs.length > 0 ? (
        // Cream ground + object-contain: the artwork is a transparent cut-out,
        // so it needs a LIGHT backdrop and must not be cropped (the old
        // object-cover + dark overlay is exactly what made these unreadable).
        // Laid out as a ROW of individual objects (client 2026-07-18: "в
        // полоску, а не кучку посредине") — the whole image is internally
        // two-rowed and shrank to a blob with cream margins either side.
        // The 5th object hides under sm: in the 306px mobile sheet five
        // columns leave 51px each; four read at ~66px.
        <div
          className="mt-3 flex h-24 w-full items-center justify-between gap-1.5 overflow-hidden rounded-xl border bg-[#f6efe2] px-3"
          style={{ borderColor: `${accent}44` }}
        >
          {senseImgs.map((src, i) => (
            <div
              key={src}
              className={`relative h-full min-w-0 flex-1 ${i >= 4 ? "hidden sm:block" : ""}`}
            >
              <Image
                src={src}
                alt={title}
                fill
                sizes="(min-width: 1024px) 110px, 25vw"
                className="object-contain p-1.5"
              />
            </div>
          ))}
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
      <SelectionComment intensity={intensity} accent={accent} label={title} lang={lang} />

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
            {pickL(
              lang,
              "Trzy smaki bazowe - cierpkość, słodycz, kwasowość - to podstawa rozumienia każdego wina. Im wyżej je zaznaczysz, tym wyraźniej dominują w twoim ulubionym profilu.",
              "The three base tastes — astringency, sweetness, acidity — are the foundation for understanding any wine. The higher you set them, the more clearly they dominate your favourite profile.",
            )}
          </p>
        </>
      ) : focused.kind === "sektor" ? (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[#e6e1d6]">
            <TourText
              key={`${isTour}:${pickL(lang, focused.sector.short_pl, focused.sector.short_en)}`}
              text={pickL(lang, focused.sector.short_pl, focused.sector.short_en)}
              typing={isTour}
            />
          </p>
          <dl className="mt-4 space-y-2 text-[12px] leading-relaxed">
            {focused.sector.tendencje.map((t) => (
              <div
                key={t.id}
                className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 border-b border-[rgba(199,159,105,0.15)] pb-2 last:border-0"
              >
                <dt className="font-serif text-[12px] italic text-[var(--color-accent-gold)]">
                  {pickL(lang, t.name_pl, t.name_en)}
                </dt>
                <dd className="text-[#cbc1b1]">{pickL(lang, t.associations_pl, t.associations_en)}</dd>
              </div>
            ))}
          </dl>
          <details className="mt-4 group">
            <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:text-[#f4efe9]">
              ❦ {pickL(lang, "Pełny opis wrażenia", "Full sensation description")}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[#cbc1b1]">
              {pickL(lang, focused.sector.long_pl, focused.sector.long_en)}
            </p>
          </details>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm leading-relaxed text-[#e6e1d6]">
            <TourText
              key={`${isTour}:${pickL(lang, focused.sector.short_pl, focused.sector.short_en)}`}
              text={pickL(lang, focused.sector.short_pl, focused.sector.short_en)}
              typing={isTour}
            />
          </p>
          <dl className="mt-4 divide-y divide-[rgba(199,159,105,0.16)] text-[13px] leading-relaxed">
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[10px] font-semibold tracking-wider text-[#c79f69]/65 uppercase">{pickL(lang, "Skojarzenia", "Associations")}</dt>
              <dd className="text-[#e6e1d6]/90">{pickL(lang, focused.tendencja.associations_pl, focused.tendencja.associations_en)}</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[10px] font-semibold tracking-wider text-[#c79f69]/65 uppercase">{pickL(lang, "Przykład", "Example")}</dt>
              <dd className="font-serif italic text-[#e6e1d6]/85">{pickL(lang, focused.tendencja.examples_pl, focused.tendencja.examples_en)}</dd>
            </div>
            <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 py-2.5 first:pt-0 last:pb-0">
              <dt className="text-[10px] font-semibold tracking-wider text-[#c79f69]/65 uppercase">{pickL(lang, "Spotkasz w", "Found in")}</dt>
              <dd className="text-[#cbc1b1]">{pickL(lang, focused.tendencja.found_in_pl, focused.tendencja.found_in_en)}</dd>
            </div>
          </dl>
          <details className="mt-4 group">
            <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:text-[#f4efe9]">
              ❦ {pickL(lang, "Pełny opis wrażenia", "Full sensation description")}
            </summary>
            <p className="mt-2 text-sm leading-relaxed text-[#cbc1b1]">
              {pickL(lang, focused.sector.long_pl, focused.sector.long_en)}
            </p>
          </details>
        </>
      )}

      {/* Hidden when the chat is disabled - the wn:open-chat listener is
          unmounted then and the button was a silent no-op (audit HIGH). */}
      {onAskGuide ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onAskGuide}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 px-4 py-2 text-xs font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:bg-[var(--color-accent-gold)]/20"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2V5a3 3 0 0 1 3-3Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
            </svg>
            {pickL(lang, "Zapytaj Vinovigatora", "Ask Vinovigator")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function IdleCard({
  level,
  onStartTour,
  lang,
}: {
  level: CompassLevel;
  onStartTour: () => void;
  lang: CompassLang;
}) {
  // Client round-3 copy, per level: stage 1 = help framing + the "Smak"
  // concept text; stage 2 = "Poznaj sześć wrażeń" concept text; stage 3
  // keeps the generic help framing.
  const isLevel2 = level === 2;
  return (
    <div>
      <p className="pitch-eyebrow pitch-eyebrow--start">Vinocompas</p>
      <h3 className="pitch-display mt-3 text-2xl text-white">
        {isLevel2
          ? pickL(lang, "Poznaj sześć wrażeń", "Meet the six sensations")
          : pickL(lang, "Potrzebujesz pomocy?", "Need a hand?")}
      </h3>
      {isLevel2 ? (
        <>
          <p className="mt-3 text-sm leading-relaxed text-[#e6e1d6]">
            {pickL(
              lang,
              "Wrażenie to sposób, w jaki nasz mózg interpretuje smak, zapach, strukturę i skojarzenia powstające podczas kontaktu z winem.",
              "A sensation is the way our brain interprets the taste, smell, texture and associations that arise when we meet a wine.",
            )}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#e6e1d6]">
            {pickL(
              lang,
              "Najedź kursorem na wybrane wrażenie, aby zobaczyć jego opis. Możesz również uruchomić przewodnik, który krok po kroku wyjaśni znaczenie wszystkich sześciu wrażeń.",
              "Hover over a sensation to see its description. You can also start the guide, which will explain the meaning of all six sensations step by step.",
            )}
          </p>
        </>
      ) : (
        <>
          <p className="mt-3 text-sm leading-relaxed text-[#e6e1d6]">
            {pickL(
              lang,
              "Najedź kursorem na element Vinocompasu, aby poznać jego znaczenie.",
              "Hover over any element of the Vinocompas to learn what it means.",
            )}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#e6e1d6]">
            {pickL(
              lang,
              "Lub uruchom przewodnik, który przeprowadzi Cię przez ten etap krok po kroku.",
              "Or start the guide, which will walk you through this stage step by step.",
            )}
          </p>
        </>
      )}
      <button
        type="button"
        onClick={onStartTour}
        className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-accent-gold)]/45 bg-[var(--color-accent-gold)]/10 px-5 py-2.5 text-xs font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:bg-[var(--color-accent-gold)]/20"
      >
        <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor">
          <path d="M3 2 L10 6 L3 10 Z" />
        </svg>
        {pickL(lang, "Uruchom przewodnik", "Start the guide")}
      </button>
      {level === 1 ? (
        <div className="mt-6 border-t border-[rgba(199,159,105,0.22)] pt-4">
          <p className="text-sm leading-relaxed text-[#e6e1d6]">
            {pickL(
              lang,
              "Smak to punkt wyjścia w Vinocompasie. Większość z nas opisuje wino jako wytrawne, półwytrawne czy słodkie. To dobry początek, ale trzy podstawowe smaki nie wystarczą, aby opisać charakter wina ani odkryć Twój winiarski gust.",
              "Taste is the starting point of the Vinocompas. Most of us describe wine as dry, off-dry or sweet. That's a good start, but three base tastes are not enough to describe a wine's character or to uncover your taste in wine.",
            )}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#e6e1d6]">
            {pickL(
              lang,
              "Dlatego w Vinocompasie zaczynamy od trzech podstawowych smaków: słodyczy, kwasowości i cierpkości. Ich wzajemne proporcje wpływają na to, jak odbieramy wytrawność wina.",
              "That's why the Vinocompas starts with the three base tastes: sweetness, acidity and astringency. Their mutual proportions shape how dry a wine seems to us.",
            )}
          </p>
        </div>
      ) : null}

    </div>
  );
}

// (SelectedProfileBar removed 2026-07 per client review — the chip row
// duplicated the wheel state below the fold; reset now lives in the stage
// controls strip.)
