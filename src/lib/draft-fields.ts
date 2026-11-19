import type { SingleOperation } from "./domain";
// Compatibility fallback for saved edits made before original form values were retained.
export function originalDraftValues(
  operation: SingleOperation,
  previous: [string, string][] = [],
): [string, string][] {
  const values = new Map(
    previous.filter(
      ([key]) =>
        !key.startsWith("newCategory") && !/^category-|^splitAmount-/.test(key),
    ),
  );
  const money = (n: number) =>
    `${n < 0 ? "-" : ""}${Math.floor(Math.abs(n) / 100)}.${String(Math.abs(n) % 100).padStart(2, "0")}`;
  const set = (key: string, value: unknown) => {
    if (value !== undefined)
      values.set(key, value === null ? "" : String(value));
  };
  for (const key of [
    "id",
    "accountId",
    "fromId",
    "toId",
    "date",
    "description",
    "status",
    "name",
    "type",
    "asOf",
    "openingBasis",
    "start",
    "cadence",
    "clearingDays",
    "month",
    "categoryId",
    "recurrenceId",
    "dueDate",
    "expectedClearDate",
  ] as const)
    if (key in operation)
      set(key, (operation as unknown as Record<string, unknown>)[key]);
  for (const key of ["amount", "opening", "target", "statement"] as const) {
    if (key in operation) {
      const amount = (operation as unknown as Record<string, unknown>)[key];
      set(key, typeof amount === "number" ? money(amount) : "");
    }
  }
  if (
    operation.kind === "transaction" ||
    operation.kind === "editTransaction"
  ) {
    set("flow", operation.flow || "auto");
    values.delete("includedInOpening");
    if (operation.balanceImpact === "included") set("includedInOpening", "on");
    operation.splits.forEach((split, i) => {
      set(`category-${i}`, split.categoryId);
      set(`splitAmount-${i}`, money(split.amount));
    });
  }
  if (operation.kind === "transfer" || operation.kind === "editTransfer") {
    values.delete("fromIncluded");
    values.delete("toIncluded");
    if (operation.fromBalanceImpact === "included") set("fromIncluded", "on");
    if (operation.toBalanceImpact === "included") set("toIncluded", "on");
  }
  if ("occurrence" in operation) {
    const prefix =
      operation.kind === "transfer" || operation.kind === "editTransfer"
        ? "transferBill"
        : "bill";
    set(`${prefix}Rule`, operation.occurrence?.recurrenceId || "");
    set(`${prefix}Due`, operation.occurrence?.dueDate || "");
    values.delete(`${prefix}Settles`);
    if (operation.occurrence?.settles) set(`${prefix}Settles`, "on");
  }
  if (operation.kind === "budget") {
    if (!operation.newCategory) values.delete("newBudgetCategory");
    if (operation.newCategory) {
      set("categoryId", "+add");
      set("newBudgetCategory", operation.newCategory.name);
    }
    set("target", money(operation.period?.amount ?? operation.target));
    set("cadence", operation.period?.cadence || "monthly");
    set("anchor", operation.period?.anchor || `${operation.month}-01`);
  }
  return [...values].filter(
    ([key]) => !/password|token|secret|csrf|email/i.test(key),
  );
}
