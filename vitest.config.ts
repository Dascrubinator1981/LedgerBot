import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: process.env.LEDGERBOT_TEST_ADMIN_URL
      ? []
      : ["tests/postgres.test.ts", "tests/rotation-postgres.test.ts"],
    fileParallelism: false,
  },
});
