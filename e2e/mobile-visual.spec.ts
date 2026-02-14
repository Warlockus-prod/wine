import { expect, test, devices, type TestOptions } from "@playwright/test";

const mobileUse = (() => {
  const device = devices["iPhone 13"];
  const use: TestOptions = {
    viewport: device.viewport,
    userAgent: device.userAgent,
    deviceScaleFactor: device.deviceScaleFactor,
    isMobile: device.isMobile,
    hasTouch: device.hasTouch,
    locale: device.locale,
    colorScheme: device.colorScheme,
  };

  return use;
})();

const pages = [
  { name: "home", path: "/" },
  { name: "pairing", path: "/pairing" },
  { name: "editorial", path: "/editorial" },
  { name: "v1-catalog", path: "/v1" },
  { name: "v1-admin", path: "/v1/admin" },
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
      await page.goto(target.path);
      await page.addStyleTag({
        content:
          "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important;}",
      });
      await page.waitForTimeout(200);

      await expect(page).toHaveScreenshot(`${target.name}.png`, {
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
