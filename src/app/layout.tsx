import type { Metadata } from "next";
import Link from "next/link";
import { Cormorant_Garamond, Work_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

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
  title: "Wine Pairing Restaurants",
  description:
    "Multi-restaurant prototype with dish to wine pairing highlights and admin editing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <Providers>
          <header className="site-frame pb-0">
            <nav className="site-panel flex flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
              <Link href="/" className="text-xl font-semibold tracking-wide md:text-2xl">
                <span
                  style={{ fontFamily: "var(--font-display)" }}
                  className="text-[#8d3a2b]"
                >
                  Cellar Compass
                </span>
              </Link>
              <div className="flex items-center gap-2 text-sm font-medium md:text-base">
                <Link
                  className="rounded-full border border-[#d9cbbb] bg-[#fff4e6] px-4 py-2 transition-colors hover:bg-[#ffe7ca]"
                  href="/"
                >
                  Restaurants
                </Link>
                <Link
                  className="rounded-full border border-[#c5d6cf] bg-[#ebf4ef] px-4 py-2 transition-colors hover:bg-[#d7ece3]"
                  href="/admin"
                >
                  Admin
                </Link>
              </div>
            </nav>
          </header>
          <main className="site-frame pt-4 md:pt-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
