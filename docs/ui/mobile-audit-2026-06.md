# Mobile audit — 2026-06

Full visual + code sweep of the mobile (375–414px) experience, run to stop
finding issues one at a time. Code audited by 4 parallel agents (layout system /
home+restaurant / pairing+samouczek / admin+forms) against
[mobile-architecture.md](mobile-architecture.md); visual pass driven in a 390px
browser across home, restaurant, pairing, samouczek. Already-fixed bugs (chat
behind tab-bar, card-border divergence, badge contrast) are excluded.

Severity: **P0** = breaks/blocks usage · **P1** = visible bug · **P2** = polish.

---

## P0 — breaks usage

| # | Where | Problem | Fix |
|---|---|---|---|
| 1 | `RestaurantPairingPanel.tsx:453` | Mobile pairing bottom-sheet anchored at literal `bottom-16` (4rem) + `z-30`; tab-bar is `--mobile-tabbar-h` (4.8rem) + `z-[70]`. Sheet base/peek/expanded-footer render **behind** the tab-bar — inline pairing on `/restaurants/[slug]` is the affordance that breaks. Comment claims "Anchored above MobileTabBar" but isn't. **Found independently by 2 agents.** | `bottom-16` → `bottom-[var(--mobile-tabbar-h)]`; re-anchor the `70dvh` from there. |
| 2 | iOS input auto-zoom (cluster) | iOS Safari force-zooms when a focused field has font-size < 16px. Roots: **`globals.css:1056` `.field-refined{font-size:.875rem}`** (~50 admin fields) and **`admin/restaurants/[slug]:602` `inputCls` `text-sm`** (whole DB editor). Singletons: `HomeClient:169` filter select, **`TasteChat:267` chat composer** (the load-bearing chat input!), `admin/signin:85`, `admin/page:1376` (12px). | Bump each to `text-base`/`16px`. Two root-class edits + 4 singletons clears it. |
| 3 | `TasteCompass.tsx:304` + `globals.css` | Classes `.taste-compass-svg/-wrap/-touch` are referenced but **never defined**; the SVG has a `viewBox` but no width/height/aspect-ratio. Renders today (resolves to 100%) but has zero guaranteed sizing — one Preflight change collapses the dial to 300×150. | Add `.taste-compass-svg{width:100%;height:auto;aspect-ratio:1;display:block}` + `.taste-compass-touch{touch-action:manipulation}`. |

## P1 — visible bugs

