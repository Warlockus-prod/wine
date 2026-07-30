/**
 * siteUrl() — canonical origin of THIS deployment, resolved at RUNTIME.
 *
 * Why not just NEXT_PUBLIC_SITE_URL: those are inlined at BUILD time, so a
 * single image cannot carry two different canonical hosts. Both sites run the
 * same image (see site-mode.ts), so the samouczek container overrides the
 * origin with a plain runtime `SITE_URL` while the full container keeps the
 * baked-in public value.
 *
 * SERVER-SIDE ONLY. Every caller (robots, sitemap, generateMetadata, the
 * directory lib) is a server component — a client component would read
 * `undefined` for SITE_URL and must keep using NEXT_PUBLIC_SITE_URL, as the
 * admin QR page does.
 */
export function siteUrl(): string {
  return (
    process.env.SITE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://wine2.icoffio.com"
  );
}
