import { randomUUID } from "node:crypto";
import { z } from "zod";
import {
  addDays,
  civilToday,
  isOccurrence,
  transactionRecordSchema,
  sumMoney,
  type FinanceState,
  type Operation,
  type Occurrence,
  type Recurrence,
  type Transaction,
  type Proposal,
} from "./domain";
import type { FinanceDb } from "./finance-db";
import { PublicError } from "./errors";
import { verifyDigest } from "./proposal-integrity";
async function source(db: FinanceDb, userId: string, id: string) {
  const row = (await db
    .prepare("SELECT data FROM proposals WHERE id=? AND user_id=?")
    .get(id, userId)) as { data: string } | undefined;
  if (!row) throw new PublicError("Record unavailable");
  const p = JSON.parse(row.data) as Proposal;
  verifyDigest(userId, p);
  if (p.status !== "approved" || p.operation.kind !== "deleteTransaction")
    throw new PublicError("Only an approved deletion can be restored");
  return z
    .array(transactionRecordSchema)
    .min(1)
    .max(2)
    .parse(Array.isArray(p.before) ? p.before : [p.before]);
}
export async function normalizePlanning(
  db: FinanceDb,
  userId: string,
  op: Operation,
): Promise<Operation> {
  if (op.kind === "transaction" || op.kind === "editTransaction")
    op = { ...op, flow: op.flow || (op.amount < 0 ? "expense" : "income") };
  if (op.kind === "restoreTransaction")
    return { ...op, entries: await source(db, userId, op.sourceProposalId) };
  if (op.kind === "editTransaction" && op.occurrence === undefined) {
    const row = (await db
      .prepare("SELECT data FROM transactions WHERE id=? AND user_id=?")
      .get(op.id, userId)) as { data: string } | undefined;
    if (row) {
      const t = JSON.parse(row.data) as Transaction;
      if (t.occurrence) return { ...op, occurrence: t.occurrence };
    }
  }
  if (op.kind === "editTransfer" && op.occurrence === undefined) {
    const row = (await db
      .prepare("SELECT data FROM transactions WHERE id=? AND user_id=?")
      .get(op.id, userId)) as { data: string } | undefined;
    if (row) {
      const t = JSON.parse(row.data) as Transaction;
      if (t.transferId) {
        const rows = (await db
          .prepare(
            "SELECT data FROM transactions WHERE transfer_id=? AND user_id=?",
          )
          .all(t.transferId, userId)) as { data: string }[];
        const from = rows
          .map((v) => JSON.parse(v.data) as Transaction)
          .find((v) => v.amount < 0);
        if (from?.occurrence) return { ...op, occurrence: from.occurrence };
      }
    }
  }
  return op;
}
async function unlocked(
  db: FinanceDb,
  userId: string,
  accountId: string,
  date: string,
) {
  const rows = (await db
    .prepare(
      "SELECT data FROM reconciliations WHERE user_id=? AND account_id=?",
    )
    .all(userId, accountId)) as { data: string }[];
  if (rows.some((row) => JSON.parse(row.data).date >= date))
    throw new PublicError(
      "Date falls in a reconciled period. Use a new dated correction.",
    );
}
function ruleFor(s: FinanceState, id: string) {
  const rule = s.recurrences.find((r) => r.id === id);
  if (!rule) throw new PublicError("Record unavailable");
  return rule;
}
export function validateLink(
  s: FinanceState,
  ref: NonNullable<Transaction["occurrence"]>,
  accountId: string,
  amount: number,
  old?: Transaction,
) {
  const rule = ruleFor(s, ref.recurrenceId),
    same =
      old?.accountId === accountId &&
      JSON.stringify(old.occurrence) === JSON.stringify(ref);
  if (!same && rule.accountId !== accountId)
    throw new PublicError("The payment must use the schedule account");
  if (Math.sign(rule.amount) !== Math.sign(amount))
    throw new PublicError(
      "A bill payment is an outflow; income must be an inflow",
    );
  if (
    !isOccurrence(rule, ref.dueDate) &&
    !(s.occurrences || []).some(
      (o) => o.recurrenceId === rule.id && o.dueDate === ref.dueDate,
    )
  )
    throw new PublicError("Choose a due date belonging to this schedule");
}
export async function validatePlanning(
  db: FinanceDb,
  userId: string,
  op: Operation,
  s: FinanceState,
) {
  const today = civilToday(s.settings.timezone),
    account = (id: string) => {
      const a = s.accounts.find((a) => a.id === id);
      if (!a) throw new PublicError("Record unavailable");
      return a;
    };
  if (op.kind === "transaction" || op.kind === "editTransaction") {
    const flow = op.flow || (op.amount < 0 ? "expense" : "income");
    if (
      (flow === "expense" && op.amount >= 0) ||
      (flow !== "expense" && op.amount <= 0)
    )
      throw new PublicError(
        "Income/refunds must be positive and expenses must be negative",
      );
    if (op.flow === "refund" && op.occurrence)
      throw new PublicError(
        "A refund must not settle a recurring income or bill",
      );
  }
  if (
    (op.kind === "transaction" || op.kind === "editTransaction") &&
    op.occurrence
  )
    validateLink(
      s,
      op.occurrence,
      op.accountId,
      op.amount,
      op.kind === "editTransaction"
        ? s.transactions.find((t) => t.id === op.id)
        : undefined,
    );
  if (op.kind === "transfer" && op.occurrence)
    validateLink(s, op.occurrence, op.fromId, -op.amount);
  if (op.kind === "renameAccount" || op.kind === "correctOpening")
    account(op.id);
  if (op.kind === "renameCategory" && !s.categories.some((c) => c.id === op.id))
    throw new PublicError("Record unavailable");
  if (op.kind === "correctOpening") {
    if (op.asOf > today)
      throw new PublicError("Opening snapshot cannot be in the future");
    const rows = await db
      .prepare(
        "SELECT data FROM reconciliations WHERE user_id=? AND account_id=?",
      )
      .all(userId, op.id);
    if (rows.length)
      throw new PublicError(
        "A reconciled account needs a dated correction entry rather than rewriting its opening snapshot",
      );
  }
  if (op.kind === "editRecurrence") {
    account(op.accountId);
    const old = ruleFor(s, op.id);
    if (
      Math.sign(old.amount) !== Math.sign(op.amount) &&
      (s.transactions.some((t) => t.occurrence?.recurrenceId === old.id) ||
        (s.occurrences || []).some((o) => o.recurrenceId === old.id))
    )
      throw new PublicError(
        "Create a new schedule to change a bill into income or income into a bill",
      );
  }
  if (op.kind === "pauseRecurrence" || op.kind === "archiveRecurrence")
    ruleFor(s, op.id);
  if (op.kind === "matchOccurrence") {
    const t = s.transactions.find((t) => t.id === op.transactionId);
    if (!t) throw new PublicError("Record unavailable");
    validateLink(
      s,
      {
        recurrenceId: op.recurrenceId,
        dueDate: op.dueDate,
        settles: op.settles,
      },
      t.accountId,
      t.amount,
    );
  }
  if (
    op.kind === "unmatchOccurrence" &&
    !s.transactions.some((t) => t.id === op.transactionId)
  )
    throw new PublicError("Record unavailable");
  if (op.kind === "occurrence") {
    const r = ruleFor(s, op.recurrenceId);
    if (
      !isOccurrence(r, op.dueDate) &&
      !(s.occurrences || []).some(
        (o) => o.recurrenceId === r.id && o.dueDate === op.dueDate,
      )
    )
      throw new PublicError("Choose a due date belonging to this schedule");
  }
  if (op.kind === "editTransfer") {
    const selected = s.transactions.find((t) => t.id === op.id);
    if (!selected?.transferId) throw new PublicError("Record unavailable");
    const pair = s.transactions.filter(
      (t) => t.transferId === selected.transferId,
    );
    if (pair.length !== 2 || pair.some((t) => t.reconciledAt))
      throw new PublicError("A reconciled transfer cannot be rewritten");
    if (op.fromId === op.toId)
      throw new PublicError("Choose two different accounts");
    for (const id of [op.fromId, op.toId]) {
      const a = account(id);
      if (op.date <= a.asOf || op.date > today)
        throw new PublicError(
          "Transfer date must follow the snapshot and be no later than today",
        );
      await unlocked(db, userId, id, op.date);
    }
    if (op.occurrence)
      validateLink(
        s,
        op.occurrence,
        op.fromId,
        -op.amount,
        pair.find((t) => t.amount < 0),
      );
  }
  if (op.kind === "settleTransfer") {
    const t = s.transactions.find((t) => t.id === op.id);
    if (!t?.transferId) throw new PublicError("Record unavailable");
    const pair = s.transactions.filter((v) => v.transferId === t.transferId);
    if (
      pair.length !== 2 ||
      pair.some((v) => v.status !== "pending" || v.reconciledAt)
    )
      throw new PublicError(
        "Only an unreconciled pending pair can be marked cleared",
      );
    for (const leg of pair) {
      if (op.date <= account(leg.accountId).asOf || op.date > today)
        throw new PublicError(
          "Cleared date must be after the opening snapshot and no later than today",
        );
      await unlocked(db, userId, leg.accountId, op.date);
    }
  }
  if (op.kind === "restoreTransaction") {
    const entries = await source(db, userId, op.sourceProposalId);
    if (JSON.stringify(entries) !== JSON.stringify(op.entries))
      throw new PublicError("Restore does not match the approved deletion");
    for (const entry of entries) {
      const a = account(entry.accountId);
      if (
        s.transactions.some(
          (t) =>
            t.id === entry.id ||
            (entry.transferId && t.transferId === entry.transferId),
        )
      )
        throw new PublicError("These records have already been restored");
      if (entry.date <= a.asOf || entry.date > today || entry.reconciledAt)
        throw new PublicError(
          "A deleted entry cannot be restored into this snapshot or reconciled period",
        );
      await unlocked(db, userId, a.id, entry.date);
      for (const split of entry.splits)
        if (!s.categories.some((c) => c.id === split.categoryId))
          throw new PublicError("Record unavailable");
      if (
        entry.splits.length &&
        sumMoney(entry.splits.map((v) => v.amount)) !== entry.amount
      )
        throw new PublicError("Restore splits do not balance");
    }
  }
}
export function planningBefore(s: FinanceState, op: Operation): unknown {
  switch (op.kind) {
    case "renameAccount":
    case "correctOpening":
      return s.accounts.find((a) => a.id === op.id) || null;
    case "renameCategory":
      return s.categories.find((c) => c.id === op.id) || null;
    case "editRecurrence":
    case "pauseRecurrence":
    case "archiveRecurrence":
      return s.recurrences.find((r) => r.id === op.id) || null;
    case "matchOccurrence":
    case "unmatchOccurrence":
      return s.transactions.find((t) => t.id === op.transactionId) || null;
    case "occurrence":
      return (
        (s.occurrences || []).find(
          (o) => o.recurrenceId === op.recurrenceId && o.dueDate === op.dueDate,
        ) || null
      );
    case "editTransfer":
    case "settleTransfer": {
      const t = s.transactions.find((t) => t.id === op.id);
      return s.transactions.filter((v) => v.transferId === t?.transferId);
    }
    default:
      return null;
  }
}
export async function ensureOccurrence(
  db: FinanceDb,
  userId: string,
  s: FinanceState,
  ref: NonNullable<Transaction["occurrence"]>,
) {
  const r = ruleFor(s, ref.recurrenceId),
    id = randomUUID();
  const value: Occurrence = {
    id,
    recurrenceId: r.id,
    dueDate: ref.dueDate,
    expectedClearDate: addDays(ref.dueDate, r.clearingDays),
    amount: r.amount,
    status: "unpaid",
  };
  await db
    .prepare(
      "INSERT INTO occurrences(id,user_id,recurrence_id,due_date,data) VALUES(?,?,?,?,?) ON CONFLICT(user_id,recurrence_id,due_date) DO NOTHING",
    )
    .run(id, userId, r.id, ref.dueDate, JSON.stringify(value));
}
export async function applyPlanning(
  db: FinanceDb,
  userId: string,
  s: FinanceState,
  op: Operation,
  insert: (t: Transaction) => Promise<void>,
): Promise<boolean> {
  switch (op.kind) {
    case "editTransfer": {
      const selected = s.transactions.find((t) => t.id === op.id)!;
      for (const old of s.transactions.filter(
        (t) => t.transferId === selected.transferId,
      )) {
        const from = old.amount < 0;
        const next: Transaction = {
          ...old,
          accountId: from ? op.fromId : op.toId,
          amount: from ? -op.amount : op.amount,
          date: op.date,
          status: op.status,
          description: op.description,
          occurrence: from ? op.occurrence : null,
        };
        if (next.occurrence)
          await ensureOccurrence(db, userId, s, next.occurrence);
        await db
          .prepare(
            "UPDATE transactions SET account_id=?,data=? WHERE id=? AND user_id=?",
          )
          .run(next.accountId, JSON.stringify(next), old.id, userId);
      }
      return true;
    }
    case "renameAccount":
    case "correctOpening": {
      const old = s.accounts.find((a) => a.id === op.id)!;
      const next =
        op.kind === "renameAccount"
          ? { ...old, name: op.name }
          : { ...old, opening: op.opening, asOf: op.asOf };
      await db
        .prepare("UPDATE accounts SET data=? WHERE id=? AND user_id=?")
        .run(JSON.stringify(next), op.id, userId);
      return true;
    }
    case "renameCategory":
      await db
        .prepare("UPDATE categories SET data=? WHERE id=? AND user_id=?")
        .run(JSON.stringify({ id: op.id, name: op.name }), op.id, userId);
      return true;
    case "editRecurrence":
    case "pauseRecurrence":
    case "archiveRecurrence": {
      const old = ruleFor(s, op.id);
      const next: Recurrence =
        op.kind === "editRecurrence"
          ? { ...old, ...op }
          : op.kind === "pauseRecurrence"
            ? { ...old, active: !op.paused }
            : { ...old, active: false, archived: true };
      await db
        .prepare(
          "UPDATE recurrences SET account_id=?,data=? WHERE id=? AND user_id=?",
        )
        .run(next.accountId, JSON.stringify(next), op.id, userId);
      return true;
    }
    case "matchOccurrence":
    case "unmatchOccurrence": {
      const t = s.transactions.find((t) => t.id === op.transactionId)!;
      const next = { ...t };
      if (op.kind === "unmatchOccurrence") delete next.occurrence;
      else {
        next.occurrence = {
          recurrenceId: op.recurrenceId,
          dueDate: op.dueDate,
          settles: op.settles,
        };
        await ensureOccurrence(db, userId, s, next.occurrence);
      }
      await db
        .prepare("UPDATE transactions SET data=? WHERE id=? AND user_id=?")
        .run(JSON.stringify(next), t.id, userId);
      return true;
    }
    case "occurrence": {
      const r = ruleFor(s, op.recurrenceId),
        old = (s.occurrences || []).find(
          (o) => o.recurrenceId === r.id && o.dueDate === op.dueDate,
        ),
        id = old?.id || randomUUID();
      const next: Occurrence = {
        id,
        recurrenceId: r.id,
        dueDate: op.dueDate,
        expectedClearDate: op.expectedClearDate,
        amount: old?.amount ?? r.amount,
        status: op.status,
      };
      await db
        .prepare(
          "INSERT INTO occurrences(id,user_id,recurrence_id,due_date,data) VALUES(?,?,?,?,?) ON CONFLICT(user_id,recurrence_id,due_date) DO UPDATE SET data=excluded.data",
        )
        .run(id, userId, r.id, op.dueDate, JSON.stringify(next));
      return true;
    }
    case "settleTransfer": {
      const t = s.transactions.find((t) => t.id === op.id)!;
      for (const leg of s.transactions.filter(
        (v) => v.transferId === t.transferId,
      ))
        await db
          .prepare("UPDATE transactions SET data=? WHERE id=? AND user_id=?")
          .run(
            JSON.stringify({ ...leg, status: "cleared", date: op.date }),
            leg.id,
            userId,
          );
      return true;
    }
    case "restoreTransaction": {
      const entries = op.entries!;
      const pair = entries[0].transferId;
      if (pair)
        await db
          .prepare("INSERT INTO transfers(id,user_id) VALUES(?,?)")
          .run(pair, userId);
      for (const entry of entries) {
        if (entry.occurrence)
          await ensureOccurrence(db, userId, s, entry.occurrence);
        await insert(entry);
      }
      return true;
    }
    default:
      return false;
  }
}
