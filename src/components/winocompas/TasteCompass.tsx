"use client";

/**
 * TasteCompass - interactive SVG wine compass à la vinocompas.pl.
 *
 * 6 sektorów (wrażeń) × 2 tendencje per sector × 6 stopni intensywności (0-5).
 * 12 outer "spokes" total. Each spoke is a clickable annular slice that fills
 * outward from the center as the user taps to set intensity.
 *
 * Mobile-first: 320px square minimum, 44pt touch targets, no drag (tap-to-set
 * is more reliable on touch). Desktop additionally supports hover preview and
 * keyboard navigation (Tab through spokes, ↑/↓ to change intensity).
 *
 * State is fully controlled - parent owns the profile. Local mode also works
 * via uncontrolled `defaultProfile`.
 */

import { useId, useMemo, useState, useEffect, useRef, useCallback, type MouseEvent as ReactMouseEvent } from "react";
import {
  COMPASS_SECTORS,
  pickL,
  type CompassLang,
  type CompassSector,
  type Tendencja,
} from "@/data/wine-compass-kb";

export type Intensity = 0 | 1 | 2 | 3 | 4 | 5;
export type CompassProfile = Record<string, Intensity>; // tendencja id -> 0-5
/**
 * Compass progressive-disclosure level.
 *  1 - only 3 base smaki axes (cierpkość / słodycz / kwasowość)
 *  2 - adds 6 sektor wedges (świeżość · oleistość · miękkość · tęgość ·
 *      szorstkość · ziemistość) clickable as a whole
 *  3 - full 12-tendencja interactive compass (default; backwards-compat)
 *
 * Each level adds a layer of click targets and labels. The underlying
 * profile model stays the same - sektor clicks fan their value to both
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
//  CIERPKOŚĆ on the left and clipped its label - fixed.)
const BASE_AXES = [
  { id: "cierpkosc", label: "CIERPKOŚĆ", label_en: "ASTRINGENCY", angle: 0 },                  // top
  { id: "slodycz",   label: "SŁODYCZ",   label_en: "SWEETNESS",   angle: (2 * Math.PI) / 3 }, // lower-right (4 o'clock)
  { id: "kwasowosc", label: "KWASOWOŚĆ", label_en: "ACIDITY",     angle: (4 * Math.PI) / 3 }, // lower-left (8 o'clock)
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
      // Sector i STARTS at arc*i from 12 o'clock (centre at +arc/2): the base
      // taste axes fall exactly on sector BOUNDARIES, as on the canonical
      // Vinocompas wheel (CIERPKOŚĆ = Szorstkie/Tęgie border, SŁODYCZ =
      // Miękkie/Oleiste, KWASOWOŚĆ = Świeże/Ziemiste). The old -π/2 offset
      // shifted the grid half a sector, centring Miękkie on 12 o'clock.
      const angle = arc * i + arc / 2;
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

/** Arc path for a curved label centred on `theta` (0=top, clockwise) spanning
 *  ±`half`, at radius `r`. Bottom-half arcs are drawn reversed so the text
 *  never renders upside-down — the classic radial-label flip. */
