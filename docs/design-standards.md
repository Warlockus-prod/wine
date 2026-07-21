# Vinovigator — design & working standards

The rules this project is built to. Written 2026-07-21 as a retrospective of
the design system that settled over the July 2026 passes. If you change the
UI, follow these; if a rule blocks you, change the rule here first, then the
code — don't silently diverge.

Companion docs: `design-pass-2026-07.md` (the UX pass), `wheel-redesign-2026-07.md`
(the Vinocompas dial), and the invariant block in `../CLAUDE.md`.

---

## 1. Colour

### 1.1 The triad
The whole product is three colours. Everything else is a tint or alpha of them.

| Role | Light (shipped) | Dark (toggle) |
|---|---|---|
| **Navy** — brand, ink, CTA | `#0b1f44` (deep `#061633`) | surfaces `#0b1f44` / `#16294f` / `#081634` |
| **Cream** — canvas, cards | `#f4efe9` page · `#ffffff` cards · `#efe7db` deep · `#fbfaf6` inputs | ink `#f4efe9` |
| **Gold** — accent, hairlines | `#9c7536` | `#c79f69` |

Ink ramp (secondary → meta): light `#3a4d6e` → `#5a6478`; dark `#cdd4df` → `#8f9bb3`.

### 1.2 Light cream is the shipped default
`data-theme="light"` is static on `<html>`. A theme toggle exists and
persists (`vinovigator-theme`), so **both themes must be styled** — never
assume light. Dark mode is reachable and real; a cream-hardcoded panel becomes
a bright island on navy (this actually shipped once — the pairing passport).

### 1.3 Tokens, never hex
Use the CSS variables (`var(--ink)`, `var(--surface-elevated)`, `var(--color-accent-gold)`, …).
Hardcoded hex is a theme bug waiting to happen: `#0b1f44` reads as ink in
light and as *background* in dark. The only sanctioned raw hex are the
licensed wheel colours (§3.6) and documented one-offs.

