# Vinovigator AI — agent notes

Live — **two sites, one codebase, one image** (split 2026-07-30):

| Host | `SITE_MODE` | Port | Serves |
|---|---|---|---|
| **wine2.icoffio.com** | `full` | 4300 | the whole product — directory, `/pairing`, `/admin`, `/pitch`, `/samouczek`. Production for restaurant pitches. |
| **wine.icoffio.com** | `samouczek` | 4301 | ONLY `/samouczek`, `/embed/samouczek`, `/privacy`. Everything else **302s to wine2 with the path preserved**, so already-printed QR codes keep working. |

`src/lib/site-mode.ts` decides (import-free — middleware is edge runtime); its
routing contract is locked by `src/lib/__tests__/site-mode.test.ts`. Canonical
URLs resolve at RUNTIME via `src/lib/site-url.ts` (`SITE_URL` env), which is
what lets ONE image serve two hosts — `NEXT_PUBLIC_*` bake in at build time and
cannot differ per container. `robots.txt`/`sitemap.xml` shrink to the single
tutorial page in samouczek mode.

**Chrome differs per site too** — the tutorial host shows NO product nav, no
bottom tab-bar and no "Otwórz Pairing" hand-off (they would only 302 a shop
visitor into wine2). Client components read the mode from
`useIsTutorialSite()` (`src/components/SiteModeProvider.tsx`), fed by the
server layout, which also stamps `data-site-mode` on `<html>` so `globals.css`
can collapse `--mobile-tabbar-h` where the bar is gone.

⚠️ **`SITE_MODE` is a RUNTIME value, so any page whose output depends on it
MUST NOT be prerendered** — a static page bakes in the mode the BUILD had
(`full`) and the tutorial site ships the product chrome. `/samouczek`,
`/privacy` and `/embed/samouczek` therefore carry `export const dynamic =
"force-dynamic"`. Deciding on the client instead is not an option: it either
breaks hydration or flashes the wrong chrome. If you add a page the tutorial
site serves, do the same — and note that **route segment config is IGNORED on a
`"use client"` file**, which is why `/embed/samouczek` is a thin server wrapper
around `EmbedSamouczekClient` (it shipped the `/pairing` hand-off to the shop's
iframe for a day because of exactly that).

Repo: https://github.com/Warlockus-prod/wine.git (`main` is what ships).

## Stack

- Next.js 16 (App Router under `[locale]/`, **webpack** flag in `dev`/`build` — keep it)
- React 19, TypeScript, Tailwind v4, Playwright
- next-intl 4 (`localePrefix: "as-needed"`) — Polish primary, English at root
- **Postgres 16** + Drizzle ORM + drizzle-kit migrations
- **Auth.js v5** (Drizzle adapter, magic-link via Nodemailer) — gate is **ON since 2026-09-01** (`AUTH_GATE_ADMIN=1` on both hosts; it had been 0, leaving /admin and the write API open to the internet — see the security note below). The active gate is **env HTTP Basic Auth** (`ADMIN_USER`/`ADMIN_PASSWORD`, `src/lib/admin-auth.ts`) — no SMTP needed; magic-link is the fallback.
- OpenAI (default `gpt-5.4-mini`) for `/api/chat` (Vinokompas guide bot) and `/api/pairing/explain` (2-sentence pair rationale)
- **Mapbox GL** (`mapbox-gl`) for the homepage map — client-only (`ssr:false`); token in `NEXT_PUBLIC_MAPBOX_TOKEN` (publishable, restrict by URL in the Mapbox dashboard)
- Seed templates live in `src/data/seed-restaurants.ts` and `src/data/seed-pairing.ts`; **canonical runtime data is Postgres**, seed runs idempotently on every deploy via `tsx scripts/db-seed.mts`.
- Wine Compass methodology KB: `src/data/wine-compass-kb.ts` — used by `<TasteCompass>`, `/samouczek`, and as system prompt for the AI bots.

## Design-system invariants (2026-07 pass — details in `docs/design-pass-2026-07.md`)

> **Full standards** — colours, typography, wheel placement, and how-we-work
> rules — are in **`docs/design-standards.md`**. Read it before any UI change.

