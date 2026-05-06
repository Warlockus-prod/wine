/**
 * DishMonogramSVG — gold-foil monogram for dish category cards.
 *
 * Lightweight SVG glyph keyed off `category`. Categories that don't match
 * fall back to a "fleur" mark so the rhythm is never broken. Renders at
 * any size — viewBox 32×32, scale via parent CSS.
 */

interface Props {
  category?: string;
  className?: string;
  /** Stroke colour override; defaults to gold accent. */
  color?: string;
}

import type { ReactElement } from "react";

const norm = (s?: string) => (s ?? "").toLowerCase().trim();

function pickGlyph(category?: string): ReactElement {
  const c = norm(category);

  // Order: most specific first.
  if (/(starter|aperitif|tapas|antipasti|amuse|przystawk|snack)/.test(c)) {
    // Olive sprig
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M16 5C12 11 12 19 16 27" />
        <ellipse cx="11" cy="11" rx="2.6" ry="1.4" transform="rotate(-30 11 11)" />
        <ellipse cx="20" cy="13" rx="2.6" ry="1.4" transform="rotate(35 20 13)" />
        <ellipse cx="11" cy="19" rx="2.6" ry="1.4" transform="rotate(-30 11 19)" />
        <ellipse cx="20" cy="21" rx="2.6" ry="1.4" transform="rotate(35 20 21)" />
      </g>
    );
  }
  if (/(pasta|noodle|ramen|risott|rice|gnocchi|pizza|focaccia|tagliatelle)/.test(c)) {
    // Pasta swirl
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="16" cy="16" r="9" />
        <path d="M11 12c2 1 5 1 7-1M9 16c3 2 7 2 11-1M11 20c2 1 5 1 7-1" />
      </g>
    );
  }
  if (/(seafood|fish|sea bass|tuna|salmon|crab|lobster|oyster|prawn|shrimp|sole|branzino|hamachi|sashimi|nigiri|cebiche|ceviche|poke)/.test(c)) {
    // Fish
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 16c4-5 9-7 14-7s8 2 12 7c-4 5-7 7-12 7S7 21 3 16z" />
        <path d="M22 13l4-3v12l-4-3" />
        <circle cx="12" cy="14.5" r="1" fill="currentColor" />
      </g>
    );
  }
  if (/(grill|robata|yakitori|chuletón|chuleton|asado|brasa|steak|frites|tomahawk|wagyu|chuleta|charcoal)/.test(c)) {
    // Flame
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 4c1 4 4 5 4 9a4 4 0 1 1-8 0c0-1 .5-2 1-3-2 2-3 4-3 6a6 6 0 1 0 12 0c0-5-4-7-6-12z" />
      </g>
    );
  }
  if (/(main|principal|główne|glowne|entree|entrée|cordero|pollo|chicken|duck|kacz|wagyu|beef|wołow|wolow|lamb|jagnię|jagnie|ragu|coq)/.test(c)) {
    // Crossed knife & fork
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 4v10a3 3 0 0 0 6 0V4M12 14v14" />
        <path d="M21 4l1 14h-3l-1-14M19.5 18v10" />
      </g>
    );
  }
  if (/(dessert|tiramisu|cheesecake|crème|creme|gelato|ice cream|sorbet|tart|cake|baklava|babka|sernik|deser|matcha)/.test(c)) {
    // Cup with steam (or scoop)
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 13h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5z" />
        <path d="M21 14h2a3 3 0 0 1 0 6h-2" />
        <path d="M11 6c0 1.5 2 1.5 2 3M16 5c0 1.5 2 1.5 2 3" />
      </g>
    );
  }
  if (/(soup|broth|zupa|bisque|bouillab)/.test(c)) {
    // Bowl with steam
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 16h22a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z" />
        <path d="M11 12c0-2 2-2 2-4M16 11c0-2 2-2 2-4M21 12c0-2 2-2 2-4" />
      </g>
    );
  }
  if (/(vegetar|vegan|salad|sałat|salat|warzyw|veg|nicoise)/.test(c)) {
    // Sprout
    return (
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 28V14" />
        <path d="M16 18c-3 0-6-2-6-6 3 0 6 2 6 6z" />
        <path d="M16 14c3 0 6-2 6-6-3 0-6 2-6 6z" />
      </g>
    );
  }

  // Default — fleur-de-lis (matches the wine-list mark)
  return (
    <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4c-2 4-4 6-4 9 0 2 1 3 4 3s4-1 4-3c0-3-2-5-4-9z" />
      <path d="M9 13c-2 2-3 4-3 6 0 2 1 3 3 3s2-1 2-3" />
      <path d="M23 13c2 2 3 4 3 6 0 2-1 3-3 3s-2-1-2-3" />
      <path d="M11 22c0 4 2 6 5 6s5-2 5-6" />
      <path d="M8 13h16" />
    </g>
  );
}

export default function DishMonogramSVG({ category, className, color }: Props) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      style={color ? { color } : undefined}
      role="img"
      aria-hidden
    >
      {pickGlyph(category)}
    </svg>
  );
}
