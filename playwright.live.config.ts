import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "/Users/Andrey/App/web_wn/e2e",
  use: { baseURL: "https://wine2.icoffio.com", trace: "off" },
  retries: 1,
});
