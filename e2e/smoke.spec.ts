import { expect, test } from "@playwright/test";

test("v2 admin + discover + restaurant flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /sommelier/i }).first()).toBeVisible();
  await expect(page.getByText(/europe overview/i)).toBeVisible();
  await expect(page.getByText("Unique URLs + QR")).toBeVisible();

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

  await page.goto("/restaurants/trattoria-bellavista");
  await expect(page).toHaveURL(/\/restaurants\/trattoria-bellavista/);
  await expect(page.getByText(/direct access qr/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /open pairing/i }).first()).toBeVisible();

  await page.getByRole("link", { name: /open pairing/i }).first().click();
  await expect(page).toHaveURL(/\/pairing\?restaurant=trattoria-bellavista/);
  await expect(page.getByText(/context: trattoria bellavista/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /pizza margherita/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /marchesi antinori tignanello/i }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /pizza margherita/i }).first()).toBeVisible();
});
