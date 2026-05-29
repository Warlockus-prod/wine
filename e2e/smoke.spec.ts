import { expect, test } from "@playwright/test";

test("v2 admin + discover + restaurant flow", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("link", { name: /vinovigator|sommelier/i }).first()).toBeVisible();
  await expect(page.getByText(/on the map|na mapie/i)).toBeVisible();
  await expect(page.getByText(/Unique URLs|Unikalne URL/i)).toBeVisible();

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: /atelier/i }).first()).toBeVisible();

  const dishName = `Smoke Dish ${Date.now()}`;
  // The new-dish form uses the single-language input; admin's edit grid splits
  // into EN/PL fields, but the create form remains a single-language quick-add.
  await page.locator('input[placeholder="Dish name"]').first().fill(dishName);
  await page.getByPlaceholder("Image URL").first().fill(
    "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200",
  );
  await page.locator('textarea[placeholder="Dish description"]').first().fill("Automated dish for smoke test");
  await page.getByRole("button", { name: /add dish/i }).click();

  await page.goto("/pairing");
  await expect(page.getByRole("button", { name: dishName }).first()).toBeVisible();

  await page.goto("/restaurants/atelier-amaro");
  await expect(page).toHaveURL(/\/restaurants\/atelier-amaro/);
  // Restaurant data is now server-rendered from the DB→seed read-path
  // (resolveRestaurantBySlug). In e2e there is no DB, so it falls back to seed.
  await expect(page.getByRole("heading", { name: /atelier amaro/i }).first()).toBeVisible({ timeout: 10000 });
  // QR aside text varies by negotiated locale (EN: "Direct access QR",
  // PL: "QR — bezpośredni dostęp"). Either is fine — we just want to
  // confirm the QR aside rendered.
  await expect(page.getByText(/direct access qr|bezpośredni dostęp/i)).toBeVisible();
  // Integrated pairing panel — footer CTA replaces the old "Open pairing" link.
  await expect(
    page.getByRole("link", { name: /open pairing view|otwórz widok łączenia/i }).first(),
  ).toBeVisible();

  await page.goto("/pairing?restaurant=atelier-amaro");
  await expect(page).toHaveURL(/\/pairing\?restaurant=atelier-amaro/);
  // Scoped context now loads via the DB→seed API (SWR), not synchronous
  // localStorage — allow for the network round-trip under parallel load.
  // Context label varies by locale ("Context: …" / "Kontekst: …").
  await expect(page.getByText(/(?:context|kontekst): atelier amaro/i)).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: /porcini in black garlic|borowik/i }).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("button", { name: /marchesi antinori tignanello/i }).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole("heading", { name: /porcini in black garlic|borowik/i }).first()).toBeVisible({ timeout: 10000 });
});

test("restaurant guest page server-renders the DB→seed read-path", async ({ page }) => {
  // P0-1: the guest page no longer reads localStorage; it is server-rendered
  // from resolveRestaurantBySlug (DB-canonical, seed fallback). This test
  // verifies the read-path renders menu + cellar content for a known venue.
  // (Cross-page propagation of *edits* now requires a real DB and is covered
  // by integration testing against staging, not this localStorage-free e2e.)
  await page.goto("/restaurants/atelier-amaro");
  await expect(page).toHaveURL(/\/restaurants\/atelier-amaro/);

  await expect(page.getByRole("heading", { name: /atelier amaro/i }).first()).toBeVisible({
    timeout: 10000,
  });

  // Seed dish + wine for this venue render from the server read-path.
  await expect(page.getByText(/porcini in black garlic|borowik/i).first()).toBeVisible();
  await expect(page.getByText(/tignanello/i).first()).toBeVisible();
});
