// Disposable synthetic-only recovery drill. Never accepts a production database URL.
import {
  randomBytes,
  randomUUID,
  createCipheriv,
  createDecipheriv,
} from "node:crypto";
import { readFile, readdir, writeFile, mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import pg from "pg";
const config = JSON.parse(
  await readFile("data/local-services/config.json", "utf8"),
);
const suffix = randomBytes(6).toString("hex");
const source = `ledgerbot_recovery_source_${suffix}`,
  target = `ledgerbot_recovery_target_${suffix}`;
const connection = (database) =>
  new pg.Client({
    host: "127.0.0.1",
    port: 55432,
    user: "postgres",
    password: config.adminPassword,
    database,
  });
function docker(args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "docker",
      [
        "--host=unix:///var/run/docker.sock",
        "exec",
        "-i",
        "ledgerbot-stage1-postgres",
        ...args,
      ],
      { stdio: ["pipe", "pipe", "pipe"] },
    );
    const buffers = [];
    let size = 0;
    child.stdout.on("data", (chunk) => {
      size += chunk.length;
      if (size > 16 * 1024 * 1024) child.kill();
      else buffers.push(chunk);
    });
    // Do not forward SQL errors or dump contents into logs.
    child.stderr.resume();
    child.stdin.on("error", () => {});
    child.on("error", () =>
      reject(new Error("Local recovery tool could not start")),
    );
    child.on("close", (code) =>
      code === 0
        ? resolve(Buffer.concat(buffers))
        : reject(new Error("Local recovery tool failed")),
    );
    child.stdin.end(input);
  });
}
const admin = connection("ledgerbot");
await admin.connect();
const created = [];
let from, restored;
try {
  for (const name of [source, target]) {
    await admin.query(`CREATE DATABASE ${name}`);
    created.push(name);
  }
  from = connection(source);
  await from.connect();
  const migrations = (await readdir("migrations/postgres"))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (let repeat = 0; repeat < 2; repeat++)
    for (const file of migrations)
      await from.query(await readFile(`migrations/postgres/${file}`, "utf8"));
  const owner = randomUUID(),
    foreign = randomUUID(),
    account = randomUUID(),
    entry = randomUUID();
  await from.query(
    "INSERT INTO ledgerbot.users(id,email) VALUES($1,$2),($3,$4)",
    [owner, `${owner}@example.test`, foreign, `${foreign}@example.test`],
  );
  await from.query(
    "INSERT INTO ledgerbot.accounts(id,user_id,data) VALUES($1,$2,$3)",
    [
      account,
      owner,
      {
        id: account,
        name: "Synthetic recovery pocket",
        type: "checking",
        opening: 10000,
        asOf: "2026-01-01",
        currency: "USD",
      },
    ],
  );
  await from.query(
    "INSERT INTO ledgerbot.transactions(id,user_id,account_id,data) VALUES($1,$2,$3,$4)",
    [
      entry,
      owner,
      account,
      {
        id: entry,
        accountId: account,
        date: "2026-01-02",
        description: "Synthetic recovery expense",
        amount: -123,
        flow: "expense",
        status: "cleared",
        splits: [],
        transferId: null,
        reconciledAt: null,
      },
    ],
  );
  const dump = await docker([
    "pg_dump",
    "-U",
    "postgres",
    "-d",
    source,
    "--format=custom",
  ]);
  const key = randomBytes(32),
    nonce = randomBytes(12),
    aad = Buffer.from("ledgerbot-synthetic-recovery-v1");
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(dump), cipher.final()]);
  const tag = cipher.getAuthTag();
  await mkdir("data/recovery", { recursive: true, mode: 0o700 });
  const path = `data/recovery/${suffix}.json`;
  await writeFile(
    path,
    JSON.stringify({
      v: 1,
      nonce: nonce.toString("base64"),
      tag: tag.toString("base64"),
      ciphertext: ciphertext.toString("base64"),
    }),
    { mode: 0o600, flag: "wx" },
  );
  const stored = JSON.parse(await readFile(path, "utf8"));
  function decrypt(encrypted, candidate = key) {
    const decoder = createDecipheriv(
      "aes-256-gcm",
      candidate,
      Buffer.from(stored.nonce, "base64"),
    );
    decoder.setAAD(aad);
    decoder.setAuthTag(Buffer.from(stored.tag, "base64"));
    return Buffer.concat([decoder.update(encrypted), decoder.final()]);
  }
  assert.throws(() => decrypt(ciphertext, randomBytes(32)));
  const changed = Buffer.from(ciphertext);
  changed[0] ^= 1;
  assert.throws(() => decrypt(changed));
  const plaintext = decrypt(Buffer.from(stored.ciphertext, "base64"));
  assert.deepEqual(plaintext, dump);
  await docker(
    [
      "pg_restore",
      "-U",
      "postgres",
      "-d",
      target,
      "--exit-on-error",
      "--no-owner",
    ],
    plaintext,
  );
  restored = connection(target);
  await restored.connect();
  assert.equal(
    (await restored.query("SELECT count(*) FROM ledgerbot.schema_migrations"))
      .rows[0].count,
    String(migrations.length),
  );
  assert.equal(
    (
      await restored.query(
        "SELECT money_minor FROM ledgerbot.transactions WHERE id=$1",
        [entry],
      )
    ).rows[0].money_minor,
    "-123",
  );
  assert.equal(
    (
      await restored.query(
        "SELECT opening_minor+(SELECT sum(money_minor) FROM ledgerbot.transactions) AS balance FROM ledgerbot.accounts WHERE id=$1",
        [account],
      )
    ).rows[0].balance,
    "9877",
  );
  await restored.query("SET ROLE ledgerbot_reader");
  await restored.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    foreign,
  ]);
  assert.equal(
    (await restored.query("SELECT count(*) FROM ledgerbot.transactions"))
      .rows[0].count,
    "0",
  );
  await restored.query("SELECT set_config('request.jwt.claim.sub',$1,false)", [
    owner,
  ]);
  assert.equal(
    (await restored.query("SELECT count(*) FROM ledgerbot.transactions"))
      .rows[0].count,
    "1",
  );
  await assert.rejects(
    restored.query("DELETE FROM ledgerbot.transactions"),
    (error) => error.code === "42501",
  );
  console.log(
    "PASS: migrations twice; encrypted file round-trip; tamper and wrong-key rejection; restored exact cents and row counts; restored reader RLS and write denial. Synthetic databases only.",
  );
} catch {
  console.error(
    "Recovery drill failed; no SQL, credentials, or financial payload logged.",
  );
  process.exitCode = 1;
} finally {
  await from?.end();
  await restored?.end();
  // These names are generated above; no supplied/custom database can be dropped.
  for (const name of created)
    await admin.query(`DROP DATABASE ${name} WITH (FORCE)`);
  await admin.end();
}
