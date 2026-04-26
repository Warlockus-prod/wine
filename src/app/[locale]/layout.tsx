import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { PwaRegister } from "@/components/pwa-register";
import { routing } from "@/i18n/routing";
import "../globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sommelier AI | Wine Pairing Platform",
  description:
    "Restaurant discovery catalog with Europe map, unique restaurant pages, QR entry points, and AI-assisted wine pairing.",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [{ url: "/app-icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/app-icon.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Sommelier AI",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a0f11",
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
    <html lang={locale} className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Symbols+Outlined"
          rel="stylesheet"
          fetchPriority="low"
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${playfairDisplay.variable} antialiased`}
      >
        <NextIntlClientProvider>
          <PwaRegister />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
