import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "pl"] as const,
  defaultLocale: "en",
  // English keeps clean URLs; Polish gets a `/pl/...` prefix.
  // Existing English QR codes stay valid; only new Polish QRs need to point at /pl/...
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];
