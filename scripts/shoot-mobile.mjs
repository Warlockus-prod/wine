// Temporary: capture live-prod mobile screenshots (iPhone width) to inspect
// real mobile layout / text overlaps. Run: node scripts/shoot-mobile.mjs
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "/tmp/wn-mobile";
mkdirSync(OUT, { recursive: true });

const iphone = devices["iPhone 13"];
const pages = [
  ["home", "https://wine.icoffio.com/pl"],
  ["pairing", "https://wine.icoffio.com/pl/pairing?restaurant=maido"],
  ["samouczek", "https://wine.icoffio.com/pl/samouczek"],
  ["guest", "https://wine.icoffio.com/pl/restaurants/atelier-amaro"],
];

const browser = await chromium.launch();
for (const theme of ["dark", "light"]) {
  const ctx = await browser.newContext({
    ...iphone,
    colorScheme: theme === "light" ? "light" : "dark",
  });
  // Force the app's theme via localStorage (it persists theme there).
  await ctx.addInitScript((t) => {
    try { localStorage.setItem("wn_theme", t); localStorage.setItem("theme", t); } catch {}
  }, theme);
  const page = await ctx.newPage();
  for (const [name, url] of pages) {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${OUT}/${name}-${theme}.png`, fullPage: false });
    // also a tall capture of the top 1600px for overlap inspection
    await page.screenshot({ path: `${OUT}/${name}-${theme}-top.png`, clip: { x: 0, y: 0, width: iphone.viewport.width, height: 1500 } }).catch(() => {});
  }
  await ctx.close();
}
await browser.close();
console.log("saved to", OUT);
