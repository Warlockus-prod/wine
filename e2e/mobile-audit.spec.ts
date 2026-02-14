import { expect, test, devices, type TestOptions } from "@playwright/test";

type RouteCheck = {
  path: string;
  mustSee: RegExp;
};

const routes: RouteCheck[] = [
  { path: "/", mustSee: /sommelier/i },
  { path: "/pairing", mustSee: /pairing room/i },
  { path: "/admin", mustSee: /admin studio/i },
  { path: "/immersive", mustSee: /epicurean/i },
  { path: "/editorial", mustSee: /lux/i },
  { path: "/v1", mustSee: /cellar compass/i },
  { path: "/v1/admin", mustSee: /restaurant content manager/i },
  { path: "/v1/restaurants/trattoria-bellavista", mustSee: /wine list/i },
];

const makeMobileUse = (device: (typeof devices)[keyof typeof devices]): TestOptions => ({
  viewport: device.viewport,
  userAgent: device.userAgent,
  deviceScaleFactor: device.deviceScaleFactor,
  isMobile: device.isMobile,
  hasTouch: device.hasTouch,
  locale: device.locale,
  colorScheme: device.colorScheme,
});

const profiles = [
  { name: "iphone-13", use: makeMobileUse(devices["iPhone 13"]) },
  { name: "pixel-7", use: makeMobileUse(devices["Pixel 7"]) },
];

for (const profile of profiles) {
  test.describe(`mobile audit ${profile.name}`, () => {
    test.use(profile.use);

    for (const route of routes) {
      test(`route ${route.path} has no horizontal overflow`, async ({ page }) => {
        await page.goto(route.path);
        await expect(page.getByText(route.mustSee).first()).toBeVisible();

        const metrics = await page.evaluate(() => {
          const doc = document.documentElement;
          const body = document.body;

          return {
            viewportWidth: window.innerWidth,
            htmlScrollWidth: doc.scrollWidth,
            bodyScrollWidth: body.scrollWidth,
          };
        });

        expect(metrics.htmlScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
        expect(metrics.bodyScrollWidth).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      });
    }
  });
}
