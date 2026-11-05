import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { randomBytes, createHmac } from "node:crypto";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { resolve } from "node:path";
import pg from "pg";
const execFile = promisify(execFileCallback),
  directory = resolve("data/local-services");
await mkdir(directory, { recursive: true, mode: 0o700 });
let config;
try {
  config = JSON.parse(await readFile(directory + "/config.json", "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  const secret = () => randomBytes(32).toString("hex");
  const jwtSecret = secret();
  const header = Buffer.from(
    JSON.stringify({ alg: "HS256", typ: "JWT" }),
  ).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      role: "anon",
      iss: "supabase",
      iat: 1700000000,
      exp: 2200000000,
    }),
  ).toString("base64url");
  const anonKey = `${header}.${payload}.${createHmac("sha256", jwtSecret).update(`${header}.${payload}`).digest("base64url")}`;
  config = {
    adminPassword: secret(),
    appPassword: secret(),
    authPassword: secret(),
    jwtSecret,
    anonKey,
    draftKey: secret(),
  };
  await writeFile(directory + "/config.json", JSON.stringify(config), {
    mode: 0o600,
  });
}
const docker = async (...args) =>
  (
    await execFile("docker", ["--host=unix:///var/run/docker.sock", ...args], {
      maxBuffer: 1024 * 1024,
    })
  ).stdout;
