import { money, type FinanceState, type SingleOperation } from "./domain";
export function operationSummary(
  op: SingleOperation,
  state: FinanceState,
): { title: string; detail: string } {
  const account = (id: string) =>
    state.accounts.find((a) => a.id === id)?.name || "Account";
  const category = (id: string) =>
    state.categories.find((c) => c.id === id)?.name || "New category";
  switch (op.kind) {
    case "account":
      return {
        title: `Add ${op.name}`,
        detail: `${op.type} · ${money(op.opening)}${["credit", "loan", "liability"].includes(op.type) ? " owed" : ""} · ${op.asOf} · ${op.openingBasis === "start-of-day" ? "before the day’s entries" : "closing snapshot"}`,
      };
    case "transaction":
    case "editTransaction":
      return {
        title: `${op.kind === "editTransaction" ? "Edit" : "Add"} ${op.description}`,
        detail: `${account(op.accountId)} · ${money(op.amount)} · ${op.date} · ${op.status}${op.balanceImpact === "included" ? " · already in starting balance" : ""}${op.splits.length ? " · " + op.splits.map((s) => `${category(s.categoryId)} ${money(s.amount)}`).join(", ") : " · uncategorized"}`,
      };
    case "transfer":
    case "editTransfer":
      return {
        title:
          op.kind === "editTransfer"
            ? "Edit transfer"
            : "Transfer / card payment",
        detail: `${account(op.fromId)} → ${account(op.toId)} · ${money(op.amount)} · ${op.date} · ${op.status}`,
      };
    case "category":
      return { title: "Add category", detail: op.name };
    case "budget":
      return {
        title: `Budget: ${op.newCategory?.name || category(op.categoryId)}`,
        detail: `${op.month} · ${money(op.period?.amount ?? op.target)} ${op.period?.cadence || "monthly"}${op.period ? " · from " + op.period.anchor : ""}`,
      };
    case "renameAccount":
      return { title: `Rename ${account(op.id)}`, detail: op.name };
    case "renameCategory":
      return { title: `Rename ${category(op.id)}`, detail: op.name };
    case "correctOpening":
      return {
        title: `Starting balance: ${account(op.id)}`,
        detail: `${money(op.opening)} · ${op.asOf} · ${op.openingBasis === "start-of-day" ? "before the day’s entries" : "closing snapshot"}`,
      };
    case "recurrence":
    case "editRecurrence":
      return {
        title: `${op.kind === "recurrence" ? "Add" : "Edit"} schedule: ${op.name}`,
        detail: `${account(op.accountId)} · ${money(op.amount)} · ${op.cadence} from ${op.start} · ${op.clearingDays} day clearing delay`,
      };
    case "deleteTransaction": {
      const t = state.transactions.find((t) => t.id === op.id);
      return {
        title: "Delete entry",
        detail: t
          ? `${t.description} · ${money(t.amount)} · ${account(t.accountId)}${t.transferId ? " · both transfer legs" : ""}`
          : "Selected entry",
      };
    }
    case "reconcile":
      return {
        title: `Reconcile ${account(op.accountId)}`,
        detail: `${money(op.statement)} through ${op.date}`,
      };
    default:
      return {
        title:
          {
            unmatchOccurrence: "Unlink payment",
            restoreTransaction: "Restore deleted entry",
            pauseRecurrence: "Pause / resume schedule",
            archiveRecurrence: "Archive schedule",
            occurrence: "Change expected bill",
            matchOccurrence: "Link existing payment",
            settleTransfer: "Clear transfer",
          }[op.kind] || "Review change",
        detail: "Inspect the exact details before confirming.",
      };
  }
}
