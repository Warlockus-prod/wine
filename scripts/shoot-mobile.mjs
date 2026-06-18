// Full live visual test: capture EVERY page, full-page, in BOTH themes,
// at desktop and mobile. Theme is forced reliably by setting the
// `data-theme` attribute + localStorage (next-themes reads the same key),
// so light mode is captured for real (not just dark). Output → /tmp/wn-shots.
//   node scripts/shoot-mobile.mjs [mobile|desktop|both]
import { chromium, devices } from "playwright";
import { mkdirSync } from "node:fs";

const OUT = "/tmp/wn-shots";
mkdirSync(OUT, { recursive: true });
const FORMS = (process.argv[2] && process.argv[2] !== "both") ? [process.argv[2]] : ["desktop", "mobile"];

const iphone = devices["iPhone 13"];
const B = "https://wine.icoffio.com/pl";
const pages = [
  ["home", `${B}`],
  ["guest", `${B}/restaurants/atelier-amaro`],
  ["pairing-scoped", `${B}/pairing?restaurant=maido`],
  ["pairing-global", `${B}/pairing`],
  ["samouczek", `${B}/samouczek`],
  ["pitch", `${B}/pitch`],
  ["admin", `${B}/admin`],
  ["admin-restaurants", `${B}/admin/restaurants`],
  ["admin-editor", `${B}/admin/restaurants/atelier-amaro`],
  ["editorial", `${B}/editorial`],
  ["immersive", `${B}/immersive`],
];

const browser = await chromium.launch();
for (const form of FORMS) {
  for (const theme of ["light", "dark"]) {
    const ctx = await browser.newContext(
      form === "mobile" ? { ...iphone } : { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    );
    const page = await ctx.newPage();
    for (const [name, url] of pages) {
      try {
        await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
      } catch {}
      // Force theme on the live DOM + persist so next-themes keeps it.
      await page.evaluate((t) => {
        try { localStorage.setItem("theme", t); } catch {}
        document.documentElement.setAttribute("data-theme", t);
        document.documentElement.classList.toggle("dark", t === "dark");
      }, theme);
      await page.waitForTimeout(1800);
      try {
        await page.screenshot({ path: `${OUT}/${name}-${form}-${theme}.png`, fullPage: true });
      } catch {}
    }
    await ctx.close();
  }
}
await browser.close();
console.log("saved to", OUT);
