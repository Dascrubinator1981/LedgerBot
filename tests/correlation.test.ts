import { beforeEach, afterEach, describe, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../src/lib/db";
import { authenticate, getSession, type Session } from "../src/lib/auth";
import { propose, review, confirm, state } from "../src/lib/finance";
import {
  balance,
  budgetActual,
  forecast,
  type Operation,
  type Transaction,
} from "../src/lib/domain";
import {
  budgetProgress,
  recentPaidBills,
  runningBalances,
} from "../src/lib/insights";
let db: DatabaseSync, user: Session;
beforeEach(() => {
  db = openDatabase(":memory:");
  user = getSession(
    db,
    authenticate(
      db,
      {
        email: "correlation@example.test",
        password: "fabricated-correlation-password",
      },
      true,
    ).token,
  );
});
afterEach(() => db.close());
async function current() {
  return state(db, user.userId);
}
async function post(op: Operation) {
  const p = await propose(db, user, op),
    r = await review(db, user, p.id);
  await confirm(db, user, {
    proposalId: p.id,
    digest: p.digest,
    version: p.version,
    token: r.token,
    idempotencyKey: randomUUID(),
  });
  return p;
}
async function setup(amount = -1000, start = "2026-01-20") {
  await post({
    kind: "account",
    name: "Fictional checking",
    type: "checking",
    opening: 10000,
    asOf: "2026-01-01",
  });
  const accountId = (await current()).accounts[0].id;
  await post({ kind: "category", name: "Fictional bills" });
  const categoryId = (await current()).categories[0].id;
  await post({ kind: "budget", categoryId, month: "2026-01", target: 10000 });
  await post({
    kind: "recurrence",
    accountId,
    name: "Fictional water bill",
    amount,
    start,
    cadence: "monthly",
    clearingDays: 0,
  });
  return {
    accountId,
    categoryId,
    recurrenceId: (await current()).recurrences[0].id,
  };
}
describe("shared ledger, budget, forecast and paid-bill contract", () => {
  it("edits a transfer pair atomically without changing its identity or counting spending", async () => {
    const { accountId } = await setup();
    await post({
      kind: "account",
      name: "Fictional savings",
      type: "savings",
      opening: 0,
      asOf: "2026-01-01",
    });
    const savings = (await current()).accounts.find(
      (a) => a.type === "savings",
    )!;
    await post({
      kind: "transfer",
      fromId: accountId,
      toId: savings.id,
      amount: 1000,
      date: "2026-01-03",
      description: "First transfer",
      status: "cleared",
    });
    const before = (await current()).transactions;
    await post({
      kind: "editTransfer",
      id: before[0].id,
      fromId: accountId,
      toId: savings.id,
      amount: 2000,
      date: "2026-01-04",
      description: "Corrected transfer",
      status: "cleared",
      occurrence: null,
    });
    const after = await current();
    expect(after.transactions.map((t) => t.id).sort()).toEqual(
      before.map((t) => t.id).sort(),
    );
    expect(new Set(after.transactions.map((t) => t.transferId)).size).toBe(1);
    expect(
      balance(
        after.accounts.find((a) => a.id === accountId)!,
        after.transactions,
      ),
    ).toBe(8000);
    expect(balance(savings, after.transactions)).toBe(2000);
    expect(budgetProgress(after, "2026-01", "2026-01-15").totalActual).toBe(0);
  });
  it("starts with no occurrence records and honest unconfigured charts", async () => {
    const s = await current();
    expect(s.occurrences).toEqual([]);
    expect(budgetProgress(s, "2026-01", "2026-01-15").configured).toBe(false);
    expect(recentPaidBills(s, "2026-01-15")).toEqual([]);
    expect(forecast(s, "2026-01-15").opening).toBeNull();
  });
  it("one linked bill payment updates balance, budget actuals, chart and forecast once", async () => {
    const { accountId, categoryId, recurrenceId } = await setup();
    expect(forecast(await current(), "2026-01-15", 7).days.at(-1)?.amount).toBe(
      9000,
    );
    await post({
      kind: "transaction",
      accountId,
      date: "2026-01-15",
      description: "Fictional water payment",
      amount: -1000,
      status: "cleared",
      splits: [{ categoryId, amount: -1000 }],
      occurrence: { recurrenceId, dueDate: "2026-01-20", settles: true },
    });
    const s = await current(),
      f = forecast(s, "2026-01-15", 7),
      b = budgetProgress(s, "2026-01", "2026-01-15");
    expect(balance(s.accounts[0], s.transactions)).toBe(9000);
    expect(budgetActual(categoryId, "2026-01", s.transactions)).toBe(1000);
    expect(b.totalActual).toBe(1000);
    expect(b.series[14].actual).toBe(1000);
    expect(f.opening).toBe(9000);
    expect(f.days.at(-1)?.amount).toBe(9000);
    expect(f.events).toEqual([]);
    expect(recentPaidBills(s, "2026-01-15")).toHaveLength(1);
  });
  it("an ordinary expense never becomes a paid bill by its merchant or description", async () => {
    const { accountId, categoryId, recurrenceId } = await setup();
    await post({
      kind: "transaction",
      accountId,
      date: "2026-01-15",
      description: "Fictional water bill",
      amount: -1000,
      status: "cleared",
      splits: [{ categoryId, amount: -1000 }],
    });
    const before = await current();
    expect(recentPaidBills(before, "2026-01-15")).toEqual([]);
    expect(forecast(before, "2026-01-15", 7).days.at(-1)?.amount).toBe(8000);
    await post({
      kind: "matchOccurrence",
      transactionId: before.transactions[0].id,
      recurrenceId,
      dueDate: "2026-01-20",
      settles: true,
    });
    const after = await current();
    expect(after.transactions).toHaveLength(1);
    expect(balance(after.accounts[0], after.transactions)).toBe(9000);
    expect(budgetProgress(after, "2026-01", "2026-01-15").totalActual).toBe(
      1000,
    );
    expect(forecast(after, "2026-01-15", 7).days.at(-1)?.amount).toBe(9000);
    expect(recentPaidBills(after, "2026-01-15")).toHaveLength(1);
  });
  it("partial and pending payments cover only the remaining obligation, without false clearing", async () => {
    const { accountId, categoryId, recurrenceId } = await setup();
    await post({
      kind: "transaction",
      accountId,
      date: "2026-01-15",
      description: "Fictional partial payment",
      amount: -400,
      status: "pending",
      splits: [{ categoryId, amount: -400 }],
      occurrence: { recurrenceId, dueDate: "2026-01-20", settles: false },
    });
    let s = await current(),
      f = forecast(s, "2026-01-15", 7);
    expect(f.opening).toBe(10000);
    expect(f.days.at(-1)?.amount).toBe(9000);
    expect(f.events.map((e) => e.amount).sort()).toEqual([-600, -400].sort());
    expect(recentPaidBills(s, "2026-01-15")).toEqual([]);
    expect(budgetProgress(s, "2026-01", "2026-01-15").totalActual).toBe(0);
    await post({
      kind: "editTransaction",
      id: s.transactions[0].id,
      accountId,
      date: "2026-01-16",
      description: "Fictional partial payment",
      amount: -400,
      status: "cleared",
      splits: [{ categoryId, amount: -400 }],
    });
    s = await current();
    f = forecast(s, "2026-01-16", 7);
    expect(f.opening).toBe(9600);
    expect(f.days.at(-1)?.amount).toBe(9000);
    expect(recentPaidBills(s, "2026-01-16")[0].settled).toBe(false);
    expect(budgetProgress(s, "2026-01", "2026-01-16").totalActual).toBe(400);
  });
  it("income does not offset expense budgets, while an approved refund does", async () => {
    const { accountId, categoryId } = await setup();
    await post({
      kind: "transaction",
      accountId,
      date: "2026-01-10",
      description: "Synthetic income",
      amount: 5000,
      flow: "income",
      status: "cleared",
      splits: [{ categoryId, amount: 5000 }],
    });
    await post({
      kind: "transaction",
      accountId,
      date: "2026-01-11",
      description: "Synthetic expense",
      amount: -1000,
      status: "cleared",
      splits: [{ categoryId, amount: -1000 }],
    });
    await post({
      kind: "transaction",
      accountId,
      date: "2026-01-12",
      description: "Synthetic refund",
      amount: 100,
      flow: "refund",
      status: "cleared",
      splits: [{ categoryId, amount: 100 }],
    });
    const s = await current(),
      b = budgetProgress(s, "2026-01", "2026-01-15");
    expect(budgetActual(categoryId, "2026-01", s.transactions)).toBe(900);
    expect(b.totalActual).toBe(900);
    expect(balance(s.accounts[0], s.transactions)).toBe(14100);
  });
  it("uncategorized and unbudgeted spending cannot hide behind an on-plan chart", async () => {
    const { accountId, categoryId } = await setup();
    await post({ kind: "budget", categoryId, month: "2026-01", target: 500 });
    await post({
      kind: "transaction",
      accountId,
      date: "2026-01-10",
      description: "Uncategorized synthetic expense",
      amount: -1000,
      status: "cleared",
      splits: [],
    });
    const b = budgetProgress(await current(), "2026-01", "2026-01-15");
    expect(b.totalActual).toBe(1000);
    expect(b.rows[0].actual).toBe(0);
    expect(b.uncategorized).toBe(1000);
    expect(b.status).toBe("Over budget");
    expect(b.series[14].actual).toBe(b.totalActual);
  });
  it("delete and reviewed restore recompute all sections and reopen/close the obligation", async () => {
    const { accountId, categoryId, recurrenceId } = await setup(
      -1000,
      "2026-07-04",
    );
    await post({
      kind: "transaction",
      accountId,
      date: "2026-07-05",
      description: "Fictional bill",
      amount: -1000,
      status: "cleared",
      splits: [{ categoryId, amount: -1000 }],
      occurrence: { recurrenceId, dueDate: "2026-07-04", settles: true },
    });
    const t = (await current()).transactions[0];
    const deletion = await post({ kind: "deleteTransaction", id: t.id });
    let s = await current();
    expect(balance(s.accounts[0], s.transactions)).toBe(10000);
    expect(recentPaidBills(s, "2026-07-06")).toEqual([]);
    expect(forecast(s, "2026-07-06", 7).days[0].amount).toBe(9000);
    await post({ kind: "restoreTransaction", sourceProposalId: deletion.id });
    s = await current();
    expect(balance(s.accounts[0], s.transactions)).toBe(9000);
    expect(s.transactions[0].id).toBe(t.id);
    expect(recentPaidBills(s, "2026-07-06")).toHaveLength(1);
    expect(forecast(s, "2026-07-06", 7).days.at(-1)?.amount).toBe(9000);
    await expect(
      propose(db, user, {
        kind: "restoreTransaction",
        sourceProposalId: deletion.id,
      }),
    ).rejects.toThrow(/already/);
  });
  it("renames keep IDs and financial values stable; opening corrections recompute views", async () => {
    const { accountId, categoryId } = await setup();
    await post({
      kind: "renameAccount",
      id: accountId,
      name: "My custom pocket",
    });
    await post({
      kind: "renameCategory",
      id: categoryId,
      name: "My custom category",
    });
    await post({
      kind: "correctOpening",
      id: accountId,
      opening: 12000,
      asOf: "2026-01-01",
    });
    const s = await current();
    expect(s.accounts[0].id).toBe(accountId);
    expect(s.categories[0].id).toBe(categoryId);
    expect(balance(s.accounts[0], s.transactions)).toBe(12000);
    expect(budgetProgress(s, "2026-01", "2026-01-15").rows[0].name).toBe(
      "My custom category",
    );
  });
  it("settles a pending card-payment pair once, without creating spending", async () => {
    const { accountId, recurrenceId } = await setup(-3000, "2026-01-20");
    await post({
      kind: "account",
      name: "Fictional card",
      type: "credit",
      opening: 5000,
      asOf: "2026-01-01",
    });
    const card = (await current()).accounts.find((a) => a.type === "credit")!;
    await post({
      kind: "transfer",
      fromId: accountId,
      toId: card.id,
      amount: 3000,
      date: "2026-01-15",
      description: "Fictional card payment",
      status: "pending",
      occurrence: { recurrenceId, dueDate: "2026-01-20", settles: true },
    });
    let s = await current();
    expect(forecast(s, "2026-01-15", 7).days.at(-1)?.amount).toBe(7000);
    expect(recentPaidBills(s, "2026-01-15")).toEqual([]);
    await post({
      kind: "settleTransfer",
      id: s.transactions[0].id,
      date: "2026-01-16",
    });
    s = await current();
    expect(s.transactions).toHaveLength(2);
    expect(
      balance(
        s.accounts.find((a) => a.id === accountId)!,
        s.transactions,
      ),
    ).toBe(7000);
    expect(balance(card, s.transactions)).toBe(2000);
    expect(budgetProgress(s, "2026-01", "2026-01-16").totalActual).toBe(0);
    expect(recentPaidBills(s, "2026-01-16")).toHaveLength(1);
  });
});
describe("paid-bill date window and deterministic running balances", () => {
  it("uses seven inclusive civil dates and excludes expenses, future items and pending", () => {
    const recurrenceId = randomUUID(),
      accountId = randomUUID();
    const base: Transaction = {
      id: randomUUID(),
      accountId,
      date: "2026-11-05",
      description: "Any synthetic description",
      amount: -100,
      status: "cleared",
      transferId: null,
      reconciledAt: null,
      splits: [],
      occurrence: { recurrenceId, dueDate: "2026-11-01", settles: true },
    };
    const transactions = [
      { ...base, id: "old", date: "2026-10-29" },
      { ...base, id: "first", date: "2026-10-30" },
      { ...base, id: "today" },
      { ...base, id: "future", date: "2026-11-06" },
      { ...base, id: "pending", status: "pending" },
      { ...base, id: "expense", occurrence: undefined },
    ];
    expect(
      recentPaidBills(
        {
          transactions,
          recurrences: [
            {
              id: recurrenceId,
              accountId,
              name: "Synthetic recurring bill",
              amount: -100,
              start: "2026-11-01",
              cadence: "monthly",
              clearingDays: 0,
            },
          ],
        },
        "2026-11-05",
      ).map((r) => r.transactionId),
    ).toEqual(["today", "first"]);
  });
  it("shows stable per-row balances and leaves pending rows out of cleared totals", () => {
    const account = {
      id: randomUUID(),
      name: "Synthetic pocket",
      type: "checking",
      opening: 10000,
      asOf: "2026-01-01",
      currency: "USD",
    };
    const t: Transaction = {
      id: "a",
      accountId: account.id,
      date: "2026-01-02",
      description: "Synthetic",
      amount: -100,
      status: "cleared",
      transferId: null,
      reconciledAt: null,
      splits: [],
    };
    const values = runningBalances(account, [
      t,
      { ...t, id: "b", amount: -200 },
      { ...t, id: "c", amount: -500, status: "pending" },
    ]);
    expect([...values.values()]).toEqual([9900, 9700, 9700]);
  });
});
