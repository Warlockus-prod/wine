import { setRequestLocale } from "next-intl/server";
import EmbedSamouczekClient from "./EmbedSamouczekClient";

/**
 * /embed/samouczek — the "naked" Vinocompas tutorial for iframe embedding in
 * an external site (winnica.pl). The widget itself is a client component;
 * this thin server wrapper exists ONLY to carry the route segment config,
 * which Next ignores on a "use client" file.
 *
 * force-dynamic for the same reason as /samouczek and /privacy: SITE_MODE is
 * a RUNTIME value, and a prerendered page freezes the BUILD's mode ("full").
 * Without this the widget kept rendering the product hand-off link to
 * /pairing on the tutorial deployment — confirmed in a real browser against
 * wine.icoffio.com on 2026-07-31, and invisible to any HTML-only check
 * because StagedTutorial mounts via next/dynamic(ssr:false), i.e. the link
 * only appears after hydration.
 *
 * This is the surface the SHOP embeds, so a stray link out to the restaurant
 * product is the most costly place for that bug to live.
 */
export const dynamic = "force-dynamic";

export default async function EmbedSamouczekPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <EmbedSamouczekClient />;
}
