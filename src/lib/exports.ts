import { affectsBalance, money, type FinanceState } from "./domain";
export function financialExport(state: FinanceState, includeDrafts = false) {
  return {
    formatVersion: 2,
    currency: "USD",
    accounts: state.accounts,
    categories: state.categories,
    transactions: state.transactions,
    budgets: state.budgets,
    recurrences: state.recurrences,
    occurrences: state.occurrences || [],
    reconciliations: state.reconciliations || [],
    preferences: state.settings,
    ...(includeDrafts ? { proposals: state.proposals } : {}),
  };
}
export function safeCsvText(value: string) {
  const safe =
    /^[\s\uFEFF\u200B]*[=+\-@]/u.test(value) || /^[\t\r\n]/.test(value)
      ? `'${value}`
      : value;
  return `"${safe.replaceAll('"', '""')}"`;
}
export function ledgerCsv(state: FinanceState) {
  const headers = [
    "record_id",
    "date",
    "account",
    "description",
    "amount_minor",
    "amount_usd",
    "status",
    "entry_type",
    "transfer_group",
    "bill_or_income_schedule",
    "occurrence_due",
    "category_allocations",
    "starting_balance_treatment",
    "affects_current_balance_when_cleared",
  ];
  const rows = state.transactions.map((t) =>
    [
      safeCsvText(t.id),
      safeCsvText(t.date),
      safeCsvText(state.accounts.find((a) => a.id === t.accountId)?.name || ""),
      safeCsvText(t.description),
      String(t.amount),
      safeCsvText(money(t.amount)),
      safeCsvText(t.status),
      safeCsvText(t.transferId ? "transfer" : t.flow || "legacy-unspecified"),
      safeCsvText(t.transferId || ""),
      safeCsvText(
        state.recurrences.find((r) => r.id === t.occurrence?.recurrenceId)
          ?.name || "",
      ),
      safeCsvText(t.occurrence?.dueDate || ""),
      safeCsvText(
        JSON.stringify(
          t.splits.map((s) => ({
            category:
              state.categories.find((c) => c.id === s.categoryId)?.name || "",
            amountMinor: s.amount,
          })),
        ),
      ),
      safeCsvText(t.balanceImpact || "legacy-date-rule"),
      safeCsvText(
        state.accounts.some((a) => a.id === t.accountId && affectsBalance(a, t))
          ? "yes"
          : "no",
      ),
    ].join(","),
  );
  return [headers.join(","), ...rows].join("\r\n") + "\r\n";
}
