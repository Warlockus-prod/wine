# Cellar Compass (Wine Pairing Restaurants)

Production-ready demo website for a multi-restaurant menu + wine pairing flow.

**Live:** [https://wine.icoffio.com](https://wine.icoffio.com)

## What is implemented

- 5 restaurants with dedicated pages (`/restaurants/[slug]`) and per-venue QR entry points
- Restaurant directory with map and filters
- Realistic seed content: dishes, wines, pairing reasons
- Pairing UX (`/pairing?restaurant=<slug>`):
  - menu and wine list scoped to the selected restaurant
  - selected dish is highlighted, non-selected dishes are dimmed
  - top-3 wine matches highlighted; #1 is auto-selected as the active wine
  - "Why it works" explanation rendered for the best match
- Admin panel (`/admin`):
  - edit dishes/wines/pairings
  - add/remove items
  - save/revert/reset
  - import/export JSON backup
- Local-first persistence via `localStorage` with runtime data normalization
- Responsive design for desktop/mobile
- E2E suite with Playwright (25 specs — gating before deploy)

## Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS 4
- Playwright

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Production run

```bash
npm run build
npm run start
```

## Validation before demo

```bash
npm run check
```

## Main routes

- Catalog: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- Example restaurant: [http://localhost:3000/restaurants/trattoria-bellavista](http://localhost:3000/restaurants/trattoria-bellavista)
- Pairing (scoped to a venue): `/pairing?restaurant=<slug>`

## Deploy

App runs on the shared icoffio VPS, bound to `172.17.0.1:4300` behind the shared `nginx_server` reverse proxy at https://wine.icoffio.com. Manual deploy — no CI:

```bash
# Local — gate first
npm run check
git push origin main

# VPS
ssh -i ~/.ssh/aiw_new_vps_ed25519 root@46.225.11.249
cd /opt/repos/wine_web_wn && git pull && docker compose up -d --build
curl -I https://wine.icoffio.com   # expect 200 OK
```

Agents: see [`CLAUDE.md`](CLAUDE.md) for the full deployment + posture notes.

## Data notes

- All edits are stored locally in browser storage.
- Use **Export JSON** in admin to move data between machines/browsers.
- Use **Import JSON** to restore data.
- **Reset all** returns to seeded demo data.

## Project structure

- `/Users/Andrey/App/web_wn/src/app/page.tsx` - catalog and restaurant tree
- `/Users/Andrey/App/web_wn/src/app/restaurants/[slug]/page.tsx` - menu + pairing UI
- `/Users/Andrey/App/web_wn/src/app/admin/page.tsx` - content editor
- `/Users/Andrey/App/web_wn/src/context/restaurants-context.tsx` - data store + persistence
- `/Users/Andrey/App/web_wn/src/data/seed-restaurants.ts` - initial dataset
- `/Users/Andrey/App/web_wn/e2e/smoke.spec.ts` - end-to-end smoke test

## Current scope

This is a strong demo build for sales presentations. For a full production SaaS release, the next step is backend storage (PostgreSQL), server auth/roles, and API-based admin operations.

**Caveat for commercial pitches:** seed wine photos and prices in `src/data/seed-restaurants.ts` are placeholder-grade. Replace with source-backed records (verified vintage photo + current market price) per label before any paid-customer demo.
