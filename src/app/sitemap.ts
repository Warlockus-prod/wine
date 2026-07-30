import type { MetadataRoute } from "next";
import { catalogRestaurants } from "@/lib/restaurant-directory";
import { routing } from "@/i18n/routing";
import { siteUrl } from "@/lib/site-url";
import { siteMode } from "@/lib/site-mode";

/**
 * sitemap.ts - Next.js App Router auto-generates /sitemap.xml from this.
 *
 * Lists every static + dynamic route per locale. Restaurant pages get the
 * highest priority (0.8) since those are guest-facing entry points scanned
 * via QR. Tutorial + pairing get medium (0.6); admin omitted (operator-only).
 */

export default function sitemap(): MetadataRoute.Sitemap {
  const SITE_URL = siteUrl();
  const now = new Date();
  const urls: MetadataRoute.Sitemap = [];

  // The tutorial deployment has exactly one indexable page per locale.
  if (siteMode() === "samouczek") {
    return routing.locales.map((locale) => ({
      url: `${SITE_URL}${locale === routing.defaultLocale ? "" : `/${locale}`}/samouczek`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 1.0,
    }));
  }

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

  // Restaurant pages × locales - high priority (QR entry points)
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
