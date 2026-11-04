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
function post(op: Operation, user = alice) {
  const p = propose(db, user, op);
  const r = review(db, user, p.id);
  return confirm(db, user, {
    proposalId: p.id,
    version: p.version,
    digest: p.digest,
    token: r.token,
    idempotencyKey: randomUUID(),
  });
}
function account(
  name = "Pocket",
  opening: number | null = 10000,
  type: "checking" | "credit" | "savings" = "checking",
  user = alice,
) {
  post({ kind: "account", name, opening, type, asOf: "2026-01-01" }, user);
  return state(db, user.userId).accounts.at(-1)!;
}
function category(name = "Food") {
  post({ kind: "category", name });
  return state(db, alice.userId).categories.at(-1)!;
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
  it("creates no financial records for new users", () => {
    const s = state(db, alice.userId);
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
  it("distinguishes unknown from a deliberately configured zero", () => {
    const a = account("unknown", null);
    expect(balance(a, [])).toBeNull();
    const z = account("zero", 0);
    expect(balance(z, [])).toBe(0);
    expect(money(0)).toBe("$0.00");
    expect(state(db, bob.userId).accounts).toEqual([]);
  });
  it("card charge changes owed once; card payment is a transfer and not new spending", () => {
    const cash = account("Cash", 10000),
      card = account("Card", 5000, "credit"),
      c = category();
    post({
      kind: "transaction",
      accountId: card.id,
      date: "2026-01-02",
      description: "Fictional lunch",
      amount: -2000,
      status: "cleared",
      splits: [{ categoryId: c.id, amount: -2000 }],
    });
    let s = state(db, alice.userId);
    expect(balance(card, s.transactions)).toBe(7000);
    expect(netWorth(s.accounts, s.transactions)).toBe(3000);
    post({
      kind: "transfer",
      fromId: cash.id,
      toId: card.id,
      amount: 3000,
      date: "2026-01-03",
      description: "Card payment",
      status: "cleared",
    });
    s = state(db, alice.userId);
    expect(balance(cash, s.transactions)).toBe(7000);
    expect(balance(card, s.transactions)).toBe(4000);
    expect(netWorth(s.accounts, s.transactions)).toBe(3000);
    expect(budgetActual(c.id, "2026-01", s.transactions)).toBe(2000);
  });
  it("deleting either transfer leg atomically removes both", () => {
    const a = account(),
      b = account("Savings", 0, "savings");
    post({
      kind: "transfer",
      fromId: a.id,
      toId: b.id,
      amount: 2500,
      date: "2026-01-02",
      description: "Move",
      status: "cleared",
    });
    const s = state(db, alice.userId);
    expect(netWorth(s.accounts, s.transactions)).toBe(10000);
    post({ kind: "deleteTransaction", id: s.transactions[0].id });
    expect(state(db, alice.userId).transactions).toHaveLength(0);
    expect(db.prepare("SELECT count(*) n FROM transfers").get()?.n).toBe(0);
  });
  it("pending entries do not change cleared balances", () => {
    const a = account();
    post({
      kind: "transaction",
      accountId: a.id,
      date: "2026-01-02",
      description: "Pending",
      amount: -2500,
      status: "pending",
      splits: [],
    });
    const s = state(db, alice.userId);
    expect(balance(a, s.transactions)).toBe(10000);
  });
  it("edit/delete actuals recomputes derived values", () => {
    const a = account();
    post({
      kind: "transaction",
      accountId: a.id,
      date: "2026-01-02",
      description: "Deposit",
      amount: 1000,
      status: "cleared",
      splits: [],
    });
    let t = state(db, alice.userId).transactions[0];
    post({
      kind: "editTransaction",
      id: t.id,
      accountId: a.id,
      date: t.date,
      description: "Corrected",
      amount: 2000,
      status: "cleared",
      splits: [],
    });
    expect(balance(a, state(db, alice.userId).transactions)).toBe(12000);
    t = state(db, alice.userId).transactions[0];
    post({ kind: "deleteTransaction", id: t.id });
    expect(balance(a, state(db, alice.userId).transactions)).toBe(10000);
  });
  it("categorization and budget changes never post another debit", () => {
    const a = account(),
      c = category();
    post({
      kind: "transaction",
      accountId: a.id,
      date: "2026-01-02",
      description: "Food",
      amount: -12000,
      status: "cleared",
      splits: [],
    });
    const t = state(db, alice.userId).transactions[0];
    post({
      kind: "editTransaction",
      id: t.id,
      accountId: a.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      status: "cleared",
      splits: [{ categoryId: c.id, amount: -12000 }],
    });
    post({ kind: "budget", categoryId: c.id, month: "2026-01", target: 20000 });
    const s = state(db, alice.userId);
    expect(s.transactions).toHaveLength(1);
    expect(balance(a, s.transactions)).toBe(-2000);
    expect(budgetActual(c.id, "2026-01", s.transactions)).toBe(12000);
  });
  it.each([-11999, -12001])(
    "blocks splits that do not balance: %i",
    (amount) => {
      const a = account(),
        c = category();
      expect(() =>
        propose(db, alice, {
          kind: "transaction",
          accountId: a.id,
          date: "2026-01-02",
          description: "Split",
          amount: -12000,
          status: "cleared",
          splits: [{ categoryId: c.id, amount }],
        }),
      ).toThrow(/exact/);
    },
  );
  it("snapshots are end-of-day and cannot count same-day transactions twice", () => {
    const a = account();
    expect(() =>
      propose(db, alice, {
        kind: "transaction",
        accountId: a.id,
        date: "2026-01-01",
        description: "Already included",
        amount: -100,
        status: "cleared",
        splits: [],
      }),
    ).toThrow(/snapshot/);
    expect(balance(a, [], "2025-12-31")).toBeNull();
  });
  it("blocks reconciliation mismatch and locks reconciled transactions", () => {
    const a = account();
    post({
      kind: "transaction",
      accountId: a.id,
      date: "2026-01-02",
      description: "Food",
      amount: -2500,
      status: "cleared",
      splits: [],
    });
    expect(() =>
      propose(db, alice, {
        kind: "reconcile",
        accountId: a.id,
        date: "2026-01-02",
        statement: 10000,
      }),
    ).toThrow(/differ/);
    post({
      kind: "reconcile",
      accountId: a.id,
      date: "2026-01-02",
      statement: 7500,
    });
    const t = state(db, alice.userId).transactions[0];
    expect(t.reconciledAt).toBe("2026-01-02");
    expect(() =>
      propose(db, alice, { kind: "deleteTransaction", id: t.id }),
    ).toThrow(/Reconciled/);
  });
});
describe("tenant and approval boundary", () => {
  it("unapproved draft, review, and discard never change financial records", () => {
    const p = propose(db, alice, {
      kind: "account",
      name: "Uncommitted",
      type: "cash",
      opening: 0,
      asOf: "2026-01-01",
    });
    expect(state(db, alice.userId).accounts).toHaveLength(0);
    review(db, alice, p.id);
    expect(state(db, alice.userId).accounts).toHaveLength(0);
    discard(db, alice, p.id);
    expect(() => review(db, alice, p.id)).toThrow();
    expect(state(db, alice.userId).accounts).toHaveLength(0);
  });
  it("rejects forged foreign account, category, transaction and proposal references", () => {
    const a = account(),
      c = category();
    expect(state(db, bob.userId).accounts).toEqual([]);
    expect(() =>
      propose(db, bob, {
        kind: "transaction",
        accountId: a.id,
        date: "2026-01-02",
        description: "Forged",
        amount: -100,
        status: "cleared",
        splits: [],
      }),
    ).toThrow(/unavailable/);
    const b = account("Bob", 10000, "checking", bob);
    expect(() =>
      propose(db, bob, {
        kind: "transaction",
        accountId: b.id,
        date: "2026-01-02",
        description: "Forged split",
        amount: -100,
        status: "cleared",
        splits: [{ categoryId: c.id, amount: -100 }],
      }),
    ).toThrow(/unavailable/);
    const p = propose(db, alice, { kind: "category", name: "Private" });
    expect(() => review(db, bob, p.id)).toThrow(/unavailable/);
    expect(() => discard(db, bob, p.id)).toThrow(/unavailable/);
  });
  it("database composite foreign keys reject cross-tenant references", () => {
    const a = account();
    expect(() =>
      db
        .prepare("INSERT INTO transactions VALUES(?,?,?,?,?)")
        .run(randomUUID(), bob.userId, a.id, null, "{}"),
    ).toThrow(/FOREIGN KEY/);
  });
  it("same idempotency retry returns the receipt and never duplicates a transfer", () => {
    const a = account(),
      b = account("B", 0);
    const p = propose(db, alice, {
      kind: "transfer",
      fromId: a.id,
      toId: b.id,
      amount: 100,
      date: "2026-01-02",
      description: "Move",
      status: "cleared",
    });
    const r = review(db, alice, p.id);
    const input = {
      proposalId: p.id,
      version: p.version,
      digest: p.digest,
      token: r.token,
      idempotencyKey: randomUUID(),
    };
    expect(confirm(db, alice, input)).toEqual(confirm(db, alice, input));
    expect(state(db, alice.userId).transactions).toHaveLength(2);
    expect(() =>
      confirm(db, alice, { ...input, idempotencyKey: randomUUID() }),
    ).toThrow(/already/);
  });
  it("rejects altered digest, missing challenge, foreign session and stale proposals", () => {
    const p = propose(db, alice, { kind: "category", name: "First" });
    const r = review(db, alice, p.id);
    const input = {
      proposalId: p.id,
      version: p.version,
      digest: p.digest,
      token: r.token,
      idempotencyKey: randomUUID(),
    };
    expect(() =>
      confirm(db, alice, { ...input, digest: "0".repeat(64) }),
    ).toThrow(/match/);
    expect(() => confirm(db, bob, input)).toThrow(/unavailable/);
    expect(() =>
      confirm(db, alice, { ...input, token: "0".repeat(64) }),
    ).toThrow(/match/);
    post({ kind: "category", name: "Competing change" });
    expect(() => confirm(db, alice, input)).toThrow(/stale/);
    expect(state(db, alice.userId).categories).toHaveLength(1);
  });
  it("expired challenge cannot commit", () => {
    const p = propose(db, alice, { kind: "category", name: "Expired" }),
      r = review(db, alice, p.id);
    db.prepare("UPDATE challenges SET expires=0").run();
    expect(() =>
      confirm(db, alice, {
        proposalId: p.id,
        version: p.version,
        digest: p.digest,
        token: r.token,
        idempotencyKey: randomUUID(),
      }),
    ).toThrow(/expired/);
    expect(state(db, alice.userId).categories).toHaveLength(0);
  });
  it("rejects AI principals independently of caller claims", () => {
    db.prepare("UPDATE sessions SET principal='ai' WHERE hash=?").run(
      alice.sessionHash,
    );
    const ai = { ...alice, principal: "ai" as const };
    const p = propose(db, ai, { kind: "category", name: "AI draft" });
    expect(() => review(db, ai, p.id)).toThrow(/human/);
    expect(() => review(db, alice, p.id)).toThrow(/human/);
    expect(() =>
      confirm(db, ai, {
        proposalId: p.id,
        version: p.version,
        digest: p.digest,
        token: "0".repeat(64),
        idempotencyKey: randomUUID(),
      }),
    ).toThrow(/human/);
    expect(state(db, alice.userId).categories).toHaveLength(0);
  });
  it("rejects logged-out and expired sessions", () => {
    const p = propose(db, alice, { kind: "category", name: "A" });
    db.prepare("UPDATE sessions SET expires=0").run();
    expect(() => review(db, alice, p.id)).toThrow(/session/);
  });
  it("rollback preserves transfer atomicity even if database insert fails", () => {
    const a = account(),
      b = account("B", 0);
    db.exec(
      `CREATE TRIGGER fail_second BEFORE INSERT ON transactions WHEN NEW.account_id='${b.id}' BEGIN SELECT RAISE(ABORT,'injected failure'); END;`,
    );
    const p = propose(db, alice, {
        kind: "transfer",
        fromId: a.id,
        toId: b.id,
        amount: 100,
        date: "2026-01-02",
        description: "Atomic",
        status: "cleared",
      }),
      r = review(db, alice, p.id);
    expect(() =>
      confirm(db, alice, {
        proposalId: p.id,
        version: p.version,
        digest: p.digest,
        token: r.token,
        idempotencyKey: randomUUID(),
      }),
    ).toThrow();
    expect(state(db, alice.userId).transactions).toHaveLength(0);
    expect(db.prepare("SELECT count(*) n FROM transfers").get()?.n).toBe(0);
  });
});
describe("forecast provenance", () => {
  it("unknown forecast stays unknown, not zero", () => {
    const f = forecast(state(db, alice.userId), "2026-01-01");
    expect(f.days.every((d) => d.amount === null)).toBe(true);
    expect(f.warnings.some((w) => w.includes("income"))).toBe(true);
  });
  it("due date plus clearing estimate changes forecast, never actual cleared state", () => {
    const a = account();
    post({
      kind: "recurrence",
      accountId: a.id,
      name: "Imaginary bill",
      amount: -1500,
      start: "2026-01-03",
      cadence: "monthly",
      clearingDays: 2,
    });
    const s = state(db, alice.userId),
      f = forecast(s, "2026-01-01");
    expect(f.days.find((d) => d.date === "2026-01-03")?.amount).toBe(10000);
    expect(f.days.find((d) => d.date === "2026-01-05")?.amount).toBe(8500);
    expect(s.transactions).toHaveLength(0);
    expect(f.events[0].state).toBe("estimated");
  });
});

describe("exact impact previews and reconciled-period integrity", () => {
  it("previews card payment before/after without writes", () => {
    const cash = account("Cash", 10000),
      card = account("Card", 7000, "credit");
    const s = state(db, alice.userId);
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
    expect(state(db, alice.userId).transactions).toHaveLength(0);
  });
  it("cannot backdate a new transaction into a reconciled period", () => {
    const a = account();
    post({
      kind: "reconcile",
      accountId: a.id,
      date: "2026-01-05",
      statement: 10000,
    });
    expect(() =>
      propose(db, alice, {
        kind: "transaction",
        accountId: a.id,
        date: "2026-01-02",
        description: "Backdate",
        amount: -100,
        status: "cleared",
        splits: [],
      }),
    ).toThrow(/reconciled period/);
  });
});
