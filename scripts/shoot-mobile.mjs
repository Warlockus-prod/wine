// Visual test: capture live-prod screenshots of key pages across
// mobile + desktop and dark + light, to /tmp/wn-mobile. Run:
//   node scripts/shoot-mobile.mjs
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
  ["pitch", "https://wine.icoffio.com/pl/pitch"],
  ["admin", "https://wine.icoffio.com/pl/admin"],
];

const browser = await chromium.launch();
for (const form of ["mobile", "desktop"]) {
  for (const theme of ["dark", "light"]) {
    const ctx = await browser.newContext(
      form === "mobile"
        ? { ...iphone }
        : { viewport: { width: 1366, height: 900 }, deviceScaleFactor: 1 },
    );
    // next-themes persists under localStorage key "theme" (attribute=data-theme).
    await ctx.addInitScript((t) => {
      try { localStorage.setItem("theme", t); } catch {}
    }, theme);
    const page = await ctx.newPage();
    for (const [name, url] of pages) {
      await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${OUT}/${name}-${form}-${theme}.png`, fullPage: false }).catch(() => {});
    }
    await ctx.close();
  }
}
await browser.close();
console.log("saved to", OUT);
