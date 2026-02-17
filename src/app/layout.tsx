import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sommelier AI | Wine Pairing Platform",
  description:
    "V2 premium restaurant showcase with AI wine pairing demo and V1 backup catalog/admin mode.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
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
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
