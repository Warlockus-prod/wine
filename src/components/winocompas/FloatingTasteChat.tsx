"use client";

/**
 * FloatingTasteChat — bottom-right floating chat button that expands into
 * the full <TasteChat> panel. Lives in viewport (position: fixed) so it
 * stays accessible across page scroll. Collapsed state = a single round
 * button with an icon and unread/idle pulse; expanded = a side panel that
 * does not move with scroll.
 *
 * Why a separate component from <TasteChat>:
 *  - <TasteChat> is layout-agnostic and used inline on /samouczek as a
 *    teaching artifact ("here's the bot, talk to it").
 *  - <FloatingTasteChat> wraps it for the persistent always-on UX request.
 *
 * Mobile: when expanded, takes up almost the full screen height
 * (max-h: calc(100dvh - 6rem)) and width (max-w: calc(100vw - 1.5rem)).
 * Desktop: 380px panel docked bottom-right.
 *
 * Persistence: docked-vs-collapsed state in localStorage so refresh doesn't
 * yank the panel away from a user mid-conversation.
 */

import { useEffect, useState } from "react";
import TasteChat from "./TasteChat";
import type { CompassProfile } from "./TasteCompass";

interface Props {
  profile?: CompassProfile;
  storageKey?: string;
  /** Default expanded state on first visit. */
  defaultOpen?: boolean;
  /** When true, hide the floating launcher AND collapse any open panel.
   *  Used by /samouczek's "Wyłącz czat" toggle so users who don't want a
   *  guide are not nagged. */
  disabled?: boolean;
  /** Page-aware hint passed through to <TasteChat> (and the API). */
  pageContext?: string;
}

const STATE_KEY = "wn_floating_chat_open_v1";

export default function FloatingTasteChat({
  profile,
  storageKey,
  defaultOpen = false,
  disabled = false,
  pageContext,
}: Props) {
  // Lazy state init reads localStorage exactly once on mount — no render
  // thrash, no setState-in-effect lint, no SSR mismatch (this whole
  // component is loaded via next/dynamic ssr:false in callers).
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultOpen;
    try {
      const v = window.localStorage.getItem(STATE_KEY);
      return v !== null ? v === "1" : defaultOpen;
    } catch {
      return defaultOpen;
    }
  });
  const hydrated = typeof window !== "undefined";

  const toggle = (next?: boolean) => {
    setOpen((prev) => {
      const v = typeof next === "boolean" ? next : !prev;
      try {
        window.localStorage.setItem(STATE_KEY, v ? "1" : "0");
      } catch {
        /* ignore */
      }
      return v;
    });
  };

  // Listen for global "open chat" requests fired from <InteractiveCompass>
  // ("Zapytaj przewodnika" CTA). Skipped while disabled. MUST sit before
  // any early returns to satisfy the rules-of-hooks ordering.
  useEffect(() => {
    if (disabled || typeof window === "undefined") return;
    const onOpen = () => {
      try {
        window.localStorage.setItem(STATE_KEY, "1");
      } catch {
        /* ignore */
      }
      setOpen(true);
    };
    window.addEventListener("wn:open-chat", onOpen);
    return () => window.removeEventListener("wn:open-chat", onOpen);
  }, [disabled]);

  if (!hydrated) {
    // SSR placeholder — render nothing to avoid layout shift on hydration.
    return null;
  }

  // Disabled mode — hide everything. Don't even leave the launcher dot.
  if (disabled) return null;

  return (
    <>
      {/* Floating launcher — visible whenever chat is collapsed */}
      {!open ? (
        <button
          type="button"
          onClick={() => toggle(true)}
          aria-label="Otwórz przewodnika Vinokompasu"
          className="group fixed right-4 bottom-20 z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(197,160,89,0.55)] bg-gradient-to-br from-primary to-primary-dark shadow-[0_18px_48px_rgba(209,21,52,0.45)] transition-transform hover:scale-105 active:scale-95 sm:bottom-6"
        >
          <span aria-hidden className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/30 blur-md" />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M12 2a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2V5a3 3 0 0 1 3-3Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
          </svg>
          <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#150a0c] bg-[var(--color-accent-gold)] text-[10px] font-bold text-[#150a0c]">
            ?
          </span>
        </button>
      ) : null}

      {/* Expanded panel — viewport-pinned */}
      {open ? (
        <div
          className="fixed inset-x-3 bottom-3 z-40 flex max-h-[calc(100dvh-6rem)] flex-col sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[380px]"
          role="dialog"
          aria-label="Przewodnik Vinokompasu"
        >
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl shadow-[0_28px_70px_rgba(0,0,0,0.55)]">
            <button
              type="button"
              onClick={() => toggle(false)}
              aria-label="Schowaj przewodnika"
              className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-black/55 text-gray-200 backdrop-blur transition hover:border-white/40 hover:text-white"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <div className="flex flex-1">
              <TasteChat profile={profile} storageKey={storageKey} pageContext={pageContext} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
