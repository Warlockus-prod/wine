"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const menuLinks = [
  { href: "/", label: "Discover" },
  { href: "/pairing", label: "Wine Pairing" },
  { href: "/immersive", label: "Reservations" },
  { href: "/editorial", label: "Events" },
  { href: "/admin", label: "Admin V2" },
  { href: "/v1", label: "Backup V1" },
  { href: "/v1/admin", label: "Admin V1" },
];

export default function Navigation() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

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
              className="inline-flex rounded-lg border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20 md:hidden"
            >
              <span className="material-icons text-base">{mobileOpen ? "close" : "menu"}</span>
            </button>
          </div>
        </div>
      </nav>

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
    </>
  );
}
