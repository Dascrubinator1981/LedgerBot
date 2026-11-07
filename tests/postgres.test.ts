import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { Client } from "pg";
import {
  withTenantDatabase,
  closePostgres,
  type PostgresDatabase,
} from "../src/lib/postgres";
import { propose, review, confirm, state, discard } from "../src/lib/finance";
import { hash, secret, type Session } from "../src/lib/auth";
import { balance, budgetActual, type Operation } from "../src/lib/domain";
import { listSessions, revokeSession } from "../src/lib/session-management";
const enabled = !!process.env.LEDGERBOT_TEST_ADMIN_URL;
describe.skipIf(!enabled)(
  "real PostgreSQL identity, policies and atomic finance",
  () => {
    let admin: Client;
    let alice: Session, bob: Session;
    beforeAll(async () => {
      admin = new Client({
        connectionString: process.env.LEDGERBOT_TEST_ADMIN_URL,
      });
      await admin.connect();
      for (let repeat = 0; repeat < 2; repeat++)
        for (const file of (await readdir("migrations/postgres"))
          .filter((f) => f.endsWith(".sql"))
          .sort())
          await admin.query(
            await readFile(`migrations/postgres/${file}`, "utf8"),
          );
      alice = await identity();
      bob = await identity();
    });
    afterAll(async () => {
      await closePostgres();
      await admin?.end();
    });
    async function identity() {
      const userId = randomUUID(),
        token = secret(),
        csrf = secret();
      await withTenantDatabase(userId, async (db) => {
        await db
          .prepare("INSERT INTO users(id,email,password) VALUES(?,?,?)")
          .run(userId, `${userId}@example.test`, null);
        await db
          .prepare(
            "INSERT INTO sessions(hash,user_id,expires,csrf,principal) VALUES(?,?,?,?,?)",
          )
          .run(hash(token), userId, Date.now() + 3600000, csrf, "human");
      });
      return {
        userId,
        sessionHash: hash(token),
        csrf,
        principal: "human" as const,
      };
    }
    const scope = <T>(s: Session, work: (db: PostgresDatabase) => Promise<T>) =>
      withTenantDatabase(s.userId, work);
    async function post(op: Operation, s = alice) {
      return scope(s, async (db) => {
        const p = await propose(db, s, op),
          r = await review(db, s, p.id);
        return confirm(db, s, {
          proposalId: p.id,
          digest: p.digest,
          version: p.version,
          token: r.token,
          idempotencyKey: randomUUID(),
        });
      });
    }
    it("starts empty and runs as a non-superuser without RLS bypass", async () => {
      await scope(alice, async (db) => {
        const role = await db.client.query(
          "SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
        );
        expect(role.rows[0]).toEqual({ rolsuper: false, rolbypassrls: false });
        expect((await state(db, alice.userId)).accounts).toEqual([]);
      });
    });
    it("isolates session revocation and its append-only security events under real RLS", async () => {
      const owner = await identity(),
        token = secret(),
        s: Session = { ...owner, sessionHash: hash(token) };
      await scope(owner, async (db) => {
        await db
          .prepare(
            "INSERT INTO sessions(hash,user_id,expires,csrf,principal) VALUES(?,?,?,?,?)",
          )
          .run(
            s.sessionHash,
            owner.userId,
            Date.now() + 3600000,
            s.csrf,
            "human",
          );
      });
      const sessions = await scope(owner, (db) => listSessions(db, owner));
      const target = sessions.sessions.find((item) => !item.current)!;
      await scope(owner, (db) => revokeSession(db, owner, { id: target.id }));
      await expect(scope(s, (db) => listSessions(db, s))).rejects.toThrow(
        /Sign in/,
      );
      expect(
        (await scope(owner, (db) => listSessions(db, owner))).sessions,
      ).toHaveLength(1);
      expect(
        (
          await scope(bob, (db) =>
            db.client.query("SELECT id FROM security_events WHERE user_id=$1", [
              owner.userId,
            ]),
          )
        ).rows,
      ).toEqual([]);
      await expect(
        scope(owner, (db) => db.client.query("DELETE FROM security_events")),
      ).rejects.toMatchObject({ code: "42501" });
    });
    it("preserves the old card/payment/category invariants on PostgreSQL", async () => {
      await post({
        kind: "account",
        name: "Fictional cash",
        type: "checking",
        opening: 10000,
        asOf: "2026-01-01",
      });
      await post({
        kind: "account",
        name: "Fictional card",
        type: "credit",
        opening: 5000,
        asOf: "2026-01-01",
      });
      await post({ kind: "category", name: "Fictional food" });
      const initial = await scope(alice, (db) => state(db, alice.userId));
      const cash = initial.accounts.find((a) => a.type === "checking")!,
        card = initial.accounts.find((a) => a.type === "credit")!,
        categoryId = initial.categories[0].id;
      await post({
        kind: "transaction",
        accountId: card.id,
        date: "2026-01-02",
        description: "Fictional food",
        amount: -2000,
        status: "cleared",
        splits: [{ categoryId, amount: -2000 }],
      });
      await post({
        kind: "transfer",
        fromId: cash.id,
        toId: card.id,
        amount: 3000,
        date: "2026-01-03",
        description: "Fictional payment",
        status: "cleared",
      });
      const s = await scope(alice, (db) => state(db, alice.userId));
      expect(balance(cash, s.transactions)).toBe(7000);
      expect(balance(card, s.transactions)).toBe(4000);
      expect(budgetActual(categoryId, "2026-01", s.transactions)).toBe(2000);
    });
    it("denies cross-owner reads and nested writes through actual policies and foreign keys", async () => {
      const own = await scope(alice, (db) => state(db, alice.userId));
      expect(own.accounts.length).toBeGreaterThan(0);
      await scope(bob, async (db) => {
        const rows = await db
          .prepare("SELECT data FROM accounts WHERE id=?")
          .all(own.accounts[0].id);
        expect(rows).toEqual([]);
        await expect(
          propose(db, bob, {
            kind: "transaction",
            accountId: own.accounts[0].id,
            date: "2026-01-02",
            description: "Forged",
            amount: -100,
            status: "cleared",
            splits: [],
          }),
        ).rejects.toThrow();
        const foreignId = randomUUID();
        await db.client.query("SAVEPOINT negative_check");
        await expect(
          db.client.query(
            "INSERT INTO ledgerbot.accounts(id,user_id,data) VALUES($1,$2,$3)",
            [foreignId, alice.userId, { ...own.accounts[0], id: foreignId }],
          ),
        ).rejects.toMatchObject({ code: "42501" });
        await db.client.query("ROLLBACK TO SAVEPOINT negative_check");
        const transactionId = randomUUID();
        await expect(
          db.client.query(
            "INSERT INTO ledgerbot.transactions(id,user_id,account_id,transfer_id,data) VALUES($1,$2,$3,NULL,$4)",
            [
              transactionId,
              bob.userId,
              own.accounts[0].id,
              {
                id: transactionId,
                accountId: own.accounts[0].id,
                date: "2026-01-02",
                description: "Synthetic forged reference",
                amount: -100,
                status: "cleared",
                splits: [],
                transferId: null,
                reconciledAt: null,
              },
            ],
          ),
        ).rejects.toMatchObject({ code: "23503" });
        await db.client.query("ROLLBACK TO SAVEPOINT negative_check");
        await db.client.query("RELEASE SAVEPOINT negative_check");
      });
    });
    it("prevents the reader role from bypassing the review gateway", async () => {
      const reader = new Client({
        connectionString: process.env.LEDGERBOT_TEST_ADMIN_URL,
      });
      await reader.connect();
      try {
        await reader.query("SET ROLE ledgerbot_reader");
        await reader.query(
          "SELECT set_config('request.jwt.claim.sub',$1,false)",
          [alice.userId],
        );
        expect(
          (await reader.query("SELECT current_user")).rows[0].current_user,
        ).toBe("ledgerbot_reader");
        expect(
          (await reader.query("SELECT * FROM ledgerbot.accounts")).rows.length,
        ).toBeGreaterThan(0);
        await expect(
          reader.query(
            "INSERT INTO ledgerbot.transfers(id,user_id) VALUES($1,$2)",
            [randomUUID(), alice.userId],
          ),
        ).rejects.toThrow(/permission/);
      } finally {
        await reader.end();
      }
    });
    it("rejects half transfers and missing money at the database boundary", async () => {
      const initial = await scope(alice, (db) => state(db, alice.userId));
      const accountId = initial.accounts[0].id;
      await expect(
        scope(alice, async (db) => {
          const pair = randomUUID(),
            id = randomUUID();
          await db
            .prepare("INSERT INTO transfers VALUES(?,?)")
            .run(pair, alice.userId);
          await db
            .prepare(
              "INSERT INTO transactions(id,user_id,account_id,transfer_id,data) VALUES(?,?,?,?,?)",
            )
            .run(
              id,
              alice.userId,
              accountId,
              pair,
              JSON.stringify({
                id,
                accountId,
                transferId: pair,
                amount: -100,
                status: "cleared",
                date: "2026-01-04",
                description: "Synthetic incomplete pair",
                splits: [],
                reconciledAt: null,
              }),
            );
        }),
      ).rejects.toThrow(/Invalid transfer pair/);
      await expect(
        scope(alice, async (db) => {
          const id = randomUUID();
          await db
            .prepare(
              "INSERT INTO transactions(id,user_id,account_id,transfer_id,data) VALUES(?,?,?,?,?)",
            )
            .run(
              id,
              alice.userId,
              accountId,
              null,
              JSON.stringify({
                id,
                accountId,
                transferId: null,
                amount: null,
                status: "cleared",
                date: "2026-01-04",
                description: "Synthetic missing money",
                splits: [],
                reconciledAt: null,
              }),
            );
        }),
      ).rejects.toMatchObject({ code: "23502" });
      expect(
        (await scope(alice, (db) => state(db, alice.userId))).transactions,
      ).toHaveLength(initial.transactions.length);
    });
    it("stores encrypted drafts and binds replay receipts to the real tenant", async () => {
      await scope(alice, async (db) => {
        const p = await propose(db, alice, {
          kind: "category",
          name: "Fictional encrypted category",
        });
        const raw = await db.client.query(
          "SELECT data FROM ledgerbot.proposals WHERE id=$1",
          [p.id],
        );
        expect(raw.rows[0].data).not.toContain("Fictional encrypted");
        const r = await review(db, alice, p.id),
          input = {
            proposalId: p.id,
            digest: p.digest,
            version: p.version,
            token: r.token,
            idempotencyKey: randomUUID(),
          };
        expect(await confirm(db, alice, input)).toEqual(
          await confirm(db, alice, input),
        );
      });
    });
    it("serializes concurrent confirmation and never duplicates records", async () => {
      const subject = await identity();
      const prepared = await scope(subject, async (db) => {
        const p = await propose(db, subject, {
            kind: "account",
            name: "Concurrent account",
            type: "cash",
            opening: 0,
            asOf: "2026-01-01",
          }),
          r = await review(db, subject, p.id);
        return {
          proposalId: p.id,
          digest: p.digest,
          version: p.version,
          token: r.token,
          idempotencyKey: randomUUID(),
        };
      });
      const results = await Promise.allSettled([
        scope(subject, (db) => confirm(db, subject, prepared)),
        scope(subject, (db) => confirm(db, subject, prepared)),
      ]);
      expect(results.some((r) => r.status === "fulfilled")).toBe(true);
      const s = await scope(subject, (db) => state(db, subject.userId));
      expect(s.accounts).toHaveLength(1);
      expect(
        await scope(subject, (db) => confirm(db, subject, prepared)),
      ).toHaveProperty("proposalId", prepared.proposalId);
    });
    it("makes concurrent discard/approval resolve to one consistent result", async () => {
      const subject = await identity();
      const input = await scope(subject, async (db) => {
        const p = await propose(db, subject, {
            kind: "category",
            name: "Race category",
          }),
          r = await review(db, subject, p.id);
        return {
          proposalId: p.id,
          digest: p.digest,
          version: p.version,
          token: r.token,
          idempotencyKey: randomUUID(),
        };
      });
      await Promise.allSettled([
        scope(subject, (db) => confirm(db, subject, input)),
        scope(subject, (db) => discard(db, subject, input.proposalId)),
      ]);
      const s = await scope(subject, (db) => state(db, subject.userId));
      expect(s.proposals[0].status).toBe(
        s.categories.length ? "approved" : "rejected",
      );
      expect(s.categories.length).toBeLessThanOrEqual(1);
    });
  },
);
