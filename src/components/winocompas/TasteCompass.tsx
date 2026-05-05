"use client";

/**
 * TasteCompass — interactive SVG wine compass à la vinocompas.pl.
 *
 * 6 sektorów (wrażeń) × 2 tendencje per sector × 5 stopni intensywności (0-4).
 * 12 outer "spokes" total. Each spoke is a clickable annular slice that fills
 * outward from the center as the user taps to set intensity.
 *
 * Mobile-first: 320px square minimum, 44pt touch targets, no drag (tap-to-set
 * is more reliable on touch). Desktop additionally supports hover preview and
 * keyboard navigation (Tab through spokes, ↑/↓ to change intensity).
 *
 * State is fully controlled — parent owns the profile. Local mode also works
 * via uncontrolled `defaultProfile`.
 */

import { useId, useMemo, useState, useEffect, useRef, useCallback } from "react";
import { COMPASS_SECTORS, type CompassSector, type Tendencja } from "@/data/wine-compass-kb";

export type Intensity = 0 | 1 | 2 | 3 | 4;
export type CompassProfile = Record<string, Intensity>; // tendencja id -> 0-4

const MAX_INTENSITY = 4;
const RING_COUNT = MAX_INTENSITY + 1; // 0..4 = 5 rings

interface SpokeMeta {
  sector: CompassSector;
  tendencja: Tendencja;
  /** Angle of spoke center in radians (0 = up, clockwise). */
  angle: number;
  /** Half-width angle of spoke. */
  half: number;
  index: number;
}

/** Arrange 12 spokes around the circle starting at 12 o'clock, clockwise.
 *  Each sector has 2 tendencje placed adjacent to each other. */
const buildSpokes = (): SpokeMeta[] => {
  const out: SpokeMeta[] = [];
  const total = COMPASS_SECTORS.length * 2; // 12
  const arc = (Math.PI * 2) / total;
  let i = 0;
  for (const sector of COMPASS_SECTORS) {
    for (const t of sector.tendencje) {
      const angle = -Math.PI / 2 + arc * i + arc / 2; // -π/2 = up
      out.push({
        sector,
        tendencja: t,
        angle,
        half: arc / 2,
        index: i,
      });
      i += 1;
    }
  }
  return out;
};

const SPOKES = buildSpokes();

/** Build a path for an annular sector (donut slice).
 *  All angles in radians, angle 0 = up (12 o'clock), clockwise.   */
function annularPath(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  startAngle: number,
  endAngle: number,
): string {
  const x1Outer = cx + rOuter * Math.sin(startAngle);
  const y1Outer = cy - rOuter * Math.cos(startAngle);
  const x2Outer = cx + rOuter * Math.sin(endAngle);
  const y2Outer = cy - rOuter * Math.cos(endAngle);
  const x2Inner = cx + rInner * Math.sin(endAngle);
  const y2Inner = cy - rInner * Math.cos(endAngle);
  const x1Inner = cx + rInner * Math.sin(startAngle);
  const y1Inner = cy - rInner * Math.cos(startAngle);

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${x1Outer} ${y1Outer}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
    `L ${x2Inner} ${y2Inner}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}`,
    "Z",
  ].join(" ");
}

interface Props {
  profile?: CompassProfile;
  defaultProfile?: CompassProfile;
  onChange?: (next: CompassProfile) => void;
  /** Show outer tendencje labels. Off on very small screens. */
  showLabels?: boolean;
  /** Diameter override; defaults to 100% of container. */
  size?: number;
}

