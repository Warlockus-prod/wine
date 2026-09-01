import { test, expect } from "@playwright/test";

/**
 * Clearing the wheel must make it LOOK empty.
 *
 * The dial paints a full-saturation pie and lays a cream wash (#f6efe2) over
 * the rings ABOVE the chosen value, so the vivid area "fills to" the choice.
 * The wash was skipped when the value was 0, which made an untouched wedge
 * identical to a maxed-out one: pressing "Wyczyść" appeared to FILL the wheel
 * to 5/5 instead of emptying it (client 2026-09-01, on both sites).
 *
 * The invariant: with nothing selected, every selectable unit carries a wash.
 */

const WASH = 'path[fill="#f6efe2"]';
const PROFILE_KEY = "wn_compass_profile_v1";

test.use({ viewport: { width: 1280, height: 900 } });

test("an empty compass is fully washed — nothing reads as selected", async ({ page }) => {
  await page.goto("/pl/samouczek");
  await page.locator("svg").first().waitFor();

  // Stage 1 shows the three base tastes, so three units must be washed.
  await expect(page.locator(WASH)).toHaveCount(3);
});

test("a profile saved at maximum unwashes, and Wyczyść washes it back", async ({ page }) => {
  // Seed a maxed-out profile: those wedges are fully vivid, so NO wash.
  await page.addInitScript(
    ([key, profile]) => window.localStorage.setItem(key as string, JSON.stringify(profile)),
    [PROFILE_KEY, { "base.slodycz": 5, "base.kwasowosc": 5, "base.cierpkosc": 5 }] as const,
  );
  await page.goto("/pl/samouczek");
  await page.locator("svg").first().waitFor();

  // Maxed out → the vivid pie shows through, no wash anywhere.
  await expect(page.locator(WASH)).toHaveCount(0);

  // Clearing must put the wash back on all three, i.e. visibly empty.
  await page.getByRole("button", { name: /^Wyczyść$/ }).first().click();
  await expect(page.locator(WASH)).toHaveCount(3);

  // …and the stored profile is actually emptied, not just repainted.
  const stored = await page.evaluate((k) => window.localStorage.getItem(k as string), PROFILE_KEY);
  expect(JSON.parse(stored ?? "{}")).toEqual({});
});
