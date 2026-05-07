import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Accessibility audit — runs axe-core against guest-facing routes.
 *
 * Standard: WCAG 2.1 AA. Reports critical+serious violations as failures
 * (treated as test failures so they show up in npm run check); minor
 * violations are logged but don't fail the suite.
 *
 * Excluded rules:
 *  - color-contrast: tested separately on light theme; the dark theme
 *    intentionally uses gold accent on dark surface which axe sometimes
 *    flags despite passing WCAG AA at our actual values.
 *  - region: dynamic compass / tour overlays render outside named landmarks
 *    on purpose (canvas-style interaction); not worth a region wrapper.
 *  - list: low-impact false positive on dynamically-loaded panel ol/li
 *    (axe sees the loader placeholder before SSR resolves).
 *
 * Admin pages are intentionally excluded — they're operator-only and
 * the dense form chrome (114 inputs) requires a separate label pass.
 */

const ROUTES = [
  { path: "/", label: "home" },
  { path: "/pl", label: "home (PL)" },
  { path: "/pl/restaurants/atelier-amaro", label: "restaurant page" },
  { path: "/pl/pairing", label: "pairing" },
  { path: "/pl/samouczek", label: "samouczek" },
];

for (const route of ROUTES) {
  test(`a11y: ${route.label} (${route.path}) has no critical/serious violations`, async ({ page }) => {
    await page.goto(route.path);
    // Wait for the Navigation heading at minimum so async data has a beat.
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(800);

    const results = await new AxeBuilder({ page })
      .disableRules(["color-contrast", "region", "list"])
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === "critical" || v.impact === "serious",
    );
    if (blocking.length > 0) {
      const summary = blocking
        .map((v) => `  - [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`)
        .join("\n");
      console.error(`\nA11y violations on ${route.path}:\n${summary}\n`);
    }
    expect(blocking, `Critical/serious a11y violations on ${route.path}`).toHaveLength(0);
  });
}
