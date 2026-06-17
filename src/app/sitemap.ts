import type { MetadataRoute } from "next";
import { catalogRestaurants } from "@/lib/restaurant-directory";
import { routing } from "@/i18n/routing";

/**
 * sitemap.ts — Next.js App Router auto-generates /sitemap.xml from this.
 *
 * Lists every static + dynamic route per locale. Restaurant pages get the
 * highest priority (0.8) since those are guest-facing entry points scanned
 * via QR. Tutorial + pairing get medium (0.6); admin omitted (operator-only).
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://wine.icoffio.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  // Static pages × locales (en at root, pl at /pl)
  const staticPaths = ["", "/pairing", "/samouczek", "/pitch"];
  for (const locale of routing.locales) {
    for (const p of staticPaths) {
      const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
      urls.push({
        url: `${SITE_URL}${prefix}${p}`,
        lastModified: now,
        changeFrequency: p === "" ? "weekly" : "monthly",
        priority: p === "" ? 1.0 : 0.6,
      });
    }
  }

  // Restaurant pages × locales — high priority (QR entry points)
  for (const locale of routing.locales) {
    const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
    for (const r of catalogRestaurants) {
      urls.push({
        url: `${SITE_URL}${prefix}/restaurants/${r.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }
  }

  return urls;
}