| # | Where | Problem | Fix |
|---|---|---|---|
| 4 | `FloatingTasteChat.tsx:137` | **Regression from the last chat fix**: panel uses `top-[14vh]` (should be `dvh`); on `/pairing` the chat `defaultOpen`s and the tall sheet covers the page + its top/X can overlap the `z-50` fixed nav on short screens. | `top-[max(5.5rem,14dvh)]`; reconsider `defaultOpen` on mobile (don't auto-cover the page). |
| 5 | `FloatingTasteChat.tsx:108,137` | `/embed/samouczek` renders **no** tab-bar, but launcher+panel reserve `var(--mobile-tabbar-h)` of bottom clearance → FAB floats too high, panel `top-[14vh]` resolves against the auto-sized iframe height. | Gate the tab-bar offset (prop) or use a plain offset in the embed. |
| 6 | `HomeClient.tsx:104` | Home `<main>` lacks `overflow-x-hidden` (pairing/restaurant/admin all have it). Wide eyebrows / map overlay / `sm:min-w-[280px]` stats can trigger a horizontal scrollbar < 375px. | Add `overflow-x-hidden`. |
| 7 | `TasteCompass.tsx:711/757/837` | Compass labels are ~7–9px effective at 375px (viewBox 440 scaled to ~343px). Tendencja/sector/axis labels illegible. | Bump label viewBox font sizes (tendencje ≥12, sectors ≥15) or render fewer on small screens. |
| 8 | `TasteCompass.tsx:213/613` | Radial intensity tap targets ≈20px tall × ~30° — picking "ring 3 of a wedge" is sub-44pt precision (the file's own header promises 44pt). | On touch, widen wedges / tap-to-increment, or enlarge the disc. |
| 9 | `StagedTutorial.tsx:517/526` | DrynessMeter zone labels (`Bardzo wytrawne/Półwytrawne/Bardzo słodkie`) at `text-[9px]` in a `justify-between` row overlap at ~280px usable. | 2 anchor labels on mobile, or abbreviate. |
| 10 | `InteractiveCompass.tsx:322/384` | Tour controls (prev/next `h-9 w-9` + STOP + WOLNO/NORMALNIE/SZYBKO `py-0.5 text-[10px]`) wrap awkwardly and are <44pt. | Speed control on its own row; bump heights. |
| 11 | `HomeClient.tsx:318/339` | Directory card QR aside (`shrink-0` ~120px) doesn't stack under the text at 375px — jagged flex-wrap. | Inner row `flex-col sm:flex-row` (QR full-width under text < sm). |
| 12 | `HomeClient.tsx:383` + `RestaurantPageClient.tsx:201` | Direct-URL value uses `truncate` (and 10px mono on the guest page) — silently clips the QR target URL. | `break-all`/wrapping `font-mono`, ≥`text-xs`. |
| 13 | `RestaurantMap.tsx` (`globals.css` `.wn-marker__label`) | Map labels `white-space:nowrap` overflow the right edge; Mapbox nav buttons ~29px (<44pt); one-finger pan scroll-trap (`cooperativeGestures:false`). | Cap label width + ellipsis (or hide < sm); `cooperativeGestures:true`; scale control hit-area. |
| 14 | `RestaurantPairingPanel.tsx:531/460` | Empty-state dish buttons `py-1.5 text-[11px]` ≈28px and the drag-handle hit-area ≈6px — both <44pt. | `py-2.5`/`min-h-[44px]`; pad the handle wrapper `py-3`. |
| 15 | `PairingClient.tsx:580/674` | Two independent `max-h-[62vh] overflow-y-auto` lists stacked on mobile → large empty voids + nested scroll-trap (confirmed visually: big empty gaps between Menu / Karta win). | Drop inner `max-h` on mobile; let the page scroll. |
| 16 | `PairingClient.tsx:952` | Wine-passport inner grid hard `grid-cols-2` + `text-[10px]`; 6 tiles 2-up at 375px wrap unevenly. | Single-column passport < sm, or reduce padding. |
| 17 | `globals.css:421` + anchors | Three magic nav-height numbers for scroll offset: global `scroll-padding-top:5.5rem`, `scroll-mt-24` (6rem), `scrollMarginTop:6.5rem` — anchored headings can land under the `h-20` (5rem) nav. | Standardize one token tied to nav height. |

## P2 — polish

| # | Where | Problem | Fix |
|---|---|---|---|
| 18 | `MobileTabBar.tsx:28`, `Navigation.tsx:121/168`, `FloatingTasteChat.tsx:153` | Primary controls <44pt: tab links ~40px, hamburger ~41px, lang pills ~24px, chat X `h-8 w-8`. | `min-h-[44px]` on each. |
| 19 | `MobileTabBar.tsx:3` | Imports `Link` from `next/link` not `@/i18n/navigation` — tab hrefs drop the `/pl` prefix (i18n rule violation). | Import from `@/i18n/navigation`. |
| 20 | `PairingClient.tsx:618/736` | Dish/wine names `truncate` (1 line) clip longer Polish names with vertical room free. | `line-clamp-2`. |
| 21 | `TasteCompass.tsx:528/888` | Copy says intensity "0 do 4" but `MAX_INTENSITY=5` (5 dots render). Off-by-one user-facing text. | Copy → "0 do 5". |
| 22 | `InteractiveCompass.tsx:802` | IdleCard sector list `grid-cols-3` + `truncate text-[10px]` clips names in the narrow panel. | `grid-cols-2` on mobile. |
| 23 | `admin/page.tsx:1452` | Raw JSON `<pre>` payload is a mobile-hostile wall (break-all). | `hidden sm:block` the raw payload. |
| 24 | `FloatingTasteChat.tsx:133` | Mobile backdrop only dims a gradient; taps in the top gap fall through instead of dismissing. | Full-cover dismiss target / `bg-black/30` floor. |
| 25 | `layout.tsx:39` | No `viewport-fit:cover`, so all `env(safe-area-inset-*)` resolve to 0. Works now, but PWA-standalone (`appleWebApp.capable:true`) won't auto-handle the home indicator. | Decide explicitly: set cover + rely on existing `env()`, or document. |

---

## Recommended fix batches

- **Batch P0 (do first, ~1 deploy):** #1 pairing-sheet `var(--mobile-tabbar-h)`, #2 iOS-zoom (2 root classes + 4 singletons incl. the chat input), #3 compass SVG sizing + #4/#5 chat-fix regressions. High impact, low risk, mostly token/className edits.
- **Batch P1-layout:** #6 overflow-x, #11 QR stack, #12/#13 URL+map, #15 pairing scrollers, #16/#22 passport+idle grids, #17 scroll-offset token.
- **Batch P1-compass:** #7 label sizes, #8 tap targets, #9 dryness labels, #10 tour controls — these are a focused samouczek-mobile pass.
- **Batch P2:** tap-target sweep (#18), i18n Link (#19), text clamps (#20/#21), misc.

Counts: **P0 ≈ 3 themes (8 edits) · P1 ≈ 14 · P2 ≈ 8.**
