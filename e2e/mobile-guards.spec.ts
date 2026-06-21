import { test, expect } from "@playwright/test";

/**
 * Mobile guard-rails — catch the recurring mobile bug CLASSES automatically so
 * we stop finding them by hand one at a time. Runs at a 390px phone width.
 * See docs/ui/mobile-architecture.md and docs/ui/mobile-audit-2026-06.md.
 *
 *  1. No horizontal overflow — the #1 mobile bug (a stray wide element gives
 *     the whole page a horizontal scrollbar).
 *  2. Every form field >= 16px — iOS Safari force-zooms the page when a focused
 *     input/textarea/select has font-size < 16px.
 */

const PAGES = [
  { name: "home", path: "/pl" },
  { name: "pairing", path: "/pl/pairing?restaurant=atelier-amaro" },
  { name: "restaurant", path: "/pl/restaurants/atelier-amaro" },
  { name: "samouczek", path: "/pl/samouczek" },
];

test.use({ viewport: { width: 390, height: 844 } });

async function settle(page: import("@playwright/test").Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("load").catch(() => {});
  await page.waitForTimeout(1200);
}

for (const p of PAGES) {
  test(`${p.name}: no horizontal overflow @390px`, async ({ page }) => {
    await settle(page, p.path);
    const { scrollW, clientW } = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
    }));
    // 1px tolerance for sub-pixel rounding.
    expect(scrollW, `${p.name} overflows: scrollWidth ${scrollW} > clientWidth ${clientW}`).toBeLessThanOrEqual(
      clientW + 1,
    );
  });

  test(`${p.name}: form fields >= 16px (no iOS auto-zoom)`, async ({ page }) => {
    await settle(page, p.path);
    const tooSmall = await page.evaluate(() =>
      [...document.querySelectorAll("input, textarea, select")]
        .filter((el) => parseFloat(getComputedStyle(el).fontSize) < 16)
        .map((el) => `${el.tagName.toLowerCase()}: ${(el as HTMLElement).className}`),
    );
    expect(tooSmall, `fields < 16px (iOS will zoom): ${tooSmall.join(" | ")}`).toHaveLength(0);
  });
}
