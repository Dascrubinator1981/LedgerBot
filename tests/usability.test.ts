import { it, expect } from "vitest";
import { entryAmount } from "../src/lib/transaction-entry";
import {
  forecastPreferencesSchema,
  forecastView,
} from "../src/lib/forecast-preferences";
import type { FinanceState } from "../src/lib/domain";
it("normalizes the owner's positive expense and three splits exactly once", () => {
  expect(entryAmount("185.00", "expense")).toBe(-18500);
  expect(
    ["80", "50", "55"]
      .map((v) => entryAmount(v, "expense"))
      .reduce((a, b) => a + b),
  ).toBe(-18500);
  expect(entryAmount("-185", "expense")).toBe(-18500);
  expect(entryAmount("-2", "refund")).toBe(200);
  expect(entryAmount("185", "auto")).toBe(18500);
  expect(() => entryAmount("1.001", "expense")).toThrow();
});
it("forecast filters preserve the original ledger and reject unsupported horizons", () => {
  const state = {
    accounts: [{ id: "a" }, { id: "b" }],
    transactions: [{ accountId: "a" }, { accountId: "b" }],
    recurrences: [{ accountId: "a" }, { accountId: "b" }],
  } as FinanceState;
  const p = forecastPreferencesSchema.parse({});
  expect(forecastView(state, p)).toBe(state);
  const view = forecastView(state, { ...p, accountIds: ["a"] });
  expect(view.accounts).toHaveLength(1);
  expect(view.transactions).toHaveLength(1);
  expect(view.recurrences).toHaveLength(1);
  expect(state.transactions).toHaveLength(2);
  expect(forecastPreferencesSchema.safeParse({ horizon: 365 }).success).toBe(
    false,
  );
});
