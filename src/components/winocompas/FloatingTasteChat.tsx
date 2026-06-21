"use client";

/**
 * FloatingTasteChat - bottom-right floating chat button that expands into
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
  // Lazy state init reads localStorage exactly once on mount - no render
  // thrash, no setState-in-effect lint, no SSR mismatch (this whole
  // component is loaded via next/dynamic ssr:false in callers).
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultOpen;
    // First visit: honour defaultOpen on desktop, but never auto-cover a phone
    // (the sheet would hide the page, e.g. on /pairing). >= 640px (sm) only.
    const firstVisit = defaultOpen && window.innerWidth >= 640;
    try {
      const v = window.localStorage.getItem(STATE_KEY);
      return v !== null ? v === "1" : firstVisit;
    } catch {
      return firstVisit;
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
    // SSR placeholder - render nothing to avoid layout shift on hydration.
    return null;
  }

  // Disabled mode - hide everything. Don't even leave the launcher dot.
  if (disabled) return null;

  return (
    <>
      {/* Floating launcher - visible whenever chat is collapsed */}
      {!open ? (
        <button
          type="button"
          onClick={() => toggle(true)}
          aria-label="Otwórz przewodnika Vinokompasu"
          className="group fixed right-4 bottom-[calc(var(--mobile-tabbar-h)+0.95rem)] z-40 flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(199,159,105,0.55)] bg-gradient-to-br from-primary to-primary-dark shadow-[0_18px_48px_rgba(199,159,105,0.45)] transition-transform hover:scale-105 active:scale-95 sm:bottom-6"
        >
          <span aria-hidden className="absolute inset-0 -z-10 animate-pulse rounded-full bg-primary/30 blur-md" />
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="text-white">
            <path d="M12 2a3 3 0 0 1 3 3v1h2a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3h2V5a3 3 0 0 1 3-3Zm-3 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm6 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" />
          </svg>
          <span className="absolute -top-1 -right-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#081634] bg-[var(--color-accent-gold)] text-[10px] font-bold text-[#081634]">
            ?
          </span>
        </button>
      ) : null}

      {/* Expanded panel - viewport-pinned. Mobile: a tall sheet from 14vh down
          to just above the bottom tab-bar (var(--mobile-tabbar-h)) so the
          composer never hides behind the tab-bar; messages scroll inside.
          Desktop: 380×~700 docked bottom-right. The drag-handle pill at the
          top is decorative - taps the chat title hides the panel. */}
      {open ? (
        <>
          {/* Mobile-only soft backdrop - not a hard scrim, just enough wash
              so users see the chat is overlay rather than the page. */}
          <button
            type="button"
            aria-label="Zamknij przewodnika"
            onClick={() => toggle(false)}
            className="fixed inset-0 z-30 bg-gradient-to-t from-black/45 via-black/20 to-transparent sm:hidden"
            style={{ pointerEvents: "auto" }}
          />
          <div
            className="fixed inset-x-2 top-[40dvh] bottom-[calc(var(--mobile-tabbar-h)+0.5rem)] z-[60] flex flex-col sm:inset-x-auto sm:top-auto sm:right-5 sm:bottom-5 sm:z-40 sm:max-h-[calc(100dvh-6rem)] sm:w-[380px]"
            role="dialog"
            aria-label="Vinovigator"
          >
            <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl shadow-[0_28px_70px_rgba(0,0,0,0.55)]">
              {/* Drag-handle pill at the top edge - purely visual cue that
                  this is a sheet you can dismiss. Taps the panel header to
                  toggle (mobile only). */}
              <button
                type="button"
                onClick={() => toggle(false)}
                aria-label="Zwiń przewodnika"
                className="absolute top-1.5 left-1/2 z-20 -translate-x-1/2 sm:hidden"
              >
                <span className="block h-1.5 w-12 rounded-full bg-white/35 transition hover:bg-white/55" />
              </button>
              <button
                type="button"
                onClick={() => toggle(false)}
                aria-label="Schowaj przewodnika"
                className="absolute top-3 right-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/55 text-gray-200 backdrop-blur transition hover:border-white/40 hover:text-white"
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
        </>
      ) : null}
    </>
  );
}
