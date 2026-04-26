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
npm run check    # = lint + build + 25 e2e tests; all three must pass
```

Individual:

```bash
npm run lint
npm run build
npm run test:e2e
```

E2E specs in `e2e/` — `smoke.spec.ts` is the load-bearing one and also runs as live smoke against wine.icoffio.com.

## Routes worth knowing

- `/` — restaurant directory + map + filters
- `/restaurants/[slug]` — per-venue menu + pairing UI (5 seeded venues, each with QR)
- `/pairing?restaurant=<slug>` — pairing view scoped to a venue's menu and wine list. After ranking loads, the #1 wine is auto-selected and its "why it works" explanation renders.
- `/admin` — local-only content editor (localStorage; export/import JSON for portability)

## Deployment

Manual, not CI. Full topology in memory: `~/.claude/projects/-Users-Andrey-App-web-wn/memory/deployment.md`.

Short version:

```bash
# Local
npm run check && git push origin main

# VPS (shared icoffio host)
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@46.225.11.249
cd /opt/repos/wine_web_wn && git pull && docker compose up -d --build
curl -I https://wine.icoffio.com   # expect 200 OK
```

App binds `172.17.0.1:4300` only — public access is via the shared `nginx_server` reverse proxy. Never expose 4300 publicly. Never restart `nginx_server`; reload via `docker exec nginx_server nginx -s reload`. The VPS hosts other production services (n8n, flask_wine, regatta, icoffio-front) — see `~/.claude/memory/vps_infrastructure.md` before touching anything outside this project's container.

## Posture & caveats

- **Demo for sale**, not a SaaS. No DB, no auth, no multi-tenant isolation. Don't propose backend persistence, accounts, or payment plumbing unless the user is actively pivoting toward a paid product.
- **Seed wine photos and prices are placeholder-grade.** Before any commercial pitch, source-back each label (verified vintage photo + current market price). Surface this caveat proactively when work touches `src/data/seed-restaurants.ts` or pairing visuals.
- Don't refactor toward a backend, accounts, or CMS without an explicit ask — the local-first design is intentional.
