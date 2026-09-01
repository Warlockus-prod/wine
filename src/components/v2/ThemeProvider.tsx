"use client";

/**
 * ThemeProvider - thin wrapper around `next-themes`.
 *
 * Why next-themes vs. rolling our own:
 *  - Handles SSR/hydration mismatch via the `suppressHydrationWarning` dance
 *    (no flash-of-wrong-theme on reload).
 *  - System-preference detection out of the box.
 *  - Persists choice to localStorage and emits a `data-theme` attribute on
 *    <html>, which our globals.css overrides key off.
 *
 * Token contract:
 *  - attribute="data-theme" (NOT "class") - we don't want to collide with
 *    the existing `dark` class on <html> nor with Tailwind v4's dark-mode
 *    handling.
 *  - defaultTheme="dark" - Vinovigator was designed dark-first; light is
 *    the considered alternative, not the canonical look.
 *  - enableSystem=true - first-time visitors get their OS preference; their
 *    explicit toggle later wins and persists.
 */

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/** `nonce` is forwarded to next-themes' inline anti-flash script. Without it
 *  our nonce-based CSP blocks that script and a dark-preference visitor gets
 *  a flash of the light theme before the client corrects it. */
export function ThemeProvider({ children, nonce }: { children: ReactNode; nonce?: string }) {
  return (
    <NextThemesProvider
      nonce={nonce}
      attribute="data-theme"
      defaultTheme="light"
      enableSystem={false}
      themes={["light", "dark"]}
      storageKey="vinovigator-theme"
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
