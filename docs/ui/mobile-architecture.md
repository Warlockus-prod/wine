# Mobile UI architecture

One reference for how the phone layout is wired, so fixes stay systematic
instead of one-off patches. Read this before touching anything that is
fixed/sticky, anchored to the bottom of the screen, or theme-dependent on mobile.

Breakpoints (Tailwind defaults): mobile = default (`< sm`), `sm` 640, `md` 768
(the bottom tab-bar hides here), `lg` 1024, `xl` 1280.

---

## 1. The bottom-anchored stack — `--mobile-tabbar-h` is the single source of truth

Mobile has a fixed bottom tab-bar (`MobileTabBar.tsx`, `md:hidden`). **Everything
anchored to the bottom of the screen must clear it.** To avoid magic numbers in
several files, the tab-bar height lives in one CSS variable (`globals.css`):

```css
--mobile-tabbar-h: calc(4.8rem + env(safe-area-inset-bottom));
```

- `4.8rem` ≈ the rendered tab-bar (icon + label + padding ≈ 4.2rem) plus a small cushion.
- `env(safe-area-inset-bottom)` adds the iPhone home-indicator inset (it is `0`
  unless the viewport is `viewport-fit: cover`, which we currently do **not** set —
  the browser keeps content above the indicator on its own, so the term is a
  harmless future-proof).

Consumers (all reference the var — never hardcode the height):

| Consumer | Value | File |
| --- | --- | --- |
| Page content cushion | `.mobile-safe-bottom { padding-bottom: var(--mobile-tabbar-h) }` | `globals.css`, applied to `<main>` in `HomeClient.tsx` |
| Floating-chat launcher (collapsed FAB) | `bottom: calc(var(--mobile-tabbar-h) + 0.95rem)` | `FloatingTasteChat.tsx` |
| Floating-chat panel (expanded) | `bottom: calc(var(--mobile-tabbar-h) + 0.5rem)` | `FloatingTasteChat.tsx` |

**Rule:** any new bottom-pinned element (sticky CTA, toast, sheet) uses
`bottom: var(--mobile-tabbar-h)` (or `+ a small gap`). Do not reintroduce literal
`bottom-2` / `4.8rem` / `5.75rem` values.

---

## 2. Z-index layering (mobile)

| z-index | Element | File |
| --- | --- | --- |
| `z-[400]` | Map overlays (label, selected-restaurant card) — only on the home map | `HomeClient.tsx` |
| `z-[70]` | `MobileTabBar` (fixed bottom nav) — **top layer on mobile** | `MobileTabBar.tsx` |
| `z-[60]` | Floating-chat **panel** (mobile) — sits above page + backdrop, below the tab-bar | `FloatingTasteChat.tsx` |
| `z-40` | Floating-chat launcher; chat panel on desktop (`sm:z-40`) | `FloatingTasteChat.tsx` |
| `z-30` | Floating-chat backdrop scrim (mobile, tap-to-dismiss) | `FloatingTasteChat.tsx` |

**Rule:** the tab-bar (`z-[70]`) is the top layer. An overlay that needs to cover
it must use `z > 70`; otherwise it sits **below** the tab-bar and must physically
clear it (see §1). The chat panel deliberately sits below the tab-bar and clears
it — it does **not** try to draw over it.

---

## 3. Floating chat (the load-bearing mobile pattern)

`FloatingTasteChat` (launcher + expanded panel) wraps the layout-agnostic
`TasteChat` (header → scrollable messages → composer).

- **Launcher**: collapsed FAB, bottom = above the tab-bar (§1).
- **Panel (mobile)**: a sheet from `top-[14vh]` down to
  `bottom: calc(var(--mobile-tabbar-h) + 0.5rem)`. A definite top+bottom gives a
  fixed height, so `TasteChat`'s flex column fills it: header, `flex-1` scrollable
  messages, and the composer pinned at the panel's bottom. Because the panel
  bottom is **above** the tab-bar, the composer is always visible and tappable.
- **Keyboard**: `viewport.interactiveWidget = "resizes-content"` (`[locale]/layout.tsx`)
  shrinks the layout viewport when the on-screen keyboard opens, so the
  bottom-anchored panel rises above the keyboard instead of being covered.
- **Desktop (`sm:`)**: resets (`sm:top-auto`, `sm:bottom-5`, `sm:max-h-[calc(100dvh-6rem)]`,
  `sm:w-[380px]`, `sm:z-40`) to a 380 px dock at bottom-right.

**Pitfall (fixed 2026-06):** the panel used `bottom-2 max-h-[58dvh]`, so its
composer landed in the bottom ~76 px that the tab-bar (`z-[70]`) covers → the
input was unreachable and the area "wouldn't scroll". Always anchor the panel
bottom to `--mobile-tabbar-h`, not to the viewport edge.

---

## 4. Restaurant directory cards (`HomeClient.tsx`)

Grid: 1 col mobile / `md:` 2 / `xl:` 3. Card = `rounded-[28px] border-2 p-4`.
Selected (picked on the map) = `border-primary/60` + a soft drop-shadow glow.

**Pitfall (fixed 2026-06):** the selected card used `border` (1 px, radius 28)
**plus** `shadow-[0_0_0_2px …]` (a 2 px spread ring whose corner radius is ~30).
On a retina phone the two outlines diverge at the rounded corners — the reported
"рамки разъезжаются". Fix: **one outline per frame** — `border-2` for the edge and
only a *blurred* drop-shadow for depth. Never combine a border with a same-edge
`0 0 0 Npx` spread-shadow ring.

---

## 5. Badge system (`RestaurantFormat.tsx`)

The `format` string (`"Type · Accolade"`, e.g. `"Peruvian Nikkei · World #1"`,
`"Haute cuisine · 3⭐ Michelin"`) renders as two chips:

- **Type pill**: a neutral outlined chip (`border-[var(--hairline-strong)]`,
  `text-[var(--ink-soft)]`). Theme-robust and premium. We dropped the
  per-restaurant `coverGradient` fill here — those pastel gradients read muddy on
  the light card. (`coverGradient` is still used for the card cover / map, just not the badge.)
- **Accolade / Michelin**: a dark "medal" plaque — `bg-[#1a0f11]` + gold border +
  gold SVG stars / text. Gold-on-dark is high-contrast in **both** themes; the old
  gold-on-`gold/12` was ~2:1 on the light card and nearly invisible.

**Rule:** gold text (`--color-accent-gold` `#c5a059`) needs a **dark backing** to be
legible in the light theme — it fails contrast on cream. Put gold on a dark plaque
(badges) or give it a dark halo (compass labels), never gold directly on a light surface.

---

## Quick rules

1. Bottom-anchored on mobile → clear `var(--mobile-tabbar-h)`; never hardcode the height.
2. One outline per frame — a border **or** a spread ring, not both on the same edge.
3. Gold text needs a dark backing in the light theme.
4. The tab-bar (`z-[70]`) is the top mobile layer; clear it or out-z-index it deliberately.
5. Mobile-first: the unprefixed class is the phone style; `sm:`/`md:` add larger-screen behaviour.
