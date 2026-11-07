import { it, expect } from "vitest";
import {
  forecastAssessment,
  periodForecast,
  weekBounds,
} from "../src/lib/forecast-dashboard";
import { defaultForecastPreferences } from "../src/lib/forecast-preferences";
import type { FinanceState } from "../src/lib/domain";
const base = (): FinanceState => ({
  accounts: [
    {
      id: "cash",
      name: "Synthetic cash",
      type: "checking",
      opening: 100000,
      asOf: "2026-11-06",
      openingBasis: "start-of-day",
      currency: "USD",
    },
  ],
  transactions: [],
  categories: [{ id: "food", name: "Food" }],
  budgets: [{ id: "b", categoryId: "food", month: "2026-11", target: 10000 }],
  recurrences: [
    {
      id: "bill",
      accountId: "cash",
      name: "Synthetic bill",
      amount: -1000,
      start: "2026-11-10",
      cadence: "monthly",
      clearingDays: 0,
    },
    {
      id: "pay",
      accountId: "cash",
      name: "Synthetic pay",
      amount: 10000,
      start: "2026-11-15",
      cadence: "monthly",
      clearingDays: 0,
    },
  ],
  proposals: [],
  revision: 0,
  settings: {
    setup: "complete",
    promotions: false,
    timezone: "Etc/UTC",
    forecaster: defaultForecastPreferences(),
  },
});
it("warns about discretionary limits without treating matched bills as yellow", () => {
  const s = base();
  s.transactions.push({
    id: "t",
    accountId: "cash",
    date: "2026-11-06",
    description: "Synthetic spending",
    amount: -9000,
    status: "cleared",
    flow: "expense",
    transferId: null,
    reconciledAt: null,
    splits: [{ categoryId: "food", amount: -9000 }],
  });
  expect(forecastAssessment(s, "2026-11-06").level).toBe("yellow");
  s.transactions[0].occurrence = {
    recurrenceId: "bill",
    dueDate: "2026-11-10",
    settles: true,
  };
  expect(forecastAssessment(s, "2026-11-06").level).toBe("green");
  s.transactions[0].splits[0].amount = -11000;
  s.transactions[0].amount = -11000;
  expect(forecastAssessment(s, "2026-11-06").level).toBe("red");
});
it("identifies the actually overdrawn account even when combined cash is positive", () => {
  const s = base();
  s.accounts.push({
    ...s.accounts[0],
    id: "overdrawn",
    name: "Synthetic overdraft",
    opening: -100,
  });
  const risk = forecastAssessment(s, "2026-11-06");
  expect(risk.level).toBe("red");
  expect(risk.overdrawn).toEqual(["overdrawn"]);
  s.accounts[1].opening = null;
  s.accounts[0].opening = null;
  expect(forecastAssessment(s, "2026-11-06").level).toBe("unknown");
});
it("uses Sunday-Saturday and never counts internal transfers as paid expenses", () => {
  expect(weekBounds("2026-11-06")).toEqual({
    start: "2026-11-01",
    end: "2026-11-07",
  });
  const s = base();
  s.transactions.push({
    id: "t",
    accountId: "cash",
    date: "2026-11-06",
    description: "Synthetic transfer",
    amount: -1000,
    status: "cleared",
    transferId: "pair",
    reconciledAt: null,
    splits: [],
  });
  const rows = periodForecast(s, "2026-11-06", "2026-11-07", "2026-11-06");
  expect(rows[0].paid).toBe(0);
  expect(rows[0].balances[0].amount).toBe(99000);
  expect(rows).toHaveLength(2);
});

it("includes approved pending spending in budget pressure without calling it cleared or treating bills as discretionary yellow", () => {
  const s = base();
  s.transactions.push({
    id: "planned",
    accountId: "cash",
    date: "2026-11-07",
    description: "Synthetic planned grocery",
    amount: -9000,
    status: "pending",
    flow: "expense",
    transferId: null,
    reconciledAt: null,
    splits: [{ categoryId: "food", amount: -9000 }],
  });
  expect(forecastAssessment(s, "2026-11-06").level).toBe("yellow");
  s.transactions[0].occurrence = {
    recurrenceId: "bill",
    dueDate: "2026-11-10",
    settles: true,
  };
  expect(forecastAssessment(s, "2026-11-06").level).toBe("green");
  s.transactions[0].amount = -11000;
  s.transactions[0].splits[0].amount = -11000;
  const result = forecastAssessment(s, "2026-11-06");
  expect(result.level).toBe("red");
  expect(result.reasons.join(" ")).toContain("not cleared spending yet");
});
