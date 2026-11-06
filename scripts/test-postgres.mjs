import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
const config = JSON.parse(
  await readFile("data/local-services/config.json", "utf8"),
);
const runtime = JSON.parse(
  await readFile("data/local-services/runtime.json", "utf8"),
);
const args = process.argv.slice(2);
const e2e = args.includes("--e2e");
const executable = e2e
  ? "node_modules/@playwright/test/cli.js"
  : "node_modules/vitest/vitest.mjs";
const child = spawn(
  process.execPath,
  [
    executable,
    ...(e2e
      ? ["test", "--config=playwright.postgres.config.ts"]
      : [
          "run",
          "tests/postgres.test.ts",
          "tests/draft-crypto.test.ts",
          "tests/key-rotation.test.ts",
          "tests/rotation-postgres.test.ts",
        ]),
  ],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ...runtime,
      LEDGERBOT_TEST_ADMIN_URL: `postgres://postgres:${config.adminPassword}@127.0.0.1:55432/ledgerbot`,
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
