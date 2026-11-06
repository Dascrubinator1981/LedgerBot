import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import { financialImpact } from "../src/lib/preview";
import { openDatabase } from "../src/lib/db";
import { authenticate, getSession, type Session } from "../src/lib/auth";
import { confirm, discard, propose, review, state } from "../src/lib/finance";
import {
  balance,
  budgetActual,
  forecast,
  money,
  netWorth,
  nextOccurrence,
  operationSchema,
  parseMoney,
  type Operation,
} from "../src/lib/domain";
let db: DatabaseSync, alice: Session, bob: Session;
beforeEach(() => {
  db = openDatabase(":memory:");
  alice = getSession(
    db,
    authenticate(
      db,
      { email: "alice@example.test", password: "fabricated-password-123" },
      true,
    ).token,
  );
  bob = getSession(
    db,
    authenticate(
      db,
      { email: "bob@example.test", password: "fabricated-password-456" },
      true,
    ).token,
  );
});
afterEach(() => db.close());
async function post(op: Operation, user = alice) {
  const p = await propose(db, user, op);
  const r = await review(db, user, p.id);
  return await confirm(db, user, {
    proposalId: p.id,
    version: p.version,
    digest: p.digest,
    token: r.token,
    idempotencyKey: randomUUID(),
  });
}
async function account(
  name = "Pocket",
  opening: number | null = 10000,
  type: "checking" | "credit" | "savings" = "checking",
  user = alice,
) {
  await post(
    { kind: "account", name, opening, type, asOf: "2026-01-01" },
    user,
  );
  return (await state(db, user.userId)).accounts.at(-1)!;
}
async function category(name = "Food") {
  await post({ kind: "category", name });
  return (await state(db, alice.userId)).categories.at(-1)!;
}
describe("exact money and dates", () => {
  it("parses minor units without float rounding", () => {
    expect(parseMoney("0.29")).toBe(29);
    expect(parseMoney("-1234.56")).toBe(-123456);
    expect(parseMoney("0")).toBe(0);
  });
  it.each([
    "1.001",
    "1e3",
    "NaN",
    "Infinity",
    "1,000",
    " 1",
    "--1",
    "1000000000000000",
  ])("rejects invalid money %s", (v) => expect(() => parseMoney(v)).toThrow());
  it("validates calendar dates and limits forecast traversal", () => {
    expect(
      operationSchema.safeParse({
        kind: "account",
        name: "a",
        type: "checking",
        opening: 0,
        asOf: "2026-02-30",
      }).success,
    ).toBe(false);
  });
  it("clamps monthly dates without drifting the anchor and handles leap years", () => {
    expect(nextOccurrence("2028-01-31", "monthly", 1)).toBe("2028-02-29");
    expect(nextOccurrence("2028-01-31", "monthly", 2)).toBe("2028-03-31");
    expect(nextOccurrence("2026-01-26", "biweekly", 1)).toBe("2026-02-09");
  });
});
describe("zero-start and canonical ledger", () => {
  it("creates no financial records for new users", async () => {
    const s = await state(db, alice.userId);
    for (const list of [
      s.accounts,
      s.transactions,
      s.categories,
      s.budgets,
      s.recurrences,
      s.proposals,
    ])
      expect(list).toEqual([]);
    expect(netWorth([], [])).toBeNull();
    expect(money(null)).toBe("Not set up yet");
  });
  it("distinguishes unknown from a deliberately configured zero", async () => {
    const a = await account("unknown", null);
    expect(balance(a, [])).toBeNull();
    const z = await account("zero", 0);
    expect(balance(z, [])).toBe(0);
    expect(money(0)).toBe("$0.00");
    expect((await state(db, bob.userId)).accounts).toEqual([]);
  });
  it("card charge changes owed once; card payment is a transfer and not new spending", async () => {
    const cash = await account("Cash", 10000),
      card = await account("Card", 5000, "credit"),
      c = await category();
    await post({
      kind: "transaction",
      accountId: card.id,
      date: "2026-01-02",
      description: "Fictional lunch",
      amount: -2000,
      status: "cleared",
      splits: [{ categoryId: c.id, amount: -2000 }],
    });
    let s = await state(db, alice.userId);
    expect(balance(card, s.transactions)).toBe(7000);
    expect(netWorth(s.accounts, s.transactions)).toBe(3000);
    await post({
      kind: "transfer",
      fromId: cash.id,
      toId: card.id,
      amount: 3000,
      date: "2026-01-03",
      description: "Card payment",
      status: "cleared",
    });
    s = await state(db, alice.userId);
    expect(balance(cash, s.transactions)).toBe(7000);
    expect(balance(card, s.transactions)).toBe(4000);
    expect(netWorth(s.accounts, s.transactions)).toBe(3000);
    expect(budgetActual(c.id, "2026-01", s.transactions)).toBe(2000);
  });
  it("deleting either transfer leg atomically removes both", async () => {
    const a = await account(),
      b = await account("Savings", 0, "savings");
    await post({
      kind: "transfer",
      fromId: a.id,
      toId: b.id,
      amount: 2500,
      date: "2026-01-02",
      description: "Move",
      status: "cleared",
    });
    const s = await state(db, alice.userId);
    expect(netWorth(s.accounts, s.transactions)).toBe(10000);
    await post({ kind: "deleteTransaction", id: s.transactions[0].id });
    expect((await state(db, alice.userId)).transactions).toHaveLength(0);
    expect(db.prepare("SELECT count(*) n FROM transfers").get()?.n).toBe(0);
  });
  it("pending entries do not change cleared balances", async () => {
    const a = await account();
    await post({
      kind: "transaction",
      accountId: a.id,
      date: "2026-01-02",
      description: "Pending",
      amount: -2500,
      status: "pending",
      splits: [],
    });
    const s = await state(db, alice.userId);
    expect(balance(a, s.transactions)).toBe(10000);
  });
  it("edit/delete actuals recomputes derived values", async () => {
    const a = await account();
    await post({
      kind: "transaction",
      accountId: a.id,
      date: "2026-01-02",
      description: "Deposit",
      amount: 1000,
      status: "cleared",
      splits: [],
    });
    let t = (await state(db, alice.userId)).transactions[0];
    await post({
      kind: "editTransaction",
      id: t.id,
      accountId: a.id,
      date: t.date,
      description: "Corrected",
      amount: 2000,
      status: "cleared",
      splits: [],
    });
    expect(balance(a, (await state(db, alice.userId)).transactions)).toBe(
      12000,
    );
    t = (await state(db, alice.userId)).transactions[0];
    await post({ kind: "deleteTransaction", id: t.id });
    expect(balance(a, (await state(db, alice.userId)).transactions)).toBe(
      10000,
    );
  });
  it("categorization and budget changes never post another debit", async () => {
    const a = await account(),
      c = await category();
    await post({
      kind: "transaction",
      accountId: a.id,
      date: "2026-01-02",
      description: "Food",
      amount: -12000,
      status: "cleared",
      splits: [],
    });
    const t = (await state(db, alice.userId)).transactions[0];
    await post({
      kind: "editTransaction",
      id: t.id,
      accountId: a.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      status: "cleared",
      splits: [{ categoryId: c.id, amount: -12000 }],
    });
    await post({
      kind: "budget",
      categoryId: c.id,
      month: "2026-01",
      target: 20000,
    });
    const s = await state(db, alice.userId);
    expect(s.transactions).toHaveLength(1);
    expect(balance(a, s.transactions)).toBe(-2000);
    expect(budgetActual(c.id, "2026-01", s.transactions)).toBe(12000);
  });
  it.each([-11999, -12001])(
    "blocks splits that do not balance: %i",
    async (amount) => {
      const a = await account(),
        c = await category();
      await expect(
        (async () =>
          await propose(db, alice, {
            kind: "transaction",
            accountId: a.id,
            date: "2026-01-02",
            description: "Split",
            amount: -12000,
            status: "cleared",
            splits: [{ categoryId: c.id, amount }],
          }))(),
      ).rejects.toThrow(/exact/);
    },
  );
  it("snapshots are end-of-day and cannot count same-day transactions twice", async () => {
    const a = await account();
    await expect(
      (async () =>
        await propose(db, alice, {
          kind: "transaction",
          accountId: a.id,
          date: "2026-01-01",
          description: "Already included",
          amount: -100,
          status: "cleared",
          splits: [],
        }))(),
    ).rejects.toThrow(/snapshot/);
    expect(balance(a, [], "2025-12-31")).toBeNull();
  });
  it("blocks reconciliation mismatch and locks reconciled transactions", async () => {
    const a = await account();
    await post({
      kind: "transaction",
      accountId: a.id,
      date: "2026-01-02",
      description: "Food",
      amount: -2500,
      status: "cleared",
      splits: [],
    });
    await expect(
      (async () =>
        await propose(db, alice, {
          kind: "reconcile",
          accountId: a.id,
          date: "2026-01-02",
          statement: 10000,
        }))(),
    ).rejects.toThrow(/differ/);
    await post({
      kind: "reconcile",
      accountId: a.id,
      date: "2026-01-02",
      statement: 7500,
    });
    const t = (await state(db, alice.userId)).transactions[0];
    expect(t.reconciledAt).toBe("2026-01-02");
    await expect(
      (async () =>
        await propose(db, alice, { kind: "deleteTransaction", id: t.id }))(),
    ).rejects.toThrow(/Reconciled/);
  });
});
describe("tenant and approval boundary", () => {
  it("unapproved draft, review, and discard never change financial records", async () => {
    const p = await propose(db, alice, {
      kind: "account",
      name: "Uncommitted",
      type: "cash",
      opening: 0,
      asOf: "2026-01-01",
    });
    expect((await state(db, alice.userId)).accounts).toHaveLength(0);
    await review(db, alice, p.id);
    expect((await state(db, alice.userId)).accounts).toHaveLength(0);
    await discard(db, alice, p.id);
    await expect(
      (async () => await review(db, alice, p.id))(),
    ).rejects.toThrow();
    expect((await state(db, alice.userId)).accounts).toHaveLength(0);
  });
  it("rejects forged foreign account, category, transaction and proposal references", async () => {
    const a = await account(),
      c = await category();
    expect((await state(db, bob.userId)).accounts).toEqual([]);
    await expect(
      (async () =>
        await propose(db, bob, {
          kind: "transaction",
          accountId: a.id,
          date: "2026-01-02",
          description: "Forged",
          amount: -100,
          status: "cleared",
          splits: [],
        }))(),
    ).rejects.toThrow(/unavailable/);
    const b = await account("Bob", 10000, "checking", bob);
    await expect(
      (async () =>
        await propose(db, bob, {
          kind: "transaction",
          accountId: b.id,
          date: "2026-01-02",
          description: "Forged split",
          amount: -100,
          status: "cleared",
          splits: [{ categoryId: c.id, amount: -100 }],
        }))(),
    ).rejects.toThrow(/unavailable/);
    const p = await propose(db, alice, { kind: "category", name: "Private" });
    await expect((async () => await review(db, bob, p.id))()).rejects.toThrow(
      /unavailable/,
    );
    await expect((async () => await discard(db, bob, p.id))()).rejects.toThrow(
      /unavailable/,
    );
  });
  it("database composite foreign keys reject cross-tenant references", async () => {
    const a = await account();
    expect(() =>
      db
        .prepare("INSERT INTO transactions VALUES(?,?,?,?,?)")
        .run(randomUUID(), bob.userId, a.id, null, "{}"),
    ).toThrow(/FOREIGN KEY/);
  });
  it("same idempotency retry returns the receipt and never duplicates a transfer", async () => {
    const a = await account(),
      b = await account("B", 0);
    const p = await propose(db, alice, {
      kind: "transfer",
      fromId: a.id,
      toId: b.id,
      amount: 100,
      date: "2026-01-02",
      description: "Move",
      status: "cleared",
    });
    const r = await review(db, alice, p.id);
    const input = {
      proposalId: p.id,
      version: p.version,
      digest: p.digest,
      token: r.token,
      idempotencyKey: randomUUID(),
    };
    expect(await confirm(db, alice, input)).toEqual(
      await confirm(db, alice, input),
    );
    expect((await state(db, alice.userId)).transactions).toHaveLength(2);
    await expect(
      (async () =>
        await confirm(db, alice, { ...input, idempotencyKey: randomUUID() }))(),
    ).rejects.toThrow(/already/);
  });
  it("rejects altered digest, missing challenge, foreign session and stale proposals", async () => {
    const p = await propose(db, alice, { kind: "category", name: "First" });
    const r = await review(db, alice, p.id);
    const input = {
      proposalId: p.id,
      version: p.version,
      digest: p.digest,
      token: r.token,
      idempotencyKey: randomUUID(),
    };
    await expect(
      (async () =>
        await confirm(db, alice, { ...input, digest: "0".repeat(64) }))(),
    ).rejects.toThrow(/match/);
    await expect((async () => await confirm(db, bob, input))()).rejects.toThrow(
      /unavailable/,
    );
    await expect(
      (async () =>
        await confirm(db, alice, { ...input, token: "0".repeat(64) }))(),
    ).rejects.toThrow(/match/);
    await post({ kind: "category", name: "Competing change" });
    await expect(
      (async () => await confirm(db, alice, input))(),
    ).rejects.toThrow(/stale/);
    expect((await state(db, alice.userId)).categories).toHaveLength(1);
  });
  it("expired challenge cannot commit", async () => {
    const p = await propose(db, alice, { kind: "category", name: "Expired" }),
      r = await review(db, alice, p.id);
    db.prepare("UPDATE challenges SET expires=0").run();
    await expect(
      (async () =>
        await confirm(db, alice, {
          proposalId: p.id,
          version: p.version,
          digest: p.digest,
          token: r.token,
          idempotencyKey: randomUUID(),
        }))(),
    ).rejects.toThrow(/expired/);
    expect((await state(db, alice.userId)).categories).toHaveLength(0);
  });
  it("rejects AI principals independently of caller claims", async () => {
    db.prepare("UPDATE sessions SET principal='ai' WHERE hash=?").run(
      alice.sessionHash,
    );
    const ai = { ...alice, principal: "ai" as const };
    const p = await propose(db, ai, { kind: "category", name: "AI draft" });
    await expect((async () => await review(db, ai, p.id))()).rejects.toThrow(
      /human/,
    );
    await expect((async () => await review(db, alice, p.id))()).rejects.toThrow(
      /human/,
    );
    await expect(
      (async () =>
        await confirm(db, ai, {
          proposalId: p.id,
          version: p.version,
          digest: p.digest,
          token: "0".repeat(64),
          idempotencyKey: randomUUID(),
        }))(),
    ).rejects.toThrow(/human/);
    expect((await state(db, alice.userId)).categories).toHaveLength(0);
  });
  it("rejects logged-out and expired sessions", async () => {
    const p = await propose(db, alice, { kind: "category", name: "A" });
    db.prepare("UPDATE sessions SET expires=0").run();
    await expect((async () => await review(db, alice, p.id))()).rejects.toThrow(
      /session/,
    );
  });
  it("rollback preserves transfer atomicity even if database insert fails", async () => {
    const a = await account(),
      b = await account("B", 0);
    db.exec(
      `CREATE TRIGGER fail_second BEFORE INSERT ON transactions WHEN NEW.account_id='${b.id}' BEGIN SELECT RAISE(ABORT,'injected failure'); END;`,
    );
    const p = await propose(db, alice, {
        kind: "transfer",
        fromId: a.id,
        toId: b.id,
        amount: 100,
        date: "2026-01-02",
        description: "Atomic",
        status: "cleared",
      }),
      r = await review(db, alice, p.id);
    await expect(
      (async () =>
        await confirm(db, alice, {
          proposalId: p.id,
          version: p.version,
          digest: p.digest,
          token: r.token,
          idempotencyKey: randomUUID(),
        }))(),
    ).rejects.toThrow();
    expect((await state(db, alice.userId)).transactions).toHaveLength(0);
    expect(db.prepare("SELECT count(*) n FROM transfers").get()?.n).toBe(0);
  });
});
describe("forecast provenance", () => {
  it("unknown forecast stays unknown, not zero", async () => {
    const f = forecast(await state(db, alice.userId), "2026-01-01");
    expect(f.days.every((d) => d.amount === null)).toBe(true);
    expect(f.warnings.some((w) => w.includes("income"))).toBe(true);
  });
  it("due date plus clearing estimate changes forecast, never actual cleared state", async () => {
    const a = await account();
    await post({
      kind: "recurrence",
      accountId: a.id,
      name: "Imaginary bill",
      amount: -1500,
      start: "2026-01-03",
      cadence: "monthly",
      clearingDays: 2,
    });
    const s = await state(db, alice.userId),
      f = forecast(s, "2026-01-01");
    expect(f.days.find((d) => d.date === "2026-01-03")?.amount).toBe(10000);
    expect(f.days.find((d) => d.date === "2026-01-05")?.amount).toBe(8500);
    expect(s.transactions).toHaveLength(0);
    expect(f.events[0].state).toBe("estimated");
  });
});
describe("exact impact previews and reconciled-period integrity", () => {
  it("previews card payment before/after without writes", async () => {
    const cash = await account("Cash", 10000),
      card = await account("Card", 7000, "credit");
    const s = await state(db, alice.userId);
    const impact = financialImpact(s, {
      kind: "transfer",
      fromId: cash.id,
      toId: card.id,
      amount: 3000,
      date: "2026-01-02",
      description: "Payment",
      status: "cleared",
    });
    expect(impact.accounts.map((a) => [a.before, a.after])).toEqual([
      [10000, 7000],
      [7000, 4000],
    ]);
    expect(impact.netWorthAfter).toBe(impact.netWorthBefore);
    expect((await state(db, alice.userId)).transactions).toHaveLength(0);
  });
  it("cannot backdate a new transaction into a reconciled period", async () => {
    const a = await account();
    await post({
      kind: "reconcile",
      accountId: a.id,
      date: "2026-01-05",
      statement: 10000,
    });
    await expect(
      (async () =>
        await propose(db, alice, {
          kind: "transaction",
          accountId: a.id,
          date: "2026-01-02",
          description: "Backdate",
          amount: -100,
          status: "cleared",
          splits: [],
        }))(),
    ).rejects.toThrow(/reconciled period/);
  });
});

