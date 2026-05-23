// Find elements that render with a DARK background while light theme is
// active — these are the un-themed spots. Reports class + computed bg.
import { chromium } from "playwright";

const routes = [
  "https://wine.icoffio.com/pl/pairing",
  "https://wine.icoffio.com/pl/samouczek",
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
const page = await ctx.newPage();

for (const url of routes) {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("vinovigator-theme", "light"));
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(2500);

  const dark = await page.evaluate(() => {
    const out = [];
    const els = document.querySelectorAll("main *, aside, [role=dialog]");
    const isDarkHex = (s) => /#(0|1|2)[0-9a-f]/i.test(s); // hex starting dark
    for (const el of els) {
      const cs = getComputedStyle(el);
      const bg = cs.backgroundColor;
      const bgImg = cs.backgroundImage;
      const rect = el.getBoundingClientRect();
      if (rect.width < 80 || rect.height < 40) continue;
      let dark = false;
      let why = "";
      const m = bg.match(/\d+/g);
      if (m) {
        const [r, g, b, a = "1"] = m;
        if (Number(a) >= 0.5) {
          const L = (0.299 * +r + 0.587 * +g + 0.114 * +b) / 255;
          if (L < 0.22) { dark = true; why = `bgcolor ${bg}`; }
        }
      }
      if (!dark && bgImg && bgImg !== "none" && isDarkHex(bgImg)) {
        dark = true;
        why = `gradient ${bgImg.slice(0, 60)}`;
      }
      if (dark) {
        out.push({
          tag: el.tagName.toLowerCase(),
          cls: (el.getAttribute("class") || "").slice(0, 80),
          why,
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    }
    const seen = new Set();
    return out.filter((o) => {
      const k = o.cls + o.why;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  });

  console.log(`\n=== ${url} ===`);
  for (const d of dark.slice(0, 20)) {
    console.log(`${d.tag} ${d.w}x${d.h} ${d.why}\n   class="${d.cls}"`);
  }
}

await browser.close();
