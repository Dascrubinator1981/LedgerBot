import { sumMoney, type FinanceState } from "./domain";
export const UNCATEGORIZED = "uncategorized";
export type BudgetFilter = { categoryIds?: string[]; accountId?: string };
// Read-only projection: select allocations, never duplicate the full amount of a split purchase.
export function budgetView(state: FinanceState, filter: BudgetFilter) {
  const selected = filter.categoryIds ? new Set(filter.categoryIds) : null;
  return {
    budgets: state.budgets.filter(
      (b) => !selected || selected.has(b.categoryId),
    ),
    categories: state.categories,
    transactions: state.transactions.flatMap((t) => {
      if (filter.accountId && t.accountId !== filter.accountId) return [];
      if (!selected) return [t];
      if (!t.splits.length) return selected.has(UNCATEGORIZED) ? [t] : [];
      const splits = t.splits.filter((s) => selected.has(s.categoryId));
      return splits.length
        ? [{ ...t, amount: sumMoney(splits.map((s) => s.amount)), splits }]
        : [];
    }),
  };
}
