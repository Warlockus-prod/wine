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
- Leaflet + OpenStreetMap (homepage map)
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

- `/` (or `/pl`) — restaurant directory + Leaflet+OSM map + filters; hero has prominent **Samouczek smaku** gold CTA
- `/restaurants/[slug]` — per-venue menu + QR (DB-backed via `/api/restaurants/[slug]`)
- `/pairing?restaurant=<slug>` — bidirectional matching workspace: pick dish → wines re-rank, pick wine → menu re-ranks. Top-3 highlights, auto-select #1 of the other side. Chat panel has 4 bubbles: compare → curated/algo reason → **Vinokompas-vocab 2-sentence explanation** (gold-bordered, AI-generated via `/api/pairing/explain`) → service note. Decant strings localized at render time (`localizeDecant`).
- `/samouczek` — interactive Vinokompas tutorial: SVG compass (6 sectors × 2 tendencje × 5 intensity rings, ARIA-correct), 3 base-smaki sliders, **3-level CompassExplorer** (sektor → tendencja → skojarzenia) with progressive reveal, **FloatingTasteChat** docked bottom-right (persists across scroll, expand/collapse remembered in localStorage). 3-stage `<StagedTutorial>` (SMAK → WRAŻENIA → TENDENCJE) with typewriter tour text + dryness bar above the compass. **Live wine proposals** render under the stages (`InlineProposals`): the live `CompassProfile` is matched against `src/data/samouczek-wines.ts` (18 grape/style entries with compass fingerprints) by the pure cosine matcher in `src/lib/samouczek-match.ts`; each card links to **winnica.pl** search for that grape (originators of the Vinokompas method — robust search URLs, never 404). Profile persists to `localStorage["wn_compass_profile_v1"]`.
- `/pitch` — editorial sales-pitch landing for restaurant owners.
- `/admin` — content editor (UI still localStorage; DB serves all reads via API; write API surface ready). Auth gate OFF via `AUTH_GATE_ADMIN=0`.
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

## Posture & caveats

- **Production-grade backend now in place** — Postgres 16 + Drizzle migrations + Auth.js scaffold + analytics events + complete write API (POST/PUT/DELETE for dishes/wines/pairings, all zod-validated, all ACL-gated). Use it; don't roll back to localStorage-only thinking.
- **Admin UI still writes to localStorage** even though reads come from DB and the write API is fully ready. Refactoring the admin page to use `fetch('/api/restaurants/<slug>/dishes', {method: 'POST', body: ...})` instead of `setDataset` is the natural next pass — backend is waiting.
- **Bootstrap your admin user** before flipping the auth gate: `ADMIN_EMAIL=ty@firma.pl npx tsx scripts/db-bootstrap-admin.mts` (run on VPS via docker exec). Then provision SMTP env (EMAIL_SERVER_*) and set `AUTH_GATE_ADMIN=1`. Without this two-step, flipping the gate is a lockout.
- **Auth gate is currently OFF** (`AUTH_GATE_ADMIN=0`). Magic-link infra is wired and ready; flip to `1` AFTER provisioning SMTP env vars (EMAIL_SERVER_HOST/PORT/USER/PASSWORD/FROM). Until then `/admin/signin` does work but emits the magic link to `docker logs` instead of email.
- **Seed wine photos and prices are placeholder-grade.** Source-back each label before any commercial pitch.
- **Image pipeline:** every seeded dish/wine has a generated local photo under `public/{dishes,wines}/<slug>/<id>.png` (50 dishes + 40 wines), mapped in `src/data/{dish,wine}-images.ts`; senses under `public/senses/*.png` (18), mapped in `src/data/sense-images.ts`. Resolution order in `src/lib/food-photos.ts`: explicit `wine.image`/`dish.image` → local map by id → category-keyed Unsplash fallback → generic fallback. **Caveat:** the Unsplash fallbacks are external and DO rot — they were audited+repaired 2026-05-23 (11 dead IDs swapped). When a DB wine id has no entry in the local map (e.g. La Scolca Gavi, Jermann Pinot Grigio on atelier-amaro) it falls to the Unsplash white-wine photo; the durable fix is to re-run `scripts/gen-wine-images.mts` so every served wine id has a local image. Verify images with `node scripts/shoot-proposals.mjs` or a browser `naturalWidth===0` sweep. Icons (`public/app-icon.svg`, `src/app/favicon.ico`, `src/app/manifest.ts`) are all local SVG — the `next.svg`/`globe.svg`/`window.svg`/`file.svg`/`vercel.svg` in `public/` are unused create-next-app leftovers.
- **PL seed translations are LLM first-pass.** Polish-speaking sommelier must vet wine vocabulary before commercial pitch.
- **OpenAI cost discipline:** `/api/pairing/explain` is per-(dish,wine) cached client-side so re-selecting doesn't re-spend tokens. `/api/chat` capped at 350 tokens per response. Default model `gpt-5.4-mini` (~$0.0003/exchange).
