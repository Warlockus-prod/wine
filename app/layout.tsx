import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
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
  title: "Sommelier.AI",
  description: "Curated tastes perfected by AI.",
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
          href="https://fonts.googleapis.com/icon?family=Material+Icons|Material+Symbols+Outlined"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${playfairDisplay.variable} antialiased bg-background-light dark:bg-background-dark text-gray-900 dark:text-gray-100 font-display`}
      >
        {children}
      </body>
    </html>
  );
}
