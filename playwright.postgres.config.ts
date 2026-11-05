import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e-postgres",
  workers: 1,
  fullyParallel: false,
  timeout: 120000,
  use: {
    baseURL: "http://127.0.0.1:3101",
    trace: "off",
    screenshot: "only-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
  },
  webServer: {
    command: "npm run dev -- --port 3101",
    url: "http://127.0.0.1:3101",
    timeout: 120000,
    reuseExistingServer: false,
    env: {
      LEDGERBOT_APP_ORIGIN: "http://127.0.0.1:3101",
      LEDGERBOT_BACKEND: "postgres",
    },
  },
  projects: [{ name: "verified-chromium", use: { browserName: "chromium" } }],
});
