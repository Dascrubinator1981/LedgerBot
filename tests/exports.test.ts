import { describe, it, expect } from "vitest";
import { financialExport, ledgerCsv, safeCsvText } from "../src/lib/exports";
import type { FinanceState } from "../src/lib/domain";
const base: FinanceState = {
  accounts: [
    {
      id: "synthetic-account",
      name: "=SUM(1,2)",
      type: "checking",
      opening: 0,
      asOf: "2026-01-01",
      currency: "USD",
    },
  ],
  categories: [],
  transactions: [
    {
      id: "synthetic-entry",
      accountId: "synthetic-account",
      date: "2026-01-02",
      description: ' =HYPERLINK("https://example.invalid")',
      amount: -100,
      status: "cleared",
      transferId: null,
      reconciledAt: null,
      splits: [],
      flow: "expense",
    },
  ],
  budgets: [],
  recurrences: [],
  occurrences: [],
  proposals: [],
  revision: 1,
  settings: { setup: "skipped", promotions: false, timezone: "Etc/UTC" },
};
describe("owner financial export", () => {
  it("exports an explicit financial schema, never injected auth fields", () => {
    const result = financialExport({
      ...base,
      password: "synthetic-private-value",
      csrf: "synthetic-request-token",
    } as FinanceState);
    const text = JSON.stringify(result);
    expect(text).not.toContain("synthetic-private-value");
    expect(text).not.toContain("synthetic-request-token");
    expect(result.transactions).toHaveLength(1);
    expect(result).not.toHaveProperty("proposals");
  });
  it("includes drafts only by explicit choice", () =>
    expect(financialExport(base, true)).toHaveProperty("proposals", []));
  it("guards spreadsheet formulas while keeping controlled minor-unit numbers exact", () => {
    const csv = ledgerCsv(base);
    expect(csv).toContain('"\'=SUM(1,2)"');
    expect(csv).toContain("\"' =HYPERLINK(");
    expect(csv).toContain(",-100,");
  });
  it.each(["=1+1", "+1+1", "-danger", "@x", "\tcommand", "\u200B=1"])(
    "quotes dangerous text %s",
    (value) => expect(safeCsvText(value)).toMatch(/^"'/),
  );
});
