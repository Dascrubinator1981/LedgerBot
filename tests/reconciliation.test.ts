import { it, expect } from "vitest";
import { investigateReconciliation } from "../src/lib/reconciliation";
import type { FinanceState } from "../src/lib/domain";
it("investigates exact differences without posting adjustments or counting pending entries", () => {
  const state: FinanceState = {
    accounts: [
      {
        id: "a",
        name: "Synthetic card",
        type: "credit",
        opening: 10000,
        asOf: "2026-01-01",
        currency: "USD",
      },
    ],
    transactions: [
      {
        id: "t",
        accountId: "a",
        date: "2026-01-02",
        description: "Synthetic charge",
        status: "cleared",
        amount: -200,
        splits: [],
        transferId: null,
        reconciledAt: null,
      },
      {
        id: "p",
        accountId: "a",
        date: "2026-01-02",
        description: "Synthetic pending charge",
        status: "pending",
        amount: -300,
        splits: [],
        transferId: null,
        reconciledAt: null,
      },
    ],
    categories: [],
    budgets: [],
    recurrences: [],
    proposals: [],
    revision: 0,
    settings: { setup: "skipped", promotions: false },
  };
  const original = JSON.stringify(state);
  const result = investigateReconciliation(state, "a", "2026-01-03", 10500)!;
  expect(result.actual).toBe(10200);
  expect(result.statement).toBe(10500);
  expect(result.difference).toBe(300);
  expect(result.pending.map((t) => t.id)).toEqual(["p"]);
  expect(result.cleared.map((t) => t.id)).toEqual(["t"]);
  expect(JSON.stringify(state)).toBe(original);
  expect(
    investigateReconciliation(state, "a", "2026-01-03", 10200)?.difference,
  ).toBe(0);
  expect(
    investigateReconciliation(state, "foreign", "2026-01-03", 0),
  ).toBeNull();
});
