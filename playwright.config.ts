import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 2,
  workers: 1, // Sequential run to avoid conflicting in-memory mock states
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "pnpm mock-backend",
      port: 3001,
      reuseExistingServer: true,
      timeout: 30000,
    },
    {
      command: "pnpm serve",
      port: 3000,
      reuseExistingServer: true,
      timeout: 30000,
    }
  ]
});
