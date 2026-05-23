"use client";

/**
 * TasteCompass — interactive SVG wine compass à la vinocompas.pl.
 *
 * 6 sektorów (wrażeń) × 2 tendencje per sector × 6 stopni intensywności (0-5).
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

export type Intensity = 0 | 1 | 2 | 3 | 4 | 5;
export type CompassProfile = Record<string, Intensity>; // tendencja id -> 0-5
/**
 * Compass progressive-disclosure level.
 *  1 — only 3 base smaki axes (cierpkość / słodycz / kwasowość)
 *  2 — adds 6 sektor wedges (świeżość · oleistość · miękkość · tęgość ·
 *      szorstkość · ziemistość) clickable as a whole
 *  3 — full 12-tendencja interactive compass (default; backwards-compat)
 *
 * Each level adds a layer of click targets and labels. The underlying
 * profile model stays the same — sektor clicks fan their value to both
 * tendencje under that sektor; base clicks set base.<id>.
 */
export type CompassLevel = 1 | 2 | 3;

const MAX_INTENSITY = 5;
// 5 fillable divisions (concentric rings). intensity 0 = empty centre,
// 1..5 fills one ring each up to the outer edge.
const RING_COUNT = MAX_INTENSITY;
// Click cycle visits 6 states: 0 (empty) then 1..5.
const STATE_COUNT = MAX_INTENSITY + 1;

// 3 base smaki at 120° intervals. The compass uses a north-zero,
// clockwise convention (x = cx + r·sin θ, y = cy − r·cos θ), so θ=0 is
// the top. Matches the canonical Vinokompas layout:
//   CIERPKOŚĆ top · SŁODYCZ lower-right (4 o'clock) · KWASOWOŚĆ lower-left.
// (Previously these used -π/2 offsets from a math-convention which put
//  CIERPKOŚĆ on the left and clipped its label — fixed.)
const BASE_AXES = [
  { id: "cierpkosc", label: "CIERPKOŚĆ", angle: 0 },                    // top
  { id: "slodycz",   label: "SŁODYCZ",   angle: (2 * Math.PI) / 3 },   // lower-right (4 o'clock)
  { id: "kwasowosc", label: "KWASOWOŚĆ", angle: (4 * Math.PI) / 3 },   // lower-left (8 o'clock)
] as const;

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
  /** Bubble hover changes to the parent (for side info-panels / tours).
   *  Bubbled IDs may be tendencja id, sektor id, or `base.<smak>` id
   *  depending on the active level. */
  onHoverChange?: (focusId: string | null) => void;
  /** Force a focus highlight from the parent — overrides internal hover.
   *  Used by <InteractiveCompass> for the guided auto-tour. Accepts a
   *  tendencja id, sektor id, or `base.<smak>` id. */
  externalHighlightId?: string | null;
  /** Hide the bottom legend (tag chips) — useful when wrapper provides its
   *  own info side-panel. */
  hideLegend?: boolean;
  /** Progressive-disclosure level (1=base only, 2=+sektor, 3=+tendencje).
   *  Defaults to 3 to keep all existing call-sites unchanged. */
  level?: CompassLevel;
}

// Sektor avg helper — fans the same value to both tendencje under a sektor.
const sektorAvg = (profile: CompassProfile, sektorId: string): number => {
  const s = COMPASS_SECTORS.find((x) => x.id === sektorId);
  if (!s) return 0;
  const a = (profile[s.tendencje[0].id] ?? 0) as number;
  const b = (profile[s.tendencje[1].id] ?? 0) as number;
  return Math.round((a + b) / 2);
};