async function ensureContainer(name, args) {
  try {
    await docker("inspect", name);
    await docker("start", name);
  } catch {
    await docker(
      "run",
      "--detach",
      "--name",
      name,
      "--network",
      "ledgerbot-stage1",
      ...args,
    );
  }
}
try {
  await docker("network", "inspect", "ledgerbot-stage1");
} catch {
  await docker("network", "create", "ledgerbot-stage1");
}
await writeFile(
  directory + "/postgres.env",
  `POSTGRES_PASSWORD=${config.adminPassword}\nPOSTGRES_DB=ledgerbot\n`,
  { mode: 0o600 },
);
await ensureContainer("ledgerbot-stage1-postgres", [
  "--env-file",
  directory + "/postgres.env",
  "-p",
  "127.0.0.1:55432:5432",
  "postgres:17.7-bookworm",
]);
const adminUrl = `postgres://postgres:${config.adminPassword}@127.0.0.1:55432/ledgerbot`;
let admin;
for (let attempt = 0; attempt < 30; attempt++) {
  const candidate = new pg.Client({ connectionString: adminUrl });
  try {
    await candidate.connect();
    admin = candidate;
    break;
  } catch {
    await candidate.end().catch(() => {});
    await new Promise((r) => setTimeout(r, 500));
  }
}
if (!admin) throw new Error("Local Postgres did not become ready");
try {
  for (const file of (await readdir("migrations/postgres"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await admin.query(await readFile(`migrations/postgres/${file}`, "utf8"));
  for (const [name, password, group] of [
    ["ledgerbot_app", config.appPassword, "ledgerbot_server"],
    ["ledgerbot_auth", config.authPassword, null],
  ]) {
    const exists = await admin.query(
      "SELECT 1 FROM pg_roles WHERE rolname=$1",
      [name],
    );
    if (!exists.rowCount) {
      await admin.query(
        `CREATE ROLE ${name} LOGIN NOSUPERUSER NOBYPASSRLS PASSWORD '${password}'`,
      );
    }
    if (group) await admin.query(`GRANT ${group} TO ${name}`);
  }
  await admin.query(
    "CREATE SCHEMA IF NOT EXISTS auth AUTHORIZATION ledgerbot_auth",
  );
  await admin.query("GRANT ALL ON SCHEMA auth TO ledgerbot_auth");
  await admin.query("ALTER ROLE ledgerbot_auth SET search_path TO auth");
} finally {
  await admin.end();
}
await ensureContainer("ledgerbot-stage1-mail", [
  "-p",
  "127.0.0.1:58025:8025",
  "axllent/mailpit:v1.27.8",
]);
const authEnv = {
  GOTRUE_API_HOST: "0.0.0.0",
  GOTRUE_API_PORT: "9999",
  API_EXTERNAL_URL: "http://127.0.0.1:55321/auth/v1",
  GOTRUE_SITE_URL: "http://127.0.0.1:3101",
  GOTRUE_URI_ALLOW_LIST:
    "http://127.0.0.1:3000/auth/callback,http://127.0.0.1:3101/auth/callback",
  GOTRUE_DB_DRIVER: "postgres",
  GOTRUE_DB_DATABASE_URL: `postgres://ledgerbot_auth:${config.authPassword}@ledgerbot-stage1-postgres:5432/ledgerbot`,
  GOTRUE_JWT_SECRET: config.jwtSecret,
  GOTRUE_JWT_EXP: "3600",
  GOTRUE_JWT_AUD: "authenticated",
  GOTRUE_JWT_DEFAULT_GROUP_NAME: "authenticated",
  GOTRUE_JWT_ADMIN_ROLES: "service_role",
  GOTRUE_DISABLE_SIGNUP: "false",
  GOTRUE_EXTERNAL_EMAIL_ENABLED: "true",
  GOTRUE_MAILER_AUTOCONFIRM: "false",
  GOTRUE_SMTP_ADMIN_EMAIL: "no-reply@example.test",
  GOTRUE_SMTP_HOST: "ledgerbot-stage1-mail",
  GOTRUE_SMTP_PORT: "1025",
  GOTRUE_SMTP_SENDER_NAME: "LedgerBot local tests",
  GOTRUE_MAILER_URLPATHS_CONFIRMATION: "/auth/v1/verify",
  GOTRUE_MAILER_URLPATHS_RECOVERY: "/auth/v1/verify",
  GOTRUE_RATE_LIMIT_EMAIL_SENT: "1000",
  GOTRUE_SMTP_MAX_FREQUENCY: "1s",
  GOTRUE_LOG_LEVEL: "warn",
};
await writeFile(
  directory + "/auth.env",
  Object.entries(authEnv)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n") + "\n",
  { mode: 0o600 },
);
await ensureContainer("ledgerbot-stage1-auth", [
  "--env-file",
  directory + "/auth.env",
  "supabase/gotrue:v2.177.0",
]);
await writeFile(
  directory + "/nginx.conf",
  "events {}\nhttp { access_log off; error_log /dev/null crit; server { listen 80; location /auth/v1/ { proxy_pass http://ledgerbot-stage1-auth:9999/; proxy_set_header Host $host; proxy_set_header X-Forwarded-Proto $scheme; } } }\n",
);
await ensureContainer("ledgerbot-stage1-proxy", [
  "-v",
  directory + "/nginx.conf:/etc/nginx/nginx.conf:ro",
  "-p",
  "127.0.0.1:55321:80",
  "nginx:1.28.0-alpine",
]);
await docker("exec", "ledgerbot-stage1-proxy", "nginx", "-s", "reload");
const runtime = {
  LEDGERBOT_BACKEND: "postgres",
  LEDGERBOT_POSTGRES_URL: `postgres://ledgerbot_app:${config.appPassword}@127.0.0.1:55432/ledgerbot`,
  LEDGERBOT_SUPABASE_URL: "http://127.0.0.1:55321",
  LEDGERBOT_SUPABASE_ANON_KEY: config.anonKey,
  LEDGERBOT_DRAFT_KEY: config.draftKey,
};
await writeFile(directory + "/runtime.json", JSON.stringify(runtime), {
  mode: 0o600,
});
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    const response = await fetch("http://127.0.0.1:55321/auth/v1/health");
    if (response.ok) {
      console.log(
        "Local PostgreSQL, Supabase Auth, and mail capture are ready. Credentials remain in ignored mode-0600 files.",
      );
      process.exit(0);
    }
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
throw new Error("Local authentication service did not become ready");
