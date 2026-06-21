import Icon from "./Icon";

/**
 * Renders a restaurant's `format` string as a premium badge group.
 *
 * The data packs type + accolade into one string, e.g.
 *   "Sushi-ya · 3⭐ Michelin", "Haute cuisine · 2⭐ Michelin",
 *   "Peruvian Nikkei · World #1", "Fine Dining".
 * The old UI dumped the whole string (emoji star and all) into a single
 * coloured gradient pill, which read as cramped and inorganic - the ⭐ glyph
 * renders inconsistently across platforms. This splits it: the cuisine type
 * keeps the brand gradient pill, and the accolade becomes a refined gold
 * "medal" - real SVG stars + "MICHELIN" (or the accolade text) on a gold
 * hairline chip that matches the rest of the gold-leaf brand language.
 */
export default function RestaurantFormat({
  format,
  typeClassName,
  className = "",
}: {
  format: string;
  /** Full className for the cuisine-type pill (gradient on cards, neutral on the hero). */
  typeClassName: string;
  className?: string;
}) {
  const parts = format.split("·").map((s) => s.trim()).filter(Boolean);
  const type = parts[0] ?? format;
  const accolade = parts.slice(1).join(" · ");
  const michelin = accolade.match(/(\d+)\s*(?:[⭐★]\s*)?Michelin/i);
  const stars = michelin ? Number(michelin[1]) : 0;
  const otherAccolade = !michelin && accolade ? accolade : null;

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      <span className={typeClassName}>{type}</span>

      {stars > 0 ? (
        <span
          className="inline-flex items-center gap-0.5 rounded-full border border-[var(--color-accent-gold)]/40 bg-[#0b1f44] px-2 py-1"
          title={`${stars}-star Michelin`}
        >
          {Array.from({ length: stars }).map((_, i) => (
            <Icon key={i} name="star" className="text-[10px] text-[var(--color-accent-gold)]" />
          ))}
          <span className="ml-0.5 text-[9px] font-bold tracking-[0.16em] text-[var(--color-accent-gold)] uppercase">
            Michelin
          </span>
        </span>
      ) : otherAccolade ? (
        <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-accent-gold)]/40 bg-[#0b1f44] px-2 py-1 text-[9px] font-bold tracking-[0.16em] text-[var(--color-accent-gold)] uppercase">
          <Icon name="star" className="text-[10px]" />
          {otherAccolade}
        </span>
      ) : null}
    </span>
  );
}
