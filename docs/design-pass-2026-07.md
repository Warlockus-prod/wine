# Design/UX pass — July 2026

Full-site design remediation driven by a 5-agent audit of the live site
(390×844 + 1440×900, every key page). Executed 2026-07-15. This file records
what changed and why, so the next pass doesn't re-litigate it.

## Root-cause fixes (site-wide)

1. **Serif display was silently broken everywhere.** `@theme inline` in
   `globals.css` inlines token values into *generated utilities* but never
   emits the custom properties themselves — so every hand-authored
   `font-family: var(--font-serif)` rule (`.pitch-display`, `.pitch-eyebrow`,
   `.pitch-roman`, …) resolved to nothing and inherited Libre Franklin.
   Fix: runtime copies of `--font-serif`/`--font-display` declared on `:root`
   *outside* `@theme` (globals.css, right after the `@theme inline` block).
   Symptom in the audit: "flagship pages read generic-SaaS".

2. **`.keep-dark` opt-out shim.** The light theme remaps
   `[class*="text-white"]` → navy ink, dark hex backgrounds → white, and
   `border-white/*` → navy hairline. Inside panels that stay navy
   (pitch stats band, step cards, footers, mobile result bar) that made text
   invisible (~1.1:1). `.keep-dark` on the container restores cream text,
   white-alpha borders/tints, and re-brightens `--color-accent-gold` to
   #c79f69. Contract: the container paints its own dark background via
   INLINE STYLE (shims can't match it); child dark-hex bg classes revert.

3. **Nav ghosting**: `--nav-bg` (light) 0.92 → 0.97 alpha; map section got
   `isolate z-0` so its z-[400] chrome can't paint over the fixed nav.

4. **One CTA language**: `.pitch-cta-primary` / `.pitch-cta-ghost` are now
   pill-shaped (border-radius 999px) — the square hero CTAs vs rounded
   tutorial pills read as two systems.

## Per-page (see git log 2026-07-15 for diffs)

- **Home**: serif hero/card titles, "Wszystkie" filters + PL cuisine chips,
  raw-URL panel removed, QR → 72px expandable thumbnail, map 340px on mobile
  with in-flow selected card, hero "Samouczek smaku" CTA, navy footer.
- **Restaurant (guest)**: price pinned right of wrapping titles, "N zł"
  dish prices (was "$"), tap-cue contrast fix, navy hero stat tiles,
  ribbon/eyebrow overlap, `self-start` grids, drop-cap ≥120 chars only,
  QR aside shows host caption instead of breaking raw URL, AI-sommelier
  chip hidden until a dish is picked.
- **Pairing**: FloatingTasteChat starts collapsed (prop `defaultCollapsed`),
  desktop panel ≤60vh; passport tiles parchment+gold; "% dopasowania"
  everywhere (was FIT/TRAFIONE mix); PL tag dictionary; serif h1/h2s;
  blurred gold glows → crisp hairlines (the smudge came from the light-shim
  box-shadow on `bg-primary/N` chips); unified radio-dot grammar; mobile
  sticky result bar ("★ wine · % — Zobacz →"); compact mobile hero; typing
  dots + staggered bubbles (AI fetch/cache logic untouched).
- **Pitch**: keep-dark stats band + navy step cards (was muddy 70%-alpha
  maroon over cream), gold hairline token pass, guest MobileTabBar removed
  from the page, mobile section gaps capped, tier cards 01/02/03 (Roman
  numerals reserved for chapters), drop-cap suppressed on short first words,
  96% badge offset out of the phone silhouette.
- **Samouczek**: stage tabs rebuilt mobile-first (no more "WRAŻENL" clipping;
  strip is `basis-full` on mobile so tabs get the full row), image-ring
  medallions (parchment backing + warm tint + gold hairline + staggered
  `.compass-medallion` entrance), micro-copy ≥12px full-opacity gold,
  duplicate proposal blurbs suppressed, PL " - " → " — " (aria-labels with
  " - " untouched — e2e counts them), top control strip desktop-only,
  guide panel `self-start lg:sticky`.

## Guardrails honored

- e2e contract kept: 3 stage tabs (/ETAP \d/i ×3), slider aria-labels,
  smoke strings ("Unikalne URL", "bezpośredni dostęp", "Kontekst: …",
  exact pairing headline PL string), heading roles.
- `mobile-visual` snapshots for home + pairing regenerated deliberately
  (above-the-fold redesign); spec files untouched.
- Analytics emitters, SWR/data flow, explain caching, localStorage keys —
  all byte-compatible.
