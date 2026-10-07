import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  timeout: 45000,
  use: { baseURL: "http://localhost:3000", trace: "retain-on-failure" },
  webServer: { command: "pnpm dev --hostname 127.0.0.1", url: "http://localhost:3000", reuseExistingServer: !process.env.CI, timeout: 120000 },
});
