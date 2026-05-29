# Vinovigator AI — agent notes

Live: https://wine.icoffio.com — production for restaurant pitches.
Repo: https://github.com/Warlockus-prod/wine.git (`main` is what ships).

## Stack

- Next.js 16 (App Router under `[locale]/`, **webpack** flag in `dev`/`build` — keep it)
- React 19, TypeScript, Tailwind v4, Playwright
- next-intl 4 (`localePrefix: "as-needed"`) — Polish primary, English at root
- **Postgres 16** + Drizzle ORM + drizzle-kit migrations
- **Auth.js v5** (Drizzle adapter, magic-link via Nodemailer) — gate currently OFF (`AUTH_GATE_ADMIN=0`)
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
- `/samouczek` — interactive Vinokompas tutorial: SVG compass (6 sectors × 2 tendencje × **intensity 0–5** = 6 rings, set by `MAX_INTENSITY` in `TasteCompass.tsx`; ARIA-correct), 3 base-smaki sliders (0–5), **3-level CompassExplorer** (sektor → tendencja → skojarzenia) with progressive reveal, **FloatingTasteChat** docked bottom-right (persists across scroll, expand/collapse remembered in localStorage). 3-stage `<StagedTutorial>` (SMAK → WRAŻENIA → TENDENCJE) with typewriter tour text + dryness bar above the compass. **Live wine proposals** render under the stages (`InlineProposals`): the live `CompassProfile` is matched against `src/data/samouczek-wines.ts` (18 grape/style entries with compass fingerprints) by the pure cosine matcher in `src/lib/samouczek-match.ts`; each card links to **winnica.pl** search for that grape (originators of the Vinokompas method — robust search URLs, never 404). Profile persists to `localStorage["wn_compass_profile_v1"]`.
- `/pitch` — editorial sales-pitch landing for restaurant owners.
- `/admin` — **localStorage sandbox/library** (global pairing playground via `usePairingDataset` + API Playground + Export/Import), explicitly labelled "sandbox — localStorage only". Top of page is a CTA to the DB editor. The legacy in-page `RestaurantContentManager` (duplicate localStorage restaurant editor) was **removed** — use `/admin/restaurants/[slug]` for real edits. Auth gate OFF via `AUTH_GATE_ADMIN=0`.
- `/admin/restaurants` + `/admin/restaurants/[slug]` — **DB-canonical per-restaurant editor** (SWR hooks + write API in `src/lib/use-restaurant-data.ts`). The only place edits persist to Postgres and reach guests.
- `/admin/signin` — magic-link login flow (waits on SMTP env vars to flip the gate).

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
 - `requireAuth()` returns the active user (or a synthetic `pilot` user when `AUTH_GATE_ADMIN=0`)
 - `requireRestaurantMember(user, slug)` resolves the restaurant + checks `restaurant_members` (bypassed in pilot mode)
 - `apiHandler(fn)` converts thrown `ApiError` into JSON+status uniformly
Every write emits an `admin_*` event into the analytics table with the actor id.

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
- Edge constraint: middleware MUST NOT import `@/auth` (pulls postgres into edge runtime and crashes). Use cookie-name probe instead — see `src/middleware.ts`.

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

There is **no docker-compose.yml** on this VPS for this project — `update_wine_web.sh` does `git pull → docker build -f Dockerfile.vps → docker rm/run`. Container name `wine_web_wn_app`.

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
- **⚠️ Security — open write API is now consequential.** `AUTH_GATE_ADMIN=0` (gate OFF) means `/admin` + all write routes accept unauthenticated requests via the synthetic `pilot` user. Because public pages now read the DB, an open `POST/PUT/DELETE /api/restaurants/<slug>/*` **changes what guests see**, and there is **no rate limiting** on write routes (only `/api/chat` is limited) → defacement + OpenAI/DB cost-abuse surface. Close via the gate flip (runbook below) or an interim stopgap (write-route rate-limit, or a shared-secret header) — see `docs/audit-2026-05.md` P0-2/P1-2.
- **Auth-gate flip runbook:** `docs/ops/auth-gate-flip.md` — 2 steps (SMTP env → `ADMIN_EMAIL=… npx tsx scripts/db-bootstrap-admin.mts` → set `AUTH_GATE_ADMIN=1`), with verify + rollback. Env lives in `/opt/repos/wine_web_wn/.env.local` (`--env-file`). Bootstrap BEFORE flipping or you lock yourself out. Open-redirect on signin `returnTo` is already fixed (`safeReturnTo`). Until SMTP is set, `/admin/signin` emits the magic link to `docker logs`.
- **Full tech+design audit:** `docs/audit-2026-05.md` (P0/P1/P2, verified, with remediation sequence). Several items already done this session (read-path→DB, open-redirect, metadata for home/pairing/samouczek, admin consolidation).
- **Seed wine photos and prices are placeholder-grade.** Source-back each label before any commercial pitch.
- **Image pipeline:** every seeded dish/wine has a generated local photo under `public/{dishes,wines}/<slug>/<id>.png` (50 dishes + 40 wines), mapped in `src/data/{dish,wine}-images.ts`; senses under `public/senses/*.png` (18), mapped in `src/data/sense-images.ts`. Resolution order in `src/lib/food-photos.ts`: explicit `wine.image`/`dish.image` → local map by id → category-keyed Unsplash fallback → generic fallback. **Caveat:** the Unsplash fallbacks are external and DO rot — they were audited+repaired 2026-05-23 (11 dead IDs swapped). When a DB wine id has no entry in the local map (e.g. La Scolca Gavi, Jermann Pinot Grigio on atelier-amaro) it falls to the Unsplash white-wine photo; the durable fix is to re-run `scripts/gen-wine-images.mts` so every served wine id has a local image. Verify images with `node scripts/shoot-proposals.mjs` or a browser `naturalWidth===0` sweep. Icons (`public/app-icon.svg`, `src/app/favicon.ico`, `src/app/manifest.ts`) are all local SVG — the `next.svg`/`globe.svg`/`window.svg`/`file.svg`/`vercel.svg` in `public/` are unused create-next-app leftovers.
- **PL seed translations are LLM first-pass.** Polish-speaking sommelier must vet wine vocabulary before commercial pitch.
- **OpenAI cost discipline:** `/api/pairing/explain` is per-(dish,wine) cached client-side so re-selecting doesn't re-spend tokens. `/api/chat` capped at 350 tokens per response. Default model `gpt-5.4-mini` (~$0.0003/exchange).
