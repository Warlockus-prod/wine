/**
 * SPRITE_VER — cache-bust token appended as `?v=` to every association-sprite
 * URL (`/senses/ring/<tendencja>-<k>.png`, shown in the wheel garland and the
 * guide card).
 *
 * WHY THIS EXISTS: `next/image` caches its optimized output keyed on the SOURCE
 * URL, not the file's content. Re-cutting sprites REUSES the filenames
 * (`dab-1.png` …), so the browser (and any CDN in front) kept serving the
 * previous optimized picture at the reused name — the client repeatedly
 * reported seeing the OLD art after an update ("как на скрине", 2026-07-22).
 * Bumping this constant changes the URL — and therefore the optimizer cache
 * key — so every viewer fetches the fresh art on the next load, no hard refresh.
 *
 * BUMP THIS whenever anything under public/senses/ring/* changes (the
 * curate-sprites.mjs run reminds you). Format: YYYYMMDD of the re-cut, plus an
 * optional `-N` for a second change the same day.
 *
 * Zero imports on purpose — next.config.ts reads it too, and the config loader
 * must be able to import it without pulling in app code.
 */
export const SPRITE_VER = "20260722";
