import { it, expect } from "vitest";
import { periodBudgetTarget } from "../src/lib/budget-period";
it("counts actual weeks instead of estimating four per month", () => {
  expect(
    periodBudgetTarget("2026-05", {
      cadence: "weekly",
      anchor: "2026-05-01",
      amount: 10001,
    }),
  ).toEqual({ count: 5, target: 50005 });
  expect(
    periodBudgetTarget("2026-02", {
      cadence: "weekly",
      anchor: "2026-01-02",
      amount: 10000,
    }),
  ).toEqual({ count: 4, target: 40000 });
});
it("anchors biweekly and quarterly targets without monthly rounding", () => {
  expect(
    periodBudgetTarget("2026-05", {
      cadence: "biweekly",
      anchor: "2026-05-01",
      amount: 10001,
    }),
  ).toEqual({ count: 3, target: 30003 });
  expect(
    periodBudgetTarget("2026-05", {
      cadence: "quarterly",
      anchor: "2026-01-31",
      amount: 10001,
    }),
  ).toEqual({ count: 0, target: 0 });
  expect(
    periodBudgetTarget("2026-04", {
      cadence: "quarterly",
      anchor: "2026-01-31",
      amount: 10001,
    }),
  ).toEqual({ count: 1, target: 10001 });
  expect(
    periodBudgetTarget("2028-02", {
      cadence: "monthly",
      anchor: "2026-01-31",
      amount: 10001,
    }),
  ).toEqual({ count: 1, target: 10001 });
  expect(() =>
    periodBudgetTarget("2026-05", {
      cadence: "weekly",
      anchor: "2026-05-01",
      amount: 100000000000,
    }),
  ).toThrow();
});
