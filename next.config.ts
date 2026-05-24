import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Origins allowed to embed the /embed/* routes (samouczek widget) in an
// iframe. Keep this tight — only the shop + our own domain.
const EMBED_FRAME_ANCESTORS =
  "frame-ancestors 'self' https://winnica.pl https://*.winnica.pl https://wine.icoffio.com;";

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  async headers() {
    return [
      {
        // EN at root (localePrefix "as-needed") + PL/other under /:locale.
        source: "/embed/:path*",
        headers: [{ key: "Content-Security-Policy", value: EMBED_FRAME_ANCESTORS }],
      },
      {
        source: "/:locale/embed/:path*",
        headers: [{ key: "Content-Security-Policy", value: EMBED_FRAME_ANCESTORS }],
      },
    ];
  },
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.qrserver.com",
        pathname: "/**",
      },
      // Unsplash CDN — used by lib/food-photos.ts as the dish/wine
      // photo fallback when seed data has no `image` field.
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
