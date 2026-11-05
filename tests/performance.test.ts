import { it, expect } from "vitest";
import { mkdirSync, writeFileSync } from "node:fs";
import { forecast, type FinanceState } from "../src/lib/domain";
import { budgetProgress, recentPaidBills } from "../src/lib/insights";
it("measures shared projections over 10,000 synthetic ledger rows without changing exact results", () => {
  const state: FinanceState = {
    accounts: [
      {
        id: "a",
        name: "Synthetic benchmark pocket",
        type: "checking",
        opening: 1000000,
        asOf: "2026-01-01",
        currency: "USD",
      },
    ],
    categories: [{ id: "c", name: "Synthetic category" }],
    budgets: [{ id: "b", categoryId: "c", month: "2026-11", target: 20000 }],
    transactions: Array.from({ length: 10000 }, (_, i) => ({
      id: String(i),
      accountId: "a",
      date: "2026-11-01",
      description: "Synthetic benchmark expense",
      amount: -1,
      flow: "expense" as const,
      status: "cleared",
      transferId: null,
      reconciledAt: null,
      splits: [{ categoryId: "c", amount: -1 }],
    })),
    recurrences: [],
    proposals: [],
    occurrences: [],
    revision: 0,
    settings: { setup: "skipped", promotions: false, timezone: "Etc/UTC" },
  };
  const started = performance.now();
  const budget = budgetProgress(state, "2026-11", "2026-11-05"),
    projection = forecast(state, "2026-11-05", 90),
    paid = recentPaidBills(state, "2026-11-05");
  const elapsed = performance.now() - started;
  mkdirSync("data", { recursive: true, mode: 0o700 });
  writeFileSync(
    "data/synthetic-performance.json",
    JSON.stringify({
      rows: 10000,
      calculationMs: elapsed,
      runtime: process.version,
      measuredAt: new Date().toISOString(),
      scope: "in-process budget, 90-day forecast, recent bills only",
    }),
    { mode: 0o600 },
  );
  expect(budget.totalActual).toBe(10000);
  expect(budget.series[4].actual).toBe(10000);
  expect(projection.opening).toBe(990000);
  expect(projection.days.at(-1)?.amount).toBe(990000);
  expect(paid).toEqual([]);
  console.info(
    `Synthetic benchmark: 10000 ledger rows; shared budget + 90-day forecast + recent bills: ${elapsed.toFixed(1)}ms. In-process only; not a database or hosted load test.`,
  );
});
