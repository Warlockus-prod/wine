import type { Metadata, Viewport } from "next";
import { Libre_Franklin, Libre_Baskerville } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeProvider } from "@/components/v2/ThemeProvider";
import { routing } from "@/i18n/routing";
import "../globals.css";

// Match winnica.pl typography: Libre Baskerville (serif headings + italic
// accents) + Libre Franklin (body/UI). Libre Baskerville ships 400/700 only.
const libreFranklin = Libre_Franklin({
  variable: "--font-libre-franklin",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vinovigator AI - Wine pairing for restaurants",
  description:
    "Vinovigator AI: kompas smaku, mapa restauracji, QR przy stoliku, dwustronny matching dania i wina z uzasadnieniem językiem Vinocompasu.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/app-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/app-icon.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vinovigator AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#f4efe9",
  // Shrink the layout viewport when the on-screen keyboard opens so the
  // floating chat composer stays above it instead of being covered.
  interactiveWidget: "resizes-content",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    // Font variable classes live on <html>, NOT <body>: the runtime copies of
    // --font-serif/--font-display in globals.css are declared on :root, and a
    // custom property substitutes its inner var()s at the element where it is
    // DECLARED — on <body> the tokens were invisible to :root and the whole
    // serif display layer silently fell back to Franklin (audit 2026-07).
    <html
      lang={locale}
      data-theme="light"
      suppressHydrationWarning
      className={`${libreFranklin.variable} ${libreBaskerville.variable}`}
    >
      <head>
        {/* Icons are now inline SVG (src/components/v2/Icon.tsx) - no external
            icon font, so no FOUC / ligature-text flash on slow networks, and no
            Google-Fonts dependency. The display fonts are self-hosted via
            next/font. */}
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <NextIntlClientProvider>
            <PwaRegister />
            {children}
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
