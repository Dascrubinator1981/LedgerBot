import { afterOpening } from "./domain";
import {
  addDays,
  sumMoney,
  liability,
  type Account,
  type FinanceState,
  type Transaction,
} from "./domain";
export function recentPaidBills(
  state: Pick<FinanceState, "transactions" | "recurrences">,
  today: string,
) {
  const first = addDays(today, -6);
  return state.transactions
    .filter(
      (t) =>
        t.status === "cleared" &&
        t.amount < 0 &&
        t.date >= first &&
        t.date <= today &&
        t.occurrence &&
        state.recurrences.some(
          (r) => r.id === t.occurrence!.recurrenceId && r.amount < 0,
        ),
    )
    .map((t) => ({
      transactionId: t.id,
      name: state.recurrences.find((r) => r.id === t.occurrence!.recurrenceId)!
        .name,
      paidOn: t.date,
      dueDate: t.occurrence!.dueDate,
      amount: -t.amount,
      settled: t.occurrence!.settles,
    }))
    .sort(
      (a, b) =>
        b.paidOn.localeCompare(a.paidOn) ||
        a.transactionId.localeCompare(b.transactionId),
    );
}
export function budgetProgress(
  state: Pick<FinanceState, "budgets" | "categories" | "transactions">,
  month: string,
  today: string,
) {
  const [year, number] = month.split("-").map(Number),
    count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const elapsed =
    month < today.slice(0, 7)
      ? count
      : month > today.slice(0, 7)
        ? 0
        : Number(today.slice(8));
  const budgets = state.budgets.filter((b) => b.month === month),
    targetIds = new Set(budgets.map((b) => b.categoryId));
  const categoryAmounts = new Map<string, number[]>(),
    daily = new Map<string, number[]>();
  const uncategorized: number[] = [],
    unbudgeted: number[] = [],
    pending: number[] = [],
    allSpending: number[] = [],
    unclassifiedPositive: number[] = [];
  for (const t of state.transactions) {
    if (t.transferId || !t.date.startsWith(month)) continue;
    const spending =
      t.flow !== "income" &&
      (t.amount < 0 || t.flow === "refund" || (!t.flow && t.splits.length > 0));
    if (!t.flow && t.amount > 0) unclassifiedPositive.push(t.amount);
    if (t.status === "pending") {
      if (spending) pending.push(-t.amount);
      continue;
    }
    if (t.status !== "cleared" || !spending) continue;
    allSpending.push(-t.amount);
    const byDay = daily.get(t.date) || [];
    byDay.push(-t.amount);
    daily.set(t.date, byDay);
    if (!t.splits.length) uncategorized.push(-t.amount);
    for (const split of t.splits) {
      const values = categoryAmounts.get(split.categoryId) || [];
      values.push(-split.amount);
      categoryAmounts.set(split.categoryId, values);
      if (!targetIds.has(split.categoryId)) unbudgeted.push(-split.amount);
    }
  }
  const rows = budgets.map((b) => {
    const actual = sumMoney(categoryAmounts.get(b.categoryId) || []),
      expected = Number((BigInt(b.target) * BigInt(elapsed)) / BigInt(count));
    return {
      id: b.id,
      name:
        state.categories.find((c) => c.id === b.categoryId)?.name ||
        "Unnamed category",
      categoryId: b.categoryId,
      target: b.target,
      actual,
      expected,
      remaining: sumMoney([b.target, -actual]),
      status:
        actual > b.target
          ? "Over budget"
          : actual > expected && elapsed < count
            ? "Ahead of planned pace"
            : "On plan",
    };
  });
  const totalTarget = sumMoney(rows.map((r) => r.target)),
    totalActual = sumMoney(allSpending);
  let running = 0;
  const series = Array.from({ length: count }, (_, i) => {
    const day = `${month}-${String(i + 1).padStart(2, "0")}`;
    running = sumMoney([running, ...(daily.get(day) || [])]);
    return {
      date: day,
      planned: Number((BigInt(totalTarget) * BigInt(i + 1)) / BigInt(count)),
      actual: day > today ? null : running,
    };
  });
  const expectedToDate = Number(
    (BigInt(totalTarget) * BigInt(elapsed)) / BigInt(count),
  );
  return {
    rows,
    series,
    totalTarget,
    totalActual,
    remaining: sumMoney([totalTarget, -totalActual]),
    uncategorized: sumMoney(uncategorized),
    unbudgeted: sumMoney(unbudgeted),
    unclassifiedPositive: sumMoney(unclassifiedPositive),
    pending: sumMoney(pending),
    configured: rows.length > 0,
    status: !rows.length
      ? "Not set up yet"
      : totalActual > totalTarget
        ? "Over budget"
        : totalActual > expectedToDate && elapsed < count
          ? "Ahead of planned pace"
          : "On plan",
  };
}
export function runningBalances(account: Account, transactions: Transaction[]) {
  const sorted = [...transactions]
      .filter((t) => t.accountId === account.id)
      .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
    values = new Map<string, number | null>();
  let signed =
    account.opening === null
      ? null
      : account.opening * (liability(account) ? -1 : 1);
  for (const t of sorted) {
    if (t.date < account.asOf) {
      values.set(t.id, null);
      continue;
    }
    if (
      signed !== null &&
      afterOpening(account, t.date) &&
      t.status === "cleared"
    )
      signed = sumMoney([signed, t.amount]);
    values.set(
      t.id,
      signed === null
        ? null
        : signed === 0
          ? 0
          : signed * (liability(account) ? -1 : 1),
    );
  }
  return values;
}
