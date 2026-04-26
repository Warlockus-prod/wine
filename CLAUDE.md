# Cellar Compass — agent notes

Live: https://wine.icoffio.com — production demo for restaurant pitches.
Repo: https://github.com/Warlockus-prod/wine.git (`main` is what ships).

## Stack

- Next.js 16 (App Router, **webpack** flag in `dev`/`build` — keep it)
- React 19, TypeScript, Tailwind v4, Playwright
- No backend. Data lives in `src/data/seed-restaurants.ts`; user edits persist in browser localStorage via `src/context/restaurants-context.tsx`.

## Validation gate

Before any commit/push that will be deployed:

```bash
npm run check    # = lint + build + 26 e2e tests; all three must pass
```

Individual:

```bash
npm run lint
npm run build
npm run test:e2e
```

E2E specs in `e2e/` — `smoke.spec.ts` is the load-bearing one and also runs as live smoke against wine.icoffio.com.

## Routes worth knowing

All routable pages live under `src/app/[locale]/`. Default English URL has no prefix; Polish gets `/pl/...`.

- `/` (or `/pl`) — restaurant directory + Leaflet+OSM map + filters
- `/restaurants/[slug]` (or `/pl/restaurants/[slug]`) — per-venue menu + pairing UI (5 seeded venues, each with QR)
- `/pairing?restaurant=<slug>` — pairing view scoped to a venue's menu and wine list. After ranking loads, the #1 wine is auto-selected and its "why it works" explanation renders in the bot chat panel.
- `/admin` — content editor with EN | PL inputs side by side for every localized field; includes a Curated Pairings section that overrides algorithmic reasons. localStorage-backed; export/import JSON for portability.

## i18n notes

- `next-intl` 4 with `localePrefix: "as-needed"` — existing English QR codes stay valid (no prefix), Polish gets `/pl/...`.
- Schema: `dish/wine/pairing.name/description/notes/reason` are `LocalizedString = {en, pl}`. Use `t(field, locale)` from `@/lib/localized` to render.
- Chrome strings live in `messages/{en,pl}.json`. Use `useTranslations()` (client) or `getTranslations()` (server).
- Use `Link` / `useRouter` / `usePathname` from `@/i18n/navigation`, not `next/link` / `next/navigation`, so locale prefixes are added automatically.
- **Caveat:** PL seed translations (wine notes + pairing reasons) are LLM first-pass. A Polish-speaking sommelier must vet `src/data/seed-restaurants.ts` and `src/data/seed-pairing.ts` before any commercial pitch. Re-translation tooling: `scripts/migrate-seed-restaurants.mjs` + `scripts/translate-seed-restaurants.mjs`.

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

- **Demo for sale**, not a SaaS. No DB, no auth, no multi-tenant isolation. Don't propose backend persistence, accounts, or payment plumbing unless the user is actively pivoting toward a paid product.
- **Seed wine photos and prices are placeholder-grade.** Before any commercial pitch, source-back each label (verified vintage photo + current market price). Surface this caveat proactively when work touches `src/data/seed-restaurants.ts` or pairing visuals.
- Don't refactor toward a backend, accounts, or CMS without an explicit ask — the local-first design is intentional.
