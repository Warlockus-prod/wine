import { expect, test, devices } from "@playwright/test";

/**
 * Mobile visual regression — ABOVE-THE-FOLD viewport screenshots.
 *
 * Deliberately NOT fullPage: pages carry live AI content (explanations,
 * match %) whose length changes total page height between runs, which made
 * full-page snapshots fail on dimension mismatch alone (audit 2026-07).
 * The viewport crop is stable and still catches theme/font/layout breakage
 * where it matters most. Dynamic widgets inside the fold are masked.
 */

const mobileUse = (() => {
  const device = devices["iPhone 13"];
  return {
    viewport: device.viewport,
    userAgent: device.userAgent,
    deviceScaleFactor: device.deviceScaleFactor,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch,
  };
})();

const pages = [
  { name: "home", path: "/" },
  { name: "pairing", path: "/pairing" },
  { name: "admin", path: "/admin" },
  { name: "pitch", path: "/pitch" },
];

test.describe("mobile visual regression", () => {
  test.use(mobileUse);

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  for (const target of pages) {
    test(`snapshot ${target.name}`, async ({ page }) => {
      await page.goto(target.path, { waitUntil: "domcontentloaded" });
      await page.addStyleTag({
        content:
          "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;caret-color:transparent!important;}",
      });
      // Fonts + late paints settle before we compare pixels. NO networkidle:
      // Mapbox telemetry on the home page never goes idle, which hung the
      // test to timeout. A fixed settle beat is stable enough for a
      // viewport-only crop.
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1200);

      await expect(page).toHaveScreenshot(`${target.name}.png`, {
        fullPage: false,
        maxDiffPixelRatio: 0.02,
        // Live/AI-driven widgets inside the fold: floating chat launcher and
        // any status pills that flip between runs.
        mask: [
          page.locator('[aria-label="Otwórz przewodnika Vinokompasu"]'),
          page.locator("text=/AI GOTOWE|AI READY|pisze…/"),
        ],
      });
    });
  }
});
