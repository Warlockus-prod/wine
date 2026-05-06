import { chromium, devices } from "@playwright/test";

const BASE = "https://wine.icoffio.com";
const phone = devices["iPhone 13"];

const ROUTES = [
  { name: "home-pl", url: "/pl" },
  { name: "samouczek-pl", url: "/pl/samouczek" },
  { name: "pairing-scoped-pl", url: "/pl/pairing?restaurant=atelier-amaro" },
  { name: "restaurant-detail-pl", url: "/pl/restaurants/atelier-amaro" },
  { name: "admin-pl", url: "/pl/admin" },
  { name: "pitch-pl", url: "/pl/pitch" },
];

const browser = await chromium.launch();
const ctx = await browser.newContext({ ...phone });
const page = await ctx.newPage();

const issues = [];

for (const r of ROUTES) {
  const url = BASE + r.url;
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
  } catch (e) {
    issues.push(`[${r.name}] navigation failed: ${e.message}`);
    continue;
  }
  // Wait briefly for fonts/images
  await page.waitForTimeout(800);

  const audit = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const issues = [];

    // Horizontal overflow
    if (doc.scrollWidth > window.innerWidth + 1)
      issues.push(`html scrollWidth=${doc.scrollWidth} > viewport=${window.innerWidth}`);
    if (body.scrollWidth > window.innerWidth + 1)
      issues.push(`body scrollWidth=${body.scrollWidth} > viewport=${window.innerWidth}`);

    // Find elements that overflow viewport horizontally
    const overflowing = [];
    document.querySelectorAll("*").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.right > window.innerWidth + 2 && r.width > 30 && el.children.length === 0) {
        overflowing.push({
          tag: el.tagName,
          cls: (el.className || "").toString().slice(0, 60),
          right: Math.round(r.right),
          text: (el.textContent || "").trim().slice(0, 40),
        });
      }
    });
    if (overflowing.length > 0)
      issues.push(`overflow elements: ${overflowing.length} (top: ${JSON.stringify(overflowing[0])})`);

    // Tap targets (buttons / links / inputs) under 44pt
    const tinyTargets = [];
    document.querySelectorAll("button, a, input, [role='slider'], [role='button'], [role='tab']").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return; // hidden
      const min = Math.min(r.width, r.height);
      if (min > 0 && min < 36) {
        tinyTargets.push({
          tag: el.tagName,
          w: Math.round(r.width),
          h: Math.round(r.height),
          text: (el.textContent || el.ariaLabel || "").trim().slice(0, 40),
        });
      }
    });
    if (tinyTargets.length > 0)
      issues.push(`tiny tap targets (<36px): ${tinyTargets.length} — first: ${JSON.stringify(tinyTargets[0])}`);

    // Text smaller than 12px (readability concern)
    const tinyText = [];
    document.querySelectorAll("p, span, h1, h2, h3, h4, label, button, a, li, td").forEach((el) => {
      const cs = window.getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (fs > 0 && fs < 11 && (el.textContent || "").trim().length > 0) {
        tinyText.push({
          tag: el.tagName,
          fs: fs.toFixed(1),
          text: (el.textContent || "").trim().slice(0, 30),
        });
      }
    });
    if (tinyText.length > 0)
      issues.push(`text <11px: ${tinyText.length} — first: ${JSON.stringify(tinyText[0])}`);

    return { issues, scrollHeight: doc.scrollHeight };
  });

  for (const i of audit.issues) issues.push(`[${r.name}] ${i}`);
  console.log(`✓ ${r.name} (h=${audit.scrollHeight}px) — ${audit.issues.length} issues`);

  await page.screenshot({
    path: `/tmp/wn-mobile-audit/${r.name}.png`,
    fullPage: true,
  });
}

await browser.close();
console.log("\n--- ISSUES ---");
issues.forEach((i) => console.log(i));
console.log(`\nTotal: ${issues.length} issues across ${ROUTES.length} pages`);
