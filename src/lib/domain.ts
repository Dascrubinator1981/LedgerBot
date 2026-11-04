import { z } from "zod";

export const MAX_MONEY = 100_000_000_000;
export const minor = z.number().int().min(-MAX_MONEY).max(MAX_MONEY);
export const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const parsed = new Date(`${value}T00:00:00Z`);
    return (
      value >= "2000-01-01" &&
      value <= "2100-12-31" &&
      !Number.isNaN(parsed.valueOf()) &&
      parsed.toISOString().slice(0, 10) === value
    );
  }, "Use a valid calendar date");
const id = z.uuid();
const name = z.string().trim().min(1).max(100);
const status = z.enum(["pending", "cleared"]);
export const splitSchema = z.object({ categoryId: id, amount: minor });
const transactionFields = {
  accountId: id,
  date,
  description: name,
  amount: minor.refine((v) => v !== 0, "Amount cannot be zero"),
  status,
  splits: z.array(splitSchema).max(50),
};
export const operationSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("account"),
    name,
    type: z.enum([
      "checking",
      "savings",
      "cash",
      "credit",
      "loan",
      "asset",
      "liability",
    ]),
    opening: minor.nullable(),
    asOf: date,
  }),
  z.object({ kind: z.literal("category"), name }),
  z.object({ kind: z.literal("transaction"), ...transactionFields }),
  z.object({ kind: z.literal("editTransaction"), id, ...transactionFields }),
  z.object({ kind: z.literal("deleteTransaction"), id }),
  z.object({
    kind: z.literal("transfer"),
    fromId: id,
    toId: id,
    amount: minor.refine((v) => v > 0),
    date,
    description: name,
    status,
  }),
  z.object({
    kind: z.literal("budget"),
    categoryId: id,
    month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/),
    target: minor.refine((v) => v >= 0),
  }),
  z.object({
    kind: z.literal("recurrence"),
    accountId: id,
    name,
    amount: minor.refine((v) => v !== 0),
    start: date,
    cadence: z.enum(["weekly", "biweekly", "monthly"]),
    clearingDays: z.number().int().min(0).max(30),
  }),
  z.object({
    kind: z.literal("reconcile"),
    accountId: id,
    date,
    statement: minor,
  }),
]);
export type Operation = z.infer<typeof operationSchema>;
export type Account = {
  id: string;
  name: string;
  type: string;
  opening: number | null;
  asOf: string;
  currency: string;
};
export type Transaction = {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  transferId: string | null;
  reconciledAt: string | null;
  splits: Split[];
};
export type Split = z.infer<typeof splitSchema>;
export type Category = { id: string; name: string };
export type Budget = {
  id: string;
  categoryId: string;
  month: string;
  target: number;
};
export type Recurrence = {
  id: string;
  accountId: string;
  name: string;
  amount: number;
  start: string;
  cadence: "weekly" | "biweekly" | "monthly";
  clearingDays: number;
};
export type Proposal = {
  id: string;
  version: number;
  digest: string;
  operation: Operation;
  before: unknown;
  impact?: import("./preview").Impact;
  status: string;
  createdAt: number;
  expiresAt: number;
  revision: number;
  source: "human" | "ai";
};
export type FinanceState = {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  recurrences: Recurrence[];
  proposals: Proposal[];
  revision: number;
  settings: { setup: string; promotions: boolean };
};

export function parseMoney(text: string): number {
  if (!/^-?\d{1,10}(\.\d{1,2})?$/.test(text))
    throw new Error("Enter dollars with at most two decimal places");
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace("-", "").split(".");
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return minor.parse(negative ? -value : value);
}
export const money = (value: number | null) =>
  value === null
    ? "Not set up yet"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(value / 100);
export const liability = (account: Account) =>
  ["credit", "loan", "liability"].includes(account.type);
