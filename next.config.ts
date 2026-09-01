import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// CSP now lives in src/lib/csp.ts and is emitted per REQUEST by
// src/middleware.ts, because it carries a per-request nonce — a static
// header here could not. Framing rules moved with it. Only the headers that
// are constant stay below.
const BASE_SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Drop the X-Powered-By: Next.js banner (minor tech disclosure).
  poweredByHeader: false,
  outputFileTracingRoot: projectRoot,
  async headers() {
    const embedHeaders = [
      ...BASE_SECURITY_HEADERS,
    ];
    return [
      // Embed widget — framable by the winnica shop (+ us). No X-Frame-Options
      // here: it can't allow-list a cross-origin parent; frame-ancestors does.
      { source: "/embed/:path*", headers: embedHeaders },
      { source: "/:locale/embed/:path*", headers: embedHeaders },
      // Everything else — locked to same-origin framing. The negative lookahead
      // stops this rule from emitting a second, conflicting CSP on /embed/*.
      {
        source: "/((?!embed/|[a-z]{2}/embed/).*)",
        headers: [
          ...BASE_SECURITY_HEADERS,
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
  images: {
    // Optimizer ON: local /public masters are 1024px PNGs but the UI never
    // renders above ~384px, so serving originals shipped multi-MB thumbnails.
    // sharp is present in node_modules and .next/cache is writable by the
    // non-root container user (Dockerfile.vps), so runtime optimization works.
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    // Sprite URLs carry a `?v=SPRITE_VER` cache-bust (src/lib/asset-version.ts)
    // so re-cut art is never masked by a stale optimizer cache. Next 16 rejects
    // query strings on local images unless a localPattern allows them:
    //   1. sprite path — allow ANY query (the `?v=` token; no `search` field so
    //      this never has to stay in sync with the version constant, which the
    //      config loader can't reliably import anyway),
    //   2. every other local image — NO query (current behaviour).
    // An enumeration probe on a non-sprite path (`/dishes/x.png?v=9`) → 400.
    localPatterns: [
      { pathname: "/senses/ring/**" },
      { pathname: "/**", search: "" },
    ],
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
      // winnica.pl product photos — the samouczek proposal cards show the
      // real bottle shots from the generated catalogue.
      {
        protocol: "https",
        hostname: "winnica.pl",
        pathname: "/**",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
