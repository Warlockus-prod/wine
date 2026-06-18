/**
 * WineBottleSVG - silhouette bottle placeholder for wines without imageUrl.
 *
 * Style detection mirrors the heuristics in restaurant-pairing-adapter.ts:
 * the wine.style + wine.grape strings drive the bottle shape and the
 * liquid tint. Sizing is responsive - viewBox is 60×200 (3:10 aspect),
 * scale via CSS width/height.
 */

import type { CSSProperties } from "react";

type WineStyleHint =
  | "red"
  | "white"
  | "sparkling"
  | "rose"
  | "dessert"
  | "default";

const palette: Record<
  WineStyleHint,
  { glass: string; liquid: string; capsule: string; label: string }
> = {
  red: { glass: "#0a3315", liquid: "#5a0a18", capsule: "#1a0408", label: "#f4ede0" },
  white: { glass: "#5b6b3a", liquid: "#e7d68a", capsule: "#2a1f10", label: "#f4ede0" },
  sparkling: { glass: "#0d3520", liquid: "#e7c97a", capsule: "#c5a059", label: "#0c0506" },
  rose: { glass: "#a8a098", liquid: "#e8a4a0", capsule: "#3a1a1a", label: "#f4ede0" },
  dessert: { glass: "#3a1a08", liquid: "#a85a18", capsule: "#1a0408", label: "#f4ede0" },
  default: { glass: "#1a0a0c", liquid: "#5a0a18", capsule: "#0c0506", label: "#f4ede0" },
};

const detectStyle = (style?: string, grape?: string): WineStyleHint => {
  const s = `${style ?? ""} ${grape ?? ""}`.toLowerCase();
  if (/(sparkling|champagne|brut|cava|prosecco|crémant|cremant)/.test(s)) return "sparkling";
  if (/(dessert|porto|port|tokaji|sauternes|sweet)/.test(s)) return "dessert";
  if (/(rose|rosé|rosado|rosato)/.test(s)) return "rose";
  if (/(white|blanc|bianco|sauvignon|chardonnay|riesling|pinot grigio|albariño|albarino|gewurz|chenin)/.test(s))
    return "white";
  return "red";
};

interface ShapeProps {
  shoulderRadius: number; // 0..1
  shoulderHeight: number; // 0..1
  bodyWidth: number; // 0..1
  neckWidth: number; // 0..1
  totalHeight: number; // px in 200-tall viewBox
}

const detectShape = (style?: string, grape?: string): ShapeProps => {
  const s = `${style ?? ""} ${grape ?? ""}`.toLowerCase();
  if (/(sparkling|champagne|brut)/.test(s))
    return { shoulderRadius: 0.95, shoulderHeight: 0.32, bodyWidth: 0.95, neckWidth: 0.3, totalHeight: 196 };
  if (/(riesling|hock|mosel|alsace)/.test(s))
    return { shoulderRadius: 0.6, shoulderHeight: 0.55, bodyWidth: 0.7, neckWidth: 0.22, totalHeight: 198 };
  if (/(pinot|chardonnay|burgundy|chablis)/.test(s))
    return { shoulderRadius: 0.95, shoulderHeight: 0.28, bodyWidth: 0.85, neckWidth: 0.26, totalHeight: 194 };
  // Default - Bordeaux: high straight shoulders.
  return { shoulderRadius: 0.25, shoulderHeight: 0.28, bodyWidth: 0.85, neckWidth: 0.26, totalHeight: 196 };
};

interface Props {
  style?: string;
  grape?: string;
  /** Optional override of palette family. */
  hint?: WineStyleHint;
  className?: string;
  styleProp?: CSSProperties;
  /** Vintage / year text rendered on the label. Optional. */
  vintage?: string;
}

