# Vinocompas wheel — "как оригинал" redesign (2026-07-17/18)

Final architecture of the `/samouczek` dial after the client-driven redesign
to match the licensed vinocompas.pl graphic. Component:
`src/components/winocompas/TasteCompass.tsx`; stage shell:
`src/components/winocompas/StagedTutorial.tsx`. All geometry lives in one
SVG (`VIEW = 640`, centre 320, `rOuter = 165`, `rInner = 36`); angle 0 =
12 o'clock, clockwise (`x = cx + r·sinθ`, `y = cy − r·cosθ`).

## Ring order (inside → out)

1. **Pie** (rInner−1 … rOuter+1) — full-saturation, `fillOpacity 0.96`.
   Colour count = the stage's selectable segment count (client: 12 hues
   behind a 3/6-segment picker confuse the choice):
   - stage 1 → 3 wedges of 120°, `BASE_WEDGE_VIVID` (pairwise blends of the
     site sector palette: wine maroon `#723b44`, warm apricot `#ed8a43`,
     sage green `#638f6c`);
   - stage 2 → the 6 site-canonical `COMPASS_SECTORS[].color` (same hues as
     legend chips / explorer, so the wheel matches the rest of the UI);
   - stage 3 → the official 12 `TENDENCJA_COLOR`, sampled from
     `vinocompas_graphics/plikigraficznevinocompas/_Vinokompas_pelny_PL`
     (brown → reds → orange → yellow → greens → teal → navy → purple → grey).
2. **Intensity = inverted cream wash.** The resting pie is vivid; setting a
   value lays `#f6efe2` at 0.62 over the rings ABOVE the chosen one — ONE
   wash path per unit of work (base wedge / sektor / tendencja; value source
   routed per level, base wedges via `axisIdForSpoke`). Skipped at v=0 and
   v=MAX.
3. **Ring lines + level-gated dividers** — white-alpha strokes over the
   vivid pie (3/6/12 dividers per stage via spoke index: base borders
   i∈{2,6,10}, sector borders even i, all 12 at level 3).
4. **Curved labels OUTSIDE the rim** (dark ink + cream halo `--compass-halo`,
   `labelArc()` textPaths, bottom half auto-reversed so nothing reads
   upside-down). Level 3 = 12 tendencje at **12px**, long ones wrapped onto
   TWO stacked arcs à la the poster (single-line `rOuter+13.5`, two-line
   `rOuter+21.5`/`+8`, line order swapped on bottom arcs). Level 2 = 6
   sektor names at **16px** (`rOuter+13`, как uproszczony; no mid-pie
   italics at level 2). Level 3 additionally keeps 13px italic sector names
   mid-pie (white + dark halo). Labels paint ABOVE the garland — the halo
   keeps them readable when a sprite passes beneath.