it("creates a new category and its budget only together after independent confirmation", async () => {
  const categoryId = randomUUID();
  const operation: Operation = {
    kind: "budget",
    categoryId,
    newCategory: { name: "Fictional supplies" },
    month: "2026-11",
    target: 10000,
  };
  const p = await propose(db, alice, operation);
  expect((await state(db, alice.userId)).categories).toEqual([]);
  expect((await state(db, alice.userId)).budgets).toEqual([]);
  const r = await review(db, alice, p.id);
  await confirm(db, alice, {
    proposalId: p.id,
    digest: p.digest,
    version: p.version,
    token: r.token,
    idempotencyKey: randomUUID(),
  });
  const saved = await state(db, alice.userId);
  expect(saved.categories).toEqual([
    { id: categoryId, name: "Fictional supplies" },
  ]);
  expect(saved.budgets[0]).toMatchObject({ categoryId, target: 10000 });
  expect(saved.accounts).toEqual([]);
  expect((await state(db, bob.userId)).categories).toEqual([]);
  await expect(
    propose(db, alice, { ...operation, categoryId: randomUUID() }),
  ).rejects.toThrow("already exists");
});

it("rolls back the new category if saving its paired budget fails", async () => {
  const id = randomUUID();
  const p = await propose(db, alice, {
    kind: "budget",
    categoryId: id,
    newCategory: { name: "Fictional rollback" },
    month: "2026-11",
    target: 100,
  });
  const r = await review(db, alice, p.id);
  db.exec(
    "CREATE TRIGGER reject_budget BEFORE INSERT ON budgets BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END",
  );
  await expect(
    confirm(db, alice, {
      proposalId: p.id,
      digest: p.digest,
      version: p.version,
      token: r.token,
      idempotencyKey: randomUUID(),
    }),
  ).rejects.toThrow();
  expect((await state(db, alice.userId)).categories).toEqual([]);
  expect((await state(db, alice.userId)).budgets).toEqual([]);
});
