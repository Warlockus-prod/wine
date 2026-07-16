/**
 * API contract tests — status + shape assertions for the public/write surface.
 *
 * Runs against the playwright webServer (npm run start on :4173) or whatever
 * BASE_URL points at. Design constraints:
 *
 *  - NO OpenAI spend: /api/chat and /api/pairing/explain are exercised only on
 *    their invalid-payload paths, which return 400 before any OpenAI call.
 *  - DB-aware: the local dev box may have no Postgres (read routes fall back to
 *    the in-repo seed, `source: "seed"`). DB-backed write cycles probe once via
 *    GET /api/restaurants and skip cleanly when no DB is behind the server.
 *    They also skip (not fail) when the auth gate is ON (writes → 401), so the
 *    file is safe under playwright.live.config.ts too.
 *  - Rate-limit friendly: total mutation count stays far below the 120/min
 *    write window; no 429 paths are exercised.
 *  - Self-cleaning: every created row is deleted in a finally block.
 */

import { expect, test, type APIRequestContext } from "@playwright/test";
import { Buffer } from "node:buffer";
import { randomUUID } from "node:crypto";

// Raw bytes (NOT valid JSON). A plain string with a JSON content-type would be
// re-serialized by Playwright into a valid JSON string literal — a Buffer is
// sent verbatim, so the server's request.json() genuinely throws.
const RAW_NOT_JSON = Buffer.from("{ definitely-not-json");

type Probe = {
  /** "db" when Postgres answered, "seed" when the in-repo fallback served. */
  source: "db" | "seed";
  /** First restaurant slug from the directory — used for per-venue routes. */
  slug: string;
  /** Status of a schema-invalid write: 400 = open gate + live DB, 401 = gate ON. */
  writeStatus: number;
};

// workers=1 in playwright.config.ts, so a module-level cache is safe; other
// workers would simply re-probe (three cheap requests).
let probeCache: Probe | null = null;

async function probe(request: APIRequestContext): Promise<Probe> {
  if (probeCache) return probeCache;
  const res = await request.get("/api/restaurants");
  expect(res.status()).toBe(200);
  const body = await res.json();
  const slug: string = body.data?.[0]?.slug ?? "";
  expect(slug.length).toBeGreaterThan(0);
  // Schema-invalid POST: never creates anything, but its status reveals
  // whether writes are reachable (400) or auth-gated (401) / DB-less (500).
  const write = await request.post(`/api/restaurants/${slug}/dishes`, {
    data: { probe: true },
  });
  probeCache = {
    source: body.source === "db" ? "db" : "seed",
    slug,
    writeStatus: write.status(),
  };
  return probeCache;
}

/** Skip DB-backed tests when there is no DB or the write gate is closed. */
async function requireOpenDbWrites(request: APIRequestContext): Promise<string> {
  const p = await probe(request);
  test.skip(p.source !== "db", "No Postgres behind this server (seed fallback) — write API untestable");
  test.skip(p.writeStatus === 401, "AUTH_GATE_ADMIN=1 — write API auth-gated, skipping open-gate contract");
  return p.slug;
}

const MISSING_SLUG = "definitely-missing-slug-xyz";

// ─── Public read surface ────────────────────────────────────────────────

test.describe("GET /api/restaurants", () => {
  test("lists restaurants with slug + name", async ({ request }) => {
    const res = await request.get("/api/restaurants");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.count).toBe(body.data.length);
    // Contract quirk: resolveRestaurants() reports the literal "demo seed" on
    // fallback (FALLBACK_REASON cast to "seed" in db-restaurants.ts), while
    // resolveRestaurantBySlug() reports plain "seed". Accept both spellings.
    expect(["db", "seed", "demo seed"]).toContain(body.source);
    for (const r of body.data) {
      expect(typeof r.slug).toBe("string");
      expect(r.slug.length).toBeGreaterThan(0);
      // Restaurant name is a LocalizedString {en, pl}.
      expect(typeof r.name?.en).toBe("string");
      expect(typeof r.name?.pl).toBe("string");
    }
  });
});

