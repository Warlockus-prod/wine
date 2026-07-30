"use client";

/**
 * Makes the deployment's SITE_MODE readable from client components.
 *
 * `SITE_MODE` is a RUNTIME server env (that is the whole point — one image,
 * two containers, see src/lib/site-mode.ts), so a client component cannot read
 * it directly: `process.env.SITE_MODE` is undefined in the browser bundle, and
 * making it `NEXT_PUBLIC_` would bake it in at build time and force two images.
 * The server layout reads it once and publishes it here.
 *
 * Used by the chrome (Navigation, MobileTabBar) so the tutorial site does not
 * advertise the product pages it only redirects away from.
 */

import { createContext, useContext } from "react";
import type { SiteMode } from "@/lib/site-mode";

const SiteModeContext = createContext<SiteMode>("full");

export function SiteModeProvider({
  mode,
  children,
}: {
  mode: SiteMode;
  children: React.ReactNode;
}) {
  return <SiteModeContext.Provider value={mode}>{children}</SiteModeContext.Provider>;
}

/** "full" | "samouczek". Defaults to "full" outside a provider, so any
 *  component rendered in isolation (tests, storybook) behaves as the product. */
export const useSiteMode = (): SiteMode => useContext(SiteModeContext);

/** True on the tutorial-only deployment (wine.icoffio.com). */
export const useIsTutorialSite = (): boolean => useSiteMode() === "samouczek";