export default function WineBottleSVG({
  style,
  grape,
  hint,
  className,
  styleProp,
  vintage,
}: Props) {
  const tone = palette[hint ?? detectStyle(style, grape)];
  const shape = detectShape(style, grape);

  // Geometry - 60×200 viewBox so the silhouette feels properly tall.
  const VIEW_W = 60;
  const VIEW_H = 200;
  const cx = VIEW_W / 2;
  const bottleH = shape.totalHeight;
  const yBase = VIEW_H - 4;
  const yTop = VIEW_H - bottleH;
  const bodyW = VIEW_W * shape.bodyWidth;
  const halfBody = bodyW / 2;
  const neckW = VIEW_W * shape.neckWidth;
  const halfNeck = neckW / 2;
  const shoulderH = bottleH * shape.shoulderHeight;
  const yShoulder = yTop + shoulderH;
  // Curve control for shoulder - higher radius pulls curve toward neck top.
  const curveX = shape.shoulderRadius * (halfBody - halfNeck);

  const bottlePath = [
    // start at bottom-left
    `M ${cx - halfBody} ${yBase}`,
    // up the body left
    `L ${cx - halfBody} ${yShoulder}`,
    // shoulder curve to neck base left
    `C ${cx - halfBody + curveX} ${yShoulder - shoulderH * 0.35} ${cx - halfNeck - 0.5} ${yShoulder - shoulderH * 0.6} ${cx - halfNeck} ${yShoulder - shoulderH * 0.95}`,
    // up the neck left
    `L ${cx - halfNeck} ${yTop + 6}`,
    // top of capsule (rounded mouth)
    `Q ${cx - halfNeck} ${yTop} ${cx - halfNeck + 1} ${yTop}`,
    `L ${cx + halfNeck - 1} ${yTop}`,
    `Q ${cx + halfNeck} ${yTop} ${cx + halfNeck} ${yTop + 6}`,
    // down the neck right
    `L ${cx + halfNeck} ${yShoulder - shoulderH * 0.95}`,
    // shoulder curve right
    `C ${cx + halfNeck + 0.5} ${yShoulder - shoulderH * 0.6} ${cx + halfBody - curveX} ${yShoulder - shoulderH * 0.35} ${cx + halfBody} ${yShoulder}`,
    // down body right
    `L ${cx + halfBody} ${yBase}`,
    // base
    `Z`,
  ].join(" ");

  // Capsule (foil at neck top)
  const capsuleH = bottleH * 0.08;

  // Label - rounded rectangle on lower body
  const labelW = bodyW - 8;
  const labelH = bottleH * 0.18;
  const labelX = cx - labelW / 2;
  const labelY = yBase - bottleH * 0.42;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      style={styleProp}
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id="wb-glass-shine" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={tone.glass} stopOpacity="0.85" />
          <stop offset="35%" stopColor={tone.glass} />
          <stop offset="50%" stopColor={tone.liquid} stopOpacity="0.55" />
          <stop offset="70%" stopColor={tone.glass} />
          <stop offset="100%" stopColor={tone.glass} stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="wb-cap-shine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone.capsule} />
          <stop offset="50%" stopColor={tone.capsule} stopOpacity="0.85" />
          <stop offset="100%" stopColor={tone.capsule} />
        </linearGradient>
      </defs>

      {/* Bottle body */}
      <path d={bottlePath} fill="url(#wb-glass-shine)" stroke="rgba(0,0,0,0.4)" strokeWidth="0.6" />

      {/* Capsule overlay - sits on top of bottle path */}
      <path
        d={`M ${cx - halfNeck} ${yTop + 4} L ${cx - halfNeck} ${yTop + capsuleH} Q ${cx - halfNeck - 0.4} ${yTop + capsuleH + 1} ${cx - halfNeck + 1} ${yTop + capsuleH + 1} L ${cx + halfNeck - 1} ${yTop + capsuleH + 1} Q ${cx + halfNeck + 0.4} ${yTop + capsuleH + 1} ${cx + halfNeck} ${yTop + capsuleH} L ${cx + halfNeck} ${yTop + 4} Z`}
        fill="url(#wb-cap-shine)"
      />

      {/* Label */}
      <rect
        x={labelX}
        y={labelY}
        width={labelW}
        height={labelH}
        rx={1}
        fill={tone.label}
        opacity={0.96}
      />
      <line
        x1={labelX + 2}
        y1={labelY + labelH * 0.32}
        x2={labelX + labelW - 2}
        y2={labelY + labelH * 0.32}
        stroke={tone.glass}
        strokeWidth="0.4"
        opacity="0.5"
      />
      {vintage ? (
        <text
          x={cx}
          y={labelY + labelH * 0.72}
          textAnchor="middle"
          fontFamily="var(--font-serif)"
          fontStyle="italic"
          fontSize="6"
          fill={tone.glass}
          opacity="0.85"
        >
          {vintage}
        </text>
      ) : null}

      {/* Subtle floor reflection */}
      <ellipse cx={cx} cy={yBase + 2} rx={halfBody * 0.85} ry="1.2" fill="rgba(0,0,0,0.32)" />
    </svg>
  );
}