export default function TasteCompass({
  profile: profileProp,
  defaultProfile,
  onChange,
  showLabels = true,
  size,
}: Props) {
  const isControlled = profileProp !== undefined;
  const [internal, setInternal] = useState<CompassProfile>(() => defaultProfile ?? {});
  const profile = isControlled ? profileProp! : internal;
  const baseId = useId();

  const setProfile = useCallback(
    (next: CompassProfile) => {
      if (!isControlled) setInternal(next);
      onChange?.(next);
    },
    [isControlled, onChange],
  );

  const setIntensity = useCallback(
    (id: string, value: Intensity) => {
      const next = { ...profile, [id]: value };
      setProfile(next);
    },
    [profile, setProfile],
  );

  const cycleIntensity = useCallback(
    (id: string) => {
      const cur = (profile[id] ?? 0) as Intensity;
      const next = (cur + 1) % RING_COUNT;
      setIntensity(id, next as Intensity);
    },
    [profile, setIntensity],
  );

  // Geometry
  const VIEW = 400;
  const cx = VIEW / 2;
  const cy = VIEW / 2;
  const rOuter = 165;
  const rInner = 36;
  const ringStep = (rOuter - rInner) / RING_COUNT;

  const [hovered, setHovered] = useState<string | null>(null);
  const focusedRef = useRef<string | null>(null);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<SVGElement>, spoke: SpokeMeta) => {
      const id = spoke.tendencja.id;
      const cur = (profile[id] ?? 0) as Intensity;
      if (e.key === "ArrowUp" || e.key === "ArrowRight") {
        e.preventDefault();
        setIntensity(id, Math.min(MAX_INTENSITY, cur + 1) as Intensity);
      } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
        e.preventDefault();
        setIntensity(id, Math.max(0, cur - 1) as Intensity);
      } else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        cycleIntensity(id);
      } else if (e.key === "0") {
        setIntensity(id, 0);
      } else if (["1", "2", "3", "4"].includes(e.key)) {
        setIntensity(id, Number(e.key) as Intensity);
      }
    },
    [profile, setIntensity, cycleIntensity],
  );

  // Reset on Esc
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && focusedRef.current) {
        focusedRef.current = null;
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, []);

  const spokes = useMemo(
    () =>
      SPOKES.map((s) => {
        const intensity = (profile[s.tendencja.id] ?? 0) as Intensity;
        const start = s.angle - s.half;
        const end = s.angle + s.half;
        return { ...s, intensity, start, end };
      }),
    [profile],
  );

  const labelRadius = rOuter + 22;

  return (
    <div className="taste-compass-wrap" style={size ? { width: size, height: size + 40 } : undefined}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="taste-compass-svg"
        role="application"
        aria-label="Tarcza Vinokompasu — zaznacz intensywność każdej tendencji"
      >
        <defs>
          <radialGradient id={`${baseId}-bg`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a0e10" />
            <stop offset="100%" stopColor="#0c0506" />
          </radialGradient>
          {COMPASS_SECTORS.map((s) => (
            <radialGradient key={s.id} id={`${baseId}-grad-${s.id}`} cx="50%" cy="50%" r="60%">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.15" />
              <stop offset="100%" stopColor={s.color} stopOpacity="1" />
            </radialGradient>
          ))}
        </defs>

        {/* Background plate */}
        <circle cx={cx} cy={cy} r={rOuter + 4} fill={`url(#${baseId}-bg)`} />

        {/* Sector wedges (background tint, full slice for both tendencje of a sector) */}
        {COMPASS_SECTORS.map((sector, sIdx) => {
          const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
          const angleCenter = -Math.PI / 2 + arc * sIdx + arc / 2;
          const start = angleCenter - arc / 2;
          const end = angleCenter + arc / 2;
          return (
            <path
              key={`bg-${sector.id}`}
              d={annularPath(cx, cy, rInner - 1, rOuter + 1, start, end)}
              fill={sector.color}
              fillOpacity={0.06}
              stroke="rgba(255,255,255,0.04)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Concentric ring lines */}
        {Array.from({ length: RING_COUNT + 1 }).map((_, i) => (
          <circle
            key={`ring-${i}`}
            cx={cx}
            cy={cy}
            r={rInner + ringStep * i}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth={0.6}
          />
        ))}

        {/* Spokes — radial dividers between tendencje */}
        {SPOKES.map((s) => {
          const x = cx + rOuter * Math.sin(s.angle - s.half);
          const y = cy - rOuter * Math.cos(s.angle - s.half);
          return (
            <line
              key={`spoke-${s.tendencja.id}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Filled intensity per tendencja */}
        {spokes.map((s) => {
          const slices: React.ReactNode[] = [];
          for (let i = 0; i < s.intensity; i++) {
            const r1 = rInner + ringStep * i;
            const r2 = rInner + ringStep * (i + 1);
            slices.push(
              <path
                key={`fill-${s.tendencja.id}-${i}`}
                d={annularPath(cx, cy, r1, r2, s.start + 0.005, s.end - 0.005)}
                fill={s.sector.color}
                fillOpacity={0.45 + (i / RING_COUNT) * 0.55}
                pointerEvents="none"
              />,
            );
          }
          return <g key={`fillg-${s.tendencja.id}`}>{slices}</g>;
        })}

        {/* Hover preview ring */}
        {hovered &&
          (() => {
            const s = spokes.find((sp) => sp.tendencja.id === hovered);
            if (!s) return null;
            const r1 = rInner + ringStep * s.intensity;
            const r2 = rInner + ringStep * (s.intensity + 1);
            if (s.intensity >= MAX_INTENSITY) return null;
            return (
              <path
                d={annularPath(cx, cy, r1, r2, s.start + 0.005, s.end - 0.005)}
                fill={s.sector.color}
                fillOpacity={0.18}
                pointerEvents="none"
              />
            );
          })()}

        {/* Touch / click target — full spoke wedge */}
        {spokes.map((s) => {
          const fit = s.intensity;
          return (
            <path
              key={`touch-${s.tendencja.id}`}
              d={annularPath(cx, cy, rInner, rOuter, s.start, s.end)}
              fill="transparent"
              stroke="transparent"
              tabIndex={0}
              role="slider"
              aria-label={`${s.sector.name_pl} — ${s.tendencja.name_pl}`}
              aria-valuemin={0}
              aria-valuemax={MAX_INTENSITY}
              aria-valuenow={fit}
              aria-valuetext={`${fit} z ${MAX_INTENSITY}`}
              onClick={() => cycleIntensity(s.tendencja.id)}
              onMouseEnter={() => setHovered(s.tendencja.id)}
              onMouseLeave={() => setHovered((h) => (h === s.tendencja.id ? null : h))}
              onKeyDown={(e) => handleKey(e, s)}
              style={{ cursor: "pointer", outline: "none" }}
              className="taste-compass-touch"
            />
          );
        })}

        {/* Center hub + 6-pointed compass star */}
        <circle cx={cx} cy={cy} r={rInner} fill="#0e0608" stroke="rgba(197,160,89,0.45)" strokeWidth={0.7} />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontFamily="var(--font-serif)"
          fontStyle="italic"
          fontSize={12}
          fill="rgba(197,160,89,0.85)"
          pointerEvents="none"
        >
          Vinokompas
        </text>

        {/* Outer labels */}
        {showLabels &&
          spokes.map((s) => {
            const x = cx + labelRadius * Math.sin(s.angle);
            const y = cy - labelRadius * Math.cos(s.angle);
            // Rotate text along the radius for outer arc readability
            const deg = (s.angle * 180) / Math.PI;
            const flip = deg > 90 || deg < -90;
            return (
              <text
                key={`lbl-${s.tendencja.id}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-display)"
                fontSize={9}
                fontWeight={600}
                fill="rgba(244,237,224,0.78)"
                transform={`rotate(${flip ? deg + 180 : deg} ${x} ${y})`}
                pointerEvents="none"
                className="select-none"
              >
                {s.tendencja.name_pl}
              </text>
            );
          })}

        {/* Sector noun labels — one per sector, larger, between the 2 tendencje */}
        {COMPASS_SECTORS.map((sector, sIdx) => {
          const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
          const angleCenter = -Math.PI / 2 + arc * sIdx + arc / 2;
          const r = (rOuter + rInner) / 2 - 4;
          const x = cx + r * Math.sin(angleCenter);
          const y = cy - r * Math.cos(angleCenter);
          return (
            <text
              key={`sector-lbl-${sector.id}`}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="var(--font-serif)"
              fontStyle="italic"
              fontSize={11}
              fontWeight={500}
              fill="rgba(255,255,255,0.55)"
              pointerEvents="none"
              className="select-none"
            >
              {sector.name_pl}
            </text>
          );
        })}
      </svg>

      {/* Live legend — shows what's currently selected */}
      <CompassLegend profile={profile} onClear={() => setProfile({})} />
    </div>
  );
}

/** Compact legend of all selected tendencje + a Reset button. */
function CompassLegend({
  profile,
  onClear,
}: {
  profile: CompassProfile;
  onClear: () => void;
}) {
  const selected = SPOKES.flatMap((s) => {
    const v = profile[s.tendencja.id] ?? 0;
    return v > 0 ? [{ s, v }] : [];
  }).sort((a, b) => b.v - a.v);

  if (selected.length === 0) {
    return (
      <p className="mt-3 text-center font-serif text-xs italic text-[var(--color-accent-gold)] opacity-80">
        Dotknij sektor i wskaż intensywność (od 0 do 4) — kompas zapamięta twój profil.
      </p>
    );
  }

  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
      {selected.map(({ s, v }) => (
        <span
          key={s.tendencja.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] text-gray-200"
          style={{ borderColor: `${s.sector.color}66` }}
        >
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: s.sector.color }}
            aria-hidden
          />
          <span>{s.tendencja.name_pl}</span>
          <span className="font-mono text-[10px] text-gray-400">·{v}</span>
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-1 rounded-full border border-rose-500/30 bg-rose-900/20 px-2.5 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-900/40"
      >
        Wyzeruj
      </button>
    </div>
  );
}
