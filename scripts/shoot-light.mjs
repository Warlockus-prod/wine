// One-off: screenshot the LIVE site in light theme for visual audit.
import { chromium } from "playwright";

const BASE = "https://wine.icoffio.com";
const routes = [
  ["/pl", "home"],
  ["/pl/restaurants/atelier-amaro", "restaurant"],
  ["/pl/pairing", "pairing"],
  ["/pl/samouczek", "samouczek"],
  ["/pl/admin", "admin"],
];

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
  // Pre-seed localStorage so the app boots in light theme.
});
const page = await ctx.newPage();

for (const [route, name] of routes) {
  await page.goto(BASE + route, { waitUntil: "domcontentloaded" });
  // Force light theme via the next-themes storage key + html attr.
  await page.evaluate(() => {
    localStorage.setItem("vinovigator-theme", "light");
    document.documentElement.setAttribute("data-theme", "light");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `/tmp/light-${name}.png`, fullPage: false });
  console.log(`shot light-${name}`);
}

await browser.close();
console.log("done");
