# Vinovigator AI — Independent UI/UX & Visual Design Audit (2026-06-18)

**Scope:** every visual surface of wine.icoffio.com — home directory, guest restaurant page, `/pairing`, `/samouczek`, `/pitch`, `/admin` — evaluated first-hand in **both light and dark themes**, desktop and mobile, cross-referenced against the code. Independent assessment + prioritized recommendations.

**Method:** heuristic review (Nielsen + visual-design principles), live inspection in-browser, and code-level verification of the theme system, image pipeline, icon system, and component structure.

---

## 0. Verdict & overall grade

**Overall: B− (strong concept and dark theme; let down by light-theme readability, broken imagery, and a flaky icon system).**

The product has a genuinely premium *concept* and a polished **dark** theme — the editorial hero, Playfair display type, wine-red + gold palette, and the bidirectional pairing logic are real strengths. But it is **not yet client-ready**, for three reasons that recur on almost every screen:

1. **Light theme is half-finished.** Many components hardcode dark-mode text colors (`text-gray-300/400`, gold, fixed hex) that the `data-theme="light"` override doesn't fully remap, so on cream backgrounds large amounts of text and several badges are near-invisible.
2. **Imagery is broken/inconsistent.** The QR code renders blank everywhere; wine/dish photos appear on some screens and as empty squares on others; compass sectors have one photo of six.
3. **Icons are unreliable.** They depend on a web-loaded icon font and flash as ligature text ("light_mode", "settings", "smart_toy") during load — sometimes never resolving in a session. This is the single most damaging issue for first impressions.

Grades per area below.

| Area | Grade | One-line |
|---|---|---|
| Brand & art direction | **A−** | Distinctive, cohesive, premium-leaning |
| Typography | **A−** | Playfair + Jakarta is excellent; a few truncation bugs |
| Dark theme | **B+** | Polished; minor contrast nits |
| **Light theme** | **D** | Large readability failures; feels unfinished |
| **Iconography** | **D+** | Font-load race → ligature text; needs inline SVG |
| **Imagery / assets** | **D** | Blank QR, inconsistent photos, missing sector images |
| Layout & spacing | **B** | Good rhythm; isolated overflow/truncation |
| Responsive / mobile | **B−** | Mostly fine; chrome + a few cards need work |
| Information architecture | **B+** | Clear; recently de-duplicated (good) |
| UX flows | **B+** | Directory→venue→pairing→tutorial is logical |
| Microcopy / i18n | **B** | Mostly localized; a few mixed-language admin bits |
| Motion | **B** | Tasteful; respects reduced-motion |
| Accessibility | **C+** | Contrast failures + interactive-SVG keyboard gaps |

---

## 1. Iconography — **P0, fix first**

**Finding.** Chrome icons (nav logo, theme toggle, Mobile/Panel, bottom tab bar, the bot launcher, chat `smart_toy`) use the Material **icon font** via ligatures. Until the font downloads, the browser renders the *ligature name* as text — "wine_bar", "light_mode", "settings", "travel_explore", "smart_toy". Observed live: sometimes icons resolve, sometimes they stay as text for the whole session (load race). On a phone over mobile data the text persists for seconds. This is what every one of your screenshots captured.

**Why it's P0.** It's the first thing a client sees, it breaks the nav layout (ligature text is wider than a glyph → overlaps the wordmark), and it looks broken.

**Recommendation (durable).** Replace the ~23 chrome/icon usages with **inline SVG icons** (a tiny local icon set). No external font, no FOUC, no CSP dependency, works offline, themeable via `currentColor`. This is the client-ready fix.
**Stop-gap (if SVG migration is deferred):** add `&display=block` to the Symbols font URL (hides the ligature text during load instead of showing it) **and** `<link rel="preload" as="font">` the woff2, **and** give every `.material-icons` span a fixed width/height so layout never shifts. This hides the flash but keeps the font dependency.

---

## 2. Light theme — **P0, systemic**

The `data-theme="light"` block in `globals.css` remaps the palette, but components that hardcode dark-mode colors slip through. Confirmed live:

- **"AI GOTOWE" badge** (`PairingClient` ~550) — pale-green pill with light text → text invisible on light.
- **Wine/dish card meta** — "Champagne, France • 2022", grape names, "#1 · Najlepsze dopasowanie", and the "% DOPASOWANIA" pills are far too low-contrast on cream cards.
- **Compass** (`/samouczek`) — sector wedge fills and gold-on-cream axis labels wash out; the disc reads muddy in light mode.
- **Hero stat block & filters** — borderline; gray labels on cream need a darker token.

**Root cause.** Components reach for fixed Tailwind grays (`text-gray-300/400/500`), `text-white`, low-opacity gold, and arbitrary `bg-[#…]`/`rgba()` instead of the theme-aware tokens (`--ink`, `--ink-soft`, `--ink-muted`, `--surface-*`). The light override can't catch arbitrary values.

