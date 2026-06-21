import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vinovigator AI",
    short_name: "Vinovigator",
    description: "Vinokompas-driven wine pairing for restaurants - mobile-first, EN+PL.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#081634",
    theme_color: "#0b1f44",
    icons: [
      {
        src: "/app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
