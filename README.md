# Cellar Compass (Wine Pairing Restaurants)

Production-ready demo website for a multi-restaurant menu + wine pairing flow.

## What is implemented

- 5 restaurants with dedicated pages (`/restaurants/[slug]`)
- Realistic seed content: dishes, wines, pairing reasons
- Pairing UX:
  - selected dish is highlighted
  - non-selected dishes are dimmed
  - matching wines are highlighted
  - each match shows "Why it works"
- Admin panel (`/admin`):
  - edit dishes/wines/pairings
  - add/remove items
  - save/revert/reset
  - import/export JSON backup
- Local-first persistence via `localStorage` with runtime data normalization
- Responsive design for desktop/mobile
- E2E smoke test with Playwright

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
npm run lint
npm run build
npm run test:e2e
```

## Main routes

- Catalog: [http://localhost:3000](http://localhost:3000)
- Admin: [http://localhost:3000/admin](http://localhost:3000/admin)
- Example restaurant: [http://localhost:3000/restaurants/trattoria-bellavista](http://localhost:3000/restaurants/trattoria-bellavista)

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

This is a strong demo build. For a full production SaaS release, the next step is backend storage (PostgreSQL), server auth/roles, and API-based admin operations.
