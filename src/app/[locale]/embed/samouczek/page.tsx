"use client";

/**
 * /embed/samouczek - "naked" Vinokompas tutorial for iframe embedding in an
 * external site (e.g. the winnica.pl shop). No site nav / hero / FAQ - just
 * the interactive compass, the 3 stages and the live wine proposals.
 *
 * Talks to the embedding page via postMessage (origin-agnostic outward; the
 * PARENT must verify event.origin === our embed origin):
 *   ⬆ { source:"vinokompas", type:"vinokompas:ready" }            on mount
 *   ⬆ { source:"vinokompas", type:"vinokompas:resize", height }   on size change
 *   ⬇ { type:"vinokompas:set-user", token }   (phase 2 - SSO/account binding)
 *
 * Phase 2 (needs the shop's contract): verify the JWT in set-user, load the
 * customer's saved profile, swap the proposal source to the shop catalog
 * API, and emit vinokompas:add-to-cart instead of linking out.
 */

import { useEffect, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import type { CompassProfile } from "@/components/winocompas/TasteCompass";

const StagedTutorial = dynamic(() => import("@/components/winocompas/StagedTutorial"), {
  ssr: false,
  loading: () => (
    <div className="h-[480px] animate-pulse rounded-2xl border border-white/8 bg-white/3" />
  ),
});

const FloatingTasteChat = dynamic(
  () => import("@/components/winocompas/FloatingTasteChat"),
  { ssr: false },
);

const PROFILE_STORAGE_KEY = "wn_compass_profile_v1";

// Origins allowed to host this widget in an iframe (must match the CSP
// frame-ancestors in next.config.ts). We post only to these - never "*" - and
// we ignore inbound messages from anywhere else (audit P1-4).
const ALLOWED_PARENT_ORIGINS = [
  "https://winnica.pl",
  "https://www.winnica.pl",
  "https://wine.icoffio.com",
];

function postToParent(msg: Record<string, unknown>) {
  if (typeof window === "undefined" || window.parent === window) return;
  for (const origin of ALLOWED_PARENT_ORIGINS) {
    try {
      window.parent.postMessage({ source: "vinokompas", ...msg }, origin);
    } catch {
      /* ignore */
    }
  }
}

export default function EmbedSamouczekPage() {
  const [profile, setProfile] = useState<CompassProfile>({});
  const [chatDisabled, setChatDisabled] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Hydrate persisted profile (same key as the full samouczek page).
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CompassProfile;
        if (parsed && typeof parsed === "object") {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setProfile(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
  }, [profile]);

  // Announce readiness + listen for parent → iframe messages.
  useEffect(() => {
    postToParent({ type: "vinokompas:ready" });
    const onMsg = (e: MessageEvent) => {
      // Only trust messages from an allowed parent origin (audit P1-4).
      if (!ALLOWED_PARENT_ORIGINS.includes(e.origin)) return;
      const data = e.data as { type?: string } | null;
      if (data?.type === "vinokompas:set-user") {
        // Phase 2: verify token server-side, load the account's profile.
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Auto-height: report the content height so the parent can size the iframe.
  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const send = () =>
      postToParent({
        type: "vinokompas:resize",
        height: Math.ceil(el.getBoundingClientRect().height),
      });
    const ro = new ResizeObserver(send);
    ro.observe(el);
    send();
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="pitch-grain bg-background-dark px-4 py-6 text-[color:var(--ink)] sm:px-6 sm:py-8"
      style={{ ["--mobile-tabbar-h"]: "0.5rem" } as CSSProperties}
    >
      <StagedTutorial
        profile={profile}
        onProfileChange={setProfile}
        chatDisabled={chatDisabled}
        onChatDisabledChange={setChatDisabled}
      />
      <FloatingTasteChat profile={profile} disabled={chatDisabled} />
    </div>
  );
}
