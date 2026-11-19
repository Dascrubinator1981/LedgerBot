import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./e2e-production",
  workers: 1,
  timeout: 60000,
  use: {
    baseURL: "http://127.0.0.1:3200",
    trace: "off",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : undefined,
  },
  webServer: {
    command: "npm run start -- --port 3200",
    url: "http://127.0.0.1:3200",
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      LEDGERBOT_BACKEND: "postgres",
      LEDGERBOT_APP_ORIGIN: "http://127.0.0.1:3200",
    },
  },
});