**Recommendation.**
1. **Systemic (highest leverage):** in the light override, force readable ink on the common offenders — map `.text-gray-300/.text-gray-400/.text-gray-500` (where used for body/meta) to `var(--ink-soft)/var(--ink-muted)`, and ensure status-pill backgrounds get sufficient text contrast. A handful of override rules fixes most of the page.
2. **Per-component:** convert the worst offenders (AI GOTOWE badge, card meta lines, % pills, compass labels) to tokens. The badge should be a solid, legible chip in both themes (e.g. emerald-700 text on emerald-100 in light; current pale-on-pale fails WCAG).
3. **Define a contrast floor:** every text token must hit ≥4.5:1 (body) / ≥3:1 (large) on its surface in *both* themes. The brand gold `#c5a059` fails AA as body text on both — reserve it for accents/large text only.

---

## 3. Imagery & assets — **P0/P1**

- **QR code renders blank** on the guest page and the home cards (white/empty box, sometimes a broken-image "?"). For a product whose entire pitch is "scan the QR," a non-rendering QR is a showstopper. → Fix the QR source (`buildQrUrl`/the QR image URL or generation); verify `img-src` CSP allows it; render a real QR (server-generated SVG/PNG is most robust).
- **Dish/wine photos inconsistent** — they render on the guest page's AI-Sommelier panel but appear as **empty squares** in `/pairing` and the menu list. → The two surfaces resolve images via different paths (`food-photos.ts` local map vs a field that's empty for some ids). Standardize on one resolver and ensure every served id has a local asset (re-run the image generator so there are no empty fallbacks).
- **Compass sector images** — only "Świeże" has a photo; the other five sectors are bare. → Either give all six a curated image (consistent treatment) or none. Mixed looks unfinished.

---

## 4. Layout, spacing, responsive — **P1/P2**

- **Title truncation** — "Sukiyabashi Jiro" clips on the mobile restaurant card; long wine names truncate mid-word. → allow 2 lines / `text-balance`, reduce size a step on mobile, or widen the text column.
- **Bot launcher** was clipped by the bottom tab bar — *fixed this session* (raised above the bar with safe-area offset).
- **Selected pairing card ring** was clipped by the scroll container — *fixed this session* (inner padding).
- **Mobile stat box overflow** — *fixed this session* (min-width gated behind `sm:`).
- Spacing rhythm is otherwise good; radii are slightly inconsistent (`rounded-[24/28/30/34]`) — worth a small scale.

---

## 5. Information architecture & UX flows — **B+ (mostly good)**

- The core flow — **directory → venue page → pairing workspace → samouczek** — is logical and the cross-links are sensible.
- **Wine duplication on /pairing** (each wine shown in a top-3 strip *and* the list) — *fixed this session* (strip removed; ranked list keeps #1/#2/#3 badges). Big de-clutter win.
- **Admin** had two parallel editors (localStorage demo + DB) — *consolidated this session* (legacy duplicate removed, CTA to the DB editor).
- Remaining: the **pairing chat panel** packs four stacked bubbles (compare → reason → Vinokompas → service note) — information-dense; consider collapsing the service note or making the Vinokompas card the hero and the rest secondary.

---

## 6. What's genuinely strong (keep)

- **Brand & art direction** — the wine-red/gold/cream palette, Playfair display, Roman-numeral eyebrows, gold hairlines, paper-grain — a coherent Michelin-guide × winery feel. Don't dilute it.
- **Dark theme** is the showpiece; the editorial hero on the guest page and `/pitch` are genuinely premium.
- **Pairing logic** (bidirectional re-ranking, the AI Vinokompas rationale) is a real differentiator.
- **Samouczek concept** (interactive compass tutorial) is distinctive and on-brand.

---

## 7. Prioritized roadmap

**P0 (block client demo):**
1. Icons → inline SVG (kills the ligature-text flash for good).
2. Light-theme readability — systemic token fixes + the AI GOTOWE badge + card meta + % pills + compass labels.
3. QR code rendering (the core feature) + image-pipeline consistency.

**P1:**
4. Title/wine-name truncation on mobile.
5. Compass light-mode sector/label contrast.
6. Sector-image standardization (all six or none).
7. Pairing chat density / hierarchy.

**P2:**
8. Radius/spacing scale consistency.
9. Interactive-SVG keyboard a11y (compass, map markers).
10. Reserve gold for accents only (contrast floor enforcement).

---

## 8. Note on method

This is the independent expert evaluation. A complementary automated code-level audit (7 parallel agents across the theme system, image pipeline, every surface, and the token architecture) is producing exact `file:line` fixes for each item above; those will be appended as an implementation checklist. The grades and priorities here stand on their own.
