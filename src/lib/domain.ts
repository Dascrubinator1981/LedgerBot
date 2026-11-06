import { z } from "./schema";
import { PublicError } from "./errors";

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
export const occurrenceRefSchema = z.object({
  recurrenceId: id,
  dueDate: date,
  settles: z.boolean(),
});
const transactionFields = {
  flow: z.enum(["income", "expense", "refund"]).optional(),
  accountId: id,
  date,
  description: name,
  amount: minor.refine((v) => v !== 0, "Amount cannot be zero"),
  status,
  splits: z.array(splitSchema).max(50),
  occurrence: occurrenceRefSchema.nullable().optional(),
};
const recurrenceFields = {
  accountId: id,
  name,
  amount: minor.refine((v) => v !== 0),
  start: date,
  cadence: z.enum(["weekly", "biweekly", "monthly"]),
  clearingDays: z.number().int().min(0).max(30),
};
export const transactionRecordSchema = z
  .object({
    id,
    ...transactionFields,
    transferId: id.nullable(),
    reconciledAt: date.nullable(),
  })
  .passthrough();
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
    occurrence: occurrenceRefSchema.nullable().optional(),
  }),
  z.object({
    kind: z.literal("budget"),
    categoryId: id,
    newCategory: z.object({ name }).optional(),
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
  z.object({ kind: z.literal("renameAccount"), id, name }),
  z.object({ kind: z.literal("renameCategory"), id, name }),
  z.object({
    kind: z.literal("correctOpening"),
    id,
    opening: minor.nullable(),
    asOf: date,
  }),
  z.object({ kind: z.literal("editRecurrence"), id, ...recurrenceFields }),
  z.object({ kind: z.literal("pauseRecurrence"), id, paused: z.boolean() }),
  z.object({ kind: z.literal("archiveRecurrence"), id }),
  z.object({
    kind: z.literal("matchOccurrence"),
    transactionId: id,
    ...occurrenceRefSchema.shape,
  }),
  z.object({ kind: z.literal("unmatchOccurrence"), transactionId: id }),
  z.object({
    kind: z.literal("occurrence"),
    recurrenceId: id,
    dueDate: date,
    expectedClearDate: date,
    status: z.enum(["unpaid", "skipped"]),
  }),
  z.object({ kind: z.literal("settleTransfer"), id, date }),
  z.object({
    kind: z.literal("editTransfer"),
    id,
    fromId: id,
    toId: id,
    amount: minor.refine((v) => v > 0),
    date,
    description: name,
    status,
    occurrence: occurrenceRefSchema.nullable().optional(),
  }),
  z.object({
    kind: z.literal("restoreTransaction"),
    sourceProposalId: id,
    entries: z.array(transactionRecordSchema).max(2).optional(),
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
  flow?: "income" | "expense" | "refund";
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  status: string;
  transferId: string | null;
  reconciledAt: string | null;
  splits: Split[];
  occurrence?: z.infer<typeof occurrenceRefSchema> | null;
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
  active?: boolean;
  archived?: boolean;
};
export type Occurrence = {
  id: string;
  recurrenceId: string;
  dueDate: string;
  expectedClearDate: string;
  amount: number;
  status: "unpaid" | "skipped";
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
  occurrences?: Occurrence[];
  reconciliations?: {
    id: string;
    accountId: string;
    date: string;
    statement: number;
    transactionIds: string[];
  }[];
  proposals: Proposal[];
  revision: number;
  settings: {
    setup: string;
    promotions: boolean;
    timezone?: string;
    reminders?: import("./reminders").Reminders;
    forecaster?: import("./forecast-preferences").ForecastPreferences;
  };
};
export const timezoneSchema = z
  .string()
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, "Choose a valid IANA timezone");
export function civilToday(timezone = "Etc/UTC", now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  return `${parts.find((p) => p.type === "year")!.value}-${parts.find((p) => p.type === "month")!.value}-${parts.find((p) => p.type === "day")!.value}`;
}
export function isOccurrence(rule: Recurrence, dueDate: string): boolean {
  let low = 0,
    high = 10000;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (nextOccurrence(rule.start, rule.cadence, mid) < dueDate) low = mid + 1;
    else high = mid;
  }
  return nextOccurrence(rule.start, rule.cadence, low) === dueDate;
}
export function paymentCoverage(
  transactions: Transaction[],
  recurrenceId: string,
  dueDate: string,
  amount: number,
) {
  const matched = transactions.filter(
    (t) =>
      t.occurrence?.recurrenceId === recurrenceId &&
      t.occurrence.dueDate === dueDate,
  );
  const cleared = sumMoney(
      matched
        .filter((t) => t.status === "cleared")
        .map((t) => Math.abs(t.amount)),
    ),
    pending = sumMoney(
      matched
        .filter((t) => t.status === "pending")
        .map((t) => Math.abs(t.amount)),
    );
  const settled = matched.some((t) => t.occurrence?.settles),
    paid =
      matched.some((t) => t.status === "cleared" && t.occurrence?.settles) ||
      cleared >= Math.abs(amount);
  return {
    cleared,
    pending,
    paid,
    remaining: settled
      ? 0
      : Math.max(0, Math.abs(amount) - sumMoney([cleared, pending])),
  };
}

export function parseMoney(text: string): number {
  if (!/^-?\d{1,10}(\.\d{1,2})?$/.test(text))
    throw new PublicError("Enter dollars with at most two decimal places");
  const negative = text.startsWith("-");
  const [whole, fraction = ""] = text.replace("-", "").split(".");
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return minor.parse(negative ? -value : value);
}
const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
export function sumMoney(values: Iterable<number>): number {
  let total = 0n;
  for (const value of values) {
    if (!Number.isSafeInteger(value))
      throw new PublicError("Money must use safe integer cents");
    total += BigInt(value);
  }
  if (
    total > BigInt(Number.MAX_SAFE_INTEGER) ||
    total < BigInt(Number.MIN_SAFE_INTEGER)
  )
    throw new PublicError("Total exceeds the supported money range");
  return Number(total);
}
export function money(value: number | null): string {
  if (value === null) return "Not set up yet";
  if (!Number.isSafeInteger(value))
    throw new PublicError("Money must use safe integer cents");
  const absolute = BigInt(Math.abs(value)),
    whole = absolute / 100n;
  const signedWhole = value < 0 ? (whole === 0n ? -0 : -whole) : whole;
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return currencyFormat
    .formatToParts(signedWhole)
    .map((part) => (part.type === "fraction" ? fraction : part.value))
    .join("");
}
export const liability = (account: Account) =>
  ["credit", "loan", "liability"].includes(account.type);
// Ledger amounts use net-worth sign for all accounts. UI displays liabilities as positive owed.
export function balance(
  account: Account,
  transactions: Transaction[],
  through = "9999-12-31",
): number | null {
  if (account.opening === null || through < account.asOf) return null;
  const signed = sumMoney([
    liability(account) ? -account.opening : account.opening,
    ...transactions
      .filter(
        (t) =>
          t.accountId === account.id &&
          t.status === "cleared" &&
          t.date > account.asOf &&
          t.date <= through,
      )
      .map((t) => t.amount),
  ]);
  return signed === 0 ? 0 : liability(account) ? -signed : signed;
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
  return sumMoney(
    accounts.map((a) => balance(a, transactions)! * (liability(a) ? -1 : 1)),
  );
}
export function budgetActual(
  categoryId: string,
  month: string,
  transactions: Transaction[],
): number {
  const actual = sumMoney(
    transactions
      .filter(
        (t) =>
          t.status === "cleared" &&
          !t.transferId &&
          t.flow !== "income" &&
          t.date.startsWith(month),
      )
      .flatMap((t) => t.splits)
      .filter((s) => s.categoryId === categoryId)
      .map((s) => s.amount),
  );
  return actual === 0 ? 0 : -actual;
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
  state: Pick<
    FinanceState,
    "accounts" | "transactions" | "recurrences" | "occurrences"
  >,
  today: string,
  horizon = 30,
) {
  date.parse(today);
  if (!Number.isInteger(horizon) || horizon < 1 || horizon > 366)
    throw new PublicError("Forecast horizon must be between 1 and 366 days");
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
  const cashRules = state.recurrences.filter((r) =>
    cash.some((a) => a.id === r.accountId),
  );
  const end = addDays(today, horizon);
  const scheduled = new Map<
    string,
    {
      rule: Recurrence;
      dueDate: string;
      clearDate: string;
      amount: number;
      skipped: boolean;
    }
  >();
  for (const rule of cashRules.filter(
    (r) => r.active !== false && !r.archived,
  )) {
    // Jump to the first future clearing date instead of traversing years of history.
    let low = 0,
      high = 10000;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      const candidate = addDays(
        nextOccurrence(rule.start, rule.cadence, middle),
        rule.clearingDays,
      );
      if (candidate < today) low = middle + 1;
      else high = middle;
    }
    for (let index = low; index < 10000; index++) {
      const day = addDays(
        nextOccurrence(rule.start, rule.cadence, index),
        rule.clearingDays,
      );
      if (day > end) break;
      const dueDate = nextOccurrence(rule.start, rule.cadence, index);
      scheduled.set(`${rule.id}:${dueDate}`, {
        rule,
        dueDate,
        clearDate: day,
        amount: rule.amount,
        skipped: false,
      });
    }
  }
  for (const item of state.occurrences || []) {
    const rule = cashRules.find((r) => r.id === item.recurrenceId);
    if (!rule) continue;
    scheduled.set(`${rule.id}:${item.dueDate}`, {
      rule,
      dueDate: item.dueDate,
      clearDate:
        item.expectedClearDate < today ? today : item.expectedClearDate,
      amount: item.amount,
      skipped: item.status === "skipped",
    });
  }
  for (const event of scheduled.values()) {
    if (event.skipped || event.clearDate > end) continue;
    const remainder = paymentCoverage(
      state.transactions,
      event.rule.id,
      event.dueDate,
      event.amount,
    ).remaining;
    if (remainder)
      events.push({
        date: event.clearDate,
        name: event.rule.name,
        amount: remainder * Math.sign(event.amount),
        state: "estimated",
      });
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
    : sumMoney(cash.map((a) => balance(a, state.transactions, today)!));
  const amountsByDate = new Map<string, number[]>();
  for (const event of events) {
    const amounts = amountsByDate.get(event.date) || [];
    amounts.push(event.amount);
    amountsByDate.set(event.date, amounts);
  }
  let running = start;
  const days = Array.from({ length: horizon + 1 }, (_, i) => {
    const day = addDays(today, i);
    if (running !== null)
      running = sumMoney([running, ...(amountsByDate.get(day) || [])]);
    return { date: day, amount: running };
  });
  const warnings = [
    "Preliminary estimate: no bank verification, holiday adjustment, or discretionary spending assumptions.",
    "Only explicitly matched bill/income payments reduce recurring estimates. Historical untracked or unlinked activity may be incomplete; no merchant-based matching is assumed.",
  ];
  if (unknown)
    warnings.push(
      "Add dated cash opening balances to calculate a cash forecast.",
    );
  if (!cashRules.some((r) => r.amount > 0))
    warnings.push("No recurring income is configured.");
  if (!cashRules.some((r) => r.amount < 0))
    warnings.push("No recurring bills are configured.");
  if (days.some((d) => d.amount !== null && d.amount < 0))
    warnings.push(
      "A projected shortage is possible; this does not assert an overdraft occurred.",
    );
  return { days, events, warnings, opening: start };
}