// Ledger amounts use net-worth sign for all accounts. UI displays liabilities as positive owed.
export function balance(
  account: Account,
  transactions: Transaction[],
  through = "9999-12-31",
): number | null {
  if (account.opening === null || through < account.asOf) return null;
  const signed =
    (liability(account) ? -account.opening : account.opening) +
    transactions
      .filter(
        (t) =>
          t.accountId === account.id &&
          t.status === "cleared" &&
          t.date > account.asOf &&
          t.date <= through,
      )
      .reduce((sum, t) => sum + t.amount, 0);
  return liability(account) ? -signed : signed;
}
export function netWorth(
  accounts: Account[],
  transactions: Transaction[],
): number | null {
  if (
    !accounts.length ||
    accounts.some((a) => balance(a, transactions) === null)
  )
    return null;
  return accounts.reduce(
    (sum, a) => sum + balance(a, transactions)! * (liability(a) ? -1 : 1),
    0,
  );
}
export function budgetActual(
  categoryId: string,
  month: string,
  transactions: Transaction[],
): number {
  return -transactions
    .filter(
      (t) =>
        t.status === "cleared" && !t.transferId && t.date.startsWith(month),
    )
    .flatMap((t) => t.splits)
    .filter((s) => s.categoryId === categoryId)
    .reduce((sum, s) => sum + s.amount, 0);
}
export function addDays(day: string, count: number): string {
  const d = new Date(`${day}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + count);
  return d.toISOString().slice(0, 10);
}
export function nextOccurrence(
  start: string,
  cadence: Recurrence["cadence"],
  index: number,
): string {
  if (cadence !== "monthly")
    return addDays(start, index * (cadence === "weekly" ? 7 : 14));
  const d = new Date(`${start}T00:00:00Z`);
  const last = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + index + 1, 0),
  );
  return new Date(
    Date.UTC(
      last.getUTCFullYear(),
      last.getUTCMonth(),
      Math.min(d.getUTCDate(), last.getUTCDate()),
    ),
  )
    .toISOString()
    .slice(0, 10);
}
export function forecast(
  state: Pick<FinanceState, "accounts" | "transactions" | "recurrences">,
  today: string,
  horizon = 30,
) {
  const cash = state.accounts.filter((a) =>
    ["checking", "savings", "cash"].includes(a.type),
  );
  const unknown =
    !cash.length ||
    cash.some((a) => balance(a, state.transactions, today) === null);
  const events: {
    date: string;
    name: string;
    amount: number;
    state: "estimated" | "pending";
  }[] = [];
  for (const rule of state.recurrences.filter((r) =>
    cash.some((a) => a.id === r.accountId),
  )) {
    for (let index = 0; index < 10000; index++) {
      const day = addDays(
        nextOccurrence(rule.start, rule.cadence, index),
        rule.clearingDays,
      );
      if (day > addDays(today, horizon)) break;
      if (day > today)
        events.push({
          date: day,
          name: rule.name,
          amount: rule.amount,
          state: "estimated",
        });
    }
  }
  for (const t of state.transactions.filter(
    (t) => t.status === "pending" && cash.some((a) => a.id === t.accountId),
  ))
    events.push({
      date: t.date > today ? t.date : addDays(today, 1),
      name: t.description,
      amount: t.amount,
      state: "pending",
    });
  const start = unknown
    ? null
    : cash.reduce((sum, a) => sum + balance(a, state.transactions, today)!, 0);
  const days = Array.from({ length: horizon + 1 }, (_, i) => {
    const day = addDays(today, i);
    return {
      date: day,
      amount:
        start === null
          ? null
          : start +
            events
              .filter((e) => e.date <= day)
              .reduce((sum, e) => sum + e.amount, 0),
    };
  });
  const warnings = [
    "Preliminary estimate: no bank verification, holiday adjustment, or discretionary spending assumptions.",
    "Recurring items are estimates only; mark received/paid separately and retire or update schedules to avoid stale assumptions.",
  ];
  if (unknown)
    warnings.push(
      "Add dated cash opening balances to calculate a cash forecast.",
    );
  if (!state.recurrences.some((r) => r.amount > 0))
    warnings.push("No recurring income is configured.");
  if (!state.recurrences.some((r) => r.amount < 0))
    warnings.push("No recurring bills are configured.");
  if (days.some((d) => d.amount !== null && d.amount < 0))
    warnings.push(
      "A projected shortage is possible; this does not assert an overdraft occurred.",
    );
  return { days, events, warnings };
}
