import { expect, test } from "@playwright/test";

test.describe("pairing algorithm regression", () => {
  test("Trattoria Bellavista: Pizza Margherita ranks Chianti or Sparkling first", async ({ page }) => {
    await page.goto("/pairing?restaurant=trattoria-bellavista");

    // Wait for AI to settle
    await expect(page.getByText(/AI ready|Fallback mode/i).first()).toBeVisible({
      timeout: 10000,
    });

    // Pick Pizza Margherita explicitly
    await page.getByRole("button", { name: /pizza margherita/i }).first().click();

    // The "Best Match" card in the top-3 row should reference one of the
    // wines our seed pairings hand-curated for that dish (Chianti or Brut).
    const bestMatchCard = page.locator("button", {
      hasText: /Best Match/i,
    });
    await expect(bestMatchCard.first()).toBeVisible();

    // Either Chianti Rufina (r1-w2) or Ferrari Brut (r1-w5) should be the best match
    // per the curated pairings on this dish.
    const bestText = await bestMatchCard.first().innerText();
    expect(bestText).toMatch(/Frescobaldi|Ferrari/i);
  });

  test("global sandbox: scallops surfaces a curated rationale", async ({ page }) => {
    await page.goto("/pairing");

    await expect(page.getByText(/AI ready|Fallback mode/i).first()).toBeVisible({
      timeout: 10000,
    });

    await page.getByRole("button", { name: /Seared Scallops/i }).first().click();

    // Wait for the explanation panel (chat) to render — it only mounts after a
    // wine auto-selects from rankedMatches.best.
    await expect(page.getByText("Sommelier Bot").first()).toBeVisible({ timeout: 10000 });

    // Once the chat is visible, one of the two curated reasons (Champagne OR
    // Provence rose) must appear. We accept either — both score 88+ and
    // stable-sort picks whichever appears first in the wines array.
    await expect(
      page.getByText(/Blanc de blancs|strawberry and citrus|truffle oil|truflow|truskawka/i).first(),
    ).toBeVisible({ timeout: 5000 });
  });
});
