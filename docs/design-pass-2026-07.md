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

## Verification round (same day)

A second 5-agent audit verified 39/43 checklist items fixed on live and caught
the stragglers, fixed in the follow-up commit:

- **Serif STILL broken after the runtime-copy fix**: custom properties
  substitute their inner `var()`s at the element where they are *declared* —
  the copies sat on `:root` (html) while next/font put
  `--font-libre-baskerville` on `<body>`. Fix: the font variable classes moved
  from `<body>` to `<html>` in `[locale]/layout.tsx`. `.pitch-display` now
  explicitly `font-weight: 400` (Baskerville ships 400/700 only) with
  re-tuned tracking/line-height for real serif glyphs.
- **`.vk-rise` stagger was dead CSS**: the un-layered atom's `animation`
  shorthand resets `animation-delay`, and un-layered beats the layered
  `[animation-delay:…]` utilities. The atom now reads
  `animation-delay: var(--vk-delay, 0ms)`; bubbles pass `--vk-delay` inline.
- **/api/pairing/explain 401 → bubble unmounted**: now soft-fails IN PLACE
  with a friendly PL/EN sentence (not cached). Root cause of the 401: the
  production **OpenAI key is revoked at the provider** (verified: same
  sk-proj… key 401s from container, VPS host and local dev). Rotating needs
  a new key from the OpenAI dashboard → `.env.local` (local + VPS) + docker
  container re-create (env is read at create).
- Mobile result bar: score moved out of the truncating wine-name span.
- Restaurant: mobile cue now says "wina w panelu poniżej" (the right rail is
  lg-only); empty-state pairing panel renders nothing on mobile and hugs its
  content on desktop.
- Samouczek: proposal matcher dedupes bottle formats of the same label
  (Portillo Malbec 37,5 cl); stage-1 tab shows "3 smaki" below sm;
  wine-compass-kb display strings use em-dashes (20 strings).
- Pitch: tier numerals `text-[0.72rem]!` (unlayered `.pitch-roman` beat the
  plain utility), maroon `#1f1115` remnants → navy, curated tiles off the
  `bg-primary/N` classes that picked up the light-shim's reddish glow.
- Homepage map: explicit "Mapa jest niedostępna…" fallback when WebGL/token
  is unavailable (was a silent blank panel). Nav alpha 0.97 → 0.99.

## Client copy round 3 (2026-07-16) — "Vinocompas AI teksty na stronę"

The client delivered final Polish copy for /samouczek plus a guiding
principle: *etap 1 uczy, że wytrawność to coś więcej niż cukier; etap 2 uczy
rozpoznawania charakteru wina; etap 3 uczy zapamiętywania charakteru poprzez
obrazy i skojarzenia* — the tutorial assumes NO wine knowledge, only taste,
emotion and imagination. All texts below are the client's, verbatim
(including the "Vinocompas" brand spelling on these surfaces):

- Hero: eyebrow "Vinocompas AI", H1 "Poznaj swój winiarski gust", new lede,
  CTA "Rozpocznij"; the secondary "Otwórz Pairing" hero button was dropped
  ("pomijamy"). (`SamouczekClient.tsx`)
- Stage 1: tab sub "3 osie smaku"; question-heading "Jak odbierasz smak wina,
  które lubisz?" + short instruction; dryness meter renamed "Twój profil
  wytrawności" with the client's caption. Stage 2: heading "Jaki charakter ma
  wino, które lubisz?" + the "wrażenia opisują wino jako całość" intro.
  Buttons: "Pokaż dopasowane wina", "Wyczyść". (`StagedTutorial.tsx`)
- Right panel (IdleCard): level 1 = "Potrzebujesz pomocy?" + hover/guide
  lines + the "Smak to punkt wyjścia…" concept block; level 2 = "Poznaj
  sześć wrażeń" + concept text; button "Uruchom przewodnik"; sector legend
  hidden at level 1; intensity 4/5 comment → "Mocne — jedno z głównych
  wrażeń Twojego wina". (`InteractiveCompass.tsx`)
- KB: the 3 axis descriptions (proportion-based wytrawność framing) and all
  6 sector `long_pl` ("X to wrażenie kojarzące się z …") — these feed the
  hover cards, the "PEŁNY OPIS WRAŻENIA" expandable AND the AI system
  prompt, so the bot speaks the same language. (`wine-compass-kb.ts`)

A dedicated verification agent then confirmed all 8 round-3 checklist areas
verbatim on production (both viewports) and flagged three polish items, fixed
same-day: level-aware tour hint vocabulary (smak/wrażenie/tendencja — no
stage-3 jargon at etap 1), a neutral "Zaznacz osie…" empty state for the
dryness meter (an all-zero profile used to assert "Wytrawne"), and a
full-width row for the long "Pokaż dopasowane wina" button on the mobile
control grid (was wrapping to 3 lines).

## Mobile deep-audit (2026-07-16) — 320/390/414, interactions included

