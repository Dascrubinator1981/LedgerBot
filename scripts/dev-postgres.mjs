import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
const runtime = JSON.parse(
  await readFile("data/local-services/runtime.json", "utf8"),
);
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      ...runtime,
      LEDGERBOT_APP_ORIGIN: "http://127.0.0.1:3000",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
