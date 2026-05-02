import { expect, test } from "@playwright/test";

test.describe("viewport switcher", () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test("mobile preview button opens phone frame overlay", async ({ page }) => {
    await page.goto("/");
    // Mapbox + hydration race — wait for one of the restaurant cards to render
    // so we know the page is interactive.
    await expect(page.getByText("Atelier Amaro").first()).toBeVisible({ timeout: 10000 });

    const mobileBtn = page.getByRole("button", { name: /^smartphone\s*Mobile$|^Mobile$/i }).first();
    await expect(mobileBtn).toBeVisible({ timeout: 5000 });
    await mobileBtn.click();

    // The overlay should appear with "Mobile Preview" label and an iframe.
    await expect(page.getByText(/Mobile Preview/i).first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator("iframe[title='Mobile preview']")).toBeVisible();

    // Close button should be visible
    const closeBtn = page.getByRole("button", { name: /close/i });
    await expect(closeBtn).toBeVisible();

    // Close the overlay
    await closeBtn.click();

    // Overlay should disappear
    await expect(page.getByText(/Mobile Preview/i).first()).not.toBeVisible();
  });

  test("mobile preview button is hidden inside iframe", async ({ page }) => {
    // Visit a page with ?viewport=mobile (simulates being inside the iframe)
    await page.goto("/?viewport=mobile");
    await page.waitForTimeout(1000);

    // The mobile preview button should NOT be visible
    const mobileBtn = page.getByRole("button", { name: /mobile/i });
    await expect(mobileBtn).not.toBeVisible();
  });
});
