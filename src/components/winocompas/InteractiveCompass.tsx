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
import { BASE_TASTES, COMPASS_SECTORS } from "@/data/wine-compass-kb";
import type { CompassProfile } from "./TasteCompass";

const TasteCompass = dynamic(() => import("./TasteCompass"), { ssr: false });

interface Props {
  profile: CompassProfile;
  onProfileChange: (next: CompassProfile) => void;
  /** Tour rotation interval in ms; defaults to 2800 (≈3s/spoke). */
  tourMs?: number;
}

// All 12 spoke ids in the order TasteCompass arranges them (clockwise from
// 12 o'clock). Used by the auto-tour to step through.
const ALL_TENDENCJE_IDS = COMPASS_SECTORS.flatMap((s) =>
  s.tendencje.map((t) => t.id),
);

const findSpoke = (tendencjaId: string | null) => {
  if (!tendencjaId) return null;
  for (const s of COMPASS_SECTORS) {
    for (const t of s.tendencje) {
      if (t.id === tendencjaId) return { sector: s, tendencja: t };
    }
  }
  return null;
};

export default function InteractiveCompass({
  profile,
  onProfileChange,
  tourMs = 2800,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null);
  // Pinned id stays selected after the user clicks (or hovers chip in the
  // selected-profile bar). Persists until they pick a different one. This
  // fixes the UX bug where info evaporated as soon as the cursor left.
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [tourOn, setTourOn] = useState(false);
  const [tourIdx, setTourIdx] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
      setTourIdx((i) => (i + 1) % ALL_TENDENCJE_IDS.length);
    }, tourMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tourOn, tourMs]);

  const tourId = tourOn ? ALL_TENDENCJE_IDS[tourIdx] : null;
  // Priority: tour > pinned (last clicked) > current hover. Tour wraps the
  // others while playing; outside of tour, the pinned selection is the
  // baseline and hover provides the live preview.
  const focusedId = tourId ?? hovered ?? pinnedId;
  const focused = useMemo(() => findSpoke(focusedId), [focusedId]);

  // Pin the spoke whenever the user changes its profile value (i.e. clicks
  // it). Listening on profile diff keeps this decoupled from TasteCompass
  // internals — we don't need a separate click callback.
  const prevProfileRef = useRef(profile);
  useEffect(() => {
    const prev = prevProfileRef.current;
    prevProfileRef.current = profile;
    for (const id of ALL_TENDENCJE_IDS) {
      if ((profile[id] ?? 0) !== (prev[id] ?? 0)) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPinnedId(id);
        break;
      }
    }
  }, [profile]);

  const stepTour = useCallback((dir: 1 | -1) => {
    setTourIdx((i) => {
      const n = ALL_TENDENCJE_IDS.length;
      return (i + dir + n) % n;
    });
  }, []);

  const onAskGuide = useCallback(() => {
    if (typeof window === "undefined") return;
    const detail = focused
      ? {
          sektor: focused.sector.name_pl,
          tendencja: focused.tendencja.name_pl,
        }
      : null;
    window.dispatchEvent(new CustomEvent("wn:open-chat", { detail }));
  }, [focused]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-7">
      {/* ── Compass ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center">
        <div className="w-full max-w-[440px]">
          <TasteCompass
            profile={profile}
            onChange={onProfileChange}
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
                onClick={() => setTourOn(false)}
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
                {tourIdx + 1} / {ALL_TENDENCJE_IDS.length}
              </span>
            </>
          )}
        </div>

        <p className="mt-3 text-center text-[11px] tracking-wider text-[#c5a059]/55 uppercase">
          {tourOn
            ? "Przewodnik prowadzi przez 12 tendencji"
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
      </div>

      {/* ── Side info panel ─────────────────────────────────────────── */}
      <aside
        className="rounded-2xl border border-[rgba(197,160,89,0.22)] p-5 transition"
        style={{
          background: focused
            ? `linear-gradient(180deg, ${focused.sector.color}1f, transparent 70%), #150a0c`
            : "#150a0c",
          borderColor: focused
            ? `${focused.sector.color}44`
            : "rgba(197,160,89,0.22)",
        }}
        aria-live="polite"
      >
        {focused ? (
          <FocusedCard
            sectorName={focused.sector.name_pl}
            sectorColor={focused.sector.color}
            sectorShort={focused.sector.short_pl}
            sectorLong={focused.sector.long_pl}
            tendencjaName={focused.tendencja.name_pl}
            tendencjaAssociations={focused.tendencja.associations_pl}
            tendencjaExamples={focused.tendencja.examples_pl}
            foundIn={focused.tendencja.found_in_pl}
            intensityValue={(profile[focused.tendencja.id] ?? 0) as number}
            isTour={tourOn}
            onAskGuide={onAskGuide}
          />
        ) : (
          <IdleCard onStartTour={() => { setTourOn(true); setTourIdx(0); }} />
        )}
      </aside>
    </div>
  );
}

