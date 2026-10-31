import {defineConfig, devices} from "@playwright/test";

const isCi = Boolean(process.env.CI);

export default defineConfig({
  forbidOnly: isCi,
  testDir: "test",
  projects: [
    {
      name: "chromium",
      use: devices["Desktop Chrome"],
    },
  ],
  use: {
    baseURL: "http://localhost:3001",
    trace: "on-first-retry",
  },
  webServer: {
    url: "http://localhost:3001",
    command: isCi
      ? "cp -R .next/static .next/standalone/apps/backoffice/.next/ && (test ! -d public || cp -R public .next/standalone/apps/backoffice/) && PORT=3001 node .next/standalone/apps/backoffice/server.js"
      : "next dev --port 3001",
    reuseExistingServer: !isCi,
  },
  reporter: isCi ? "github" : "list",
  retries: isCi ? 2 : 0,
});
