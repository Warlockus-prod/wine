# Vinovigator AI — agent notes

Live: https://wine.icoffio.com — production for restaurant pitches.
Repo: https://github.com/Warlockus-prod/wine.git (`main` is what ships).

## Stack

- Next.js 16 (App Router under `[locale]/`, **webpack** flag in `dev`/`build` — keep it)
- React 19, TypeScript, Tailwind v4, Playwright
- next-intl 4 (`localePrefix: "as-needed"`) — Polish primary, English at root
- **Postgres 16** + Drizzle ORM + drizzle-kit migrations
- **Auth.js v5** (Drizzle adapter, magic-link via Nodemailer) — gate currently OFF (`AUTH_GATE_ADMIN=0`). When ON, the default gate is **env HTTP Basic Auth** (`ADMIN_USER`/`ADMIN_PASSWORD`, `src/lib/admin-auth.ts`) — no SMTP needed; magic-link is the fallback.
- OpenAI (default `gpt-5.4-mini`) for `/api/chat` (Vinokompas guide bot) and `/api/pairing/explain` (2-sentence pair rationale)
- **Mapbox GL** (`mapbox-gl`) for the homepage map — client-only (`ssr:false`); token in `NEXT_PUBLIC_MAPBOX_TOKEN` (publishable, restrict by URL in the Mapbox dashboard)
- Seed templates live in `src/data/seed-restaurants.ts` and `src/data/seed-pairing.ts`; **canonical runtime data is Postgres**, seed runs idempotently on every deploy via `tsx scripts/db-seed.mts`.
- Wine Compass methodology KB: `src/data/wine-compass-kb.ts` — used by `<TasteCompass>`, `/samouczek`, and as system prompt for the AI bots.

## Design-system invariants (2026-07 pass — details in `docs/design-pass-2026-07.md`)

