import { cp } from "node:fs/promises";
import { spawn } from "node:child_process";
const args = process.argv.slice(2);
if (args.length && (args.length !== 2 || args[0] !== "--port"))
  throw new Error("Only --port is supported");
const port = Number(args[1] || process.env.PORT || 3000);
if (!Number.isInteger(port) || port < 1 || port > 65535)
  throw new Error("Invalid server port");
await cp(".next/static", ".next/standalone/.next/static", { recursive: true });
try {
  await cp("public", ".next/standalone/public", { recursive: true });
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const child = spawn(process.execPath, [".next/standalone/server.js"], {
  stdio: "inherit",
  env: { ...process.env, PORT: String(port), HOSTNAME: "127.0.0.1" },
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
