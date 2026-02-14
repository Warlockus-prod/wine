import { expect, test } from "@playwright/test";

test("v2 main + v1 backup catalog/admin flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /sommelier/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /backup v1/i }).first()).toBeVisible();

  await page.getByRole("link", { name: /backup v1/i }).first().click();
  await expect(page).toHaveURL(/\/v1$/);
  await expect(page.getByRole("link", { name: "Cellar Compass", exact: true })).toBeVisible();

  const trattoriaLink = page
    .getByRole("link", { name: "Trattoria Bellavista", exact: true })
    .first();
  await expect(trattoriaLink).toBeVisible();
  await trattoriaLink.click();

  await expect(page).toHaveURL(/\/v1\/restaurants\/trattoria-bellavista/);
  await expect(page.getByText("Wine list")).toBeVisible();

  await page.getByRole("button", { name: /Tagliatelle al Ragu/i }).click();
  await expect(page.getByText("Why it works:").first()).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/v1\/admin/);
  await expect(page.getByText("Restaurant content manager")).toBeVisible();

  const dishName = `Smoke Test Dish ${Date.now()}`;
  await page.getByPlaceholder("Dish name").fill(dishName);
  await page.getByPlaceholder("Description").fill("Automated E2E smoke test dish");
  await page.getByRole("button", { name: "Add dish" }).click();
  await expect(page.locator("option", { hasText: dishName })).toHaveCount(1);

  await page.getByRole("button", { name: "Save restaurant" }).click();

  await page.goto("/restaurants/trattoria-bellavista");
  await expect(page).toHaveURL(/\/v1\/restaurants\/trattoria-bellavista/);
  await expect(page.locator("h3", { hasText: dishName }).first()).toBeVisible();
});