A 5-agent programmatic sweep (horizontal overflow, text clipping,
fixed-layer overlap at 3 scroll depths, plus eyeballed screenshots of every
interactive state) found 19 issues, all fixed and re-verified live at 320px:

- **Token mismatch**: `--mobile-tabbar-h` (76.8px) vs the rendered tab bar
  (73px) showed a 4px see-through slit under every bottom-anchored bar/sheet
  → the tab bar's height is now pinned to the token.
- **320px width class**: hero stat labels (8px base — "RESTAURACJE" is one
  unbreakable word in a 63px cell), expanded QR 128px, selects `w-full
  min-w-0`, pairing dish-card match block capped at 45% (+%-only label) —
  the title column was 8px wide, result bar reclaims FAB clearance (name had
  0px), pitch tier grid `grid-cols-1` ("Porozmawiajmy" price forced 57px
  page overflow), compass side axis labels lifted 10 units into the medallion
  gap.
- **Fixed-layer choreography**: chat FAB hides (max-md) while the pairing
  result bar is up and is 48px below sm; restaurant sheet height capped
  below the top nav (the grab handle slid under it — taps swallowed);
  collapsed ghost handle removed; scrim added behind the open sheet;
  samouczek "?"-sheet content clears the ✕ (the N/5 pill rendered beneath
  it); the "Co oznacza…?" button scroll-margins above the tab bar and
  auto-nudges into view on focus change.
- Nav is now fully opaque in light theme; pairing dish prices show zł.

## Vinocompas canon sync (2026-07-17)

Cross-checked the whole wheel against the authoritative source
(vinocompas.pl "Opis systemu" + parfumealavin.my.canva.site/samouczek).
Methodology: 3 base tastes (SŁODYCZ/CIERPKOŚĆ/KWASOWOŚĆ) → 6 wrażenia →
12 tendencje, each rated 0–5; original gate is "co najmniej 7 skojarzeń".
Our structure, sector order, geometry, colours and all 12 tendencja
`name_pl` values are **100% canonical**.

The `/senses/arc/*` icon ring is the visual dictionary of each tendencja's
canonical associations — **regenerate only from the samouczek association
text** (the `SUBJECTS` map in `scripts/gen-arc-icons.mts` is the source of
truth). Two clusters were corrected 2026-07-17: `szorstkie.pizmo` had
lavender/herbs (those are Ziemiste) — it's now animal/musk/leather per the
canon ("skojarzenia zwierzęce: mokry pies, koń, stajnia, skóra");
`ziemiste.sciolka` gained the canonical violets/lavender/cut-grass.
On-wheel Szorstkie labels are now "Piżmo i skóra" / "Dąb i dym".

Open (product decision): our proposal gate is `MIN_FILLED=4` while the
original Vinocompas asks for 7 associations — raise to 7 or drop the
"jak w oryginalnym Vinokompasie" line from the nudge copy.

## Final full re-audit (2026-07-17) — 9 agents, adversarially verified

After the backlog + audit waves, a fresh 6-lens re-audit against live
confirmed nearly everything WORKING (all backlog features, canonical wheel,
zł currency, security headers, X-Powered-By gone, admin not prefetched,
Mapbox code-split). Three real i18n gaps found + fixed:
- AI chat CHROME was 100% Polish on the EN site (only replies localized) —
  TasteChat + FloatingTasteChat now take a `lang` prop (derived from
  document.documentElement.lang) with EN variants for greeting, suggestion
  chips, header, clear, placeholder, send, fallbacks and all aria-labels.
- Dish-category eyebrows leaked English on the PL restaurant page
  (RICE/COLD/GAME/SUSHI…) — `CATEGORY_PL` was 12/16; completed to 16 in BOTH
  RestaurantPageClient and RestaurantPairingPanel (the two maps had drifted).
- Cuisine/country eyebrows raw English on the PL restaurant hero — added
  `CUISINE_PL`/`COUNTRY_PL` render-time maps.
Plus lows: EN Szorstkie wheel labels (Musk & leather / Oak & smoke),
theme-aware compass focus ring (was hardcoded bright gold, failed 3:1 on
cream), mobile result-bar aria-label now carries name + %.

## Arc-icon canon (client poster reference)

The client's reference poster is the visual target: each tendencja's hanging
cluster mirrors the poster's imagery. szorstkie.pizmo now leads with an
actual HORSE (the poster shows "koń") + leather/saddle/fur/musk. Stage-control
buttons made compact (36-38px) per "mniejsze guziki wyżej".

## Guardrails honored

- e2e contract kept: 3 stage tabs (/ETAP \d/i ×3), slider aria-labels,
  smoke strings ("Unikalne URL", "bezpośredni dostęp", "Kontekst: …",
  exact pairing headline PL string), heading roles.
- `mobile-visual` snapshots for home + pairing regenerated deliberately
  (above-the-fold redesign); spec files untouched.
- Analytics emitters, SWR/data flow, explain caching, localStorage keys —
  all byte-compatible.
