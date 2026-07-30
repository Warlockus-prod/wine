import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import { siteMode } from "@/lib/site-mode";

export default function robots(): MetadataRoute.Robots {
  const SITE_URL = siteUrl();
  // The tutorial deployment serves exactly one page; pointing crawlers at
  // product URLs it only redirects away would be a lie.
  if (siteMode() === "samouczek") {
    return {
      rules: [{ userAgent: "*", allow: ["/samouczek", "/pl/samouczek"], disallow: ["/api/*"] }],
      host: SITE_URL,
    };
  }
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Operator pages stay un-indexed - they're behind the upcoming
        // auth gate anyway and have no public value.
        disallow: ["/admin", "/admin/*", "/api/*"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
