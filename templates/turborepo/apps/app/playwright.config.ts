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
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    url: "http://localhost:3000",
    command: isCi
      ? "cp -R .next/static .next/standalone/apps/app/.next/ && (test ! -d public || cp -R public .next/standalone/apps/app/) && node .next/standalone/apps/app/server.js"
      : "next dev --port 3000",
    reuseExistingServer: !isCi,
  },
  reporter: isCi ? "github" : "list",
  retries: isCi ? 2 : 0,
});
