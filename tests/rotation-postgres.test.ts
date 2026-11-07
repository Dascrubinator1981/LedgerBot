import {
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  it,
  expect,
  vi,
} from "vitest";
import { Client } from "pg";
import { randomBytes, randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { rotateDrafts } from "../src/lib/rotate-drafts";
import { encryptDraft, decryptDraft } from "../src/lib/draft-crypto";
let admin: Client, db: Client;
const database = `ledgerbot_rotation_${randomBytes(6).toString("hex")}`,
  owner = randomUUID(),
  old = randomBytes(32).toString("hex"),
  next = randomBytes(32).toString("hex");
const first = "00000000-0000-0000-0000-000000000000",
  second = "00000000-0000-4000-8000-000000000002",
  bad = "ffffffff-ffff-4fff-8fff-ffffffffffff";
beforeAll(async () => {
  const url = new URL(process.env.LEDGERBOT_TEST_ADMIN_URL!);
  if (!["127.0.0.1", "localhost"].includes(url.hostname))
    throw new Error("Disposable local database required");
  admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  await admin.query(`CREATE DATABASE ${database}`);
  url.pathname = `/${database}`;
  db = new Client({ connectionString: url.toString() });
  await db.connect();
  for (const file of (await readdir("migrations/postgres"))
    .filter((f) => f.endsWith(".sql"))
    .sort())
    await db.query(await readFile(`migrations/postgres/${file}`, "utf8"));
  await db.query("INSERT INTO ledgerbot.users(id,email) VALUES($1,$2)", [
    owner,
    `${owner}@example.test`,
  ]);
});
afterAll(async () => {
  await db?.end();
  if (admin) {
    await admin.query(`DROP DATABASE ${database} WITH (FORCE)`);
    await admin.end();
  }
});
beforeEach(async () => {
  vi.stubEnv("LEDGERBOT_DRAFT_KEY", old);
  vi.stubEnv("LEDGERBOT_DRAFT_KEYS", "");
  await db.query("DELETE FROM ledgerbot.proposals");
  for (const id of [first, second])
    await db.query(
      "INSERT INTO ledgerbot.proposals(id,user_id,data) VALUES($1,$2,$3)",
      [
        id,
        owner,
        encryptDraft(
          JSON.stringify({ id, note: "Synthetic rotation fixture" }),
          owner,
        ),
      ],
    );
  vi.stubEnv("LEDGERBOT_DRAFT_KEYS", JSON.stringify({ next }));
  vi.stubEnv("LEDGERBOT_DRAFT_ACTIVE_KEY_ID", "next");
});
afterEach(() => vi.unstubAllEnvs());
const snapshot = async () =>
  (await db.query("SELECT data FROM ledgerbot.proposals ORDER BY id")).rows.map(
    (r) => r.data,
  );
it("dry-runs without writes, rotates in small batches and recovers with only the new key", async () => {
  const original = await snapshot();
  expect(await rotateDrafts(db, false, 1)).toEqual({
    checked: 2,
    wouldChange: 2,
    applied: false,
  });
  expect(await snapshot()).toEqual(original);
  expect(await rotateDrafts(db, true, 1)).toEqual({
    checked: 2,
    changed: 2,
    applied: true,
  });
  vi.stubEnv("LEDGERBOT_DRAFT_KEY", "");
  for (const id of [first, second]) {
    const row = (
      await db.query("SELECT data FROM ledgerbot.proposals WHERE id=$1", [id])
    ).rows[0];
    expect(JSON.parse(row.data).kid).toBe("next");
    expect(JSON.parse(decryptDraft(row.data, owner, id)).note).toBe(
      "Synthetic rotation fixture",
    );
  }
  expect(await rotateDrafts(db, true)).toEqual({
    checked: 2,
    changed: 0,
    applied: true,
  });
  expect(
    (await db.query("SELECT count(*) FROM ledgerbot.transactions")).rows[0]
      .count,
  ).toBe("0");
});
it("rolls back every prior envelope update if any later draft is corrupt", async () => {
  await db.query(
    "INSERT INTO ledgerbot.proposals(id,user_id,data) VALUES($1,$2,$3)",
    [bad, owner, "not-a-valid-envelope"],
  );
  const original = await snapshot();
  await expect(rotateDrafts(db, true, 1)).rejects.toThrow();
  expect(await snapshot()).toEqual(original);
});
it("rejects incomplete recovery keys without changing stored ciphertext", async () => {
  const original = await snapshot();
  vi.stubEnv("LEDGERBOT_DRAFT_KEY", "");
  await expect(rotateDrafts(db, false)).rejects.toThrow(/unavailable/);
  expect(await snapshot()).toEqual(original);
});
it("rejects the ordinary server role instead of reporting an RLS-filtered partial rotation", async () => {
  const original = await snapshot();
  await db.query("SET ROLE ledgerbot_server");
  try {
    await expect(rotateDrafts(db, true)).rejects.toThrow(/maintenance role/);
  } finally {
    await db.query("RESET ROLE");
  }
  expect(await snapshot()).toEqual(original);
});