- **Light cream theme is the shipped default** (`data-theme="light"` static on `<html>`). Global shims in `globals.css` remap `text-white`/`text-gray-*`/dark hex backgrounds/`border-white/*` for light mode. **Panels that stay navy** must use the `.keep-dark` class AND paint their background via inline style (shims can't match inline styles); inside `.keep-dark` the cream text/white-alpha borders/bright gold are restored automatically.
- **`@theme inline` does NOT emit custom properties at runtime.** Hand-authored CSS that uses `var(--font-serif)`/`var(--font-display)` works only because runtime copies are declared on `:root` right after the `@theme` block — don't remove them, and don't reference new `@theme`-only tokens from authored CSS without adding a runtime copy.
- `.pitch-cta-primary`/`.pitch-cta-ghost` are pill-shaped (one CTA language site-wide). Serif display = `.pitch-display` (Libre Baskerville); Franklin is body/UI only.
- e2e `samouczek-flow` re-centres the wheel (`centerWheel`) after stage switches — stage-tab layout changes can put wedge bbox-centres under the fixed mobile tab bar and force-clicks then hit the bar.
- **Unified wheel design across all 3 stages (client 2026-07-17):** same colored-pie visual; only the subdivision + label detail change. Stage 1 = **3 wedges of 120°** (base tastes, centred on the CIERPKOŚĆ/SŁODYCZ/KWASOWOŚĆ axes, boundaries at 60/180/300°) that **fill with intensity rings** on click (level-1 fill branch in TasteCompass, gold); stage 2 = 6 sector wedges (sektorAvg fill); stage 3 = 12 tendencja wedges. Radial dividers are level-gated (3/6/12 via spoke index: base-borders i∈{2,6,10}, sector-borders even i, all 12 at level 3). The 12 hanging-icon clusters ring the wheel at **every** level unchanged; base-axis labels always sit at rOuter+58 (outside the icon ring). The thin gold "beam" is suppressed at level 1 (the wedge fill shows the value there).

## Validation gate

Before any commit/push that will be deployed:

```bash
npm run check    # = lint + build + 36 e2e tests; all three must pass
```

Individual:

```bash
npm run lint
npm run build
npm run test:e2e
```

E2E specs in `e2e/` — `smoke.spec.ts` is the load-bearing one and also runs as live smoke against wine.icoffio.com.

## Routes worth knowing

All routable pages live under `src/app/[locale]/`. English at root, Polish at `/pl/...`.

- `/` (or `/pl`) — restaurant directory + Mapbox map + filters; hero has prominent **Samouczek smaku** gold CTA. **Server component** (`page.tsx`) fetches `resolveRestaurants()` (DB→seed, ISR `revalidate=60`) and passes data to `HomeClient.tsx`; directory is in the SSR HTML. Has own `generateMetadata`.
- `/restaurants/[slug]` — per-venue menu + QR. **Server-rendered from the DB read-path** via `resolveRestaurantBySlug` (DB→seed fallback, ISR `revalidate=60`); `RestaurantPageClient` takes the resolved restaurant as a prop. DB-editor edits surface to guests within ~60s.
- `/pairing?restaurant=<slug>` — bidirectional matching workspace: pick dish → wines re-rank, pick wine → menu re-ranks. Top-3 highlights, auto-select #1 of the other side. Chat panel has 4 bubbles: compare → curated/algo reason → **Vinokompas-vocab 2-sentence explanation** (gold-bordered, AI-generated via `/api/pairing/explain`) → service note. Decant strings localized at render time (`localizeDecant`). **Restaurant-scoped context reads the DB read-path** via the GET API (SWR) — `PairingClient.tsx`; the no-param **global sandbox still uses `usePairingDataset` (localStorage)** by design. Server `page.tsx` adds `generateMetadata`.
- `/samouczek` — interactive Vinokompas tutorial: SVG compass (6 sectors × 2 tendencje × **intensity 0–5** = 6 rings, set by `MAX_INTENSITY` in `TasteCompass.tsx`; ARIA-correct). **Sector order matches the canonical vinocompas.pl wheel** (clockwise from 12: Tęgie → Miękkie → Oleiste → Świeże → Ziemiste → Szorstkie) — `COMPASS_SECTORS` in `wine-compass-kb.ts` is the single source of truth; the dial renders it clockwise, so array order = visual order (verified against the official calculator's S1/S2 data, 2026-06). **3-level CompassExplorer** (sektor → tendencja → skojarzenia) with progressive reveal, **FloatingTasteChat** docked bottom-right (persists across scroll, expand/collapse remembered in localStorage). **3-stage `<StagedTutorial>`** (SMAK → WRAŻENIA → AROMATY; a 2-stage merge was trialled in 2026-06 and reverted 2026-07 at the client's request): stage 1 = 3 base smaki on the level-1 wheel + dryness bar under the dial, stage 2 = 6 wrażenia (level 2), stage 3 = 12 tendencje/aromaty (level 3). **Wheel geometry is canonical**: sector boundaries fall exactly ON the base-taste axes (CIERPKOŚĆ 12:00 = Szorstkie/Tęgie border, SŁODYCZ = Miękkie/Oleiste, KWASOWOŚĆ = Świeże/Ziemiste) — sector i spans `[arc·i, arc·(i+1)]` from 12 o'clock; do NOT re-add a −π/2 half-sector offset. The unused `baseInteractive` rim-slider mode remains in TasteCompass. **"Как оригинал" visual (final form 2026-07-18):** full-saturation pie at `fillOpacity 0.96`, but the **colour count = the stage's selectable segment count** (client: 12 hues behind a 3/6-segment picker "путает") — level 1 paints 3 wedges (`BASE_WEDGE_VIVID` — pairwise blends of the site sector palette: wine maroon / warm apricot / sage green), level 2 the six site-canonical `COMPASS_SECTORS[].color` (the same hues as the legend chips/explorer, so the wheel matches the rest of the UI), level 3 the official 12 (`TENDENCJA_COLOR`, sampled from `vinocompas_graphics/…/_Vinokompas_pelny_PL`). Intensity is an **inverted wash**: the resting pie is vivid, and setting a value lays a cream `#f6efe2` wash over the rings ABOVE the chosen one — ONE wash path per unit of work (base wedge / sektor / tendencja). **Ring order matches the client's reference** (`VIEW = 640`, centre 320): pie (rOuter 165) → **curved labels OUTSIDE the rim**, dark ink + cream halo, bottom arcs auto-flipped readable — level 3 = 12 tendencje at 12px, long ones WRAPPED onto two stacked arcs à la the poster (single-line `rOuter+13.5`, two-line `rOuter+21.5`/`+8`, order swapped on bottom arcs), painted ABOVE the garland so the cream halo keeps them readable over sprites; level 2 = 6 sektor names (16px, `rOuter+13`) à la uproszczony, NO mid-pie italics at level 2 — the 13px italics render at level 3 only → **CONTINUOUS garland of INDIVIDUAL object sprites** (client 2026-07-18 "равномерно без отступов"): each official image is cut into its component objects (`scratchpad/slice-ring2.mjs`, alpha connected-components + gap-only valley splits → `public/senses/ring/<tendencja>-<k>.png`, 37 sprites; manifest hardcoded as `RING_SPRITES`), laid out by `spriteRing()` in TWO staggered rows (even→`rOuter+59`, odd→`rOuter+101`; client 2026-07-18 "в два уровня чтобы крупнее") with equal-area √A sizing, ONE uniform gap per row, and per-row global rotation aligning each tendencja's objects with its slice — shown on all 3 stages → **curved base-axis arcs outermost** (CIERPKOŚĆ `rOuter+133`, KWASOWOŚĆ/SŁODYCZ `rOuter+149` — glyph-clear of the outer sprite row; 19px bright at level 1 / 15px dim at 0.55 on levels 2-3, 0.1em tracking; the 0/5 value rides INSIDE the curved caption, e.g. "KWASOWOŚĆ · 0/5" — no separate chip). The geometry margins are tight and documented in TasteCompass comments — verify visually after ANY radius/tile/font change. The top stage-controls strip in `StagedTutorial` is **sticky** on desktop (`top-[5.25rem]`, under the fixed nav); on mobile an app-style pinned quick-nav (`sticky bottom-[calc(var(--mobile-tabbar-h)+0.75rem)]`, centred) keeps Następny etap reachable above the fixed MobileTabBar. Wrapped question headings use `.pitch-display--roomy` (line-height 1.3) — the display class's 1.04 overlaps at text-xl on mobile. The old loose-icon ring assets (`public/senses/arc/`) are unused by the dial now. No selection frame on click. Typewriter tour text + one-pass auto-presentation. **Live wine proposals** render under the stages (`InlineProposals`): the live `CompassProfile` is matched against `src/data/samouczek-wines.ts` (18 grape/style entries with compass fingerprints) by the pure cosine matcher in `src/lib/samouczek-match.ts`; each card links to **winnica.pl** search for that grape (originators of the Vinokompas method — robust search URLs, never 404). Profile persists to `localStorage["wn_compass_profile_v1"]`.
- `/pitch` — editorial sales-pitch landing for restaurant owners.
- `/admin` — **localStorage sandbox/library** (global pairing playground via `usePairingDataset` + API Playground + Export/Import), explicitly labelled "sandbox — localStorage only". Top of page is a CTA to the DB editor. The legacy in-page `RestaurantContentManager` (duplicate localStorage restaurant editor) was **removed** — use `/admin/restaurants/[slug]` for real edits. Auth gate OFF via `AUTH_GATE_ADMIN=0`.
- `/admin/restaurants` + `/admin/restaurants/[slug]` — **DB-canonical per-restaurant editor** (SWR hooks + write API in `src/lib/use-restaurant-data.ts`). The only place edits persist to Postgres and reach guests.
- `/admin/signin` — magic-link login flow (waits on SMTP env vars). **Note:** with the gate ON the default is now env **Basic Auth** (browser login prompt on `/admin`); this page only matters if you wire SMTP + magic-link.

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
- `/api/auth/[...nextauth]` — Auth.js handlers

All write routes go through `src/lib/api-acl.ts`:
 - `requireAuth(request?)` returns the active user. `AUTH_GATE_ADMIN=0` → synthetic `pilot` user (open). `=1` → validates env **Basic Auth** (`ADMIN_USER`/`ADMIN_PASSWORD` via `src/lib/admin-auth.ts`), falling back to an Auth.js magic-link session; else 401.
 - `requireRestaurantMember(user, slug)` resolves the restaurant + checks `restaurant_members` (bypassed in pilot mode and for the `admin` role)
 - `enforceWriteRateLimit(request)` — per-IP sliding window (120/min) on every mutation; `apiHandler(fn)` converts thrown `ApiError` into JSON+status (+ `Retry-After` on 429)
Every write emits an `admin_*` event into the analytics table with the actor id.
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
- Edge constraint: middleware MUST NOT import `@/auth` (pulls postgres into edge runtime and crashes). The admin gate uses env Basic Auth via `src/lib/admin-auth.ts` (zero imports, edge-safe) — see `src/middleware.ts`.

## Deployment

Manual, not CI. Full topology in memory: `~/.claude/projects/-Users-Andrey-App-web-wn/memory/deployment.md`.

**Single production host since 2026-07-16: VPS2 (Hetzner FSN1,
`178.104.223.93`).** The old VPS1 (`46.225.11.249`) was wiped of this project
the same day (containers/volume/image/repo removed; final DB dump archived at
`/opt/repos/wine_web_wn/backups/wine-vps1-final-20260716.sql.gz` on VPS2).
Postgres on VPS2 carries the full pilot history (events since 2026-05-05).
Daily DB backup: cron `20 3 * * *` → `/opt/backups/wine_web_wn/` (14-day
retention). TLS: certbot with auto-renew (`certbot.timer`) on VPS2 — the old
manual DNS-01 ritual is dead.

```bash
# Local
npm run check && git push origin main

# VPS2 — PRODUCTION (git pull + docker build + rm/run)
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@178.104.223.93 'bash /opt/repos/wine_web_wn/update_wine_web.sh'

# Smoke
curl -I https://wine.icoffio.com   # expect 200 OK
curl -I https://wine.icoffio.com/pl   # expect 200 OK (Polish locale)

# Live regression — runs the smoke + i18n e2e suite against production
npx playwright test --config=playwright.live.config.ts --grep "v2 admin|i18n EN/PL"
```

There is **no docker-compose.yml** on this VPS for this project — `update_wine_web.sh` does `git pull → docker build -f Dockerfile.vps → docker rm/run`. Container name `wine_web_wn_app`. **Secrets never enter the image** (`.dockerignore` excludes `.env*`; injected at runtime via `--env-file`); **`NEXT_PUBLIC_*` are passed as `--build-arg`** sourced from `.env.local` (blank Mapbox map after deploy ⇒ build-args weren't passed). Container runs as the non-root `node` user. To rotate a runtime secret (e.g. `OPENAI_API_KEY`) without a rebuild: edit `.env.local` then `docker rm -f wine_web_wn_app && docker run … --env-file … wine_web_wn:latest` (env is read at container create, so a plain `docker restart` won't pick it up).

App binds `172.17.0.1:4300` only — public access is via the shared `nginx_server` reverse proxy. Never expose 4300 publicly. Never restart `nginx_server`; reload via `docker exec nginx_server nginx -s reload`. The VPS hosts other production services (n8n, flask_wine, regatta, icoffio-front) — see `~/.claude/memory/vps_infrastructure.md` before touching anything outside this project's container.

## TLS

Handled automatically on VPS2: certbot renewal config for `wine.icoffio.com`
+ systemd `certbot.timer`. Current cert 2026-07-16 → 2026-10-14. The manual
DNS-01 ritual documented pre-migration applied to VPS1 and is obsolete.

## Posture & caveats

- **Production-grade backend in place AND wired to the public read-path** — Postgres 16 + Drizzle migrations + Auth.js scaffold + analytics events + complete write API (POST/PUT/DELETE for dishes/wines/pairings, all zod-validated, all ACL-gated). As of 2026-05-29 the public pages (home, guest `/restaurants/[slug]`, scoped `/pairing`) **read from the DB** (`resolveRestaurants`/`resolveRestaurantBySlug`, DB→seed fallback, ISR `revalidate=60`). Edits via the DB editor reach guests. Don't roll back to localStorage-only thinking.
- **Dead module:** `src/lib/restaurant-store.ts` (`useRestaurantCatalog`) now has **no consumers** after the read-path migration + `RestaurantContentManager` removal — safe to delete in a cleanup pass (`pairing-store.ts`/`usePairingDataset` is still used by the `/admin` sandbox and the no-param `/pairing`).
- **⚠️ Security — write API is open ONLY while the gate is off.** `AUTH_GATE_ADMIN=0` (current default) means `/admin` + all write routes accept unauthenticated requests via the synthetic `pilot` user → an open `POST/PUT/DELETE /api/restaurants/<slug>/*` **changes what guests see**. **Mitigated** (PR `security-hardening`, 2026-06): all write + OpenAI/CPU routes are now **rate-limited**, and a one-line **env Basic Auth gate** closes the hole entirely. **Until you flip the gate, the API is still open** — see `docs/audit-2026-05.md` P0-2/P1-2.
- **Closing the gate — two options.** (a) **Simple, recommended, no SMTP:** add `AUTH_GATE_ADMIN=1` + `ADMIN_USER=admin` + `ADMIN_PASSWORD=<strong>` to `/opt/repos/wine_web_wn/.env.local`, redeploy → `/admin` + write API require HTTP Basic Auth (`src/lib/admin-auth.ts`); fails closed if `ADMIN_PASSWORD` unset. (b) **Magic-link, multi-user:** `docs/ops/auth-gate-flip.md` — SMTP env → `ADMIN_EMAIL=… npx tsx scripts/db-bootstrap-admin.mts` → `AUTH_GATE_ADMIN=1`; bootstrap BEFORE flipping or you lock yourself out. Same flag gates both; Basic Auth wins, magic-link is fallback. Open-redirect on signin `returnTo` already fixed (`safeReturnTo`).
- **Full tech+design audit:** `docs/audit-2026-05.md` (P0/P1/P2, verified). Done: read-path→DB, open-redirect, metadata, admin consolidation; **2026-06 hardening** (PR `security-hardening`) added rate-limiting, input-validation/IDOR/prompt-injection fixes, **security headers** (CSP/HSTS/XFO/nosniff/Referrer/Permissions in `next.config.ts`), the env Basic Auth gate, `.dockerignore` + build-args + non-root container, and bumped `next`→16.2.9 (middleware-authz CVE) + `next-intl`→4.13. **Still open: C1 — flip the gate** (off by default); `nodemailer`/`next-auth` beta advisories (no upstream fix, only relevant once magic-link is live).
- **Seed wine photos and prices are placeholder-grade.** Source-back each label before any commercial pitch.
- **Image pipeline:** every seeded dish/wine has a generated local photo under `public/{dishes,wines}/<slug>/<id>.png` (50 dishes + 40 wines), mapped in `src/data/{dish,wine}-images.ts`; senses under `public/senses/*.png` (18), mapped in `src/data/sense-images.ts`. **Coverage is 100% (verified 2026-06-18 by diffing every seed id against the maps: 40/40 wines, 50/50 dishes, 18/18 senses) — nothing falls back to Unsplash in practice.** Resolution order in `src/lib/food-photos.ts`: explicit `wine.image`/`dish.image` → local map by id → category-keyed Unsplash fallback → generic fallback (the Unsplash branch only fires for never-seeded ids). DB wines use `external_id` = the seed id (`r1-w1`…), so DB-served wines hit the local map too. Brief "empty squares" on first paint are next/image lazy-load timing, not missing files. Regenerate only if you add NEW wines/dishes: `OPENAI_API_KEY=… npx tsx scripts/gen-wine-images.mts` (dall-e-3, writes PNG + appends the map). Verify with `node scripts/shoot-mobile.mjs` (iPhone-width live screenshots → `/tmp/wn-mobile`). **Icons are now inline SVG** (`src/components/v2/Icon.tsx`) — the Material Symbols web font was removed (it flashed ligature text on mobile). **QR codes** render locally via `qrcode.react` (`<QRCodeSVG value={restaurantUrl}>`), no external `api.qrserver.com`. `next.svg`/`globe.svg`/etc. in `public/` are unused create-next-app leftovers; `RestaurantCard.tsx`/`HeroSection.tsx` are dead (unimported).
- **PL seed translations are LLM first-pass.** Polish-speaking sommelier must vet wine vocabulary before commercial pitch.
- **OpenAI cost discipline:** `/api/pairing/explain` is per-(dish,wine) cached client-side so re-selecting doesn't re-spend tokens. `/api/chat` capped at 350 tokens per response. Default model `gpt-5.4-mini` (~$0.0003/exchange).
