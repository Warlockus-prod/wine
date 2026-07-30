import { describe, it, expect } from "vitest";
import { samouczekRoute, FULL_SITE_URL } from "../site-mode";

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
