export default function TendrilCorner({ side = "right" }: { side?: "left" | "right" }) {
  const flip = side === "left" ? " scale(-1, 1)" : "";
  return (
    <svg
      className="tendril-corner"
      width="120"
      height="120"
      viewBox="0 0 120 120"
      style={{
        top: 12,
        [side]: 12,
        transform: `rotate(0deg)${flip}`,
      } as React.CSSProperties}
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round">
        <path d="M10 60 C 30 30, 60 30, 80 50 S 110 80, 100 110" />
        <path d="M40 38 C 35 30, 28 28, 22 32" />
        <path d="M65 36 C 65 28, 70 22, 78 22" />
        <path d="M88 56 C 95 52, 102 54, 106 60" />
        <ellipse cx="22" cy="32" rx="3.5" ry="1.4" transform="rotate(-30 22 32)" />
        <ellipse cx="78" cy="22" rx="3.5" ry="1.4" transform="rotate(35 78 22)" />
        <ellipse cx="106" cy="60" rx="3.5" ry="1.4" transform="rotate(70 106 60)" />
      </g>
    </svg>
  );
}
