// Screenshot the live wine proposals by driving the base-taste sliders the
// way a real user would (no localStorage race).
import { chromium } from "playwright";

const BASE = "http://localhost:4399/pl/samouczek";
const browser = await chromium.launch();

async function shoot(name, { width, height, theme }) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  await ctx.addInitScript((t) => {
    try {
      localStorage.setItem("vinovigator-theme", t);
    } catch {}
  }, theme);
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  // Open the precise-sliders panel and drive the base tastes.
  const summary = page.getByText("Wolisz suwaki?", { exact: false });
  if (await summary.count()) {
    await summary.first().click();
    await page.waitForTimeout(300);
  }
  const ranges = page.locator('input[type="range"]');
  const n = await ranges.count();
  // slodycz, cierpkosc, kwasowosc → push kwasowosc high for crisp whites.
  const presses = [1, 1, 4];
  for (let i = 0; i < Math.min(n, 3); i++) {
    await ranges.nth(i).focus();
    for (let k = 0; k < presses[i]; k++) {
      await ranges.nth(i).press("ArrowRight");
      await page.waitForTimeout(60);
    }
  }
  await page.waitForTimeout(1200);

  const card = page
    .locator("text=twórców metody Vinokompas")
    .locator("xpath=ancestor::div[contains(@class,'rounded-2xl')][1]");
  const path = `/tmp/proposals-${name}.png`;
  if (await card.count()) {
    await card.first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await card.first().screenshot({ path });
  } else {
    await page.screenshot({ path, fullPage: true });
  }
  console.log("shot", path);
  await ctx.close();
}

await shoot("light-desktop", { width: 1280, height: 1100, theme: "light" });
await shoot("dark-mobile", { width: 390, height: 1500, theme: "dark" });
await shoot("light-mobile", { width: 390, height: 1500, theme: "light" });

await browser.close();
