import { affectsBalance } from "./domain";
import { balance, sumMoney, type FinanceState } from "./domain";
export function investigateReconciliation(
  state: FinanceState,
  accountId: string,
  through: string,
  displayedStatement: number,
) {
  const account = state.accounts.find((a) => a.id === accountId);
  if (!account) return null;
  const actual = balance(account, state.transactions, through);
  const statement = displayedStatement;
  const entries = state.transactions.filter(
    (t) =>
      t.accountId === accountId &&
      affectsBalance(account, t) &&
      t.date <= through,
  );
  const difference = actual === null ? null : sumMoney([statement, -actual]);
  return {
    actual,
    statement,
    difference,
    opening: account.opening,
    asOf: account.asOf,
    cleared: entries.filter((t) => t.status === "cleared"),
    pending: entries.filter((t) => t.status === "pending"),
  };
}