5. **Association garland — 37 individual object sprites, two staggered
   rows.** Assets: each of the client's 12 official images
   (`vinocompas_graphics/obrazkinut`, background-stripped + trimmed by
   `scratchpad/process-ring.mjs`) is cut into its component objects by
   `scratchpad/slice-ring2.mjs` (alpha connected-components at solid
   threshold 110 + valley splits that only cut through genuine column gaps
   — never through an object) → `public/senses/ring/<tendencja>-<k>.png`.
   The manifest (file + true aspect) is hardcoded as `RING_SPRITES` in ring
   order. Layout by `spriteRing(r1, r2)`: even indices → inner row
   `rOuter+59`, odd → outer `rOuter+101`; equal-area √A sizing (common
   scale = the tighter row's budget at 84% coverage, `hCap 0.98·s0`).
   Placement is SLICE-ANCHORED (2026-07-18 independent audit caught 19/37
   sprites drifting onto neighbouring sectors under pure uniform spacing):
   each tendencja's row-items start evenly spread within their slice, then
   gap-equalising relaxation runs with a hard clamp to the slice ±10% pad;
   slices EMPTY in a given row (single-sprite tendencje) donate half their
   arc to each neighbour so no holes open — verified 0/37 off-sector,
   worst deviation 11°, gaps ≤55px. Deterministic — no Date/random. Shown on all
   3 stages. Served via `/_next/image?w=96&q=75` (q must stay 75 — Next 16
   whitelists qualities).

   The same sprites are reused OUTSIDE the dial by the guide card
   (`FocusedCard` in `InteractiveCompass.tsx`) via `ringSpritesFor()` in
   `src/data/sense-images.ts`: a flex row of ≤5 objects across a cream band,
   because the whole image is internally two-rowed and `object-contain` in a
   wide band shrank it to a blob mid-card (client 2026-07-18 "в полоску, а
   не кучку посредине"). Single-blob tendencje (dojrzałe, masło, zielone,
   minerały) borrow their sibling's objects; the 5th column hides under
   `sm:` for the 306px mobile sheet. The dark AI still-lifes in
   `SENSE_IMAGE_MAP` are no longer used by this card.
6. **Curved base-axis captions outermost** — CIERPKOŚĆ arc at `rOuter+133`
   (glyphs grow outward), KWASOWOŚĆ/SŁODYCZ at `rOuter+149` (bottom arcs
   flipped, glyphs grow inward; +149 keeps them ~6px clear of the outer
   sprite row). 19px bright at level 1 / 15px dim at opacity 0.55 on levels
   2-3, 0.1em tracking. The 0/5 value rides INSIDE the caption
   ("KWASOWOŚĆ · 0/5") — the two-row garland claimed every radius a
   separate chip could occupy.

## Interaction (unchanged by the redesign)

Tap-to-set intensity 0–5 per ring (`ringFromEvent`), click targets per
level (3 wedges / 6 sectors / 12 slices), keyboard arrows on sliders,
hover/tour previews now WHITE washes (colour overlays vanish on the
saturated pie). No selection frame on click (`globals.css` focus rules).

## Stage shell (StagedTutorial)

- Desktop: top stage-controls strip is sticky (`top-[5.25rem]`, under the
  fixed nav) with its own ground + backdrop blur.
- Mobile: app-style pinned quick-nav — `sticky
  bottom-[calc(var(--mobile-tabbar-h)+0.75rem)]`, centred so the
  FloatingTasteChat launcher stays clear; ← at stages 2-3, primary
  Następny etap / Pokaż wina.
- Wrapped question headings use `.pitch-display--roomy` (line-height 1.3);
  the display class's 1.04 leading overlaps at text-xl on mobile.

## Canonical-correctness checklist (verified 2026-07-18 vs the poster)

- Sector order clockwise from 12: Tęgie → Miękkie → Oleiste → Świeże →
  Ziemiste → Szorstkie ✓
- 12 tendencje order + PL names = client-approved short forms of the
  official lists (e.g. "Kawa i czekolada" for "tytoń, kawa, czekolada") ✓
- Base axes ON sector boundaries: CIERPKOŚĆ 12:00, SŁODYCZ 120°,
  KWASOWOŚĆ 240° ✓
- Every sprite's objects sit over their own sector ✓

## Regenerating assets

```bash
# 1. re-strip/trim the 12 source images (only if obrazkinut changes)
node scratchpad/process-ring.mjs      # natural-aspect PNGs, height 430
# 2. re-slice into object sprites + print the RING_SPRITES manifest
node scratchpad/slice-ring2.mjs       # paste MANIFEST into TasteCompass
```

(Scratchpad scripts are session-local; both are reproduced in the git log
of `public/senses/ring/` commits if lost.)

## Gotchas

- The geometry margins are TIGHT. After any radius/size/font change,
  screenshot all 3 stages + mobile 390px before shipping (`npm run check`
  does not see visual collisions).
- Curved label run-length estimates assume ~0.62em avg glyph advance —
  Polish diacritics fit, but new longer labels may not; check the arc math
  in `axisHalfArc` / the two-line wrap.
- `public/senses/arc/` (old loose icons) and the whole-image
  `public/senses/ring/<tendencja>.png` files are no longer referenced by
  the dial (the whole-image files remain as slicing sources).
- The dev-mode `.next` cache can corrupt after many rebuilds (JSON parse
  500s on /pl/samouczek) — `rm -rf .next` fixes it; production builds are
  unaffected.
