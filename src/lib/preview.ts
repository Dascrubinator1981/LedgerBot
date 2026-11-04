import {
  balance,
  netWorth,
  type FinanceState,
  type Operation,
  type Transaction,
} from "./domain";
export type Impact = {
  accounts: {
    name: string;
    before: number | null;
    after: number | null;
    owed: boolean;
  }[];
  netWorthBefore: number | null;
  netWorthAfter: number | null;
};
// A pure, nonpersisting view of the exact canonical balance changes. No database writes.
export function financialImpact(state: FinanceState, op: Operation): Impact {
  const accounts = [...state.accounts];
  let transactions = [...state.transactions];
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
      } satisfies Transaction);
  return {
    accounts: accounts.map((a) => ({
      name: a.name,
      before: state.accounts.some((old) => old.id === a.id)
        ? balance(a, state.transactions)
        : null,
      after: balance(a, transactions),
      owed: ["credit", "loan", "liability"].includes(a.type),
    })),
    netWorthBefore: netWorth(state.accounts, state.transactions),
    netWorthAfter: netWorth(accounts, transactions),
  };
}