Legacy dark-vocabulary utility classes (`text-white`, `text-gray-*`, `bg-black/*`,
`border-white/*`) survive **only** because `globals.css` shims remap them for
light mode. Panels that must stay navy in light mode use `.keep-dark` **and**
paint their bg via inline style (shims can't match inline styles).

### 1.4 Gold is not an ink for small text
Gold on cream tops out at **3.76 : 1** (`#9c7536`) — below the 4.5 : 1 that
text < 18.66px needs. So:
- Gold is for **large** italic serif accent lines, hairlines, borders, fills.
- Small uppercase labels/eyebrows use `--ink-muted` / `--ink-soft`, not gold.
- A sector's own hue is **not** an ink either — half the palette fails as
  11px text on cream (Oleiste `#f4c84a` = 1.43 : 1). Carry the colour on a dot,
  keep the label in ink.

Off-palette Tailwind colours (`amber-*`, `emerald-*`, `rose-*`) are banned in
product UI — green/amber are not in the triad. Status uses gold (live) /
hairline (degraded) / paper-tint (working).

### 1.5 One CTA language
`.pitch-cta-primary` (gradient navy/red, gold border) and `.pitch-cta-ghost`
(gold outline), both pill-shaped. Don't invent new button shapes.

---

## 2. Typography

### 2.1 Exactly two families — no third
| Family | Variable | Role |
|---|---|---|
| **Libre Baskerville** (serif, italic for accents) | `--font-serif`, `.pitch-display` | Display, h1–h5, editorial accents |
| **Libre Franklin** (sans) | `--font-display` *(name is historical)* | Body, UI, small caps, captions, numerals |

A third typeface is a regression. `font-mono` is banned — digit counters use
Franklin with `tabular-nums`, not a monospace family. Verify with a page sweep:
every rendered `font-family` must resolve to one of these two.

### 2.2 Sizes are deliberate
Wrapped display headings use `.pitch-display--roomy` (line-height 1.3) — the
1.04 of `.pitch-display` overlaps at `text-xl` on mobile. Wheel label sizes are
in §3.4.

---

## 3. Placement — the Vinocompas wheel

`VIEW = 640`, centre `(320, 320)`, `rOuter = 165`, `rInner = 36`.
Angle 0 = 12 o'clock, growing clockwise: `x = cx + r·sinθ`, `y = cy − r·cosθ`.

### 3.1 Geometry is canonical and LOCKED
The pure maths lives in `src/lib/compass-geometry.ts` (no React/DOM) and every
invariant is unit-tested in `compass-geometry.test.ts`, which runs in the gate:
- Sector order clockwise from 12: **Tęgie → Miękkie → Oleiste → Świeże →
  Ziemiste → Szorstkie** (`COMPASS_SECTORS` is the single source of truth).
- Base-taste axes fall **on** sector boundaries: CIERPKOŚĆ 12:00, SŁODYCZ 120°
  (4 o'clock), KWASOWOŚĆ 240° (8 o'clock). No `−π/2` offset — ever.
- Every sprite sits inside its own 30° slice.

A red test here means the wheel stopped matching the licensed poster. Fix the
geometry, don't relax the test.

### 3.2 The garland — one object per sprite
Each official association image (`vinocompas_graphics/obrazkinut/`, 1536×1024)
is cut into individual objects by `scratchpad/slice-grouped.mjs` (true 2D
connected-components) → `public/senses/ring/<tendencja>-<k>.png`. Rules:
- **One object per sprite.** No glued groups. A touching composition that
  reads as one unit (honey jar + comb) may stay; distinct objects (horse vs
  campfire vs leather) must be separate.
- **No duplicates.** The source sheets repeat decorative objects; keep one
  representative (`scratchpad/curate-sprites.mjs` holds the KEEP lists).
- Current count: **74 sprites** across 12 tendencje.

### 3.3 Garland layout — equalise, don't hand-tune
`spriteRing(rOuter+52, rOuter+92)` — two staggered rows.
- **Coverage 0.70** of each row's circumference (uniform air).
- **Height cap** `min(0.98·s0, rowGap−2)` — a sprite can never be taller than
  the gap between rows, so the rows can't stack radially.
- **Area equalisation**: every sprite is pulled toward its row's median area,
  bounded `[0.72, 1.32]`, so nothing dwarfs its neighbours. The dense 11–2h
  crown (`cigaro`/`suszone`/`dab`) gets an extra ×0.88.
- Placement is **slice-anchored** (a 2026-07 audit found 19/37 sprites drifting
  onto neighbours under pure uniform spacing) — locked by the slice test.

The card (`ringSpritesFor`) reuses the same sprites in a strip of ≤5; a
tendency card shows **only its own** objects (no sibling borrow now that every
tendency has ≥2).

### 3.4 Labels — curved, outside the rim
- Tendency names (level 3): 13.5px Franklin, curved `<textPath>` at `rOuter+13.5`
  (single line) or `rOuter+8 / +21.5` (two-line, long names), bottom arcs
  auto-flipped readable.
- Sector names (level 2): 18px at `rOuter+13`.
- Mid-pie italic sector names (level 3): 15px Baskerville.
- Base-axis captions: 21px (bright, level 1) / 16px (dim 0.55, level 2-3),
  outermost — CIERPKOŚĆ arc `rOuter+133`, SŁODYCZ/KWASOWOŚĆ `rOuter+149`. The
  0/5 value rides inside the caption (`KWASOWOŚĆ · 0/5`), no separate chip.

### 3.5 Centre medallion — `rHub = 44`
The cream disc behind the "Vinocompas" wordmark. **Rule: every line drawn from
the centre must start at `rHub`, not `(cx,cy)`**, or it crosses the medallion
and lands on the text. The medallion circle and all centre-origin lines
(dividers are covered by the opaque disc; the base-axis dashed anchor + value
beam start at `rHub`) reference the one constant so they can't drift. `rInner`
stays 36 for the ring math and the tap-to-reset hit zone.

### 3.6 Colour on the dial — count = selectable segments
The pie is full-saturation; the **colour count equals the stage's selectable
segment count** (12 hues behind a 3/6 picker confused users):
- Level 1: 3 wedges (`BASE_WEDGE_VIVID`, blends of the sector palette).
- Level 2: the six site sector colours (`COMPASS_SECTORS[].color`):
  Tęgie `#8a4b2a` · Miękkie `#e74c3c` · Oleiste `#f4c84a` · Świeże `#9bc24a` ·
  Ziemiste `#2c5d8e` · Szorstkie `#5a2c5e`. Same hues as the legend/explorer.
- Level 3: the official licensed 12 (`TENDENCJA_COLOR`).
Intensity is an **inverted cream wash** (`#f6efe2`) laid over the rings above
the chosen value — the resting pie is vivid.

### 3.7 Arrowheads — plain triangles, tips outside, 3 tiers
Simple 3-point triangles on the divider boundaries, tips **past the rim**,
sized by the stage that introduced the boundary (`[bodyLen, halfW, tipOut]`):
base axes `[11, 9, 20]` · sector borders `[8, 6, 12]` · tendencja borders
`[5, 4, 6]`. Tips land at `rOuter+6 / +12 / +20` — three clearly distinct
sizes. So stage 1 = 3 big, stage 2 = 6 in two sizes, stage 3 = 12 in three.

### 3.8 Margins are NOT tested — verify by eye
The canon tests cover sector/slice/order only. Radii, font sizes, tile sizes,
the medallion, the arrows — none are covered. **Screenshot after any
radius/tile/font change**, at 1440 / 390 / 320, both themes.

---

## 4. How we work

### 4.1 Measure, don't guess
Overlaps, contrast, gaps, drift — compute them, don't eyeball. Every UI claim
in this session was backed by a number (gap in px, contrast ratio, sprite area,
off-sector degrees). A screenshot *confirms*; a measurement *decides*.

### 4.2 Verify the value, not the render
A local screenshot can look right while the deployed attribute is wrong (three
font bumps silently no-op'd once; a stale next/image cache showed an old
sprite). After deploy, read the **actual attribute** (`font-size`, sprite
count, computed colour) on the live DOM — not the picture.

### 4.3 The gate is non-negotiable
```
npm run check   # = lint + test:unit (vitest) + build + test:e2e (57)
```
All four pass before any push. Locally `DATABASE_URL` is a placeholder, so DB
`Failed query … ENOTFOUND invalid` and Wikipedia `429`s in the e2e log are
expected noise, not failures — read the final `57 passed` line.

### 4.4 Manifest sync is invariant
Sprite counts must agree across three places: files on disk = `RING_SPRITES`
(wheel) = `RING_SPRITE_COUNTS` (card). The card↔wheel↔disk test enforces it.
Re-slicing without updating both manifests is a guaranteed red.

### 4.5 Deploy + verify on prod
```
git push origin main
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@178.104.223.93 'bash /opt/repos/wine_web_wn/update_wine_web.sh'
```
Then curl the routes (expect 200) and re-measure the changed thing on the live
site. The deploy `rm/run`s the container, so a curl in the swap window can 502
briefly — retry, don't panic. Prod rebuilds `.next` fresh, so it never serves
the stale image cache that bites local dev.

### 4.6 Copy is canonical
Guest-facing Polish comes from the client's `vinocompas_graphics/vinocompas
system` doc, applied verbatim. Brand is **Vinocompas** (with C) everywhere.
EN is a first-pass translation pending a native/sommelier vet. Don't leak the
data model into guest copy ("rekordów" was DB jargon, removed).

### 4.7 Reusable asset scripts live in `scratchpad/`
`slice-grouped.mjs` (cut originals → object sprites), `curate-sprites.mjs`
(drop duplicates, renumber, regen manifest). They're in the repo so the
pipeline is reproducible — an earlier ephemeral scratchpad was lost.
