import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../src/lib/db";
import { authenticate, getSession, type Session } from "../src/lib/auth";
import { propose, review, confirm, discard, state } from "../src/lib/finance";
import {
  money,
  balance,
  budgetActual,
  forecast,
  type Operation,
} from "../src/lib/domain";
let db: DatabaseSync, user: Session;
beforeEach(() => {
  db = openDatabase(":memory:");
  user = getSession(
    db,
    authenticate(
      db,
      { email: "audit@example.test", password: "synthetic-audit-password" },
      true,
    ).token,
  );
});
afterEach(() => db.close());
async function post(op: Operation) {
  const p = await propose(db, user, op),
    r = await review(db, user, p.id);
  return await confirm(db, user, {
    proposalId: p.id,
    digest: p.digest,
    version: p.version,
    token: r.token,
    idempotencyKey: randomUUID(),
  });
}
async function account() {
  await post({
    kind: "account",
    name: "Fictional cash",
    type: "checking",
    opening: 10000,
    asOf: "2026-01-01",
  });
  return (await state(db, user.userId)).accounts[0];
}
describe("prelaunch audit regressions", () => {
  it("normalizes zero owed and empty budget actuals to positive zero", () => {
    const zero = {
      id: randomUUID(),
      name: "Zero card",
      type: "credit",
      opening: 0,
      asOf: "2026-01-01",
      currency: "USD",
    };
    expect(Object.is(balance(zero, []), -0)).toBe(false);
    expect(Object.is(budgetActual(randomUUID(), "2026-01", []), -0)).toBe(
      false,
    );
    expect(money(-0)).toBe("$0.00");
  });
  it("formats every cent at the safe integer boundary exactly", () => {
    expect(money(Number.MAX_SAFE_INTEGER)).toBe("$90,071,992,547,409.91");
    expect(money(-29)).toBe("-$0.29");
    expect(() => money(Number.MAX_SAFE_INTEGER + 1)).toThrow();
  });
  it("keeps budget identity stable when target is amended", async () => {
    await post({ kind: "category", name: "Fictional food" });
    const categoryId = (await state(db, user.userId)).categories[0].id;
    await post({ kind: "budget", categoryId, month: "2026-01", target: 1000 });
    const first = (await state(db, user.userId)).budgets[0];
    await post({ kind: "budget", categoryId, month: "2026-01", target: 2000 });
    const after = (await state(db, user.userId)).budgets[0];
    expect(after.id).toBe(first.id);
    expect(after.target).toBe(2000);
    expect(db.prepare("SELECT id FROM budgets").get()?.id).toBe(after.id);
  });
  it("does not allow a later reconciliation to be overwritten with an older date", async () => {
    const a = await account();
    await post({
      kind: "reconcile",
      accountId: a.id,
      date: "2026-01-05",
      statement: 10000,
    });
    await expect(
      (async () =>
        await propose(db, user, {
          kind: "reconcile",
          accountId: a.id,
          date: "2026-01-03",
          statement: 10000,
        }))(),
    ).rejects.toThrow(/later|reconcil/i);
  });
  it("recomputes the digest of stored operations before commit", async () => {
    const p = await propose(db, user, {
        kind: "category",
        name: "Reviewed category",
      }),
      r = await review(db, user, p.id);
    db.prepare("UPDATE proposals SET data=? WHERE id=?").run(
      JSON.stringify({
        ...p,
        operation: { kind: "category", name: "Unreviewed change" },
      }),
      p.id,
    );
    await expect(
      (async () =>
        await confirm(db, user, {
          proposalId: p.id,
          digest: p.digest,
          version: p.version,
          token: r.token,
          idempotencyKey: randomUUID(),
        }))(),
    ).rejects.toThrow(/integrity|digest|match/i);
    expect((await state(db, user.userId)).categories).toHaveLength(0);
  });
  it("rolls back discard if challenge invalidation fails", async () => {
    const p = await propose(db, user, { kind: "category", name: "Discard me" });
    await review(db, user, p.id);
    db.exec(
      "CREATE TRIGGER fail_invalidation BEFORE UPDATE ON challenges BEGIN SELECT RAISE(ABORT,'synthetic failure'); END;",
    );
    await expect(
      (async () => await discard(db, user, p.id))(),
    ).rejects.toThrow();
    expect((await state(db, user.userId)).proposals[0].status).toBe(
      "awaiting_review",
    );
  });
  it("checks recurring-income coverage for cash accounts rather than liabilities", async () => {
    const a = await account();
    const s = await state(db, user.userId);
    const liability = { ...a, id: randomUUID(), type: "credit" };
    const f = forecast(
      {
        ...s,
        accounts: [a, liability],
        recurrences: [
          {
            id: randomUUID(),
            accountId: liability.id,
            name: "Liability-only adjustment",
            amount: 1000,
            start: "2026-01-02",
            cadence: "weekly",
            clearingDays: 0,
          },
        ],
      },
      "2026-01-01",
    );
    expect(f.warnings).toContain("No recurring income is configured.");
  });
  it("rejects invalid or unbounded forecast horizons", async () => {
    const s = await state(db, user.userId);
    for (const horizon of [0, -1, 1.5, 367, Infinity])
      expect(() => forecast(s, "2026-01-01", horizon)).toThrow();
  });
  it("does not issue a review challenge for a corrupted stored proposal", async () => {
    const p = await propose(db, user, { kind: "category", name: "Original" });
    db.prepare("UPDATE proposals SET data=? WHERE id=?").run(
      JSON.stringify({ ...p, before: { unexpected: "changed" } }),
      p.id,
    );
    await expect((async () => await review(db, user, p.id))()).rejects.toThrow(
      /integrity/i,
    );
    expect(db.prepare("SELECT count(*) n FROM challenges").get()?.n).toBe(0);
  });
  it("keeps monthly anchors and clearing delay when jumping past old history", async () => {
    const a = await account(),
      s = await state(db, user.userId);
    const f = forecast(
      {
        ...s,
        recurrences: [
          {
            id: randomUUID(),
            accountId: a.id,
            name: "Old monthly",
            amount: -100,
            start: "2000-01-31",
            cadence: "monthly",
            clearingDays: 2,
          },
        ],
      },
      "2026-01-31",
      90,
    );
    expect(f.events.map((e) => e.date)).toEqual([
      "2026-02-02",
      "2026-03-02",
      "2026-04-02",
    ]);
    expect(f.days.at(-1)?.amount).toBe(9700);
  });
});
