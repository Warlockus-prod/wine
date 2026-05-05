import { expect, test } from "@playwright/test";

test("v2 admin + discover + restaurant flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /sommelier/i }).first()).toBeVisible();
  await expect(page.getByText(/on the map|na mapie/i)).toBeVisible();
  await expect(page.getByText(/Unique URLs|Unikalne URL/i)).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByText("V2 Admin Studio")).toBeVisible();

  const dishName = `Smoke Dish ${Date.now()}`;
  // The new-dish form uses the single-language input; admin's edit grid splits
  // into EN/PL fields, but the create form remains a single-language quick-add.
  await page.locator('input[placeholder="Dish name"]').first().fill(dishName);
  await page.getByPlaceholder("Image URL").first().fill(
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200",
  );
  await page.locator('textarea[placeholder="Dish description"]').first().fill("Automated dish for smoke test");
  await page.getByRole("button", { name: "Add Dish" }).click();

  await page.goto("/pairing");
  await expect(page.getByRole("button", { name: dishName }).first()).toBeVisible();

  await page.goto("/restaurants/atelier-amaro");
  await expect(page).toHaveURL(/\/restaurants\/atelier-amaro/);
  await expect(page.getByText(/direct access qr/i)).toBeVisible();
  await expect(page.getByRole("link", { name: /open pairing/i }).first()).toBeVisible();

  await page.getByRole("link", { name: /open pairing/i }).first().click();
  await expect(page).toHaveURL(/\/pairing\?restaurant=atelier-amaro/);
  await expect(page.getByText(/context: atelier amaro/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /pizza margherita/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /marchesi antinori tignanello/i }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: /pizza margherita/i }).first()).toBeVisible();
});

test("restaurant admin edits flow into restaurant page and scoped pairing", async ({ page }) => {
  await page.goto("/admin");

  const restaurantAdmin = page.locator("section", { hasText: "Restaurant content manager" }).first();
  await expect(restaurantAdmin).toBeVisible();

  const dishName = `Restaurant Smoke Dish ${Date.now()}`;
  const wineName = `Restaurant Smoke Wine ${Date.now()}`;

  await restaurantAdmin.getByPlaceholder("Restaurant dish name").fill(dishName);
  await restaurantAdmin.getByPlaceholder("Restaurant dish description").fill(
    "Automated restaurant dish for smoke test",
  );
  await restaurantAdmin.getByRole("button", { name: "Add restaurant dish" }).click();

  await restaurantAdmin.getByPlaceholder("Restaurant wine name").fill(wineName);
  await restaurantAdmin.getByPlaceholder("Region").fill("Test Valley, Europe");
  await restaurantAdmin.getByPlaceholder("Restaurant wine notes").fill(
    "Bright citrus, clean acidity and a focused finish.",
  );
  await restaurantAdmin.getByRole("button", { name: "Add restaurant wine" }).click();

  await page.goto("/restaurants/atelier-amaro");
  await expect(page.getByText(dishName).first()).toBeVisible();
  await expect(page.getByText(wineName).first()).toBeVisible();

  await page.goto("/pairing?restaurant=atelier-amaro");
  await expect(page.getByRole("button", { name: new RegExp(dishName, "i") }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: new RegExp(wineName, "i") }).first()).toBeVisible();
});
