import { test, expect, type Page } from "@playwright/test";

/**
 * Samouczek 2-stage flow (Vinokompas + Aromaty) — locks in the A1 merge so it
 * can't silently regress:
 *   1. exactly two stages (Vinokompas + Aromaty), no legacy third stage;
 *   2. the compass renders the canonical Vinocompas sector set;
 *   3. base-smak (rim) and wrażenie (sector) are settable INDEPENDENTLY on one
 *      wheel — the option-3 click-layer fix (a base tap must not bleed into a
 *      sector and vice-versa);
 *   4. the Aromaty stage exposes the 12 tendencja sliders.
 *
 * Functional assertions only (no pixel snapshots) so it's stable against the
 * AI/lazy-loaded content that makes visual snapshots flaky.
 */

test.use({ viewport: { width: 390, height: 844 } });

const PROFILE_KEY = "wn_compass_profile_v1";

async function openCompass(page: Page) {
  await page.goto("/pl/samouczek", { waitUntil: "domcontentloaded" });
  // Deterministic start: drop any persisted profile, then reload.
  await page.evaluate((k) => localStorage.removeItem(k), PROFILE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.evaluate(() =>
    (document.querySelector('a[href="#kompas"]') as HTMLElement | null)?.click(),
  );
  await page.waitForSelector("#kompas svg.taste-compass-svg", { timeout: 20000 });
  await page.waitForTimeout(1500);
}

const readProfile = (page: Page) =>
  page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k) || "{}") as Record<string, number>,
    PROFILE_KEY,
  );

/** Switching stages changes the layout height above the wheel, which can
 *  leave a wedge's bbox centre under the fixed mobile tab bar — a force
 *  click would then land on the bar, not the wheel. Re-centre the dial
 *  before interacting with sliders. */
async function centerWheel(page: Page) {
  await page.evaluate(() =>
    document
      .querySelector("#kompas svg.taste-compass-svg")
      ?.scrollIntoView({ block: "center" }),
  );
  await page.waitForTimeout(300);
}

test("exactly three stages: Smak + Wrażenia + Aromaty", async ({ page }) => {
  await page.goto("/pl/samouczek", { waitUntil: "domcontentloaded" });
  // Tab accessible names include the whole label+sub text — match substrings.
  await expect(page.getByRole("button", { name: /ETAP 1/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /WRAŻENIA/i }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: /TENDENCJE/i })).toBeVisible();
  // The three stage tabs are the only buttons carrying an "ETAP <n>" marker.
  await expect(page.getByRole("button").filter({ hasText: /ETAP\s*\d/i })).toHaveCount(3);
});

test("compass renders the canonical Vinocompas sectors", async ({ page }) => {
  await openCompass(page);
  // Sector sliders live on the level-2 wheel — stage 2 (WRAŻENIA).
  await page.getByRole("button", { name: /WRAŻENIA/i }).first().click();
  await page.waitForTimeout(1200);
  const labels = await page.evaluate(() =>
    [...document.querySelectorAll('[role="slider"]')].map((s) => s.getAttribute("aria-label") || ""),
  );
  for (const s of ["Tęgie", "Miękkie", "Oleiste", "Świeże", "Ziemiste", "Szorstkie"]) {
    expect(labels, `sector "${s}" present on the wheel`).toContain(s);
  }
});

test("base smak (stage 1) and wrażenie sector (stage 2) are independent", async ({ page }) => {
  await openCompass(page);

  // Stage 1 (SMAK): tap the SŁODYCZ wedge → base.slodycz set, no sector bleed.
  await centerWheel(page);
  await page.getByRole("slider", { name: "SŁODYCZ", exact: true }).click({ force: true });
  await expect
    .poll(async () => (await readProfile(page))["base.slodycz"] ?? 0)
    .toBeGreaterThan(0);
  const afterBase = await readProfile(page);
  const slodyczValue = afterBase["base.slodycz"];
  expect(
    Object.keys(afterBase).some((k) => k.startsWith("swieze")),
    "base taps must not set any wrażenie",
  ).toBe(false);

  // Stage 2 (WRAŻENIA): tap the Świeże sector → wrażenie set, smak untouched.
  await page.getByRole("button", { name: /WRAŻENIA/i }).first().click();
  await page.waitForTimeout(1200);
  await centerWheel(page);
  await page.getByRole("slider", { name: "Świeże", exact: true }).click({ force: true });
  await page.waitForTimeout(400);
  const afterSector = await readProfile(page);
  expect(afterSector["base.slodycz"], "sector tap must not change the base smak").toBe(slodyczValue);
  expect(
    Object.keys(afterSector).some((k) => k.startsWith("swieze")),
    "sector tap must set the wrażenie",
  ).toBe(true);
});

test("Aromaty stage exposes the 12 tendencja sliders", async ({ page }) => {
  await openCompass(page);
  await page.getByRole("button", { name: /TENDENCJE/i }).click();
  await page.waitForTimeout(1500);
  const tendencjaSliders = await page.evaluate(
    () =>
      [...document.querySelectorAll('[role="slider"]')].filter((s) =>
        (s.getAttribute("aria-label") || "").includes(" - "),
      ).length,
  );
  expect(tendencjaSliders, "12 sektor-tendencja sliders at level 3").toBeGreaterThanOrEqual(12);
});