test.describe("GET /api/restaurants/[slug]", () => {
  test("resolves a known slug with dishes + wines", async ({ request }) => {
    const { slug } = await probe(request);
    const res = await request.get(`/api/restaurants/${slug}`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.data.slug).toBe(slug);
    expect(Array.isArray(body.data.dishes)).toBe(true);
    expect(body.data.dishes.length).toBeGreaterThan(0);
    expect(Array.isArray(body.data.wines)).toBe(true);
    expect(body.data.wines.length).toBeGreaterThan(0);
  });

  test("404s on an unknown slug", async ({ request }) => {
    const res = await request.get(`/api/restaurants/${MISSING_SLUG}`);
    expect(res.status()).toBe(404);
    expect(await res.json()).toMatchObject({ error: "Not found" });
  });
});

// ─── Dishes write cycle (DB + open gate required) ───────────────────────

test.describe("dishes write API", () => {
  test("GET lists dishes; 404 for unknown restaurant", async ({ request }) => {
    const slug = await requireOpenDbWrites(request);
    const ok = await request.get(`/api/restaurants/${slug}/dishes`);
    expect(ok.status()).toBe(200);
    const body = await ok.json();
    expect(Array.isArray(body.data)).toBe(true);

    const missing = await request.get(`/api/restaurants/${MISSING_SLUG}/dishes`);
    expect(missing.status()).toBe(404);
    expect(await missing.json()).toMatchObject({ error: "Restaurant not found" });
  });

  test("POST rejects a payload missing `name` with 400", async ({ request }) => {
    const slug = await requireOpenDbWrites(request);
    const res = await request.post(`/api/restaurants/${slug}/dishes`, {
      // name missing — createSchema requires it.
      data: { description: "contract-test dish", category: "test", price: 1 },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid payload" });
  });

  test("POST creates a dish, DELETE removes it", async ({ request }) => {
    const slug = await requireOpenDbWrites(request);
    const created = await request.post(`/api/restaurants/${slug}/dishes`, {
      data: {
        name: "E2E contract dish",
        description: "created by e2e/api.spec.ts — safe to delete",
        category: "e2e-test",
        price: 1,
      },
    });
    expect(created.status()).toBe(200);
    const dish = (await created.json()).data;
    const dishUrl = `/api/restaurants/${slug}/dishes/${dish.id}`;
    let deleted = false;
    try {
      expect(typeof dish.id).toBe("string");
      // Plain-string localized input is mirrored to {en, pl}.
      expect(dish.name).toMatchObject({ en: "E2E contract dish", pl: "E2E contract dish" });
      expect(dish.category).toBe("e2e-test");

      const del = await request.delete(dishUrl);
      expect(del.status()).toBe(200);
      expect(await del.json()).toMatchObject({ ok: true });
      deleted = true;

      // Row is really gone: a second DELETE 404s.
      const again = await request.delete(dishUrl);
      expect(again.status()).toBe(404);
      expect(await again.json()).toMatchObject({ error: "Dish not found" });
    } finally {
      if (!deleted) await request.delete(dishUrl).catch(() => {});
    }
  });
});

// ─── Wines write cycle ──────────────────────────────────────────────────

test.describe("wines write API", () => {
  test("POST rejects a payload missing required fields with 400", async ({ request }) => {
    const slug = await requireOpenDbWrites(request);
    const res = await request.post(`/api/restaurants/${slug}/wines`, {
      // region/grape/style/price/notes all missing.
      data: { name: "Lonely name" },
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid payload" });
  });

  test("POST creates a wine (structure defaults applied), DELETE removes it", async ({ request }) => {
    const slug = await requireOpenDbWrites(request);
    const created = await request.post(`/api/restaurants/${slug}/wines`, {
      data: {
        name: "E2E contract wine",
        region: "Testland",
        grape: "Testgrape",
        style: "red",
        price: 1,
        notes: "created by e2e/api.spec.ts — safe to delete",
      },
    });
    expect(created.status()).toBe(200);
    const wine = (await created.json()).data;
    const wineUrl = `/api/restaurants/${slug}/wines/${wine.id}`;
    let deleted = false;
    try {
      expect(typeof wine.id).toBe("string");
      expect(wine.name).toMatchObject({ en: "E2E contract wine", pl: "E2E contract wine" });
      // Passport defaults when omitted from the payload.
      expect(wine.body).toBe("medium");
      expect(wine.acidity).toBe("medium");
      expect(wine.tannin).toBe("medium");

      const del = await request.delete(wineUrl);
      expect(del.status()).toBe(200);
      expect(await del.json()).toMatchObject({ ok: true });
      deleted = true;
    } finally {
      if (!deleted) await request.delete(wineUrl).catch(() => {});
    }
  });
});

// ─── Curated pairings upsert + delete ───────────────────────────────────

test.describe("pairings write API", () => {
  test("POST validates ids; upsert is idempotent; DELETE via query params", async ({ request }) => {
    const slug = await requireOpenDbWrites(request);

    // Non-uuid ids → 400 before touching rows.
    const bad = await request.post(`/api/restaurants/${slug}/pairings`, {
      data: { dishId: "not-a-uuid", wineId: "also-not", reason: "x" },
    });
    expect(bad.status()).toBe(400);

    // Valid uuids that don't belong to the restaurant → 404.
    const orphan = await request.post(`/api/restaurants/${slug}/pairings`, {
      data: { dishId: randomUUID(), wineId: randomUUID(), reason: "x" },
    });
    expect(orphan.status()).toBe(404);

    // Real cycle: create dish + wine, pair them, upsert, delete everything.
    const dishRes = await request.post(`/api/restaurants/${slug}/dishes`, {
      data: { name: "E2E pairing dish", description: "e2e temp", category: "e2e-test", price: 1 },
    });
    expect(dishRes.status()).toBe(200);
    const dishId = (await dishRes.json()).data.id as string;
    try {
      const wineRes = await request.post(`/api/restaurants/${slug}/wines`, {
        data: {
          name: "E2E pairing wine",
          region: "Testland",
          grape: "Testgrape",
          style: "red",
          price: 1,
          notes: "e2e temp",
        },
      });
      expect(wineRes.status()).toBe(200);
      const wineId = (await wineRes.json()).data.id as string;
      try {
        const created = await request.post(`/api/restaurants/${slug}/pairings`, {
          data: { dishId, wineId, reason: "e2e contract reason" },
        });
        expect(created.status()).toBe(200);
        const pairing = (await created.json()).data;
        expect(pairing.dishId).toBe(dishId);
        expect(pairing.wineId).toBe(wineId);
        expect(pairing.boost).toBe(15); // default

        // Same triple again = upsert (unique restaurant+dish+wine), not a dupe.
        const upserted = await request.post(`/api/restaurants/${slug}/pairings`, {
          data: { dishId, wineId, reason: "e2e updated reason", boost: 20 },
        });
        expect(upserted.status()).toBe(200);
        const updated = (await upserted.json()).data;
        expect(updated.id).toBe(pairing.id);
        expect(updated.boost).toBe(20);

        const del = await request.delete(
          `/api/restaurants/${slug}/pairings?dishId=${dishId}&wineId=${wineId}`,
        );
        expect(del.status()).toBe(200);
        expect(await del.json()).toMatchObject({ ok: true, deleted: 1 });

        // Idempotent delete reports 0 rows.
        const delAgain = await request.delete(
          `/api/restaurants/${slug}/pairings?dishId=${dishId}&wineId=${wineId}`,
        );
        expect(delAgain.status()).toBe(200);
        expect(await delAgain.json()).toMatchObject({ ok: true, deleted: 0 });

        // Missing query params → 400.
        const delBad = await request.delete(`/api/restaurants/${slug}/pairings?dishId=${dishId}`);
        expect(delBad.status()).toBe(400);
      } finally {
        await request.delete(`/api/restaurants/${slug}/wines/${wineId}`).catch(() => {});
      }
    } finally {
      await request.delete(`/api/restaurants/${slug}/dishes/${dishId}`).catch(() => {});
    }
  });
});

// ─── Algorithmic pairing scorer (no DB, no OpenAI) ──────────────────────

test.describe("POST /api/pairing", () => {
  const scorerPayload = {
    dish: { id: "d1", name: "beef steak", description: "grilled ribeye", tags: ["steak"] },
    wines: [
      { id: "w-cab", name: "Cabernet Sauvignon", description: "full-bodied tannic red" },
      { id: "w-pinot", name: "Pinot Noir rose", description: "light and delicate" },
    ],
  };

  test("scores wines and ranks the structured red first", async ({ request }) => {
    const res = await request.post("/api/pairing", { data: scorerPayload });
    expect(res.status()).toBe(200);
    const { matches } = await res.json();
    expect(Array.isArray(matches)).toBe(true);
    expect(matches).toHaveLength(2);
    for (const m of matches) {
      expect(typeof m.wineId).toBe("string");
      expect(typeof m.reason).toBe("string");
      expect(m.score).toBeGreaterThanOrEqual(25);
      expect(m.score).toBeLessThanOrEqual(99);
    }
    // Sorted descending; tannic red beats the light rosé on red meat.
    expect(matches[0].score).toBeGreaterThanOrEqual(matches[1].score);
    expect(matches[0].wineId).toBe("w-cab");
    expect(matches[0].reason).toContain("Tannin structure");
  });

  test("localizes the algorithmic reason when locale=pl", async ({ request }) => {
    const res = await request.post("/api/pairing", {
      data: { ...scorerPayload, locale: "pl" },
    });
    expect(res.status()).toBe(200);
    const { matches } = await res.json();
    expect(matches[0].reason).toContain("Struktura taninowa");
  });

  test("rejects a schema-garbage payload with 400", async ({ request }) => {
    const res = await request.post("/api/pairing", {
      data: { dish: {}, wines: [] }, // wines min(1) violated
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid payload" });

    const res2 = await request.post("/api/pairing", { data: { nonsense: true } });
    expect(res2.status()).toBe(400);
  });
});

// ─── Analytics ingest (deliberately soft-failing) ───────────────────────

test.describe("POST /api/events", () => {
  test("accepts a whitelisted client event", async ({ request }) => {
    const res = await request.post("/api/events", {
      data: { type: "page_view", props: { source: "e2e/api.spec.ts" } },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.count).toBe(1);
  });

  test("accepts a small batch and reports its count", async ({ request }) => {
    const res = await request.post("/api/events", {
      data: [
        { type: "page_view", props: { source: "e2e/api.spec.ts" } },
        { type: "restaurant_view", props: { source: "e2e/api.spec.ts" } },
      ],
    });
    expect(res.status()).toBe(200);
    expect((await res.json()).count).toBe(2);
  });

  // Contract quirk (by design, see route comment): validation failures are
  // SOFT — the route returns 200 {ok:true} with NO count so bad clients never
  // see a 4xx. "Not ingested" is observable as the missing `count`.
  test("silently drops a non-whitelisted (server-only) event type", async ({ request }) => {
    const res = await request.post("/api/events", {
      data: { type: "admin_dish_create", props: { forged: true } },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.count).toBeUndefined(); // rejected by the whitelist, not ingested
  });

  test("silently drops a batch of 51 (max 50)", async ({ request }) => {
    const res = await request.post("/api/events", {
      data: Array.from({ length: 51 }, () => ({ type: "page_view" as const })),
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.count).toBeUndefined();
  });
});

// ─── Taste profiles ─────────────────────────────────────────────────────

test.describe("/api/profiles", () => {
  test("GET requires a uuid anonymousId", async ({ request }) => {
    const missing = await request.get("/api/profiles");
    expect(missing.status()).toBe(400);
    expect(await missing.json()).toMatchObject({ error: "valid anonymousId required" });

    const bogus = await request.get("/api/profiles?anonymousId=not-a-uuid");
    expect(bogus.status()).toBe(400);
  });

  test("POST rejects an invalid payload with 400", async ({ request }) => {
    const res = await request.post("/api/profiles", {
      data: { anonymousId: randomUUID() }, // compass + baseTastes missing
    });
    expect(res.status()).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid payload" });

    // Intensity outside 0–4 is rejected too.
    const outOfRange = await request.post("/api/profiles", {
      data: { anonymousId: randomUUID(), compass: { swieze_cytrusy: 9 }, baseTastes: {} },
    });
    expect(outOfRange.status()).toBe(400);
  });

  test("upsert + read-back roundtrip by anonymousId", async ({ request }) => {
    const p = await probe(request);
    test.skip(p.source !== "db", "No Postgres behind this server — profiles land 503");

    // Fixed uuid: upsert semantics mean repeat runs update one row instead of
    // accumulating garbage (profiles has no DELETE endpoint).
    const anonymousId = "00000000-e2e0-4000-8000-000000000001";
    const compass = { swieze_cytrusy: 3, tegie_czekolada: 1 };
    const baseTastes = { kwasowosc: 2 };

    const saved = await request.post("/api/profiles", {
      data: { anonymousId, compass, baseTastes },
    });
    expect(saved.status()).toBe(200);
    expect(typeof (await saved.json()).data?.id).toBe("string");

    const read = await request.get(`/api/profiles?anonymousId=${anonymousId}`);
    expect(read.status()).toBe(200);
    const body = await read.json();
    expect(body.data.anonymousId).toBe(anonymousId);
    expect(body.data.compass).toMatchObject(compass);
    expect(body.data.baseTastes).toMatchObject(baseTastes);

    // Unknown (random) id reads back as data: null, not 404.
    const miss = await request.get(`/api/profiles?anonymousId=${randomUUID()}`);
    expect(miss.status()).toBe(200);
    expect((await miss.json()).data).toBeNull();
  });
});

// ─── OpenAI-backed routes: invalid-payload paths ONLY (zero token spend) ─

test.describe("POST /api/pairing/explain (validation only)", () => {
  test("rejects malformed JSON and empty payloads with 400", async ({ request }) => {
    const notJson = await request.post("/api/pairing/explain", {
      headers: { "content-type": "application/json" },
      data: RAW_NOT_JSON,
    });
    expect(notJson.status()).toBe(400);
    expect(await notJson.json()).toMatchObject({ error: "Invalid JSON" });

    const empty = await request.post("/api/pairing/explain", { data: {} });
    expect(empty.status()).toBe(400);
    const body = await empty.json();
    expect(body.error).toBe("Invalid payload");
    expect(body.details).toBeDefined(); // zod error format echoed for this route

    const missingWine = await request.post("/api/pairing/explain", {
      data: { dish: { name: "Steak" } }, // wine object missing entirely
    });
    expect(missingWine.status()).toBe(400);
  });
});

test.describe("POST /api/chat (validation only)", () => {
  test("rejects payloads before any OpenAI call", async ({ request }) => {
    const notJson = await request.post("/api/chat", {
      headers: { "content-type": "application/json" },
      data: RAW_NOT_JSON,
    });
    expect(notJson.status()).toBe(400);
    expect(await notJson.json()).toMatchObject({ error: "Invalid JSON" });

    const noMessages = await request.post("/api/chat", { data: {} });
    expect(noMessages.status()).toBe(400);
    expect(await noMessages.json()).toMatchObject({ error: "messages required" });

    const emptyMessages = await request.post("/api/chat", { data: { messages: [] } });
    expect(emptyMessages.status()).toBe(400);

    // Turns that sanitize away (blank content) → "no valid messages".
    const blankTurn = await request.post("/api/chat", {
      data: { messages: [{ role: "user", content: "   " }] },
    });
    expect(blankTurn.status()).toBe(400);
    expect(await blankTurn.json()).toMatchObject({ error: "no valid messages" });
  });
});