function FocusedCard({
  sectorName,
  sectorColor,
  sectorShort,
  sectorLong,
  tendencjaName,
  tendencjaAssociations,
  tendencjaExamples,
  foundIn,
  intensityValue,
  isTour,
  onAskGuide,
}: {
  sectorName: string;
  sectorColor: string;
  sectorShort: string;
  sectorLong: string;
  tendencjaName: string;
  tendencjaAssociations: string;
  tendencjaExamples: string;
  foundIn: string;
  intensityValue: number;
  isTour: boolean;
  onAskGuide: () => void;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-3">
        <span
          className="inline-block h-3 w-3 rounded-full"
          style={{
            background: sectorColor,
            boxShadow: `0 0 0 2px #150a0c, 0 0 0 4px ${sectorColor}55`,
          }}
          aria-hidden
        />
        <p className="text-[11px] font-bold tracking-[0.22em] uppercase" style={{ color: sectorColor }}>
          {isTour ? "Przewodnik mówi…" : "Aktualnie"}
        </p>
        <span className="ml-auto font-mono text-[10px] tracking-wider text-[#c5a059]/70">
          {intensityValue}/4
        </span>
      </div>

      <h3 className="pitch-display mt-2 text-2xl text-white">
        {sectorName}
        <em className="font-serif text-base italic text-[#e6dccd]/85"> · {tendencjaName}</em>
      </h3>

      <p className="mt-2 text-sm leading-relaxed text-[#e6dccd]">{sectorShort}</p>

      <dl className="mt-4 space-y-2.5 text-[13px] leading-relaxed">
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3">
          <dt className="text-[10px] font-semibold tracking-wider text-[#c5a059]/65 uppercase">Skojarzenia</dt>
          <dd className="text-[#e6dccd]/90">{tendencjaAssociations}</dd>
        </div>
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3">
          <dt className="text-[10px] font-semibold tracking-wider text-[#c5a059]/65 uppercase">Przykład</dt>
          <dd className="font-serif italic text-[#e6dccd]/85">{tendencjaExamples}</dd>
        </div>
        <div className="grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3">
          <dt className="text-[10px] font-semibold tracking-wider text-[#c5a059]/65 uppercase">Spotkasz w</dt>
          <dd className="text-[#cbc1b1]">{foundIn}</dd>
        </div>
      </dl>

      <details className="mt-4 group">
        <summary className="cursor-pointer text-[11px] font-semibold tracking-wider text-[var(--color-accent-gold)] uppercase transition hover:text-[#f4ede0]">
          ❦ Pełny opis sektora
        </summary>
        <p className="mt-2 text-sm leading-relaxed text-[#cbc1b1]">{sectorLong}</p>
      </details>

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

function IdleCard({ onStartTour }: { onStartTour: () => void }) {
  return (
    <div>
      <p className="pitch-eyebrow pitch-eyebrow--start">Vinokompas</p>
      <h3 className="pitch-display mt-3 text-2xl text-white">
        Najedź na sektor lub<br />uruchom przewodnika
      </h3>
      <p className="mt-3 text-sm leading-relaxed text-[#e6dccd]">
        Tarcza Vinokompasu pokaże opis każdego wrażenia. Możesz też pozwolić, by
        przewodnik przeszedł przez wszystkie 12 tendencji automatycznie — wystarczy nacisnąć przycisk poniżej.
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
