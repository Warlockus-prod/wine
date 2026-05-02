import { expect, test } from "@playwright/test";

test.describe("i18n EN/PL switching", () => {
  test("English home reachable with English content", async ({ page }) => {
    await page.goto("/");
    // Restaurant directory must render the seed restaurants (proper noun, same in both locales)
    await expect(page.getByText("Atelier Amaro").first()).toBeVisible({ timeout: 10000 });
  });

  test("Polish home reachable under /pl path prefix", async ({ page }) => {
    await page.goto("/pl");
    await expect(page.getByText("Atelier Amaro").first()).toBeVisible({ timeout: 10000 });
  });

  test("pairing page renders localized chrome under /pl", async ({ page }) => {
    await page.goto("/pl/pairing");
    // Localized headline from messages/pl.json — verifies next-intl provider wired
    await expect(
      page.getByText("Wybierz danie. Wybierz wino. Przeczytaj uzasadnienie poniżej."),
    ).toBeVisible({ timeout: 10000 });
    // Localized column header
    await expect(page.getByRole("heading", { name: "Karta win" }).first()).toBeVisible();
  });

  test("admin page reachable under /pl", async ({ page }) => {
    await page.goto("/pl/admin");
    // Page loads — Curated Pairings section title localized in PL
    await expect(page.getByText(/Kuratorskie połączenia/i)).toBeVisible({ timeout: 10000 });
  });

  test("pitch page renders bilingual marketing copy", async ({ page }) => {
    // English pitch — distinctive headline copy
    await page.goto("/pitch");
    await expect(page.getByText(/A sommelier/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /how it works/i }).first()).toBeVisible();

    // Polish pitch — same headline localized
    await page.goto("/pl/pitch");
    await expect(page.getByText(/Sommelier/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: /jak to działa/i }).first()).toBeVisible();
  });

  test("scoped pairing in Polish loads PL pairing reasons", async ({ page }) => {
    await page.goto("/pl/pairing?restaurant=atelier-amaro");
    // Wait for AI analysis to settle to "ready" or "fallback"
    await expect(page.getByText("Bot sommeliera")).toBeVisible({ timeout: 8000 });
    // Bot service note line includes the word "podawać" in PL only
    await expect(page.getByText(/podawać/i)).toBeVisible({ timeout: 5000 });
  });
});
