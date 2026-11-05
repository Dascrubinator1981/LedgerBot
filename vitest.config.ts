import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: process.env.LEDGERBOT_TEST_ADMIN_URL
      ? []
      : ["tests/postgres.test.ts"],
    fileParallelism: false,
  },
});
