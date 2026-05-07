import { expect, test } from "@playwright/test";

test.describe("pairing algorithm regression", () => {
  test("Atelier Amaro pairing flow surfaces a structured red for the venison tartare", async ({ page }) => {
    // Force English to keep accessible names predictable (PL test elsewhere asserts PL chrome)
    await page.context().addCookies([{ name: "NEXT_LOCALE", value: "en", url: "http://127.0.0.1:4173" }]);
    await page.goto("/pairing?restaurant=atelier-amaro");

    await expect(page.getByText(/AI ready|Fallback mode/i).first()).toBeVisible({
      timeout: 10000,
    });

    // After the Italian→Polish menu rewrite, the signature dish is venison
    // tartare and the curated pairings are Sangiovese/Tignanello reds.
    await page.getByRole("button", { name: /venison tartare/i }).first().click();

    const bestMatchCard = page.locator("button", { hasText: /Best Match/i });
    await expect(bestMatchCard.first()).toBeVisible();

    const bestText = await bestMatchCard.first().innerText();
    expect(bestText).toMatch(/Tignanello|Frescobaldi|Brunello/i);
  });

  test("global sandbox: scallops surfaces a curated rationale", async ({ page }) => {
    await page.context().addCookies([{ name: "NEXT_LOCALE", value: "en", url: "http://127.0.0.1:4173" }]);
    await page.goto("/pairing");

    await expect(page.getByText(/AI ready|Fallback mode/i).first()).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: /Seared Scallops/i }).first().click();

    await expect(page.getByText("Sommelier Bot").first()).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByText(/Blanc de blancs|strawberry and citrus|truffle oil/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
