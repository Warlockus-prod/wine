// Diagnostic: confirm light theme applies + dump computed colors of key
// surfaces on the live restaurant page.
import { chromium } from "playwright";

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await ctx.newPage();

await page.goto("https://wine.icoffio.com/pl/restaurants/atelier-amaro", {
  waitUntil: "domcontentloaded",
});
await page.evaluate(() => {
  localStorage.setItem("vinovigator-theme", "light");
});
await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForTimeout(2500);

const data = await page.evaluate(() => {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const panel = document.querySelector('[aria-label="Restaurant pairing panel"]');
  const panelBg = panel ? getComputedStyle(panel).backgroundColor : "n/a";
  const panelColor = panel ? getComputedStyle(panel).color : "n/a";
  return {
    dataTheme: root.getAttribute("data-theme"),
    surface: cs.getPropertyValue("--surface").trim(),
    surfaceElevated: cs.getPropertyValue("--surface-elevated").trim(),
    ink: cs.getPropertyValue("--ink").trim(),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    panelBg,
    panelColor,
  };
});
console.log(JSON.stringify(data, null, 2));
await page.screenshot({ path: "/tmp/light-resto-full.png", fullPage: true });
console.log("shot full");
await browser.close();
