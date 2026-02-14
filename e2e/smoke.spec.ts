import { expect, test } from "@playwright/test";

test("v2 admin + pairing and v1 backup flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /sommelier/i }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: /backup v1/i }).first()).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("V2 Admin Studio")).toBeVisible();

  const dishName = `Smoke Dish ${Date.now()}`;
  await page.getByPlaceholder("Dish name").fill(dishName);
  await page.getByPlaceholder("Image URL").first().fill(
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200",
  );
  await page.getByPlaceholder("Dish description").fill("Automated dish for smoke test");
  await page.getByRole("button", { name: "Add Dish" }).click();

  await page.goto("/pairing");
  await expect(page.getByRole("button", { name: dishName }).first()).toBeVisible();

  await page.goto("/v1");
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
});