function labelArc(cx: number, cy: number, r: number, theta: number, half: number): string {
  const deg = (((theta * 180) / Math.PI) % 360 + 360) % 360;
  const bottom = deg > 90 && deg < 270;
  const a1 = bottom ? theta + half : theta - half;
  const a2 = bottom ? theta - half : theta + half;
  const p = (a: number): [number, number] => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const [x1, y1] = p(a1);
  const [x2, y2] = p(a2);
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 ${bottom ? 0 : 1} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

/** Base-taste wedge that owns spoke i: CIERPKOŚĆ spans ±60° about 12 o'clock
 *  (spokes 10,11,0,1), SŁODYCZ spokes 2-5, KWASOWOŚĆ spokes 6-9. Used to route
 *  the level-1 base value onto its four 30° slices so the fill keeps each
 *  slice's own official colour ("цвета как оригинал", 2026-07-17). */
const axisIdForSpoke = (i: number): string => BASE_AXES[Math.floor(((i + 2) % 12) / 4)].id;

// The association wreath is a garland of INDIVIDUAL object sprites (client
// 2026-07-18: "равномерно без отступов", per her reference poster — no
// grouped tiles). scratchpad/slice-ring2.mjs cuts each official image into
// its component objects via alpha connected-components + gap-only valley
// splits → public/senses/ring/<tendencja>-<k>.png. Order below = clockwise
// ring order (sector order from 12 o'clock); `a` = true sprite aspect.
const RING_SPRITES: { f: string; t: string; a: number }[] = [
  { f: "tegie-cigaro-1", t: "tegie-cigaro", a: 1.348 },
  { f: "tegie-cigaro-2", t: "tegie-cigaro", a: 1.095 },
  { f: "tegie-cigaro-3", t: "tegie-cigaro", a: 1.611 },
  { f: "tegie-cigaro-4", t: "tegie-cigaro", a: 1.735 },
  { f: "tegie-cigaro-5", t: "tegie-cigaro", a: 0.553 },
  { f: "tegie-suszone-1", t: "tegie-suszone", a: 2.119 },
  { f: "tegie-suszone-2", t: "tegie-suszone", a: 2.224 },
  { f: "tegie-suszone-3", t: "tegie-suszone", a: 1.589 },
  { f: "tegie-suszone-4", t: "tegie-suszone", a: 4.415 },
  { f: "tegie-suszone-5", t: "tegie-suszone", a: 1.481 },
  { f: "miekkie-dojrzale-1", t: "miekkie-dojrzale", a: 1.523 },
  { f: "miekkie-konfitury-1", t: "miekkie-konfitury", a: 0.985 },
  { f: "miekkie-konfitury-2", t: "miekkie-konfitury", a: 1.2 },
  { f: "miekkie-konfitury-3", t: "miekkie-konfitury", a: 1.136 },
  { f: "oleiste-maslo-1", t: "oleiste-maslo", a: 1.591 },
  { f: "oleiste-tropikalne-1", t: "oleiste-tropikalne", a: 1.364 },
  { f: "oleiste-tropikalne-2", t: "oleiste-tropikalne", a: 1.723 },
  { f: "oleiste-tropikalne-3", t: "oleiste-tropikalne", a: 1.573 },
  { f: "oleiste-tropikalne-4", t: "oleiste-tropikalne", a: 0.576 },
  { f: "oleiste-tropikalne-5", t: "oleiste-tropikalne", a: 0.527 },
  { f: "swieze-zielone-1", t: "swieze-zielone", a: 1.584 },
  { f: "swieze-cytrusy-1", t: "swieze-cytrusy", a: 1.036 },
  { f: "swieze-cytrusy-2", t: "swieze-cytrusy", a: 1.193 },
  { f: "swieze-cytrusy-3", t: "swieze-cytrusy", a: 0.87 },
  { f: "ziemiste-mineraly-1", t: "ziemiste-mineraly", a: 1.386 },
  { f: "ziemiste-sciolka-1", t: "ziemiste-sciolka", a: 0.969 },
  { f: "ziemiste-sciolka-2", t: "ziemiste-sciolka", a: 0.959 },
  { f: "ziemiste-sciolka-3", t: "ziemiste-sciolka", a: 0.86 },
  { f: "ziemiste-sciolka-4", t: "ziemiste-sciolka", a: 0.948 },
  { f: "ziemiste-sciolka-5", t: "ziemiste-sciolka", a: 0.394 },
  { f: "szorstkie-pizmo-1", t: "szorstkie-pizmo", a: 0.295 },
  { f: "szorstkie-pizmo-2", t: "szorstkie-pizmo", a: 1.216 },
  { f: "szorstkie-dab-1", t: "szorstkie-dab", a: 0.556 },
  { f: "szorstkie-dab-2", t: "szorstkie-dab", a: 3.352 },
  { f: "szorstkie-dab-3", t: "szorstkie-dab", a: 0.766 },
  { f: "szorstkie-dab-4", t: "szorstkie-dab", a: 1.167 },
  { f: "szorstkie-dab-5", t: "szorstkie-dab", a: 1.136 },
];
/** Lay the sprites around the circle with ONE uniform gap between every
 *  neighbour (the whole complaint was uneven cluster spacing): widths come
 *  from true aspects at a common height (wide strips flatten to cap), the
 *  common height is solved so the sprites cover ~86% of the circumference,
 *  and a single global rotation aligns each tendencja's centroid with its
 *  30° slice so the garland still reads directionally. Deterministic. */
function spriteRing(r1: number, r2: number): { f: string; t: string; theta: number; r: number; w: number; h: number }[] {
  // TWO staggered rows (client 2026-07-18 "в два уровня чтобы крупнее и
  // больше влезло, как на оригинале"): alternate sprites inner/outer, which
  // halves each row's arc demand → sprites nearly double in size and the
  // band reads as the reference poster's dense object field. EQUAL-AREA √A
  // sizing keeps every sprite at the same visual mass; per-row uniform gaps
  // + per-row global rotation keep each tendencja's objects over its slice.
  const rows: { idx: number[]; r: number }[] = [
    { idx: RING_SPRITES.map((_, i) => i).filter((i) => i % 2 === 0), r: r1 },
    { idx: RING_SPRITES.map((_, i) => i).filter((i) => i % 2 === 1), r: r2 },
  ];
  // one common sprite scale = the tighter row's budget (uniform look)
  const s0 = Math.min(
    ...rows.map((row) => {
      const sqrtSum = row.idx.reduce((s, i) => s + Math.sqrt(Math.min(RING_SPRITES[i].a, 2.3)), 0);
      return (0.84 * 2 * Math.PI * row.r) / sqrtSum;
    }),
  );
  const hCap = 0.98 * s0;
  const centreOf: Record<string, number> = {};
  for (const s of SPOKES) centreOf[s.tendencja.id.replace(/\./g, "-")] = s.angle;
  const out: { f: string; t: string; theta: number; r: number; w: number; h: number }[] = [];
  for (const row of rows) {
    const C = 2 * Math.PI * row.r;
    const items = row.idx.map((i) => {
      const x = RING_SPRITES[i];
      const aCap = Math.min(x.a, 2.3);
      let w = s0 * Math.sqrt(aCap);
      let h = w / x.a; // true aspect: capped-wide strips get shorter, narrow ones taller
      if (h > hCap) {
        const f = hCap / h;
        w *= f;
        h = hCap;
      }
      return { f: x.f, t: x.t, w, h };
    });
    const totalW = items.reduce((s, x) => s + x.w, 0);
    const gap = (C - totalW) / items.length;
    let acc = 0;
    const pos = items.map((x) => {
      const c = acc + x.w / 2;
      acc += x.w + gap;
      return c;
    });
    let off = 0;
    for (let i = 0; i < items.length; i++) {
      let d = centreOf[items[i].t] - pos[i] / row.r;
      while (d > Math.PI) d -= 2 * Math.PI;
      while (d < -Math.PI) d += 2 * Math.PI;
      off += d;
    }
    off /= items.length;
    for (let i = 0; i < items.length; i++) {
      out.push({ ...items[i], theta: pos[i] / row.r + off, r: row.r });
    }
  }
  return out;
}

// Colour count matches the SELECTABLE segment count per stage (client
// 2026-07-18: 12 hues behind a 3- or 6-segment picker "путает"). Level 2
// paints the SITE's canonical sector palette (`COMPASS_SECTORS[].color` —
// the same hues the legend chips, explorer and side panels use, so the
// wheel matches the rest of the UI); level 1 paints their pairwise blends,
// which sit naturally in the cream/gold/wine brand gamut (client: "подбери
// под палитру круга под сайт"). Level 3 keeps the official licensed 12.
const BASE_WEDGE_VIVID: Record<string, string> = {
  cierpkosc: "#723b44", // blend(szorstkie #5a2c5e, tęgie #8a4b2a) — wine maroon
  slodycz: "#ed8a43",   // blend(miękkie #e74c3c, oleiste #f4c84a) — warm apricot
  kwasowosc: "#638f6c", // blend(świeże #9bc24a, ziemiste #2c5d8e) — sage green
};

// The canonical 12-colour flow of the OFFICIAL Vinocompas wheel (client
// 2026-07-17 "как оригинал"), sampled from _Vinokompas_pelny_PL: brown → reds
// → orange → yellow → greens → teal → navy → purple → grey around the circle.
// Used to paint the 12-segment (level-3) tint + fill; levels 1/2 keep the
// 3/6-colour blends above / the 6 sector colours.
const TENDENCJA_COLOR: Record<string, string> = {
  "tegie.cigaro": "#4a2c28",
  "tegie.suszone": "#8e0000",
  "miekkie.dojrzale": "#cc0000",
  "miekkie.konfitury": "#ff0000",
  "oleiste.maslo": "#fa7d00",
  "oleiste.tropikalne": "#ffd400",
  "swieze.zielone": "#92d050",
  "swieze.cytrusy": "#00b050",
  "ziemiste.mineraly": "#2b7589",
  "ziemiste.sciolka": "#163152",
  "szorstkie.pizmo": "#460e4a",
  "szorstkie.dab": "#2f2f2d",
};

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
  /** Force a focus highlight from the parent - overrides internal hover.
   *  Used by <InteractiveCompass> for the guided auto-tour. Accepts a
   *  tendencja id, sektor id, or `base.<smak>` id. */
  externalHighlightId?: string | null;
  /** Auto-tour demo preview - animates filled rings on a sektor/tendencja to
   *  *demonstrate* intensity, WITHOUT touching the profile. `level` is the
   *  number of rings (1..MAX) to show. Cleared between tour steps. */
  demoFill?: { id: string; level: number } | null;
  /** Hide the bottom legend (tag chips) - useful when wrapper provides its
   *  own info side-panel. */
  hideLegend?: boolean;
  /** Progressive-disclosure level (1=base only, 2=+sektor, 3=+tendencje).
   *  Defaults to 3 to keep all existing call-sites unchanged. */
  level?: CompassLevel;
  /** When true (the merged "Vinokompas" stage uses it at level 2), the 3
   *  base-smak labels around the rim become clickable - tap to cycle 0-5.
   *  This lets base tastes (which drive the dryness meter) AND the 6
   *  wrażenia be set on a single wheel. The base hit-areas sit OUTSIDE the
   *  sector wedges, so the two click layers never fight. */
  baseInteractive?: boolean;
  /** Level-2 image-ring medallions: when provided, each medallion becomes a
   *  real button (click/Enter → this callback with its tendencja id) and
   *  bubbles hover through onHoverChange - "kliknij obrazek, zobacz opis"
   *  (client 2026-07). Without it the ring stays decorative. */
  onMedallionSelect?: (tendencjaId: string) => void;
  /** UI language for labels + aria strings. Defaults to "pl" so every
   *  existing call-site (and the PL e2e surface) stays byte-identical;
   *  the EN /samouczek passes "en". */
  lang?: CompassLang;
}

