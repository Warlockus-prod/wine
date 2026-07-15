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
- `/samouczek` — interactive Vinokompas tutorial: SVG compass (6 sectors × 2 tendencje × **intensity 0–5** = 6 rings, set by `MAX_INTENSITY` in `TasteCompass.tsx`; ARIA-correct). **Sector order matches the canonical vinocompas.pl wheel** (clockwise from 12: Tęgie → Miękkie → Oleiste → Świeże → Ziemiste → Szorstkie) — `COMPASS_SECTORS` in `wine-compass-kb.ts` is the single source of truth; the dial renders it clockwise, so array order = visual order (verified against the official calculator's S1/S2 data, 2026-06). **3-level CompassExplorer** (sektor → tendencja → skojarzenia) with progressive reveal, **FloatingTasteChat** docked bottom-right (persists across scroll, expand/collapse remembered in localStorage). **3-stage `<StagedTutorial>`** (SMAK → WRAŻENIA → AROMATY; a 2-stage merge was trialled in 2026-06 and reverted 2026-07 at the client's request): stage 1 = 3 base smaki on the level-1 wheel + dryness bar under the dial, stage 2 = 6 wrażenia (level 2), stage 3 = 12 tendencje/aromaty (level 3). **Wheel geometry is canonical**: sector boundaries fall exactly ON the base-taste axes (CIERPKOŚĆ 12:00 = Szorstkie/Tęgie border, SŁODYCZ = Miękkie/Oleiste, KWASOWOŚĆ = Świeże/Ziemiste) — sector i spans `[arc·i, arc·(i+1)]` from 12 o'clock; do NOT re-add a −π/2 half-sector offset. The unused `baseInteractive` rim-slider mode remains in TasteCompass. Typewriter tour text + one-pass auto-presentation. **Live wine proposals** render under the stages (`InlineProposals`): the live `CompassProfile` is matched against `src/data/samouczek-wines.ts` (18 grape/style entries with compass fingerprints) by the pure cosine matcher in `src/lib/samouczek-match.ts`; each card links to **winnica.pl** search for that grape (originators of the Vinokompas method — robust search URLs, never 404). Profile persists to `localStorage["wn_compass_profile_v1"]`.
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

```bash
# Local
npm run check && git push origin main

# VPS (shared icoffio host) — single command does git pull + docker build + rm/run
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@46.225.11.249 'bash /opt/repos/wine_web_wn/update_wine_web.sh'

# Smoke
curl -I https://wine.icoffio.com   # expect 200 OK
curl -I https://wine.icoffio.com/pl   # expect 200 OK (Polish locale)

# Live regression — runs the smoke + i18n e2e suite against production
npx playwright test --config=playwright.live.config.ts --grep "v2 admin|i18n EN/PL"
```

There is **no docker-compose.yml** on this VPS for this project — `update_wine_web.sh` does `git pull → docker build -f Dockerfile.vps → docker rm/run`. Container name `wine_web_wn_app`. **Secrets never enter the image** (`.dockerignore` excludes `.env*`; injected at runtime via `--env-file`); **`NEXT_PUBLIC_*` are passed as `--build-arg`** sourced from `.env.local` (blank Mapbox map after deploy ⇒ build-args weren't passed). Container runs as the non-root `node` user. To rotate a runtime secret (e.g. `OPENAI_API_KEY`) without a rebuild: edit `.env.local` then `docker rm -f wine_web_wn_app && docker run … --env-file … wine_web_wn:latest` (env is read at container create, so a plain `docker restart` won't pick it up).

App binds `172.17.0.1:4300` only — public access is via the shared `nginx_server` reverse proxy. Never expose 4300 publicly. Never restart `nginx_server`; reload via `docker exec nginx_server nginx -s reload`. The VPS hosts other production services (n8n, flask_wine, regatta, icoffio-front) — see `~/.claude/memory/vps_infrastructure.md` before touching anything outside this project's container.

## TLS / cert renewal — manual quarterly action required

**`wine.icoffio.com` is NOT in MetroWeb edge's auto-SSL system** (unlike `app`, `n8n`, `regatta`, `web`, `moda`, `voxcategory` etc., which the edge auto-renews via its own ACME client). Reason: nobody added wine to the MetroWeb auto-renew list. As a result certbot on this VPS owns the cert, but webroot HTTP-01 renewal is blocked — the MetroWeb edge (`178.104.223.93`) terminates port 80 and returns 404 for `/.well-known/acme-challenge/...`; port 443 is TCP-passthrough to our nginx, so a locally-installed cert IS served to browsers.

Cert was last issued via manual DNS-01 on **2026-05-26**, expires **2026-08-24**. Must repeat by then. Deploy hook `/etc/letsencrypt/renewal-hooks/deploy/wine_icoffio_sync.sh` auto-installs the new cert to `/opt/repos/certs/{certs,private}/wine.icoffio.com.{crt,key}` and reloads `nginx_server` on successful issuance — so renewal is a single certbot run + a single DNS record.

### Renewal procedure (~5 min)

1. On VPS, launch detached certbot manual DNS-01 (FIFO holds it paused at the DNS prompt):
   ```bash
   ssh -i ~/.ssh/aiw_new_vps_ed25519 root@46.225.11.249 '
     rm -f /tmp/cbfifo /tmp/cbout; mkfifo /tmp/cbfifo;
     setsid bash -c "exec 9<>/tmp/cbfifo; certbot certonly --manual --preferred-challenges dns \
       --cert-name wine.icoffio.com -d wine.icoffio.com \
       --agree-tos --no-eff-email --force-renewal \
       < /tmp/cbfifo > /tmp/cbout 2>&1" </dev/null >/dev/null 2>&1 & disown;
     sleep 8; cat /tmp/cbout'
   ```
2. Read the TXT value from the prompt output and add it in MetroWeb DirectAdmin:
   - Panel: `https://server001.metroweb.pl:2222/evo/user/dns-records` (account `icoffio.com`).
   - Click **Dodaj rekord** → Typ: `TXT`, Nazwa: `_acme-challenge.wine` (`.icoffio.com` is appended automatically), TTL: 300, Wartość: `<value from certbot prompt>`. Save.
3. Verify propagation: `dig +short @8.8.8.8 TXT _acme-challenge.wine.icoffio.com` — must echo the value.
4. Resume certbot:
   ```bash
   ssh -i ~/.ssh/aiw_new_vps_ed25519 root@46.225.11.249 '
     echo "" > /tmp/cbfifo; sleep 15; cat /tmp/cbout; rm -f /tmp/cbfifo /tmp/cbout'
   ```
   Expect `Successfully received certificate` + multiple `nginx configuration file test is successful`. Deploy hook fires automatically.
5. Optionally delete the TXT record in MetroWeb (it's harmless to leave).

### Long-term fixes (pick when convenient)

- **Best:** ask MetroWeb support to add `wine.icoffio.com` to the edge auto-SSL list, same as the other icoffio subdomains. Eliminates the manual ritual forever.
- **Alt:** wire a DirectAdmin DNS API auth hook for certbot (`--manual-auth-hook` script that POSTs to DA API to add the TXT, then deletes it on cleanup). Requires a DA API token.

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
