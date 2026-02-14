import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Work_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./v1.css";

const displayFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Work_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Cellar Compass V1 Backup",
  description: "Backup catalog/admin flow with dish-to-wine pairing highlights.",
};

export default function V1Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`v1-shell ${displayFont.variable} ${bodyFont.variable}`}>
      <Providers>
        <header className="site-frame pb-0">
          <nav className="site-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-3">
              <Link href="/v1" className="text-xl font-semibold tracking-wide md:text-2xl">
                <span style={{ fontFamily: "var(--font-display)" }} className="text-[#8d3a2b]">
                  Cellar Compass
                </span>
              </Link>
              <span className="rounded-full border border-[#d9cbbb] bg-[#fff4e6] px-2.5 py-1 text-[11px] font-semibold tracking-[0.1em] text-[#8d3a2b] uppercase">
                Backup V1
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm font-medium md:text-base">
              <Link
                className="rounded-full border border-[#d9cbbb] bg-[#fff4e6] px-4 py-2 transition-colors hover:bg-[#ffe7ca]"
                href="/v1"
              >
                Restaurants
              </Link>
              <Link
                className="rounded-full border border-[#c5d6cf] bg-[#ebf4ef] px-4 py-2 transition-colors hover:bg-[#d7ece3]"
                href="/v1/admin"
              >
                Admin
              </Link>
              <Link
                className="rounded-full border border-[#ceb7cf] bg-[#f8edf8] px-4 py-2 transition-colors hover:bg-[#f0dcf0]"
                href="/"
              >
                Main V2
              </Link>
            </div>
          </nav>
        </header>

        <main className="site-frame pt-4 md:pt-6">{children}</main>
      </Providers>
    </div>
  );
}
