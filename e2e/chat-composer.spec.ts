import { test, expect } from "@playwright/test";

/**
 * The chat composer must stay INSIDE the floating panel at every viewport.
 *
 * This has broken twice, both times silently — the guest could read the bot's
 * replies but had no way to type, because the panel clips with
 * overflow-hidden and the composer had been pushed past its bottom edge:
 *   2026-07-18  a missing `min-h-0` on the panel wrapper (client: "невозможно
 *               общаться")
 *   2026-07-31  `h-full … sm:min-h-[420px]` on the TasteChat root: the
 *               percentage height did not resolve against a flex-basis parent,
 *               so the root fell back to CONTENT height — 742px inside a 432px
 *               box, putting the composer 253px below the visible panel.
 *
 * Both were invisible to every existing test, which only checked that the chat
 * ANSWERS. Hence a geometric assertion: the textarea's box must sit within the
 * panel's box. Desktop sizes matter most — that is where the 2026-07-31
 * regression lived, while mobile still worked.
 */

const SIZES = [
  { name: "desktop 1280x720", width: 1280, height: 720 },
  { name: "small laptop 1280x600", width: 1280, height: 600 },
  { name: "tablet 768x1024", width: 768, height: 1024 },
  { name: "phone 390x844", width: 390, height: 844 },
];

const PANEL = '[role="dialog"][aria-label="Vinovigator"]';
const CHAT_STORAGE_KEY = "wn_taste_chat_v1";

/**
 * A REAL conversation, seeded before load. With an empty chat the message list
 * is short enough that the broken layout still fit at most sizes — the bug only
 * showed once a few replies had accumulated. Seeding makes the guard
 * deterministic and reproduces the condition the client actually hit.
 */
const SEEDED_HISTORY = Array.from({ length: 6 }, (_, i) => [
  { role: "user", content: `Pytanie numer ${i + 1} o smaki wina?` },
  {
    role: "assistant",
    content:
      "Cierpkość to uczucie delikatnego ściągania i suchości w ustach, podobne do tego po mocnej herbacie albo niedojrzałym owocu. W Vinocompasie to jeden z trzech podstawowych smaków i często sprawia, że wino wydaje się bardziej wyraziste.",
  },
]).flat();

for (const size of SIZES) {
  test(`chat composer stays inside the panel — ${size.name}`, async ({ page }) => {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.addInitScript(
      ([key, history]) => {
        window.localStorage.setItem(key as string, JSON.stringify(history));
        // Make sure the panel starts expanded regardless of persisted state.
        window.localStorage.setItem("wn_floating_chat_open_v1", "1");
      },
      [CHAT_STORAGE_KEY, SEEDED_HISTORY] as const,
    );
    await page.goto("/pl/samouczek");

    // The chat is next/dynamic(ssr:false), so the panel appears only after
    // hydration. Wait for it; if it stayed collapsed, open it via the launcher.
    // The launcher must be matched on "Otwórz" — a looser "przewodnika" match
    // also hits the invisible mobile backdrop ("Zamknij przewodnika").
    const panel = page.locator(PANEL);
    try {
      await expect(panel).toBeVisible({ timeout: 8000 });
    } catch {
      await page
        .locator('button[aria-label^="Otwórz przewodnika"], button[aria-label^="Open the Vinocompas"]')
        .first()
        .click();
      await expect(panel).toBeVisible({ timeout: 8000 });
    }

    const composer = panel.locator("textarea");
    await expect(composer).toBeVisible();

    const panelBox = await panel.boundingBox();
    const composerBox = await composer.boundingBox();
    expect(panelBox, "panel has a box").not.toBeNull();
    expect(composerBox, "composer has a box").not.toBeNull();

    // The composer must be fully within the panel's clipping box (1px slack
    // for sub-pixel rounding).
    expect(
      composerBox!.y + composerBox!.height,
      `composer bottom must not fall below the panel (overflow: ${Math.round(
        composerBox!.y + composerBox!.height - (panelBox!.y + panelBox!.height),
      )}px)`,
    ).toBeLessThanOrEqual(panelBox!.y + panelBox!.height + 1);
    expect(composerBox!.y).toBeGreaterThanOrEqual(panelBox!.y - 1);

    // And it must be usable, not just present.
    await expect(composer).toBeEditable();
    await composer.fill("test");
    await expect(composer).toHaveValue("test");

    // Stronger, size-independent invariant: the chat panel FILLS its box and
    // nothing inside it is pushed past the clipping edge. Checking only the
    // composer's box is not enough — whether it lands outside depends on the
    // viewport height and how long the conversation is, so a broken layout can
    // still fit at some sizes. This asserts the real contract instead.
    const overflow = await page.evaluate((sel) => {
      const panel = document.querySelector(sel)!;
      const pb = panel.getBoundingClientRect().bottom;
      let worst = 0;
      let culprit = "";
      for (const el of panel.querySelectorAll("*")) {
        const b = el.getBoundingClientRect();
        // Skip zero-size nodes and anything intentionally scrolled inside a
        // scroll container (the message list scrolls; its children may sit
        // below the fold *within* it, which is fine).
        if (b.height === 0) continue;
        let inScroller = false;
        for (let p = el.parentElement; p && p !== panel; p = p.parentElement) {
          if (getComputedStyle(p).overflowY === "auto") { inScroller = true; break; }
        }
        if (inScroller) continue;
        const over = Math.round(b.bottom - pb);
        if (over > worst) { worst = over; culprit = el.tagName.toLowerCase() + "." + String(el.className).slice(0, 40); }
      }
      return { worst, culprit };
    }, PANEL);

    expect(
      overflow.worst,
      `nothing may extend past the panel's clipping edge (worst: ${overflow.worst}px on ${overflow.culprit})`,
    ).toBeLessThanOrEqual(1);
  });
}
