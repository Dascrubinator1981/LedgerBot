import pg from "pg";
import { rotateDrafts } from "../src/lib/rotate-drafts.ts";
const raw = process.env.LEDGERBOT_ROTATION_DATABASE_URL;
if (!raw) {
  console.error(
    "Set the separate operator database URL securely. No action performed.",
  );
  process.exit(1);
}
let client;
try {
  const uri = new URL(raw),
    local = ["localhost", "127.0.0.1", "[::1]"].includes(uri.hostname);
  if (!local)
    for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
      uri.searchParams.delete(key);
  client = new pg.Client({
    connectionString: uri.toString(),
    ssl: local ? false : { rejectUnauthorized: true },
    connectionTimeoutMillis: 5000,
    query_timeout: 30000,
  });
  await client.connect();
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply"))
    throw new Error("Unknown argument");
  console.log(
    JSON.stringify(await rotateDrafts(client, args.includes("--apply"))),
  );
} catch {
  console.error(
    "Draft rotation failed; changes rolled back. Check key recovery and permissions locally. No payloads logged.",
  );
  process.exitCode = 1;
} finally {
  await client?.end();
}