export default function TasteCompass({
  profile: profileProp,
  defaultProfile,
  onChange,
  showLabels = true,
  size,
  onHoverChange,
  externalHighlightId,
  hideLegend = false,
  level = 3,
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
      const next = (cur + 1) % STATE_COUNT;
      setIntensity(id, next as Intensity);
    },
    [profile, setIntensity],
  );

  // Level-2 click: cycle the average for the sektor and fan it to BOTH
  // tendencje under it (so downstream consumers see a coherent profile
  // even when the user never opens level 3).
  const cycleSektor = useCallback(
    (sektorId: string) => {
      const s = COMPASS_SECTORS.find((x) => x.id === sektorId);
      if (!s) return;
      const cur = sektorAvg(profile, sektorId);
      const next = ((cur + 1) % STATE_COUNT) as Intensity;
      setProfile({
        ...profile,
        [s.tendencje[0].id]: next,
        [s.tendencje[1].id]: next,
      });
    },
    [profile, setProfile],
  );

  // Level-1 click: cycle a base smak. Same 0..5 ring scale, stored under
  // `base.<id>` so it doesn't collide with tendencja keys.
  const cycleBase = useCallback(
    (baseId: string) => {
      const key = `base.${baseId}`;
      const cur = (profile[key] ?? 0) as Intensity;
      const next = ((cur + 1) % STATE_COUNT) as Intensity;
      setIntensity(key, next);
    },
    [profile, setIntensity],
  );

  // Geometry — viewBox 440 gives 20px breathing room on each side so the
  // outermost labels (text-anchor=start at the east point) never clip out
  // of the parent container at 390px viewport. Compass disc itself stays
  // visually unchanged — only the SVG canvas is wider.
  const VIEW = 440;
  const cx = VIEW / 2;
  const cy = VIEW / 2;
  const rOuter = 165;
  const rInner = 36;
  const ringStep = (rOuter - rInner) / RING_COUNT;

  const [hovered, setHovered] = useState<string | null>(null);
  const focusedRef = useRef<string | null>(null);

  // Effective highlight: prefer the parent-controlled externalHighlightId
  // (used for guided tour) over the internal mouse-driven hover.
  const effectiveHover = externalHighlightId ?? hovered;

  // Bubble internal hover changes upward so a side-panel can react.
  const reportHover = useCallback(
    (id: string | null) => {
      setHovered(id);
      onHoverChange?.(id);
    },
    [onHoverChange],
  );

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

  return (
    <div className="taste-compass-wrap" style={size ? { width: size, height: size + 40 } : undefined}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="taste-compass-svg"
        role="application"
        aria-label="Tarcza Vinokompasu — zaznacz intensywność każdej tendencji"
      >
        <defs>
          {/* BG gradient reads from semantic tokens — flips dark↔white per
              theme without re-rendering. */}
          <radialGradient id={`${baseId}-bg`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--surface-elevated)" />
            <stop offset="100%" stopColor="var(--surface-deep)" />
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
              stroke="var(--hairline)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Concentric ring lines — theme-aware via hairline var */}
        {Array.from({ length: RING_COUNT + 1 }).map((_, i) => (
          <circle
            key={`ring-${i}`}
            cx={cx}
            cy={cy}
            r={rInner + ringStep * i}
            fill="none"
            stroke="var(--hairline)"
            strokeWidth={0.6}
          />
        ))}

        {/* Spokes — radial dividers between tendencje. Faded out at level 1
            (when only base axes matter) so the disc reads simpler. */}
        {SPOKES.map((s) => {
          const x = cx + rOuter * Math.sin(s.angle - s.half);
          const y = cy - rOuter * Math.cos(s.angle - s.half);
          return (
            <line
              key={`spoke-${s.tendencja.id}`}
              opacity={level >= 2 ? 1 : 0.18}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="var(--hairline-strong)"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Filled intensity — at level 3 we draw per-tendencja (12 wedges);
            at level 2 we paint the average across BOTH tendencje of each
            sektor as a single wide wedge so the L2 view stays clean. */}
        {level >= 3
          ? spokes.map((s) => {
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
            })
          : level === 2
            ? COMPASS_SECTORS.map((sector, sIdx) => {
                const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
                const angleCenter = -Math.PI / 2 + arc * sIdx + arc / 2;
                const start = angleCenter - arc / 2 + 0.01;
                const end = angleCenter + arc / 2 - 0.01;
                const intensity = sektorAvg(profile, sector.id);
                if (intensity <= 0) return null;
                const slices: React.ReactNode[] = [];
                for (let i = 0; i < intensity; i++) {
                  const r1 = rInner + ringStep * i;
                  const r2 = rInner + ringStep * (i + 1);
                  slices.push(
                    <path
                      key={`l2fill-${sector.id}-${i}`}
                      d={annularPath(cx, cy, r1, r2, start, end)}
                      fill={sector.color}
                      fillOpacity={0.40 + (i / RING_COUNT) * 0.55}
                      pointerEvents="none"
                    />,
                  );
                }
                return <g key={`l2fillg-${sector.id}`}>{slices}</g>;
              })
            : null}

        {/* Hover / tour highlight — handles three target kinds:
            1) tendencja id  → highlight that spoke (current behaviour)
            2) sektor id     → highlight whole sektor wedge (level 2)
            3) base.<id>     → glow on the matching base axis (level 1) */}
        {effectiveHover &&
          (() => {
            const isTour = externalHighlightId === effectiveHover;
            // 1) tendencja
            const s = spokes.find((sp) => sp.tendencja.id === effectiveHover);
            if (s && level >= 3) {
              const r1 = rInner + ringStep * s.intensity;
              const r2 = rInner + ringStep * (s.intensity + 1);
              if (s.intensity >= MAX_INTENSITY) {
                return (
                  <path
                    d={annularPath(cx, cy, rInner, rOuter, s.start + 0.005, s.end - 0.005)}
                    fill="none"
                    stroke={s.sector.color}
                    strokeOpacity={0.85}
                    strokeWidth={1.4}
                    pointerEvents="none"
                  />
                );
              }
              return (
                <path
                  d={annularPath(cx, cy, r1, r2, s.start + 0.005, s.end - 0.005)}
                  fill={s.sector.color}
                  fillOpacity={isTour ? 0.32 : 0.18}
                  pointerEvents="none"
                >
                  {isTour ? (
                    <animate attributeName="fill-opacity" values="0.18;0.45;0.18" dur="2s" repeatCount="indefinite" />
                  ) : null}
                </path>
              );
            }
            // 2) sektor (level 2)
            const sektor = COMPASS_SECTORS.find((x) => x.id === effectiveHover);
            if (sektor) {
              const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
              const sIdx = COMPASS_SECTORS.indexOf(sektor);
              const angleCenter = -Math.PI / 2 + arc * sIdx + arc / 2;
              return (
                <path
                  d={annularPath(cx, cy, rInner, rOuter, angleCenter - arc / 2 + 0.01, angleCenter + arc / 2 - 0.01)}
                  fill={sektor.color}
                  fillOpacity={isTour ? 0.18 : 0.10}
                  stroke={sektor.color}
                  strokeOpacity={0.85}
                  strokeWidth={1.4}
                  pointerEvents="none"
                >
                  {isTour ? (
                    <animate attributeName="fill-opacity" values="0.10;0.28;0.10" dur="2s" repeatCount="indefinite" />
                  ) : null}
                </path>
              );
            }
            // 3) base.<id> (level 1) — glow disc behind the matching beam
            if (effectiveHover.startsWith("base.")) {
              const baseId = effectiveHover.slice(5);
              const axis = BASE_AXES.find((a) => a.id === baseId);
              if (!axis) return null;
              const x = cx + (rOuter + 4) * Math.sin(axis.angle);
              const y = cy - (rOuter + 4) * Math.cos(axis.angle);
              return (
                <circle cx={x} cy={y} r={20} fill="var(--color-accent-gold)" fillOpacity={isTour ? 0.30 : 0.18} pointerEvents="none">
                  {isTour ? (
                    <animate attributeName="fill-opacity" values="0.18;0.42;0.18" dur="2s" repeatCount="indefinite" />
                  ) : null}
                </circle>
              );
            }
            return null;
          })()}

        {/* Level-2 click overlay — one wedge per sektor (cycles avg) */}
        {level === 2 &&
          COMPASS_SECTORS.map((sector, sIdx) => {
            const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
            const angleCenter = -Math.PI / 2 + arc * sIdx + arc / 2;
            const start = angleCenter - arc / 2;
            const end = angleCenter + arc / 2;
            const value = sektorAvg(profile, sector.id);
            return (
              <path
                key={`l2touch-${sector.id}`}
                d={annularPath(cx, cy, rInner, rOuter, start, end)}
                fill="transparent"
                stroke="transparent"
                tabIndex={0}
                role="slider"
                aria-label={sector.name_pl}
                aria-valuemin={0}
                aria-valuemax={MAX_INTENSITY}
                aria-valuenow={value}
                aria-valuetext={`${value} z ${MAX_INTENSITY}`}
                onClick={() => cycleSektor(sector.id)}
                onMouseEnter={() => reportHover(sector.id)}
                onMouseLeave={() =>
                  reportHover(hovered === sector.id ? null : hovered)
                }
                style={{ cursor: "pointer", outline: "none" }}
                className="taste-compass-touch"
              />
            );
          })}

        {/* Level-1 click overlay — 3 broad wedges, each ~120° wide,
            centred on the corresponding base axis. Big touch areas so
            mobile users can tap easily. */}
        {level === 1 &&
          BASE_AXES.map((axis) => {
            const arc = (Math.PI * 2) / BASE_AXES.length;
            const start = axis.angle - arc / 2;
            const end = axis.angle + arc / 2;
            const id = `base.${axis.id}`;
            const value = (profile[id] ?? 0) as number;
            return (
              <path
                key={`l1touch-${axis.id}`}
                d={annularPath(cx, cy, rInner, rOuter, start, end)}
                fill="transparent"
                stroke="transparent"
                tabIndex={0}
                role="slider"
                aria-label={axis.label}
                aria-valuemin={0}
                aria-valuemax={MAX_INTENSITY}
                aria-valuenow={value}
                aria-valuetext={`${value} z ${MAX_INTENSITY}`}
                onClick={() => cycleBase(axis.id)}
                onMouseEnter={() => reportHover(id)}
                onMouseLeave={() =>
                  reportHover(hovered === id ? null : hovered)
                }
                style={{ cursor: "pointer", outline: "none" }}
                className="taste-compass-touch"
              />
            );
          })}

        {/* Touch / click target — full spoke wedge (level 3 only) */}
        {level >= 3 && spokes.map((s) => {
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
              onMouseEnter={() => reportHover(s.tendencja.id)}
              onMouseLeave={() =>
                reportHover(hovered === s.tendencja.id ? null : hovered)
              }
              onKeyDown={(e) => handleKey(e, s)}
              style={{ cursor: "pointer", outline: "none" }}
              className="taste-compass-touch"
            />
          );
        })}

        {/* Center hub + 6-pointed compass star — fill flips per theme */}
        <circle cx={cx} cy={cy} r={rInner} fill="var(--surface-deep)" stroke="var(--gold-hairline)" strokeWidth={0.7} />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontFamily="var(--font-serif)"
          fontStyle="italic"
          fontSize={12}
          fill="var(--color-accent-gold)"
          opacity={0.9}
          pointerEvents="none"
        >
          Vinokompas
        </text>

        {/* Outer labels — horizontal text, smart-anchored by quadrant.
            Long labels split on `·` into two lines. The label sits on a
            short radial tick line for premium chart-y feel.
            Only rendered at level 3 (12 tendencje view) — at lower levels
            this would clutter the disc. */}
        {showLabels && level >= 3 &&
          spokes.map((s) => {
            const xUnit = Math.sin(s.angle);
            const yUnit = -Math.cos(s.angle);
            const tickStart = { x: cx + (rOuter + 4) * xUnit, y: cy + (rOuter + 4) * yUnit };
            const tickEnd = { x: cx + (rOuter + 14) * xUnit, y: cy + (rOuter + 14) * yUnit };
            const labelPos = {
              x: cx + (rOuter + 22) * xUnit,
              y: cy + (rOuter + 22) * yUnit,
            };
            // Anchor by horizontal position relative to centre.
            // Right of axis → start; left → end; near axis → middle.
            const anchorBand = Math.abs(xUnit);
            const textAnchor = anchorBand < 0.3
              ? "middle"
              : xUnit > 0
                ? "start"
                : "end";
            const baseline = yUnit < -0.3 ? "auto" : yUnit > 0.3 ? "hanging" : "middle";

            const label = s.tendencja.shortLabel_pl ?? s.tendencja.name_pl;
            const lines = label.includes("·") ? label.split("·").map((p) => p.trim()) : [label];
            const lineHeight = 11;
            const totalH = (lines.length - 1) * lineHeight;
            const y0 = labelPos.y - (baseline === "middle" ? totalH / 2 : 0);

            return (
              <g key={`lbl-${s.tendencja.id}`} pointerEvents="none">
                {/* radial tick */}
                <line
                  x1={tickStart.x}
                  y1={tickStart.y}
                  x2={tickEnd.x}
                  y2={tickEnd.y}
                  stroke={s.sector.color}
                  strokeOpacity={0.55}
                  strokeWidth={0.9}
                />
                <text
                  x={labelPos.x}
                  y={y0}
                  textAnchor={textAnchor}
                  dominantBaseline={baseline}
                  fontFamily="var(--font-display)"
                  fontSize={9.2}
                  fontWeight={600}
                  letterSpacing="0.04em"
                  fill="var(--ink)"
                  opacity={0.9}
                  className="select-none"
                >
                  {lines.length === 1 ? (
                    label
                  ) : (
                    lines.map((ln, i) => (
                      <tspan
                        key={i}
                        x={labelPos.x}
                        dy={i === 0 ? 0 : lineHeight}
                      >
                        {ln}
                      </tspan>
                    ))
                  )}
                </text>
              </g>
            );
          })}

        {/* Sector noun labels — one per sector, larger, between the 2 tendencje.
            Faded at level 1 (compass shows only base axes there) and given
            a stronger weight at level 2 (where sektor IS the unit of work). */}
        {level >= 2 && COMPASS_SECTORS.map((sector, sIdx) => {
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
              fontSize={level === 2 ? 13 : 11}
              fontWeight={level === 2 ? 600 : 500}
              fill="var(--ink)"
              opacity={level === 2 ? 0.95 : 0.65}
              pointerEvents="none"
              className="select-none"
            >
              {sector.name_pl}
            </text>
          );
        })}

        {/* Base-smak axis overlay — 3 gold beams + labels at the perimeter.
            Always rendered so the user keeps the reference even at level
            2/3, but visually loud only at level 1 (where it's the only
            interaction). Beam length = base intensity × ringStep (0..rOuter). */}
        {BASE_AXES.map((axis) => {
          const baseId = `base.${axis.id}`;
          const value = (profile[baseId] ?? 0) as number;
          const xUnit = Math.sin(axis.angle);
          const yUnit = -Math.cos(axis.angle);
          const beamLen = rInner + ringStep * value;
          const beamX = cx + beamLen * xUnit;
          const beamY = cy + beamLen * yUnit;
          const labelX = cx + (rOuter + 30) * xUnit;
          const labelY = cy + (rOuter + 30) * yUnit;
          const dimWhenIrrelevant = level >= 2 ? 0.4 : 1;
          return (
            <g key={`base-${axis.id}`} opacity={dimWhenIrrelevant} pointerEvents="none">
              {/* Faint axis line ALWAYS shown to anchor the geometry */}
              <line
                x1={cx}
                y1={cy}
                x2={cx + (rOuter - 4) * xUnit}
                y2={cy + (rOuter - 4) * yUnit}
                stroke="rgba(197, 160, 89, 0.30)"
                strokeWidth={0.8}
                strokeDasharray="2 3"
              />
              {/* Filled beam — proportional to value */}
              {value > 0 ? (
                <line
                  x1={cx}
                  y1={cy}
                  x2={beamX}
                  y2={beamY}
                  stroke="var(--color-accent-gold)"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  opacity={0.85}
                />
              ) : null}
              {/* Tip dot at axis end (always visible — the click hint) */}
              <circle
                cx={cx + rOuter * xUnit}
                cy={cy + rOuter * yUnit}
                r={4}
                fill="var(--color-accent-gold)"
                opacity={value > 0 ? 1 : 0.55}
              />
              {/* Label */}
              <text
                x={labelX}
                y={labelY}
                textAnchor="middle"
                dominantBaseline="middle"
                fontFamily="var(--font-display)"
                fontSize={level === 1 ? 13 : 10.5}
                fontWeight={700}
                letterSpacing="0.18em"
                fill="var(--color-accent-gold)"
                className="select-none"
              >
                {axis.label}
              </text>
              {/* Value pill at axis end (level 1 only — too noisy at higher levels) */}
              {level === 1 ? (
                <text
                  x={cx + (rOuter + 14) * xUnit}
                  y={cy + (rOuter + 14) * yUnit}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontFamily="ui-monospace, SFMono-Regular, monospace"
                  fontSize={10}
                  fill="var(--ink)"
                  opacity={0.75}
                  className="select-none"
                >
                  {value}/{MAX_INTENSITY}
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Live legend — shows what's currently selected.
          Hidden when the wrapper provides its own info side-panel. */}
      {hideLegend ? null : <CompassLegend profile={profile} onClear={() => setProfile({})} />}
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