- **Light cream theme is the shipped default** (`data-theme="light"` static on `<html>`). Global shims in `globals.css` remap `text-white`/`text-gray-*`/dark hex backgrounds/`border-white/*` for light mode. **Panels that stay navy** must use the `.keep-dark` class AND paint their background via inline style (shims can't match inline styles); inside `.keep-dark` the cream text/white-alpha borders/bright gold are restored automatically.
- **`@theme inline` does NOT emit custom properties at runtime.** Hand-authored CSS that uses `var(--font-serif)`/`var(--font-display)` works only because runtime copies are declared on `:root` right after the `@theme` block — don't remove them, and don't reference new `@theme`-only tokens from authored CSS without adding a runtime copy.
- `.pitch-cta-primary`/`.pitch-cta-ghost` are pill-shaped (one CTA language site-wide). Serif display = `.pitch-display` (Libre Baskerville); Franklin is body/UI only.
- e2e `samouczek-flow` re-centres the wheel (`centerWheel`) after stage switches — stage-tab layout changes can put wedge bbox-centres under the fixed mobile tab bar and force-clicks then hit the bar.
- **Unified wheel design across all 3 stages (client 2026-07-17):** same colored-pie visual; only the subdivision + label detail change. Stage 1 = **3 wedges of 120°** (base tastes, centred on the CIERPKOŚĆ/SŁODYCZ/KWASOWOŚĆ axes, boundaries at 60/180/300°) that **fill with intensity rings** on click (level-1 fill branch in TasteCompass, gold); stage 2 = 6 sector wedges (sektorAvg fill); stage 3 = 12 tendencja wedges. Radial dividers are level-gated (3/6/12 via spoke index: base-borders i∈{2,6,10}, sector-borders even i, all 12 at level 3). The 12 hanging-icon clusters ring the wheel at **every** level unchanged; base-axis labels always sit at rOuter+58 (outside the icon ring). The thin gold "beam" is suppressed at level 1 (the wedge fill shows the value there).

## Validation gate

Before any commit/push that will be deployed:

```bash
npm run check    # = lint + unit (vitest) + build + 68 e2e (61 run + 7 skipped); all four must pass
```

Individual:

```bash
npm run lint
npm run build
npm run test:e2e
```

E2E specs in `e2e/` — `smoke.spec.ts` is the load-bearing one and also runs as live smoke against **wine2.icoffio.com** (the full site; it was retargeted in the 2026-07-30 split — wine.icoffio.com now only answers the tutorial paths, so the old target would 302 most of the suite away).

## Routes worth knowing

All routable pages live under `src/app/[locale]/`. English at root, Polish at `/pl/...`.

- `/` (or `/pl`) — restaurant directory + Mapbox map + filters; hero has prominent **Samouczek smaku** gold CTA. **Server component** (`page.tsx`) fetches `resolveRestaurants()` (DB→seed, ISR `revalidate=60`) and passes data to `HomeClient.tsx`; directory is in the SSR HTML. Has own `generateMetadata`.
- `/restaurants/[slug]` — per-venue menu + QR. **Server-rendered from the DB read-path** via `resolveRestaurantBySlug` (DB→seed fallback, ISR `revalidate=60`); `RestaurantPageClient` takes the resolved restaurant as a prop. DB-editor edits surface to guests within ~60s.
- `/pairing?restaurant=<slug>` — bidirectional matching workspace: pick dish → wines re-rank, pick wine → menu re-ranks. Top-3 highlights, auto-select #1 of the other side. Chat panel has 4 bubbles: compare → curated/algo reason → **Vinokompas-vocab 2-sentence explanation** (gold-bordered, AI-generated via `/api/pairing/explain`) → service note. Decant strings localized at render time (`localizeDecant`). **Restaurant-scoped context reads the DB read-path** via the GET API (SWR) — `PairingClient.tsx`; the no-param **global sandbox still uses `usePairingDataset` (localStorage)** by design. Server `page.tsx` adds `generateMetadata`.
- `/samouczek` — interactive Vinokompas tutorial: SVG compass (6 sectors × 2 tendencje × **intensity 0–5** = 6 rings, set by `MAX_INTENSITY` in `src/lib/compass-geometry.ts`; ARIA-correct). **Sector order matches the canonical vinocompas.pl wheel** (clockwise from 12: Tęgie → Miękkie → Oleiste → Świeże → Ziemiste → Szorstkie) — `COMPASS_SECTORS` in `wine-compass-kb.ts` is the single source of truth; the dial renders it clockwise, so array order = visual order (verified against the official calculator's S1/S2 data, 2026-06). **3-level CompassExplorer** (sektor → tendencja → skojarzenia) with progressive reveal, **FloatingTasteChat** docked bottom-right (persists across scroll, expand/collapse remembered in localStorage). **3-stage `<StagedTutorial>`** (SMAK → WRAŻENIA → TENDENCJE, „12 grup aromatów” — copy z dokumentu klienta 2026-07-21; a 2-stage merge was trialled in 2026-06 and reverted 2026-07 at the client's request): stage 1 = 3 base smaki on the level-1 wheel + dryness bar under the dial, stage 2 = 6 wrażenia (level 2), stage 3 = 12 tendencje/aromaty (level 3). **Wheel geometry is canonical**: sector boundaries fall exactly ON the base-taste axes (CIERPKOŚĆ 12:00 = Szorstkie/Tęgie border, SŁODYCZ = Miękkie/Oleiste, KWASOWOŚĆ = Świeże/Ziemiste) — sector i spans `[arc·i, arc·(i+1)]` from 12 o'clock; do NOT re-add a −π/2 half-sector offset. **The pure geometry now lives in `src/lib/compass-geometry.ts`** (no React/DOM — `SPOKES`, `BASE_AXES`, `labelArc`, `RING_SPRITES`, `spriteRing`), and every canonical invariant above is LOCKED by `src/lib/__tests__/compass-geometry.test.ts`, which runs in the gate: sector order, axes-on-boundaries, no −π/2 offset, every sprite inside its own 30° slice, bottom-arc label flip, and card↔wheel↔disk sprite-manifest sync. A failure there means the wheel stopped matching the licensed poster — fix the geometry, don't relax the test. The unused `baseInteractive` rim-slider mode remains in TasteCompass. **"Как оригинал" visual (final form 2026-07-18):** full-saturation pie at `fillOpacity 0.96`, but the **colour count = the stage's selectable segment count** (client: 12 hues behind a 3/6-segment picker "путает") — level 1 paints 3 wedges (`BASE_WEDGE_VIVID` — pairwise blends of the site sector palette: wine maroon / warm apricot / sage green), level 2 the six site-canonical `COMPASS_SECTORS[].color` (the same hues as the legend chips/explorer, so the wheel matches the rest of the UI), level 3 the official 12 (`TENDENCJA_COLOR`, sampled from `vinocompas_graphics/…/_Vinokompas_pelny_PL`). Intensity is an **inverted wash**: the resting pie is vivid, and setting a value lays a cream `#f6efe2` wash over the rings ABOVE the chosen one — ONE wash path per unit of work (base wedge / sektor / tendencja). **Ring order matches the client's reference** (`VIEW = 640`, centre 320): pie (rOuter 165) → **curved labels OUTSIDE the rim**, dark ink + cream halo, bottom arcs auto-flipped readable — level 3 = 12 tendencje at 12px, long ones WRAPPED onto two stacked arcs à la the poster (single-line `rOuter+13.5`, two-line `rOuter+21.5`/`+8`, order swapped on bottom arcs), painted ABOVE the garland so the cream halo keeps them readable over sprites; level 2 = 6 sektor names (16px, `rOuter+13`) à la uproszczony, NO mid-pie italics at level 2 — the 13px italics render at level 3 only → **CONTINUOUS garland of INDIVIDUAL object sprites** (client 2026-07-18 "равномерно без отступов"): each official image is cut into its component objects (`scratchpad/slice-grouped.mjs` — true 2D connected-components → `public/senses/ring/<tendencja>-<k>.png`, **72 sprites** across all 12 tendencje; all 12 tendencje re-sliced into individual objects 2026-07-21 (the horse split from the campfire, the citrus/jam trios split; honey jar+comb kept as one composition per client); manifest hardcoded as `RING_SPRITES`), laid out by `spriteRing()` in TWO staggered rows (even→`rOuter+59`, odd→`rOuter+101`; client 2026-07-18 "в два уровня чтобы крупнее") with equal-area √A sizing, ONE uniform gap per row, and per-row global rotation aligning each tendencja's objects with its slice — shown on all 3 stages → **curved base-axis arcs outermost** (CIERPKOŚĆ `rOuter+133`, KWASOWOŚĆ/SŁODYCZ `rOuter+149` — glyph-clear of the outer sprite row; 19px bright at level 1 / 15px dim at 0.55 on levels 2-3, 0.1em tracking; the 0/5 value rides INSIDE the curved caption, e.g. "KWASOWOŚĆ · 0/5" — no separate chip). The geometry margins are tight and documented in TasteCompass comments — the unit tests catch canon violations (sector/slice/order), but MARGINS are not covered, so still verify visually after ANY radius/tile/font change. The top stage-controls strip in `StagedTutorial` is **sticky** on desktop (`top-[5.25rem]`, under the fixed nav); on mobile an app-style pinned quick-nav (`sticky bottom-[calc(var(--mobile-tabbar-h)+0.75rem)]`, centred) keeps Następny etap reachable above the fixed MobileTabBar. Wrapped question headings use `.pitch-display--roomy` (line-height 1.3) — the display class's 1.04 overlaps at text-xl on mobile. The old loose-icon ring assets (`public/senses/arc/`) are unused by the dial now. No selection frame on click. Typewriter tour text + one-pass auto-presentation. **Live wine proposals** render under the stages (`InlineProposals`): the live `CompassProfile` is matched against `src/data/samouczek-wines.ts`, which serves the **567-wine winnica.pl catalogue** (`src/data/winnica-catalog.generated.ts`, real prices incl. VAT + direct product URLs, refreshed by `scripts/parse-winnica-api.mjs` from the shop's PrestaShop Webservice). **HTML scraping is retired** (2026-09-01) — the shop publishes its own Vinocompas data-sheet as product features, so fingerprints are READ, not inferred; wines only (the shop also sells delicatessen/pasta/cookies); the 18 hand-written archetypes are only the `LEGACY_ARCHETYPES` fallback used when the catalogue has <20 entries by the pure cosine matcher in `src/lib/samouczek-match.ts`; each card links to **winnica.pl** search for that grape (originators of the Vinokompas method — robust search URLs, never 404). Profile persists to `localStorage["wn_compass_profile_v1"]`.
- `/pitch` — editorial sales-pitch landing for restaurant owners.
- `/admin` — **localStorage sandbox/library** (global pairing playground via `usePairingDataset` + API Playground + Export/Import), explicitly labelled "sandbox — localStorage only". Top of page is a CTA to the DB editor. The legacy in-page `RestaurantContentManager` (duplicate localStorage restaurant editor) was **removed** — use `/admin/restaurants/[slug]` for real edits. Auth gate OFF via `AUTH_GATE_ADMIN=0`.
- `/admin/restaurants` + `/admin/restaurants/[slug]` — **DB-canonical per-restaurant editor** (SWR hooks + write API in `src/lib/use-restaurant-data.ts`). The only place edits persist to Postgres and reach guests.
- `/admin/signin` — magic-link login flow (waits on SMTP env vars). **Note:** with the gate ON the default is now env **Basic Auth** (browser login prompt on `/admin`); this page only matters if you wire SMTP + magic-link.
- `/privacy` — legal page, linked from the footer. Served by BOTH sites (it is in `SAMOUCZEK_ALLOWED`), hence `force-dynamic`.
- `/embed/samouczek` — the "naked" tutorial widget winnica.pl iframes. Server wrapper + `EmbedSamouczekClient`; talks to the parent via `postMessage` (`vinokompas:ready` / `:resize`), origin-allow-listed. `force-dynamic`.
- `/admin/chat` — guest-chat analytics (reads `chat_sessions`/`chat_messages`; rows expire per `CHAT_RETENTION_DAYS`).
- `/admin/restaurants/[slug]/qr` + `/admin/restaurants/[slug]/stats` — printable QR sheet and per-venue event stats.
- `/offline` — PWA fallback served by `public/sw.js`.

## API routes
- `GET /api/restaurants` + `/api/restaurants/[slug]` — DB-resolved with seed fallback (`src/lib/db-restaurants.ts`)
- `GET/POST /api/restaurants/[slug]/dishes` + `PUT/DELETE /api/restaurants/[slug]/dishes/[id]` — write surface, zod-validated, ACL-gated
- `GET/POST /api/restaurants/[slug]/wines` + `PUT/DELETE /api/restaurants/[slug]/wines/[id]` — same shape
- `GET/POST/DELETE /api/restaurants/[slug]/pairings` — POST is upsert keyed on (restaurant, dish, wine); DELETE via `?dishId=&wineId=`
- `POST /api/pairing` — algorithmic scoring (~14 rules)
- `POST /api/pairing/explain` — Vinokompas 2-sentence reasoning (OpenAI)
- `POST /api/chat` — Vinokompas guide bot (OpenAI, KB system prompt, gpt-5.x → `max_completion_tokens`)
- `GET/POST /api/profiles` — guest taste-compass profile by anonymous_id
- `POST /api/events` — analytics ingest (single or batch ≤50)
- `GET /api/admin/chat-analytics` — aggregates `chat_sessions`/`chat_messages` for the `/admin/chat` page
- `/api/auth/[...nextauth]` — Auth.js handlers

**The tutorial deployment serves only `/api/chat`, `/api/events` and
`/api/profiles`** — `samouczekAllowsApi()` in `src/lib/site-mode.ts`, enforced by
the middleware, whose matcher now INCLUDES `/api`. ⚠️ **Middleware must return
`undefined` for an allowed API route, never `NextResponse.next()`** — the latter
re-issues the request internally and DROPS the POST body, so `/api/pairing`
scored with no dish context and returned an unrelated wine. It fails silently:
status 200, plausible JSON, wrong answer. Caught only by
`pairing-algorithm.spec.ts` asserting the actual wine. Until 2026-09-01 the matcher
excluded `/api`, so the shop-facing host served the entire write API.

All write routes go through `src/lib/api-acl.ts`:
 - `requireAuth(request?)` returns the active user. ⚠️ It FAILS OPEN: anything other than `AUTH_GATE_ADMIN=1` → synthetic `pilot` user, i.e. no auth at all, which is how production sat exposed until 2026-09-01. Both deploy scripts now assert `/api/admin/chat-analytics == 401` after deploying and fail otherwise. `=1` → validates env **Basic Auth** (`ADMIN_USER`/`ADMIN_PASSWORD` via `src/lib/admin-auth.ts`), falling back to an Auth.js magic-link session; else 401.
 - `requireRestaurantMember(user, slug)` resolves the restaurant + checks `restaurant_members` (bypassed in pilot mode and for the `admin` role)
 - `enforceWriteRateLimit(request)` — per-IP sliding window (120/min) on every mutation; `apiHandler(fn)` converts thrown `ApiError` into JSON+status (+ `Retry-After` on 429)
Every write emits an `admin_*` event into the analytics table with the actor id.
**⚠️ The client IP is NOT trustworthy today.** Public :443 is an nginx *stream*
SNI router that proxies to 127.0.0.1:8443, so `X-Real-IP` is the loopback
address for everyone and every per-IP limit is ONE bucket for the whole
internet. `/api/chat` therefore keys on `anonymousId` when the IP is loopback
and enforces a separate global ceiling (`GLOBAL_MAX_PER_WINDOW`); `trustedIp()`
switches back to the IP automatically once nginx forwards it. Fixing it for
real needs `proxy_protocol` on the shared stream, which forces EVERY vhost on
that box (20+, most belonging to other projects) to be patched in the same
change — see `docs/ops/real-client-ip.md`.

**Rate limiting** (`src/lib/rate-limit.ts`) also covers the OpenAI/CPU routes: `/api/pairing/explain` 30/min·IP, `/api/pairing` 60/min, `/api/events` 120/min (client-event types only, props size-capped), `/api/profiles` 30/min (real upsert by `anonymous_id`). `/api/chat` keeps its own 30/4h·anon limiter.

## i18n notes

- `next-intl` 4 with `localePrefix: "as-needed"` — English QR codes stay valid (no prefix), Polish gets `/pl/...`.
- Schema: `dish/wine/pairing.name/description/notes/reason` are `LocalizedString = {en, pl}`. Use `t(field, locale)` from `@/lib/localized` to render. JSONB at the DB layer.
- Chrome strings live in `messages/{en,pl}.json`. Use `useTranslations()` (client) or `getTranslations()` (server).
- Use `Link` / `useRouter` / `usePathname` from `@/i18n/navigation`, not `next/link` / `next/navigation`.
- **Caveat:** PL seed translations (wine notes + pairing reasons) are LLM first-pass. A Polish-speaking sommelier must vet `src/data/seed-restaurants.ts` and `src/data/seed-pairing.ts` before any commercial pitch.

## Database notes

- Schema: `src/db/schema/index.ts` (13 tables, JSONB localized fields, append-only events). Connection wrapper `src/db/index.ts` (postgres-js singleton, max=10 in prod / 5 in dev).
- Migrations: `npx drizzle-kit generate --name=<change>`. Auto-applied on every deploy.
- Seed: `tsx scripts/db-seed.mts` — idempotent via `unique(restaurant_id, external_id)` constraints.
- Server-side analytics: `logEvent({type, ...})` from `@/lib/server-events`. Soft-fail — never blocks user response.
- **Guest chat logs expire.** `/api/chat` persists every turn (`chat_sessions`/`chat_messages`) for the `/admin/chat` analytics page; `scripts/db-purge-chat.mts` drops anything older than `CHAT_RETENTION_DAYS` (default 90, matching the page's widest range) nightly via `purge_chat.sh`. Sessions are aged by their LAST message, not `ended_at` — chat-store only closes a session when the same guest returns after a 45-min gap, so most stay open forever. The window **fails closed**: a malformed or <7 value aborts the run instead of deleting (`src/lib/chat-retention.ts`, unit-tested). `--dry-run` reports without touching anything. **Ops scripts may import from `src/lib` only because `Dockerfile.vps` copies it into the runtime image** — same for `src/db`/`src/data`; a script importing from anywhere else in `src/` dies with ERR_MODULE_NOT_FOUND at cron time.
- Edge constraint: middleware MUST NOT import `@/auth` (pulls postgres into edge runtime and crashes). The admin gate uses env Basic Auth via `src/lib/admin-auth.ts` (zero imports, edge-safe) — see `src/middleware.ts`.

## Deployment

Manual, not CI. Full topology in memory: `~/.claude/projects/-Users-Andrey-App-web-wn/memory/deployment.md`.

**Single production host since 2026-07-16: VPS2 (Hetzner FSN1,
`178.104.223.93`).** The old VPS1 (`46.225.11.249`) was wiped of this project
the same day (containers/volume/image/repo removed; final DB dump archived at
`/opt/repos/wine_web_wn/backups/wine-vps1-final-20260716.sql.gz` on VPS2).
Postgres on VPS2 carries the full pilot history (events since 2026-05-05).
Daily DB backup: cron `20 3 * * *` → `/opt/backups/wine_web_wn/` (14-day
retention). **Chat-log retention: cron `40 3 * * *` → `purge_chat.sh`**
(20 min after the backup, so a purged day is always in that night's dump
first) → `/var/log/wine-chat-purge.log`. TLS: certbot with auto-renew (`certbot.timer`) on VPS2 — the old
manual DNS-01 ritual is dead.

```bash
# Local
npm run check && git push origin main

# VPS2 — PRODUCTION (git pull + docker build + rm/run)
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@178.104.223.93 'bash /opt/repos/wine_web_wn/update_wine_web.sh'

# Smoke
curl -I https://wine2.icoffio.com      # full site — expect 200 OK
curl -I https://wine2.icoffio.com/pl   # expect 200 OK (Polish locale)
curl -I https://wine.icoffio.com/pl/samouczek   # tutorial site — expect 200
curl -I https://wine.icoffio.com/pl/pairing     # expect 302 → wine2

# Live regression — runs the smoke + i18n e2e suite against production
npx playwright test --config=playwright.live.config.ts --grep "v2 admin|i18n EN/PL"
```

There is **no docker-compose.yml** on this VPS for this project — `update_wine_web.sh` does `git pull → docker build -f Dockerfile.vps → docker rm/run`. It starts BOTH containers: `wine_web_wn_app` (`SITE_MODE=full`, :4300) and `wine_web_wn_samouczek` (`SITE_MODE=samouczek`, :4301). **Gotcha: the script git-pulls itself, so a run that CHANGES the script executes the OLD copy — run the deploy twice in that case.** **Secrets never enter the image** (`.dockerignore` excludes `.env*`; injected at runtime via `--env-file`); **`NEXT_PUBLIC_*` are passed as `--build-arg`** sourced from `.env.local` (blank Mapbox map after deploy ⇒ build-args weren't passed). Container runs as the non-root `node` user. To rotate a runtime secret (e.g. `OPENAI_API_KEY`) without a rebuild: edit `.env.local` then `docker rm -f wine_web_wn_app && docker run … --env-file … wine_web_wn:latest` (env is read at container create, so a plain `docker restart` won't pick it up).

App binds `172.17.0.1:4300` (full site) and `172.17.0.1:4301` (tutorial site) only — public access is via the shared `nginx_server` reverse proxy (`wine2.icoffio.com.conf` → :4300, `wine.icoffio.com.conf` → :4301; 443 is an SNI stream router). Never expose 4300/4301 publicly. Never restart `nginx_server`; reload via `docker exec nginx_server nginx -s reload`. The VPS hosts other production services (n8n, flask_wine, regatta, icoffio-front) — see `~/.claude/memory/vps_infrastructure.md` before touching anything outside this project's container.

## TLS

Handled automatically on VPS2: certbot renewal configs for BOTH `wine.icoffio.com` and `wine2.icoffio.com` (issued 2026-07-30 → 2026-10-28, same `copy-to-shared-and-reload.sh` deploy hook)
+ systemd `certbot.timer`. Current cert 2026-07-16 → 2026-10-14. The manual
DNS-01 ritual documented pre-migration applied to VPS1 and is obsolete.

## Posture & caveats

- **Production-grade backend in place AND wired to the public read-path** — Postgres 16 + Drizzle migrations + Auth.js scaffold + analytics events + complete write API (POST/PUT/DELETE for dishes/wines/pairings, all zod-validated, all ACL-gated). As of 2026-05-29 the public pages (home, guest `/restaurants/[slug]`, scoped `/pairing`) **read from the DB** (`resolveRestaurants`/`resolveRestaurantBySlug`, DB→seed fallback, ISR `revalidate=60`). Edits via the DB editor reach guests. Don't roll back to localStorage-only thinking.
- **Store modules:** `pairing-store.ts`/`usePairingDataset` is still used by the `/admin` sandbox and the no-param `/pairing`. (`restaurant-store.ts` was deleted once the read-path moved to the DB.)
- **⚠️ Security — write API is open ONLY while the gate is off.** `AUTH_GATE_ADMIN=0` (current default) means `/admin` + all write routes accept unauthenticated requests via the synthetic `pilot` user → an open `POST/PUT/DELETE /api/restaurants/<slug>/*` **changes what guests see**. **Mitigated** (PR `security-hardening`, 2026-06): all write + OpenAI/CPU routes are now **rate-limited**, and a one-line **env Basic Auth gate** closes the hole entirely. **Until you flip the gate, the API is still open** — see `docs/audit-2026-05.md` P0-2/P1-2.
- **Closing the gate — two options.** (a) **Simple, recommended, no SMTP:** add `AUTH_GATE_ADMIN=1` + `ADMIN_USER=admin` + `ADMIN_PASSWORD=<strong>` to `/opt/repos/wine_web_wn/.env.local`, redeploy → `/admin` + write API require HTTP Basic Auth (`src/lib/admin-auth.ts`); fails closed if `ADMIN_PASSWORD` unset. (b) **Magic-link, multi-user:** `docs/ops/auth-gate-flip.md` — SMTP env → `ADMIN_EMAIL=… npx tsx scripts/db-bootstrap-admin.mts` → `AUTH_GATE_ADMIN=1`; bootstrap BEFORE flipping or you lock yourself out. Same flag gates both; Basic Auth wins, magic-link is fallback. Open-redirect on signin `returnTo` already fixed (`safeReturnTo`).
- **Full tech+design audit:** `docs/audit-2026-05.md` (P0/P1/P2, verified). Done: read-path→DB, open-redirect, metadata, admin consolidation; **2026-06 hardening** (PR `security-hardening`) added rate-limiting, input-validation/IDOR/prompt-injection fixes, **security headers** (HSTS/XFO/nosniff/Referrer/Permissions in `next.config.ts`; **CSP moved to `src/lib/csp.ts` + `src/middleware.ts` on 2026-09-01** — it now carries a per-request nonce with `strict-dynamic` instead of `'unsafe-inline'`, and `img-src` lists real hosts instead of all of `https:`. Everything Next emits gets the nonce automatically — Next reads it from the CSP REQUEST header, no layout code needed. ⚠️ **`headers()` in the root layout is LOAD-BEARING** — it both supplies the nonce to next-themes AND forces dynamic rendering, which the nonce REQUIRES: a prerendered page bakes in a build-time nonce while the header sends a fresh one per request, so every chunk is blocked and the page ships with no JavaScript. That was tried on 2026-09-01 and silently broke the home page; only e2e caught it. Cost measured at 5–15 ms/render. See `memory/csp-nonce-vs-prerender.md`), the env Basic Auth gate, `.dockerignore` + build-args + non-root container, and bumped `next`→16.2.9 (middleware-authz CVE) + `next-intl`→4.13. **Still open: C1 — flip the gate** (off by default); `nodemailer`/`next-auth` beta advisories (no upstream fix, only relevant once magic-link is live).
- **Seed wine photos and prices are placeholder-grade.** Source-back each label before any commercial pitch.
- **Image pipeline:** every seeded dish/wine has a generated local photo under `public/{dishes,wines}/<slug>/<id>.png` (50 dishes + 40 wines), mapped in `src/data/{dish,wine}-images.ts`; **Coverage is 100% (verified 2026-06-18: 40/40 wines, 50/50 dishes) — nothing falls back to Unsplash in practice.** (The 18 AI still-lifes under `public/senses/*.png` and the 12 loose `public/senses/arc/` icons were DELETED 2026-07-31 — superseded by the client's cut-out sprites and referenced by nothing; recover from git history if ever needed.) Resolution order in `src/lib/food-photos.ts`: explicit `wine.image`/`dish.image` → local map by id → category-keyed Unsplash fallback → generic fallback (the Unsplash branch only fires for never-seeded ids). DB wines use `external_id` = the seed id (`r1-w1`…), so DB-served wines hit the local map too. Brief "empty squares" on first paint are next/image lazy-load timing, not missing files. Regenerate only if you add NEW wines/dishes: `OPENAI_API_KEY=… npx tsx scripts/gen-wine-images.mts` (dall-e-3, writes PNG + appends the map). Verify with `node scripts/shoot-mobile.mjs` (iPhone-width live screenshots → `/tmp/wn-mobile`). **Icons are now inline SVG** (`src/components/v2/Icon.tsx`) — the Material Symbols web font was removed (it flashed ligature text on mobile). **QR codes** render locally via `qrcode.react` (`<QRCodeSVG value={restaurantUrl}>`), no external `api.qrserver.com`. `public/` is now clean: `app-icon.svg`, `sw.js`, `dishes/`, `wines/`, `senses/ring/`.
- **PL seed translations are LLM first-pass.** Polish-speaking sommelier must vet wine vocabulary before commercial pitch.
- **OpenAI cost discipline:** `/api/pairing/explain` is per-(dish,wine) cached client-side so re-selecting doesn't re-spend tokens. `/api/chat` capped at 350 tokens per response. Default model `gpt-5.4-mini` (~$0.0003/exchange).