// Sektor avg helper - fans the same value to both tendencje under a sektor.
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
  demoFill,
  hideLegend = false,
  level = 3,
  baseInteractive = false,
  onMedallionSelect,
  lang = "pl",
}: Props) {
  const isControlled = profileProp !== undefined;
  const [internal, setInternal] = useState<CompassProfile>(() => defaultProfile ?? {});
  const profile = isControlled ? profileProp! : internal;
  const baseId = useId();
  // Locale shorthands - axis rim labels, slider value text, tendencja names.
  const axisLabel = (axis: (typeof BASE_AXES)[number]) =>
    lang === "pl" ? axis.label : axis.label_en;
  const valueText = (value: number) =>
    lang === "pl" ? `${value} z ${MAX_INTENSITY}` : `${value} of ${MAX_INTENSITY}`;

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

  // Geometry - all coordinates derive from VIEW so the whole dial recentres
  // automatically. Ring order matches the client's reference: pie → curved
  // labels outside the rim → uniform sprite garland → curved base-axis arcs.
  // Back to 640 (from the 720 big-tile era): individual sprites need a far
  // thinner band than the 93px tiles did, so the wheel gets its size back.
const VIEW = 640;
  const cx = VIEW / 2;
  const cy = VIEW / 2;
  const rOuter = 165;
  const rInner = 36;
  const ringStep = (rOuter - rInner) / RING_COUNT;

  // Radial pick - intensity follows the ring the user clicks (the dial fills
  // to where you tap: 3rd ring → 3, 5th ring → 5). Clicking the current level
  // (or the centre hub) resets to 0, so tapping the outer ring again clears
  // it and the fill starts over. Feels organic, not like a counter.
  const ringFromEvent = (e: ReactMouseEvent<SVGElement>): number => {
    const svg = e.currentTarget.ownerSVGElement;
    const ctm = svg?.getScreenCTM();
    if (!svg || !ctm) return 1;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const p = pt.matrixTransform(ctm.inverse());
    const dist = Math.hypot(p.x - cx, p.y - cy);
    if (dist <= rInner) return 0;
    return Math.max(1, Math.min(MAX_INTENSITY, Math.ceil((dist - rInner) / ringStep)));
  };
  const nextFromClick = (clicked: number, cur: number): Intensity =>
    (clicked === 0 || clicked === cur ? 0 : clicked) as Intensity;

  const pickIntensity = (e: ReactMouseEvent<SVGElement>, id: string) => {
    setIntensity(id, nextFromClick(ringFromEvent(e), (profile[id] ?? 0) as number));
  };
  const pickSektor = (e: ReactMouseEvent<SVGElement>, sektorId: string) => {
    const s = COMPASS_SECTORS.find((x) => x.id === sektorId);
    if (!s) return;
    const next = nextFromClick(ringFromEvent(e), sektorAvg(profile, sektorId));
    setProfile({ ...profile, [s.tendencje[0].id]: next, [s.tendencje[1].id]: next });
  };
  const pickBase = (e: ReactMouseEvent<SVGElement>, baseId: string) => {
    const key = `base.${baseId}`;
    setIntensity(key, nextFromClick(ringFromEvent(e), (profile[key] ?? 0) as number));
  };

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
      } else if (["1", "2", "3", "4", "5"].includes(e.key)) {
        setIntensity(id, Number(e.key) as Intensity);
      }
    },
    [profile, setIntensity, cycleIntensity],
  );

  // Keyboard equivalents for the level-2 sektor wedges and level-1 base wedges
  // (were click-only — WCAG 2.1.1 keyboard-operability). Arrow keys step ±1,
  // Enter/Space cycles, digits 0-5 set directly.
  const handleSektorKey = useCallback(
    (e: React.KeyboardEvent<SVGElement>, sektorId: string) => {
      const s = COMPASS_SECTORS.find((x) => x.id === sektorId);
      if (!s) return;
      const cur = sektorAvg(profile, sektorId);
      let next: number | null = null;
      if (e.key === "ArrowUp" || e.key === "ArrowRight") next = Math.min(MAX_INTENSITY, cur + 1);
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") next = Math.max(0, cur - 1);
      else if (e.key === " " || e.key === "Enter") next = (cur + 1) % STATE_COUNT;
      else if (/^[0-5]$/.test(e.key)) next = Number(e.key);
      if (next === null) return;
      e.preventDefault();
      setProfile({
        ...profile,
        [s.tendencje[0].id]: next as Intensity,
        [s.tendencje[1].id]: next as Intensity,
      });
    },
    [profile, setProfile],
  );

  const handleBaseKey = useCallback(
    (e: React.KeyboardEvent<SVGElement>, axisId: string) => {
      const id = `base.${axisId}`;
      const cur = (profile[id] ?? 0) as number;
      let next: number | null = null;
      if (e.key === "ArrowUp" || e.key === "ArrowRight") next = Math.min(MAX_INTENSITY, cur + 1);
      else if (e.key === "ArrowDown" || e.key === "ArrowLeft") next = Math.max(0, cur - 1);
      else if (e.key === " " || e.key === "Enter") next = (cur + 1) % STATE_COUNT;
      else if (/^[0-5]$/.test(e.key)) next = Number(e.key);
      if (next === null) return;
      e.preventDefault();
      setIntensity(id, next as Intensity);
    },
    [profile, setIntensity],
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
        role="group"
        aria-label={pickL(
          lang,
          "Tarcza Vinokompasu - zaznacz intensywność każdej tendencji",
          "The Vinocompas dial - set the intensity of each tendency",
        )}
      >
        <defs>
          {/* BG gradient reads from semantic tokens - flips dark↔white per
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

        {/* Background pie — full-saturation, colour count = the stage's
            selectable segment count (client 2026-07-18: 12 hues behind a
            3/6-segment picker "путает"): 3 blended wedges at level 1, the 6
            blended sector hues at level 2, the official 12 at level 3. */}
        {level >= 3
          ? SPOKES.map((s) => (
              <path
                key={`bg-${s.tendencja.id}`}
                d={annularPath(cx, cy, rInner - 1, rOuter + 1, s.angle - s.half, s.angle + s.half)}
                fill={TENDENCJA_COLOR[s.tendencja.id] ?? s.sector.color}
                fillOpacity={0.96}
                stroke="none"
              />
            ))
          : level === 2
            ? COMPASS_SECTORS.map((sector, sIdx) => {
                const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
                return (
                  <path
                    key={`bg2-${sector.id}`}
                    d={annularPath(cx, cy, rInner - 1, rOuter + 1, arc * sIdx, arc * (sIdx + 1))}
                    fill={sector.color}
                    fillOpacity={0.96}
                    stroke="none"
                  />
                );
              })
            : BASE_AXES.map((axis) => {
                const arc = (Math.PI * 2) / BASE_AXES.length;
                return (
                  <path
                    key={`bg1-${axis.id}`}
                    d={annularPath(cx, cy, rInner - 1, rOuter + 1, axis.angle - arc / 2, axis.angle + arc / 2)}
                    fill={BASE_WEDGE_VIVID[axis.id]}
                    fillOpacity={0.96}
                    stroke="none"
                  />
                );
              })}

        {/* Intensity read-out — the resting pie stays FULL saturation (the
            poster look); once a unit is set, its UNCHOSEN outer rings get a
            cream wash, so the vivid area "fills to" the chosen ring. One
            wash path per UNIT of work (base wedge / sektor / tendencja). */}
        {(level >= 3
          ? spokes.map((s) => ({ key: s.tendencja.id, start: s.start, end: s.end, v: s.intensity as number }))
          : level === 2
            ? COMPASS_SECTORS.map((sector, sIdx) => {
                const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
                return { key: sector.id, start: arc * sIdx + 0.004, end: arc * (sIdx + 1) - 0.004, v: sektorAvg(profile, sector.id) };
              })
            : BASE_AXES.map((axis) => {
                const arc = (Math.PI * 2) / BASE_AXES.length;
                return { key: axis.id, start: axis.angle - arc / 2 + 0.004, end: axis.angle + arc / 2 - 0.004, v: (profile[`base.${axis.id}`] ?? 0) as number };
              })
        ).map((u) =>
          u.v <= 0 || u.v >= MAX_INTENSITY ? null : (
            <path
              key={`wash-${u.key}`}
              d={annularPath(cx, cy, rInner + ringStep * u.v, rOuter + 1, u.start + 0.004, u.end - 0.004)}
              fill="#f6efe2"
              fillOpacity={0.62}
              stroke="rgba(255,255,255,0.95)"
              strokeWidth={1}
              pointerEvents="none"
            />
          ),
        )}

        {/* Concentric ring lines — white over the vivid pie so the 5 intensity
            rings stay legible on every hue. */}
        {Array.from({ length: RING_COUNT + 1 }).map((_, i) => (
          <circle
            key={`ring-${i}`}
            cx={cx}
            cy={cy}
            r={rInner + ringStep * i}
            fill="none"
            stroke="rgba(255,255,255,0.38)"
            strokeWidth={0.6}
            pointerEvents="none"
          />
        ))}

        {/* Radial dividers — the wheel reads as 3 / 6 / 12 segments per stage
            (client 2026-07: same pie design, only the subdivision changes).
            The 12 spoke boundaries fall at 30°·i from 12 o'clock; sector
            boundaries are the even indices (every 60°), and the 3 base-wedge
            boundaries sit between the base axes (i = 2, 6, 10 → 60/180/300°).
            Level 1 shows 3 dividers, level 2 shows 6, level 3 shows all 12. */}
        {SPOKES.map((s, i) => {
          const showAtLevel1 = i === 2 || i === 6 || i === 10; // base-wedge borders
          const showAtLevel2 = i % 2 === 0; // sector borders (every 60°)
          const visible = level >= 3 || (level === 2 && showAtLevel2) || (level === 1 && showAtLevel1);
          if (!visible) return null;
          const x = cx + rOuter * Math.sin(s.angle - s.half);
          const y = cy - rOuter * Math.cos(s.angle - s.half);
          return (
            <line
              key={`spoke-${s.tendencja.id}`}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.65)"
              strokeWidth={0.9}
              pointerEvents="none"
            />
          );
        })}

        {/* Demo intensity preview (auto-tour) - animated rings on the focused
            sektor/tendencja to SHOW that intensity varies. Visual only; never
            mutates the profile. */}
        {demoFill && demoFill.level > 0
          ? (() => {
              const sektor = COMPASS_SECTORS.find((s) => s.id === demoFill.id);
              let geo: { start: number; end: number; color: string } | null = null;
              if (sektor) {
                const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
                const sIdx = COMPASS_SECTORS.indexOf(sektor);
                const angleCenter = arc * sIdx + arc / 2;
                geo = {
                  start: angleCenter - arc / 2 + 0.01,
                  end: angleCenter + arc / 2 - 0.01,
                  color: sektor.color,
                };
              } else {
                const sp = spokes.find((x) => x.tendencja.id === demoFill.id);
                if (sp) geo = { start: sp.start, end: sp.end, color: TENDENCJA_COLOR[sp.tendencja.id] ?? sp.sector.color };
              }
              if (!geo) return null;
              const bands = [];
              for (let i = 0; i < demoFill.level; i++) {
                bands.push(
                  <path
                    key={`demo-${i}`}
                    d={annularPath(cx, cy, rInner + ringStep * i, rInner + ringStep * (i + 1), geo.start + 0.005, geo.end - 0.005)}
                    fill={geo.color}
                    fillOpacity={0.82}
                    stroke="#fff"
                    strokeOpacity={0.5}
                    strokeWidth={0.6}
                    pointerEvents="none"
                  >
                    {i === demoFill.level - 1 ? (
                      <animate attributeName="fill-opacity" values="0.3;0.7;0.3" dur="1.1s" repeatCount="indefinite" />
                    ) : null}
                  </path>,
                );
              }
              return <g>{bands}</g>;
            })()
          : null}

        {/* Hover / tour highlight - handles three target kinds:
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
                    stroke="rgba(255,255,255,0.9)"
                    strokeWidth={1.4}
                    pointerEvents="none"
                  />
                );
              }
              return (
                // White preview band — the pie beneath is vivid, so a colour
                // overlay would vanish; a light wash reads on every hue.
                <path
                  d={annularPath(cx, cy, r1, r2, s.start + 0.005, s.end - 0.005)}
                  fill="#fff"
                  fillOpacity={isTour ? 0.4 : 0.26}
                  pointerEvents="none"
                >
                  {isTour ? (
                    <animate attributeName="fill-opacity" values="0.26;0.55;0.26" dur="2s" repeatCount="indefinite" />
                  ) : null}
                </path>
              );
            }
            // 2) sektor (level 2)
            const sektor = COMPASS_SECTORS.find((x) => x.id === effectiveHover);
            if (sektor) {
              const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
              const sIdx = COMPASS_SECTORS.indexOf(sektor);
              const angleCenter = arc * sIdx + arc / 2;
              return (
                // Light wash + white rim: a colour overlay would disappear on
                // the vivid 12-colour pie.
                <path
                  d={annularPath(cx, cy, rInner, rOuter, angleCenter - arc / 2 + 0.01, angleCenter + arc / 2 - 0.01)}
                  fill="#fff"
                  fillOpacity={isTour ? 0.24 : 0.14}
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth={1.4}
                  pointerEvents="none"
                >
                  {isTour ? (
                    <animate attributeName="fill-opacity" values="0.14;0.34;0.14" dur="2s" repeatCount="indefinite" />
                  ) : null}
                </path>
              );
            }
            // 3) base.<id> (level 1) - glow disc behind the matching beam
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

        {/* Merged-stage base click targets - tap the rim label to cycle that
            base smak 0→5. Rendered BEFORE the sector wedges: where a label's
            box dips inside rOuter the sector wedge (painted later) wins the
            click, while the visible label sits well outside rOuter so tapping
            the label always sets the base smak. No click is stolen from the
            6 wrażenia. */}
        {baseInteractive &&
          BASE_AXES.map((axis) => {
            const xUnit = Math.sin(axis.angle);
            const yUnit = -Math.cos(axis.angle);
            const labelR = rOuter + 28;
            const halfW = axisLabel(axis).length * 13 * 0.42;
            const labelX = Math.max(halfW + 6, Math.min(VIEW - halfW - 6, cx + labelR * xUnit));
            const labelY = cy + labelR * yUnit;
            const id = `base.${axis.id}`;
            const value = (profile[id] ?? 0) as number;
            // Rect half-width (halfW+6) matches the labelX clamp margin, so the
            // box can never clip the viewBox edge.
            const w = halfW * 2 + 12;
            // Taller hit-box for a comfier touch target (rim labels sit at
            // radius 193, well outside rOuter=165, so a 50-unit box stays off
            // the wheel and on-canvas for all three axes).
            const h = 50;
            return (
              <rect
                key={`basehit-${axis.id}`}
                x={labelX - w / 2}
                y={labelY - h / 2}
                width={w}
                height={h}
                rx={11}
                fill="transparent"
                tabIndex={0}
                role="slider"
                aria-label={axisLabel(axis)}
                aria-valuemin={0}
                aria-valuemax={MAX_INTENSITY}
                aria-valuenow={value}
                aria-valuetext={valueText(value)}
                onClick={() => cycleIntensity(id)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowUp" || e.key === "ArrowRight") {
                    e.preventDefault();
                    setIntensity(id, Math.min(MAX_INTENSITY, value + 1) as Intensity);
                  } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
                    e.preventDefault();
                    setIntensity(id, Math.max(0, value - 1) as Intensity);
                  } else if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    cycleIntensity(id);
                  }
                }}
                onMouseEnter={() => reportHover(id)}
                onMouseLeave={() => reportHover(hovered === id ? null : hovered)}
                style={{ cursor: "pointer" }}
                className="taste-compass-touch vk-base-hit"
              />
            );
          })}

        {/* Level-2 click overlay - one wedge per sektor (cycles avg) */}
        {level === 2 &&
          COMPASS_SECTORS.map((sector, sIdx) => {
            const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
            const angleCenter = arc * sIdx + arc / 2;
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
                aria-label={pickL(lang, sector.name_pl, sector.name_en)}
                aria-valuemin={0}
                aria-valuemax={MAX_INTENSITY}
                aria-valuenow={value}
                aria-valuetext={valueText(value)}
                onClick={(e) => pickSektor(e, sector.id)}
                onKeyDown={(e) => handleSektorKey(e, sector.id)}
                onMouseEnter={() => reportHover(sector.id)}
                onMouseLeave={() =>
                  reportHover(hovered === sector.id ? null : hovered)
                }
                style={{ cursor: "pointer" }}
                className="taste-compass-touch"
              />
            );
          })}

        {/* Level-1 click overlay - 3 broad wedges, each ~120° wide,
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
                aria-label={axisLabel(axis)}
                aria-valuemin={0}
                aria-valuemax={MAX_INTENSITY}
                aria-valuenow={value}
                aria-valuetext={valueText(value)}
                onClick={(e) => pickBase(e, axis.id)}
                onKeyDown={(e) => handleBaseKey(e, axis.id)}
                onMouseEnter={() => reportHover(id)}
                onMouseLeave={() =>
                  reportHover(hovered === id ? null : hovered)
                }
                style={{ cursor: "pointer" }}
                className="taste-compass-touch"
              />
            );
          })}

        {/* Touch / click target - full spoke wedge (level 3 only) */}
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
              aria-label={`${pickL(lang, s.sector.name_pl, s.sector.name_en)} - ${pickL(lang, s.tendencja.name_pl, s.tendencja.name_en)}`}
              aria-valuemin={0}
              aria-valuemax={MAX_INTENSITY}
              aria-valuenow={fit}
              aria-valuetext={valueText(fit)}
              onClick={(e) => pickIntensity(e, s.tendencja.id)}
              onMouseEnter={() => reportHover(s.tendencja.id)}
              onMouseLeave={() =>
                reportHover(hovered === s.tendencja.id ? null : hovered)
              }
              onKeyDown={(e) => handleKey(e, s)}
              style={{ cursor: "pointer" }}
              className="taste-compass-touch"
            />
          );
        })}

        {/* Center hub + 6-pointed compass star - fill flips per theme */}
        <circle cx={cx} cy={cy} r={rInner} fill="var(--surface-deep)" stroke="var(--gold-hairline)" strokeWidth={0.7} />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fontFamily="var(--font-serif)"
          fontStyle="italic"
          fontSize={12}
          fontWeight={500}
          fill="var(--compass-center-ink, var(--color-accent-gold))"
          stroke="var(--compass-halo-center)"
          strokeWidth={2.2}
          strokeLinejoin="round"
          paintOrder="stroke"
          opacity={1}
          pointerEvents="none"
        >
          Vinocompas
        </text>

        {/* Image ring - the client's "ramka wypełniona obrazkami wrażeń i
            tendencji" (2026-07): one still-life photo per tendencja, orbiting
            just outside the dial at the tendencja's centre angle. Decorative
            (pointer-events none) so it never steals wedge clicks; images go
            through /_next/image so 12 thumbs cost ~5KB each, not 300KB.
            Each photo is framed as an inlaid medallion (parchment ring +
            gold hairline + warm tint) and enters with a staggered fade+scale
            via the .compass-medallion atom - keyed by level so re-entering
            stage 2 retriggers the entrance. */}
        {level >= 1 &&
          (() => {
            // Client 2026-07-18 (её референс-постер): the garland is a
            // CONTINUOUS field of individual object sprites in TWO staggered
            // rows — uniform gaps, no grouped tiles, bigger objects. Sprite
            // order follows the sectors clockwise, and spriteRing()'s global
            // rotation keeps each tendencja's objects over its slice.
            const sprites = spriteRing(rOuter + 59, rOuter + 101);
            const tendencjaOf: Record<string, (typeof SPOKES)[number]> = {};
            for (const sp of SPOKES) tendencjaOf[sp.tendencja.id.replace(/\./g, "-")] = sp;
            return sprites.map((sprite, i) => {
              const s = tendencjaOf[sprite.t];
              const tileW = sprite.w;
              const tileH = sprite.h;
              const ix = cx + sprite.r * Math.sin(sprite.theta);
              const iy = cy - sprite.r * Math.cos(sprite.theta);
            // q must stay 75 - Next 16 whitelists image qualities (default
            // [75]) and any other value 400s ("q parameter not allowed").
            const href = `/_next/image?url=${encodeURIComponent(`/senses/ring/${sprite.f}.png`)}&w=96&q=75`;
            const interactive = Boolean(onMedallionSelect);
            const pick = () => onMedallionSelect?.(s.tendencja.id);
            return (
              <g
                key={`med-${i}-${level}`}
                className="compass-medallion"
                style={{ ["--mi" as string]: i, cursor: interactive ? "pointer" : undefined }}
                pointerEvents={interactive ? "auto" : "none"}
                aria-hidden={interactive ? undefined : true}
                {...(interactive
                  ? {
                      role: "button",
                      tabIndex: 0,
                      "aria-label": `${pickL(lang, "Pokaż opis", "Show description")}: ${pickL(lang, s.tendencja.name_pl, s.tendencja.name_en)}`,
                      onClick: pick,
                      onKeyDown: (e: { key: string; preventDefault: () => void }) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          pick();
                        }
                      },
                      onMouseEnter: () => onHoverChange?.(s.tendencja.id),
                      onMouseLeave: () => onHoverChange?.(null),
                    }
                  : {})}
              >
                {/* Invisible hit-area - the cluster PNG is irregular, taps
                    should work anywhere in its footprint. */}
                <rect x={ix - tileW / 2} y={iy - tileH / 2} width={tileW} height={tileH} fill="transparent" />
                <image
                  href={href}
                  x={ix - tileW / 2}
                  y={iy - tileH / 2}
                  width={tileW}
                  height={tileH}
                  preserveAspectRatio="xMidYMid meet"
                />
              </g>
            );
            });
          })()}

        {/* Curved tendencja labels — OUTSIDE the rim on the cream ground,
            dark ink, exactly like the original poster (client 2026-07-18:
            "подписи идут поза кругом что бы было более читабельно"; they sat
            inside the rim briefly, but white-on-colour reads worse). The
            garland moved outward to make the band. Bottom-half arcs
            auto-reversed. Level 3 only (the 12-tendencja view). */}
        {showLabels && level >= 3 &&
          spokes.map((s) => {
            const label =
              lang === "pl"
                ? (s.tendencja.shortLabel_pl ?? s.tendencja.name_pl)
                : (s.tendencja.shortLabel_en ?? s.tendencja.name_en);
            // Long labels wrap onto TWO stacked arcs exactly like the
            // original poster ("suszone / owoce") — that's what lets the
            // font grow to 10.5 (client 2026-07-18 "очень мелко и не видно")
            // while every line still fits its 30° slice.
            const words = label.split(" ");
            let lines: string[] = [label];
            if (words.length >= 2 && label.length > 10) {
              let best = 1;
              let bestDiff = Infinity;
              for (let i = 1; i < words.length; i++) {
                const d = Math.abs(words.slice(0, i).join(" ").length - words.slice(i).join(" ").length);
                if (d < bestDiff) { bestDiff = d; best = i; }
              }
              lines = [words.slice(0, best).join(" "), words.slice(best).join(" ")];
            }
            const deg = (((s.angle * 180) / Math.PI) % 360 + 360) % 360;
            const isBottom = deg > 90 && deg < 270;
            // Line 1 must read ABOVE line 2 on screen: radially-outer first
            // on top arcs, radially-inner first on the flipped bottom arcs.
            const radii =
              lines.length === 2
                ? isBottom
                  ? [rOuter + 8, rOuter + 21.5]
                  : [rOuter + 21.5, rOuter + 8]
                : [rOuter + 13.5];
            return (
              <g key={`lbl-${s.tendencja.id}`} pointerEvents="none">
                {lines.map((ln, li) => {
                  const arcId = `${baseId}-lblarc-${s.tendencja.id.replace(".", "-")}-${li}`;
                  return (
                    <g key={li}>
                      <path id={arcId} d={labelArc(cx, cy, radii[li], s.angle, s.half * 0.98)} fill="none" />
                      <text
                        fontFamily="var(--font-display)"
                        fontSize={12}
                        fontWeight={600}
                        letterSpacing="0.02em"
                        fill="var(--ink)"
                        stroke="var(--compass-halo)"
                        strokeWidth={2.2}
                        strokeLinejoin="round"
                        paintOrder="stroke"
                        className="select-none"
                      >
                        <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                          {ln}
                        </textPath>
                      </text>
                    </g>
                  );
                })}
              </g>
            );
          })}

        {/* Level-2 curved SECTOR names — OUTSIDE the rim like the official
            uproszczony file, where the 6 sektor names run along the circle
            just past the pie (no mid-pie text there). */}
        {showLabels && level === 2 &&
          COMPASS_SECTORS.map((sector, sIdx) => {
            const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
            const angleCenter = arc * sIdx + arc / 2;
            const arcId = `${baseId}-seclblarc-${sector.id}`;
            return (
              <g key={`seclbl-${sector.id}`} pointerEvents="none">
                <path id={arcId} d={labelArc(cx, cy, rOuter + 13, angleCenter, arc * 0.46)} fill="none" />
                <text
                  fontFamily="var(--font-display)"
                  fontSize={16}
                  fontWeight={600}
                  letterSpacing="0.06em"
                  fill="var(--ink)"
                  stroke="var(--compass-halo)"
                  strokeWidth={2.4}
                  strokeLinejoin="round"
                  paintOrder="stroke"
                  className="select-none"
                >
                  <textPath href={`#${arcId}`} startOffset="50%" textAnchor="middle">
                    {pickL(lang, sector.name_pl, sector.name_en)}
                  </textPath>
                </text>
              </g>
            );
          })}


        {/* Sector noun labels - one per sector, mid-pie, between the 2
            tendencje. Level 3 ONLY: at level 2 the sektor names run curved
            on the rim instead (like the official uproszczony), and level 1
            shows just the base axes. */}
        {level >= 3 && COMPASS_SECTORS.map((sector, sIdx) => {
          const arc = (Math.PI * 2) / COMPASS_SECTORS.length;
          const angleCenter = arc * sIdx + arc / 2;
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
              fontSize={13}
              fontWeight={600}
              // White ink + dark halo: the pie beneath is now the vivid
              // official palette, spanning near-black navy to pure yellow —
              // the halo carries the contrast on the light slices.
              fill="#fff"
              stroke="rgba(46,22,14,0.55)"
              strokeWidth={2.4}
              strokeLinejoin="round"
              paintOrder="stroke"
              opacity={level === 2 ? 1 : 0.9}
              pointerEvents="none"
              className="select-none"
            >
              {pickL(lang, sector.name_pl, sector.name_en)}
            </text>
          );
        })}

        {/* Base-smak axis overlay - 3 gold beams + labels at the perimeter.
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
          // Labels sit just past the rim. Long ones (KWASOWOŚĆ at the
          // lower-left spoke) would clip the SVG edge on a ~390px viewport,
          // so clamp the centre inward to keep the whole text box on-canvas.
          // At level 2 the image ring occupies rOuter+27±25 (44px medallions
          // + parchment ring), so the labels move outside it. The two LOWER
          // labels (KWASOWOŚĆ/SŁODYCZ) are clamped horizontally toward the
          // viewBox edge, so extra radius can't clear the 225°/315° medallion
          // corners — lift them into the gap between medallions instead.
          // CURVED base-axis captions — on the ORIGINAL wheel (both the pełny
          // poster and the uproszczony file) all three run along the outer
          // circle: CIERPKOŚĆ arcs over the top, KWASOWOŚĆ / SŁODYCZ arc at
          // the lower corners, bottom arcs flipped readable (labelArc does
          // exactly the official flip). They sit OUTSIDE the tile wreath:
          // top tiles' outer edges reach ~330 (arc at rOuter+173 = 338);
          // the lower diagonal tile corners (~349 at azimuth ~228°) sit
          // outside the lower arcs' radius but 1.5° clear of their angular
          // span (glyphs start at ~229.5°).
          const isLower = axis.id !== "cierpkosc";
          const axisR = isLower ? rOuter + 141 : rOuter + 133;
          // Bright (level-1 size, full opacity) when base axes are the focus:
          // either at level 1, or in the merged stage where baseInteractive
          // makes them tappable.
          const labelBright = level === 1 || baseInteractive;
          const axisFontSize = labelBright ? 19 : 15;
          // Approximate glyph run (avg advance ≈ 0.62em + 0.16em tracking)
          // → half-arc that hugs the text without invading the tile corridor.
          // The value now rides INSIDE the curved caption ("KWASOWOŚĆ · 0/5"):
          // the two-row garland claimed every radius a separate chip could
          // occupy. +6 chars covers " · 0/5".
          const axisRunLen = axisLabel(axis).length + (labelBright ? 6 : 0);
          const axisHalfArc = (axisRunLen * axisFontSize * 0.36 + 8) / axisR;
          const axisArcId = `${baseId}-axisarc-${axis.id}`;
          const dimWhenIrrelevant = baseInteractive ? 1 : level >= 2 ? 0.55 : 1;
          return (
            <g key={`base-${axis.id}`} opacity={dimWhenIrrelevant} pointerEvents="none">
              {/* Faint axis line ALWAYS shown to anchor the geometry */}
              <line
                x1={cx}
                y1={cy}
                x2={cx + (rOuter - 4) * xUnit}
                y2={cy + (rOuter - 4) * yUnit}
                stroke="rgba(199, 159, 105, 0.30)"
                strokeWidth={0.8}
                strokeDasharray="2 3"
              />
              {/* Filled beam - proportional to value. Suppressed at level 1:
                  the 120° base WEDGE now fills with rings there (client
                  2026-07), so the thin beam would double-render the value.
                  Kept at level 2/3 as a dim reference to the base axes. */}
              {value > 0 && level !== 1 ? (
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
              {/* Tip dot at axis end (always visible - the click hint) */}
              <circle
                cx={cx + rOuter * xUnit}
                cy={cy + rOuter * yUnit}
                r={4}
                fill="var(--color-accent-gold)"
                opacity={value > 0 ? 1 : 0.55}
              />
              {/* Label + value stacked in SCREEN space (value directly below
                  the label) so they never collide regardless of axis angle -
                  the old radial value pill overlapped the label on the lower
                  spokes. High-contrast theme-aware --ink replaces the dim gold
                  so both read on dark AND light. */}
              <path id={axisArcId} d={labelArc(cx, cy, axisR, axis.angle, axisHalfArc)} fill="none" />
              <text
                fontFamily="var(--font-display)"
                fontSize={axisFontSize}
                fontWeight={700}
                letterSpacing="0.1em"
                fill="var(--ink)"
                className="select-none"
              >
                <textPath href={`#${axisArcId}`} startOffset="50%" textAnchor="middle">
                  {axisLabel(axis)}
                  {labelBright ? ` · ${value}/${MAX_INTENSITY}` : ""}
                </textPath>
              </text>
            </g>
          );
        })}
      </svg>

      {/* Live legend - shows what's currently selected.
          Hidden when the wrapper provides its own info side-panel. */}
      {hideLegend ? null : (
        <CompassLegend profile={profile} onClear={() => setProfile({})} lang={lang} />
      )}
    </div>
  );
}

