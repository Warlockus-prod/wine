"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";

const menuLinks = [
  { href: "/", label: "Discover" },
  { href: "/pairing", label: "Wine Pairing" },
  { href: "/immersive", label: "Reservations" },
  { href: "/editorial", label: "Events" },
  { href: "/admin", label: "Admin V2" },
  { href: "/v1", label: "Backup V1" },
  { href: "/v1/admin", label: "Admin V1" },
];

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const isIframe =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("viewport") === "mobile";

  // Hide the viewport toggle inside the iframe preview
  const showViewportToggle = !isIframe;

  return (
    <>
      <nav className="glass-nav fixed top-0 z-50 w-full border-b border-white/10">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-white">
              <span className="material-icons text-sm">wine_bar</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Sommelier<span className="text-primary">AI</span>
            </span>
          </Link>

          <div className="hidden items-center gap-7 md:flex">
            {menuLinks.slice(0, 4).map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  className={`text-sm font-medium transition ${
                    active ? "text-primary" : "text-gray-300 hover:text-white"
                  }`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              className="rounded-md border border-primary/40 bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary hover:bg-primary/25"
              href="/v1"
            >
              Backup V1
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {/* Viewport switcher toggle — only on desktop, hidden inside iframe */}
            {showViewportToggle ? (
              <button
                type="button"
                onClick={() => setPreviewMode(true)}
                className="hidden items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/15 px-3 py-2 text-xs font-semibold text-primary transition-all hover:bg-primary hover:text-white md:flex"
              >
                <span className="material-icons text-sm">smartphone</span>
                <span>Mobile</span>
              </button>
            ) : null}
            <Link
              className="hidden rounded-lg border border-white/20 bg-white/8 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/16 md:inline-flex"
              href="/admin"
            >
              Admin
            </Link>
            <button
              type="button"
              className="hidden rounded-lg border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/14 md:inline-flex"
            >
              Sign In
            </button>
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen((prev) => !prev)}
              className="inline-flex rounded-lg border border-white/20 bg-white/10 p-2.5 text-white transition hover:bg-white/20 md:hidden"
            >
              <span className="material-icons text-base">{mobileOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile navigation dropdown */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-[55] bg-black/55 md:hidden" onClick={() => setMobileOpen(false)}>
          <aside
            role="dialog"
            aria-label="Mobile navigation"
            className="absolute top-20 right-3 left-3 rounded-2xl border border-white/10 bg-[#1d1114] p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid gap-2">
              {menuLinks.map((link) => {
                const active =
                  pathname === link.href ||
                  pathname.startsWith(`${link.href}/`) ||
                  (link.href === "/admin" && pathname === "/v1/admin");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                      active
                        ? "border border-primary/30 bg-primary/15 text-primary"
                        : "border border-white/8 bg-white/4 text-gray-200"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </aside>
        </div>
      ) : null}

      {/* Mobile preview overlay — portalled to body */}
      {previewMode
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm">
              {/* Top bar */}
              <div className="absolute top-0 right-0 left-0 z-[105] flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-primary/20 px-3 py-1.5 text-xs font-bold tracking-wider text-primary uppercase">
                    Mobile Preview
                  </span>
                  <span className="text-xs text-gray-400">
                    {PHONE_WIDTH}×{PHONE_HEIGHT}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewMode(false)}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-surface-dark px-4 py-2.5 text-sm font-semibold text-white shadow-2xl transition hover:border-primary hover:bg-primary"
                >
                  <span className="material-icons text-sm">close</span>
                  Close
                </button>
              </div>

              {/* Phone frame */}
              <div
                className="relative flex flex-col overflow-hidden rounded-[3rem] border-[6px] border-gray-700 bg-black shadow-[0_0_80px_rgba(209,21,52,0.15)]"
                style={{
                  width: PHONE_WIDTH + 12,
                  height: PHONE_HEIGHT + 12,
                }}
              >
                {/* Dynamic Island */}
                <div className="absolute top-2 left-1/2 z-10 h-[26px] w-[100px] -translate-x-1/2 rounded-full bg-black" />

                {/* iframe with the actual mobile view */}
                <iframe
                  src={`${pathname}?viewport=mobile`}
                  title="Mobile preview"
                  className="h-full w-full border-0"
                  style={{
                    width: PHONE_WIDTH,
                    height: PHONE_HEIGHT,
                    background: "#1a0f11",
                  }}
                />

                {/* Home indicator */}
                <div className="absolute bottom-2 left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-gray-600" />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
