import {
  balance,
  forecast,
  civilToday,
  addDays,
  netWorth,
  type FinanceState,
  type Operation,
  type Transaction,
} from "./domain";
import { budgetProgress } from "./insights";
export type Impact = {
  accounts: {
    name: string;
    before: number | null;
    after: number | null;
    owed: boolean;
  }[];
  netWorthBefore: number | null;
  netWorthAfter: number | null;
  plan?: {
    month: string;
    targetBefore: number;
    targetAfter: number;
    actualBefore: number;
    actualAfter: number;
  };
  projection?: {
    asOf: string;
    lowestBefore: number | null;
    lowestAfter: number | null;
  };
};
// A pure, nonpersisting view of the exact canonical balance changes. No database writes.
export function financialImpact(state: FinanceState, op: Operation): Impact {
  const accounts = [...state.accounts];
  let transactions = [...state.transactions];
  let recurrences = [...state.recurrences],
    budgets = [...state.budgets];
  let occurrences = [...(state.occurrences || [])];
  if (op.kind === "renameAccount" || op.kind === "correctOpening") {
    const index = accounts.findIndex((a) => a.id === op.id);
    if (index >= 0)
      accounts[index] =
        op.kind === "renameAccount"
          ? { ...accounts[index], name: op.name }
          : { ...accounts[index], opening: op.opening, asOf: op.asOf };
  }
  if (op.kind === "account")
    accounts.push({
      id: "preview-account",
      name: op.name,
      type: op.type,
      opening: op.opening,
      asOf: op.asOf,
      currency: "USD",
    });
  if (op.kind === "transaction" || op.kind === "editTransaction") {
    if (op.kind === "editTransaction")
      transactions = transactions.filter((t) => t.id !== op.id);
    transactions.push({
      ...op,
      id: "preview-transaction",
      transferId: null,
      reconciledAt: null,
    });
  }
  if (op.kind === "deleteTransaction") {
    const old = transactions.find((t) => t.id === op.id);
    transactions = transactions.filter((t) =>
      old?.transferId ? t.transferId !== old.transferId : t.id !== op.id,
    );
  }
  if (op.kind === "transfer")
    for (const [accountId, amount] of [
      [op.fromId, -op.amount],
      [op.toId, op.amount],
    ] as const)
      transactions.push({
        id: `preview-${accountId}`,
        accountId,
        amount,
        date: op.date,
        description: op.description,
        status: op.status,
        transferId: "preview-transfer",
        reconciledAt: null,
        splits: [],
        ...(amount < 0 && op.occurrence ? { occurrence: op.occurrence } : {}),
      } satisfies Transaction);
  if (op.kind === "settleTransfer") {
    const old = transactions.find((t) => t.id === op.id);
    transactions = transactions.map((t) =>
      t.transferId === old?.transferId
        ? { ...t, date: op.date, status: "cleared" }
        : t,
    );
  }
  if (op.kind === "editTransfer") {
    const old = transactions.find((t) => t.id === op.id);
    transactions = transactions.map((t) =>
      t.transferId !== old?.transferId
        ? t
        : {
            ...t,
            accountId: t.amount < 0 ? op.fromId : op.toId,
            amount: t.amount < 0 ? -op.amount : op.amount,
            status: op.status,
            date: op.date,
            description: op.description,
            occurrence: t.amount < 0 ? op.occurrence : null,
          },
    );
  }
  if (op.kind === "restoreTransaction")
    transactions.push(...(op.entries || []));
  if (op.kind === "matchOccurrence" || op.kind === "unmatchOccurrence")
    transactions = transactions.map((t) => {
      if (t.id !== op.transactionId) return t;
      const value = { ...t };
      if (op.kind === "unmatchOccurrence") delete value.occurrence;
      else
        value.occurrence = {
          recurrenceId: op.recurrenceId,
          dueDate: op.dueDate,
          settles: op.settles,
        };
      return value;
    });
  if (op.kind === "recurrence") recurrences.push({ ...op, id: "preview-rule" });
  if (
    op.kind === "editRecurrence" ||
    op.kind === "pauseRecurrence" ||
    op.kind === "archiveRecurrence"
  )
    recurrences = recurrences.map((r) =>
      r.id !== op.id
        ? r
        : op.kind === "editRecurrence"
          ? { ...r, ...op }
          : op.kind === "pauseRecurrence"
            ? { ...r, active: !op.paused }
            : { ...r, active: false, archived: true },
    );
  if (op.kind === "budget") {
    budgets = budgets.filter(
      (b) => b.categoryId !== op.categoryId || b.month !== op.month,
    );
    budgets.push({ ...op, id: "preview-budget" });
  }
  if (op.kind === "occurrence") {
    const rule = recurrences.find((r) => r.id === op.recurrenceId);
    if (rule) {
      occurrences = occurrences.filter(
        (o) => o.recurrenceId !== rule.id || o.dueDate !== op.dueDate,
      );
      occurrences.push({
        ...op,
        id: "preview-occurrence",
        amount: rule.amount,
      });
    }
  }
  for (const t of transactions) {
    const ref = t.occurrence;
    if (
      !ref ||
      occurrences.some(
        (o) => o.recurrenceId === ref.recurrenceId && o.dueDate === ref.dueDate,
      )
    )
      continue;
    const rule = recurrences.find((r) => r.id === ref.recurrenceId);
    if (rule)
      occurrences.push({
        id: `preview-${t.id}`,
        recurrenceId: rule.id,
        dueDate: ref.dueDate,
        expectedClearDate: addDays(ref.dueDate, rule.clearingDays),
        amount: rule.amount,
        status: "unpaid",
      });
  }
  const after = {
    ...state,
    accounts,
    transactions,
    recurrences,
    budgets,
    occurrences,
  };
  const today = civilToday(state.settings.timezone),
    month =
      op.kind === "budget"
        ? op.month
        : "date" in op
          ? op.date.slice(0, 7)
          : today.slice(0, 7);
  const beforeBudget = budgetProgress(state, month, today),
    afterBudget = budgetProgress(after, month, today);
  const low = (s: FinanceState) => {
    const values = forecast(s, today, 30)
      .days.map((d) => d.amount)
      .filter((v) => v !== null);
    return values.length ? Math.min(...values) : null;
  };
  return {
    accounts: accounts.map((a) => ({
      name: a.name,
      before: state.accounts.some((old) => old.id === a.id)
        ? balance(
            state.accounts.find((old) => old.id === a.id)!,
            state.transactions,
          )
        : null,
      after: balance(a, transactions),
      owed: ["credit", "loan", "liability"].includes(a.type),
    })),
    netWorthBefore: netWorth(state.accounts, state.transactions),
    netWorthAfter: netWorth(accounts, transactions),
    plan: {
      month,
      targetBefore: beforeBudget.totalTarget,
      targetAfter: afterBudget.totalTarget,
      actualBefore: beforeBudget.totalActual,
      actualAfter: afterBudget.totalActual,
    },
    projection: {
      asOf: today,
      lowestBefore: low(state),
      lowestAfter: low(after),
    },
  };
}