/** Compact legend of all selected tendencje + a Reset button. */
function CompassLegend({
  profile,
  onClear,
  lang = "pl",
}: {
  profile: CompassProfile;
  onClear: () => void;
  lang?: CompassLang;
}) {
  const selected = SPOKES.flatMap((s) => {
    const v = profile[s.tendencja.id] ?? 0;
    return v > 0 ? [{ s, v }] : [];
  }).sort((a, b) => b.v - a.v);

  if (selected.length === 0) {
    return (
      <p className="mt-3 text-center font-serif text-xs italic text-[var(--color-accent-gold)] opacity-80">
        {pickL(
          lang,
          "Dotknij sektor i wskaż intensywność (od 0 do 5) - kompas zapamięta twój profil.",
          "Tap a sector and set the intensity (from 0 to 5) - the compass remembers your profile.",
        )}
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
          <span>{pickL(lang, s.tendencja.name_pl, s.tendencja.name_en)}</span>
          <span className="font-mono text-[10px] text-gray-400">·{v}</span>
        </span>
      ))}
      <button
        type="button"
        onClick={onClear}
        className="ml-1 rounded-full border border-rose-500/30 bg-rose-900/20 px-2.5 py-1 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-900/40"
      >
        {pickL(lang, "Wyzeruj", "Reset")}
      </button>
    </div>
  );
}
