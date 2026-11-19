import { afterEach, beforeEach, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { openDatabase } from "../src/lib/db";
import { authenticate, getSession, type Session } from "../src/lib/auth";
import { confirm, propose, review, state } from "../src/lib/finance";
import {
  addDays,
  balance,
  balanceAnchor,
  civilToday,
  forecast,
  type Operation,
} from "../src/lib/domain";
import { budgetProgress, runningBalances } from "../src/lib/insights";
import { investigateReconciliation } from "../src/lib/reconciliation";
import { periodForecast } from "../src/lib/forecast-dashboard";
let db: ReturnType<typeof openDatabase>, session: Session;
beforeEach(() => {
  db = openDatabase(":memory:");
  session = getSession(
    db,
    authenticate(
      db,
      { email: "manual-flow@example.test", password: "fictional-password-123" },
      true,
    ).token,
  );
});
afterEach(() => db.close());
async function post(operation: Operation) {
  const proposal = await propose(db, session, operation),
    challenge = await review(db, session, proposal.id);
  return confirm(db, session, {
    proposalId: proposal.id,
    version: proposal.version,
    digest: proposal.digest,
    token: challenge.token,
    idempotencyKey: randomUUID(),
  });
}
async function setup() {
  await post({
    kind: "account",
    name: "Synthetic manual pocket",
    type: "checking",
    opening: 100000,
    asOf: "2026-01-01",
  });
  return (await state(db, session.userId)).accounts[0];
}
function purchase(
  accountId: string,
  extra: Record<string, unknown> = {},
): Operation {
  return {
    kind: "transaction",
    accountId,
    date: "2026-01-01",
    description: "Synthetic ordinary purchase",
    flow: "expense",
    amount: -18500,
    status: "cleared",
    splits: [],
    balanceImpact: "additional",
    ...extra,
  } as Operation;
}
it("records the same-day purchase against a legacy closing balance without changing the opening or posting before approval", async () => {
  const account = await setup();
  const proposal = await propose(db, session, purchase(account.id));
  expect(proposal.impact?.accounts[0]).toMatchObject({
    before: 100000,
    after: 81500,
  });
  expect((await state(db, session.userId)).transactions).toHaveLength(0);
  await post(purchase(account.id));
  const s = await state(db, session.userId);
  expect(s.accounts[0].opening).toBe(100000);
  expect(s.accounts[0].openingBasis).toBe("end-of-day");
  expect(balance(s.accounts[0], s.transactions)).toBe(81500);
  expect(
    runningBalances(s.accounts[0], s.transactions).get(s.transactions[0].id),
  ).toBe(81500);
  expect(
    investigateReconciliation(s, account.id, "2026-01-01", 81500)?.actual,
  ).toBe(81500);
});
it("keeps older included history in spending without a second balance deduction and excludes included pending holds from cash projection", async () => {
  const account = await setup();
  await post(
    purchase(account.id, { date: "2025-12-31", balanceImpact: "included" }),
  );
  await post(
    purchase(account.id, { status: "pending", balanceImpact: "included" }),
  );
  const s = await state(db, session.userId);
  expect(balance(s.accounts[0], s.transactions)).toBe(100000);
  expect(budgetProgress(s, "2025-12", "2026-01-01").totalActual).toBe(18500);
  expect(forecast(s, "2026-01-01", 7).events).toHaveLength(0);
  expect(
    runningBalances(s.accounts[0], s.transactions).get(
      s.transactions.find((t) => t.date === "2025-12-31")!.id,
    ),
  ).toBeNull();
});
it("applies backdated additional entries at the checkpoint and re-evaluates overrides after a reviewed checkpoint replacement", async () => {
  const account = await setup();
  await post(purchase(account.id, { date: "2025-12-31" }));
  await post(purchase(account.id, { date: "2026-01-02", amount: -1000 }));
  let s = await state(db, session.userId);
  expect(balance(s.accounts[0], s.transactions)).toBe(80500);
  expect(
    runningBalances(s.accounts[0], s.transactions).get(
      s.transactions.find((t) => t.date === "2026-01-02")!.id,
    ),
  ).toBe(80500);
  const p = await propose(db, session, {
    kind: "correctOpening",
    id: account.id,
    opening: 100000,
    asOf: "2026-01-01",
  });
  expect(p.impact?.accounts[0].after).toBe(99000);
  await post({
    kind: "correctOpening",
    id: account.id,
    opening: 100000,
    asOf: "2026-01-01",
  });
  s = await state(db, session.userId);
  expect(balance(s.accounts[0], s.transactions)).toBe(99000);
  const version = s.accounts[0].openingVersion;
  await post({
    kind: "correctOpening",
    id: account.id,
    opening: 100000,
    asOf: "2026-01-01",
  });
  expect((await state(db, session.userId)).accounts[0].openingVersion).not.toBe(
    version,
  );
});
it("moves future pending to cleared on the same transaction, from dotted spending to actuals, without duplicate cash or spending", async () => {
  const account = await setup(),
    today = civilToday(),
    tomorrow = addDays(today, 1);
  await post(purchase(account.id, { date: tomorrow, status: "pending" }));
  let s = await state(db, session.userId),
    tx = s.transactions[0];
  expect(balance(s.accounts[0], s.transactions)).toBe(100000);
  const pending = budgetProgress(s, tomorrow.slice(0, 7), today);
  expect(pending.totalActual).toBe(0);
  expect(pending.pending).toBe(18500);
  expect(pending.series.find((d) => d.date === tomorrow)?.withPending).toBe(
    18500,
  );
  expect(
    forecast(s, today, 7).days.find((d) => d.date === tomorrow)?.amount,
  ).toBe(81500);
  await expect(
    propose(db, session, purchase(account.id, { date: tomorrow })),
  ).rejects.toThrow("future dates");
  await post({
    ...tx,
    kind: "editTransaction",
    date: today,
    status: "cleared",
  } as Operation);
  s = await state(db, session.userId);
  tx = s.transactions[0];
  expect(s.transactions).toHaveLength(1);
  expect(balance(s.accounts[0], s.transactions)).toBe(81500);
  const cleared = budgetProgress(s, today.slice(0, 7), today);
  expect(cleared.totalActual).toBe(18500);
  expect(cleared.pending).toBe(0);
  expect(cleared.series.find((d) => d.date === today)?.withPending).toBe(18500);
  expect(forecast(s, today, 7).opening).toBe(81500);
});
it("preserves included-entry treatment through a label-only API edit and replaces an untrusted anchor", async () => {
  const account = await setup();
  await post(
    purchase(account.id, {
      date: "2026-01-02",
      balanceImpact: "included",
      balanceAnchor: "untrusted",
    }),
  );
  let s = await state(db, session.userId);
  const tx = s.transactions[0];
  expect(tx.balanceAnchor).toBe(balanceAnchor(s.accounts[0]));
  const fields = { ...tx };
  delete fields.balanceImpact;
  delete fields.balanceAnchor;
  await post({
    ...fields,
    kind: "editTransaction",
    description: "Readable synthetic merchant",
  } as Operation);
  s = await state(db, session.userId);
  expect(balance(s.accounts[0], s.transactions)).toBe(100000);
  expect(s.transactions).toHaveLength(1);
  expect(s.transactions[0].description).toBe("Readable synthetic merchant");
});
it("supports independent inclusion choices on transfer legs and preserves their pairing through edits", async () => {
  const account = await setup();
  await post({
    kind: "account",
    name: "Synthetic manual savings",
    type: "savings",
    opening: 20000,
    asOf: "2026-01-01",
  });
  let s = await state(db, session.userId);
  const to = s.accounts.find((a) => a.id !== account.id)!;
  await post({
    kind: "transfer",
    fromId: account.id,
    toId: to.id,
    amount: 30000,
    date: "2026-01-01",
    description: "Synthetic paired movement",
    status: "cleared",
    fromBalanceImpact: "additional",
    toBalanceImpact: "included",
  });
  s = await state(db, session.userId);
  expect(
    balance(
      s.accounts.find((a) => a.id === account.id)!,
      s.transactions,
    ),
  ).toBe(70000);
  expect(
    balance(
      s.accounts.find((a) => a.id === to.id)!,
      s.transactions,
    ),
  ).toBe(20000);
  expect(budgetProgress(s, "2026-01", "2026-01-02").totalActual).toBe(0);
  const pair = s.transactions[0].transferId;
  await post({
    kind: "editTransfer",
    id: s.transactions[0].id,
    fromId: account.id,
    toId: to.id,
    amount: 30000,
    date: "2026-01-01",
    description: "Readable transfer",
    status: "cleared",
  });
  s = await state(db, session.userId);
  expect(s.transactions).toHaveLength(2);
  expect(s.transactions.every((t) => t.transferId === pair)).toBe(true);
  expect(
    balance(
      s.accounts.find((a) => a.id === to.id)!,
      s.transactions,
    ),
  ).toBe(20000);
});
it("retains unknown balances, reconciled-period locks and tenant isolation", async () => {
  const account = await setup();
  await post({
    kind: "reconcile",
    accountId: account.id,
    date: "2026-01-02",
    statement: 100000,
  });
  await expect(propose(db, session, purchase(account.id))).rejects.toThrow(
    "reconciled",
  );
  const other = getSession(
    db,
    authenticate(
      db,
      {
        email: "other-manual@example.test",
        password: "fictional-password-456",
      },
      true,
    ).token,
  );
  await expect(propose(db, other, purchase(account.id))).rejects.toThrow(
    "unavailable",
  );
  await post({
    kind: "account",
    name: "Synthetic unknown",
    type: "checking",
    opening: null,
    asOf: "2026-01-01",
  });
  const s = await state(db, session.userId),
    unknown = s.accounts.find((a) => a.opening === null)!;
  await post(purchase(unknown.id));
  expect(
    balance(unknown, (await state(db, session.userId)).transactions),
  ).toBeNull();
});
it("keeps credit-account pending projections compatible with signed chart accounts", async () => {
  await post({
    kind: "account",
    name: "Synthetic credit",
    type: "credit",
    opening: 5000,
    asOf: "2026-01-01",
  });
  const s = await state(db, session.userId),
    account = s.accounts[0];
  await post(purchase(account.id, { amount: -2000, status: "pending" }));
  const current = await state(db, session.userId);
  expect(balance(current.accounts[0], current.transactions)).toBe(5000);
  expect(
    periodForecast(current, "2026-01-01", "2026-01-02", "2026-01-01")[1]
      .balances[0].amount,
  ).toBe(7000);
});

it("does not lose pending cash commitments when replacing a starting checkpoint or clearing an older transfer pair", async () => {
  const from = await setup();
  await post({
    kind: "account",
    name: "Synthetic pending savings",
    type: "savings",
    opening: 20000,
    asOf: "2026-01-01",
  });
  let s = await state(db, session.userId);
  const to = s.accounts.find((a) => a.id !== from.id)!;
  await post({
    kind: "transfer",
    fromId: from.id,
    toId: to.id,
    date: "2026-01-02",
    amount: 30000,
    description: "Synthetic pending move",
    status: "pending",
  });
  await post({
    kind: "correctOpening",
    id: from.id,
    opening: 100000,
    asOf: "2026-01-02",
  });
  s = await state(db, session.userId);
  expect(
    forecast(
      { ...s, accounts: [s.accounts.find((a) => a.id === from.id)!] },
      "2026-01-02",
      7,
    ).days[1].amount,
  ).toBe(70000);
  const selected = s.transactions.find((t) => t.accountId === from.id)!;
  const proposal = await propose(db, session, {
    kind: "settleTransfer",
    id: selected.id,
    date: "2026-01-02",
  });
  expect(
    proposal.impact?.accounts.find((a) => a.name === from.name)?.after,
  ).toBe(70000);
  await post({ kind: "settleTransfer", id: selected.id, date: "2026-01-02" });
  s = await state(db, session.userId);
  expect(
    balance(
      s.accounts.find((a) => a.id === from.id)!,
      s.transactions,
    ),
  ).toBe(70000);
  expect(
    balance(
      s.accounts.find((a) => a.id === to.id)!,
      s.transactions,
    ),
  ).toBe(50000);
  expect(s.transactions).toHaveLength(2);
});

it("keeps a single pending purchase reserved and clears it once after a new checkpoint even for an older API caller", async () => {
  const account = await setup();
  await post(purchase(account.id, { date: "2026-01-02", status: "pending" }));
  await post({
    kind: "correctOpening",
    id: account.id,
    opening: 100000,
    asOf: "2026-01-02",
  });
  let s = await state(db, session.userId);
  const tx = s.transactions[0];
  expect(forecast(s, "2026-01-02", 7).days[1].amount).toBe(81500);
  const fields = { ...tx };
  delete fields.balanceImpact;
  delete fields.balanceAnchor;
  const proposal = await propose(db, session, {
    ...fields,
    kind: "editTransaction",
    status: "cleared",
  } as Operation);
  expect(proposal.impact?.accounts[0].after).toBe(81500);
  await post({
    ...fields,
    kind: "editTransaction",
    status: "cleared",
  } as Operation);
  s = await state(db, session.userId);
  expect(s.transactions).toHaveLength(1);
  expect(balance(s.accounts[0], s.transactions)).toBe(81500);
  expect(budgetProgress(s, "2026-01", "2026-01-02").totalActual).toBe(18500);
});
