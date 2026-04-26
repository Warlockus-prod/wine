import { expect, test } from "@playwright/test";

test.describe("i18n EN/PL switching", () => {
  test("English home reachable with English content", async ({ page }) => {
    await page.goto("/");
    // Restaurant directory must render (English seed name)
    await expect(page.getByRole("heading", { name: /Trattoria Bellavista/i }).first()).toBeVisible();
  });

  test("Polish home reachable under /pl path prefix", async ({ page }) => {
    await page.goto("/pl");
    // The page renders without 404 — restaurant directory present
    await expect(page.getByRole("heading", { name: /Trattoria Bellavista/i }).first()).toBeVisible();
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

  test("scoped pairing in Polish loads PL pairing reasons", async ({ page }) => {
    await page.goto("/pl/pairing?restaurant=trattoria-bellavista");
    // Wait for AI analysis to settle to "ready" or "fallback"
    await expect(page.getByText("Bot sommeliera")).toBeVisible({ timeout: 8000 });
    // Bot service note line includes the word "podawać" in PL only
    await expect(page.getByText(/podawać/i)).toBeVisible({ timeout: 5000 });
  });
});
