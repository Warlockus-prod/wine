import { describe, it, expect } from "vitest";
import { samouczekRoute, samouczekAllowsApi, FULL_SITE_URL } from "../site-mode";

/** The tutorial site (wine.icoffio.com) must serve the tutorial and nothing
 *  else, while never dead-ending a link that used to work. */
describe("samouczekRoute — what the tutorial site serves", () => {
  it("serves the tutorial itself in both locales", () => {
    expect(samouczekRoute("/samouczek")).toBeNull();
    expect(samouczekRoute("/pl/samouczek")).toBeNull();
  });

  it("serves the embeddable widget (winnica.pl iframes it)", () => {
    expect(samouczekRoute("/embed/samouczek")).toBeNull();
    expect(samouczekRoute("/pl/embed/samouczek")).toBeNull();
  });

  it("keeps the privacy page reachable — it is linked from the footer", () => {
    expect(samouczekRoute("/privacy")).toBeNull();
    expect(samouczekRoute("/pl/privacy")).toBeNull();
  });

  it("opens the tutorial at the bare root, in the guest's language", () => {
    expect(samouczekRoute("/")).toEqual({ to: "/samouczek", external: false });
    expect(samouczekRoute("/pl")).toEqual({ to: "/pl/samouczek", external: false });
    expect(samouczekRoute("/pl/")).toEqual({ to: "/pl/samouczek", external: false });
  });

  it("sends every product page to the full site, path preserved", () => {
    for (const p of [
      "/restaurants/atelier-amaro",
      "/pl/restaurants/atelier-amaro",
      "/pairing",
      "/pl/pairing",
      "/admin",
      "/pl/admin/restaurants/atelier-amaro",
      "/pitch",
    ]) {
      expect(samouczekRoute(p), `for ${p}`).toEqual({
        to: `${FULL_SITE_URL}${p}`,
        external: true,
      });
    }
  });

  it("does NOT let a lookalike path masquerade as the tutorial", () => {
    // "/samouczek-old" must not slip through the allow-list prefix check.
    expect(samouczekRoute("/samouczek-old")?.external).toBe(true);
    expect(samouczekRoute("/pl/samouczekX")?.external).toBe(true);
    expect(samouczekRoute("/embed/samouczek-v2")?.external).toBe(true);
  });

  it("preserves QR-code deep links so printed codes keep working", () => {
    const r = samouczekRoute("/pl/restaurants/trattoria-del-ponte");
    expect(r).toEqual({
      to: `${FULL_SITE_URL}/pl/restaurants/trattoria-del-ponte`,
      external: true,
    });
  });
});

/** The tutorial host is our most widely published origin (QR codes, the shop's
 *  iframe). It must expose only the APIs the tutorial itself uses. */
describe("samouczekAllowsApi — which APIs the tutorial site serves", () => {
  it("allows exactly what the tutorial needs", () => {
    for (const p of ["/api/chat", "/api/events", "/api/profiles", "/api/chat/"]) {
      expect(samouczekAllowsApi(p), p).toBe(true);
    }
  });

  it("blocks the write API — the reason this split exists", () => {
    for (const p of [
      "/api/restaurants",
      "/api/restaurants/atelier-amaro/dishes",
      "/api/restaurants/atelier-amaro/wines/r1-w1",
      "/api/restaurants/atelier-amaro/pairings",
    ]) {
      expect(samouczekAllowsApi(p), p).toBe(false);
    }
  });

  it("blocks admin analytics and auth", () => {
    for (const p of ["/api/admin/chat-analytics", "/api/auth/session", "/api/pairing", "/api/pairing/explain"]) {
      expect(samouczekAllowsApi(p), p).toBe(false);
    }
  });

  it("does not let a lookalike path slip past the allow-list", () => {
    for (const p of ["/api/chat-analytics", "/api/chatx", "/api/events-admin", "/api/profiles/all", "/api/chat/../restaurants"]) {
      expect(samouczekAllowsApi(p), p).toBe(false);
    }
  });
});
