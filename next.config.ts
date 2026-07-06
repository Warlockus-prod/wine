import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Origins allowed to embed the /embed/* routes (samouczek widget) in an
// iframe. Keep this tight — only the shop + our own domain.
const EMBED_FRAME_ANCESTORS =
  "frame-ancestors 'self' https://winnica.pl https://*.winnica.pl https://wine.icoffio.com";

// `unsafe-eval` is only needed by the webpack dev server (eval source maps).
// Production bundles — including Mapbox GL — don't need it, so we drop it there.
const isDev = process.env.NODE_ENV !== "production";

// Shared CSP. `script/style 'unsafe-inline'` is required by Next's hydration,
// the next-themes inline theme script, and Tailwind's injected styles.
// `img-src https:` keeps the Unsplash/Wikimedia/QR/Mapbox photo fallbacks
// working. OpenAI is called server-side only, so it needs no connect-src entry.
const buildCsp = (frameAncestors: string) =>
  [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob: https:",
    // Google Fonts: the Material Icons/Symbols stylesheet is served by
    // fonts.googleapis.com and the font files by fonts.gstatic.com. Without
    // these, CSP blocks the icon font and icons render as ligature text
    // (e.g. "wine_bar", "settings") for every user.
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "connect-src 'self' https://api.mapbox.com https://events.mapbox.com",
    "worker-src 'self' blob:",
    frameAncestors,
  ].join("; ");

// Headers safe on every route. Framing is handled per-route below (the embed
// widget must stay cross-origin-framable; the rest of the site must not).
const BASE_SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  async headers() {
    const embedHeaders = [
      ...BASE_SECURITY_HEADERS,
      { key: "Content-Security-Policy", value: buildCsp(EMBED_FRAME_ANCESTORS) },
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
          { key: "Content-Security-Policy", value: buildCsp("frame-ancestors 'self'") },
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
