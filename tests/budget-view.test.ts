import { describe, it, expect } from "vitest";
import type { FinanceState, Transaction } from "../src/lib/domain";
import { budgetView, UNCATEGORIZED } from "../src/lib/budget-view";
import { budgetProgress } from "../src/lib/insights";
const transaction = (overrides: Partial<Transaction>): Transaction => ({
  id: "split",
  accountId: "a",
  date: "2026-11-02",
  description: "Synthetic split purchase",
  amount: -1200,
  status: "cleared",
  flow: "expense",
  transferId: null,
  reconciledAt: null,
  splits: [
    { categoryId: "g", amount: -700 },
    { categoryId: "f", amount: -500 },
  ],
  ...overrides,
});
const state: FinanceState = {
  accounts: [],
  categories: [
    { id: "g", name: "Groceries" },
    { id: "f", name: "Fuel" },
  ],
  budgets: [
    { id: "bg", categoryId: "g", month: "2026-11", target: 1000 },
    { id: "bf", categoryId: "f", month: "2026-11", target: 1000 },
  ],
  transactions: [
    transaction({}),
    transaction({
      id: "refund",
      amount: 200,
      flow: "refund",
      splits: [{ categoryId: "g", amount: 200 }],
    }),
    transaction({
      id: "pending",
      amount: -100,
      status: "pending",
      splits: [{ categoryId: "g", amount: -100 }],
    }),
    transaction({
      id: "uncategorized",
      accountId: "b",
      amount: -100,
      splits: [],
    }),
    transaction({
      id: "income",
      amount: 5000,
      flow: "income",
      splits: [{ categoryId: "g", amount: 5000 }],
    }),
  ],
  recurrences: [],
  proposals: [],
  revision: 1,
  settings: { setup: "skipped", promotions: false },
};
const progress = (filters: Parameters<typeof budgetView>[1]) =>
  budgetProgress(budgetView(state, filters), "2026-11", "2026-11-05");
describe("read-only budget drill-down", () => {
  it("counts only selected split portions and refunds; keeps pending separate", () => {
    const before = JSON.stringify(state);
    const result = progress({ categoryIds: ["g"] });
    expect(result.totalActual).toBe(500);
    expect(result.totalTarget).toBe(1000);
    expect(result.pending).toBe(100);
    expect(result.series[4].actual).toBe(500);
    expect(JSON.stringify(state)).toBe(before);
  });
  it("restores exact overall totals when filters clear and includes uncategorized", () => {
    expect(progress({}).totalActual).toBe(1100);
    expect(progress({ categoryIds: [UNCATEGORIZED] }).totalActual).toBe(100);
    expect(progress({ categoryIds: ["f"] }).totalActual).toBe(500);
    expect(progress({ categoryIds: [] }).totalActual).toBe(0);
    expect(progress({ categoryIds: [] }).configured).toBe(false);
  });
  it("filters account actuals without inventing account-specific targets", () => {
    const result = progress({ accountId: "b" });
    expect(result.totalActual).toBe(100);
    expect(result.totalTarget).toBe(2000);
    expect(progress({ accountId: "foreign" }).totalActual).toBe(0);
  });
});
