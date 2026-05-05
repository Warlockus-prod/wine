import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vinovigator AI",
    short_name: "Vinovigator",
    description: "Vinokompas-driven wine pairing for restaurants — mobile-first, EN+PL.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#130a0b",
    theme_color: "#1a0f11",
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
