import { forecastPreferencesSchema } from "./forecast-preferences";
import { proposalDigest, verifyDigest } from "./proposal-integrity";
import {
  normalizePlanning,
  validatePlanning,
  planningBefore,
  applyPlanning,
  ensureOccurrence,
} from "./finance-planning";
import { PublicError } from "./errors";
import { randomUUID } from "node:crypto";
import { financialImpact } from "./preview";
import type { FinanceDb } from "./finance-db";
import { hash, secret, type Session } from "./auth";
import {
  balance,
  money,
  civilToday,
  type Occurrence,
  operationSchema,
  type Account,
  type Transaction,
  type Category,
  type Budget,
  type Recurrence,
  type Proposal,
  type FinanceState,
  type Operation,
} from "./domain";
type Table =
  | "accounts"
  | "transactions"
  | "categories"
  | "budgets"
  | "recurrences"
  | "proposals"
  | "occurrences"
  | "reconciliations";
async function records<T>(
  db: FinanceDb,
  table: Table,
  userId: string,
): Promise<T[]> {
  return (
    (await db
      .prepare(`SELECT data FROM ${table} WHERE user_id=?`)
      .all(userId)) as {
      data: string;
    }[]
  ).map((r) => JSON.parse(r.data) as T);
}
async function owned<T>(
  db: FinanceDb,
  table: Table,
  userId: string,
  id: string,
): Promise<T> {
  const row = (await db
    .prepare(`SELECT data FROM ${table} WHERE id=? AND user_id=?`)
    .get(id, userId)) as
    | {
        data: string;
      }
    | undefined;
  if (!row) throw new PublicError("Record unavailable");
  return JSON.parse(row.data) as T;
}
async function currentRevision(db: FinanceDb, userId: string): Promise<number> {
  const row = (await db
    .prepare("SELECT revision FROM users WHERE id=?")
    .get(userId)) as
    | {
        revision: number;
      }
    | undefined;
  if (!row) throw new PublicError("Sign in required", 401);
  return row.revision;
}
export async function state(
  db: FinanceDb,
  userId: string,
  includeProposals = true,
): Promise<FinanceState> {
  const user = (await db
    .prepare(
      "SELECT revision,setup,promotions,timezone,reminders,forecast_preferences FROM users WHERE id=?",
    )
    .get(userId)) as
    | {
        revision: number;
        setup: string;
        promotions: number;
        timezone: string;
        reminders: string;
        forecast_preferences: string;
      }
    | undefined;
  if (!user) throw new PublicError("Sign in required");
  return {
    accounts: await records<Account>(db, "accounts", userId),
    transactions: await records<Transaction>(db, "transactions", userId),
    categories: await records<Category>(db, "categories", userId),
    budgets: await records<Budget>(db, "budgets", userId),
    recurrences: await records<Recurrence>(db, "recurrences", userId),
    occurrences: await records<Occurrence>(db, "occurrences", userId),
    reconciliations: await records<
      NonNullable<FinanceState["reconciliations"]>[number]
    >(db, "reconciliations", userId),
    proposals: includeProposals
      ? await records<Proposal>(db, "proposals", userId)
      : [],
    revision: user.revision,
    settings: {
      setup: user.setup,
      promotions: !!user.promotions,
      timezone: user.timezone,
      reminders: JSON.parse(user.reminders),
      forecaster: forecastPreferencesSchema.parse(
        JSON.parse(user.forecast_preferences || "{}"),
      ),
    },
  };
}
async function validate(db: FinanceDb, userId: string, op: Operation) {
  const s = await state(db, userId, false);
  const account = async (id: string) =>
    await owned<Account>(db, "accounts", userId, id);
  const unlockedDate = async (accountId: string, date: string) => {
    const rows = (await db
      .prepare(
        "SELECT data FROM reconciliations WHERE user_id=? AND account_id=?",
      )
      .all(userId, accountId)) as {
      data: string;
    }[];
    if (rows.some((row) => JSON.parse(row.data).date >= date))
      throw new PublicError(
        "Date falls in a reconciled period. Use a new dated correction.",
      );
  };
  if (op.kind === "transaction" || op.kind === "editTransaction") {
    const a = await account(op.accountId);
    await unlockedDate(a.id, op.date);
    if (op.date <= a.asOf)
      throw new PublicError(
        "Transaction must be after the opening snapshot date. Same-day entries are already included in that end-of-day snapshot.",
      );
    if (op.date > civilToday(s.settings.timezone))
      throw new PublicError(
        "Use recurring plans for future dates, not actual transactions",
      );
    if (
      op.splits.length &&
      op.splits.reduce((sum, v) => sum + v.amount, 0) !== op.amount
    )
      throw new PublicError(
        "Splits must equal the exact signed transaction amount",
      );
    if (new Set(op.splits.map((v) => v.categoryId)).size !== op.splits.length)
      throw new PublicError("Combine duplicate split categories");
    for (const split of op.splits) {
      await owned<Category>(db, "categories", userId, split.categoryId);
      if (
        split.amount !== 0 &&
        Math.sign(split.amount) !== Math.sign(op.amount)
      )
        throw new PublicError("Split directions must match the transaction");
    }
    if (op.kind === "editTransaction") {
      const t = await owned<Transaction>(db, "transactions", userId, op.id);
      if (t.transferId || t.reconciledAt)
        throw new PublicError(
          "Reconciled entries and transfer pairs cannot be edited. Use a reviewed reversal.",
        );
    }
  }
  if (op.kind === "deleteTransaction") {
    const t = await owned<Transaction>(db, "transactions", userId, op.id);
    const affected = t.transferId
      ? s.transactions.filter((v) => v.transferId === t.transferId)
      : [t];
    if (affected.some((v) => v.reconciledAt))
      throw new PublicError(
        "Reconciled entries cannot be deleted. Use a reviewed reversal.",
      );
  }
  if (op.kind === "account" && op.asOf > civilToday(s.settings.timezone))
    throw new PublicError("Opening snapshot cannot be in the future");
  if (op.kind === "transfer") {
    if (op.fromId === op.toId)
      throw new PublicError("Choose two different accounts");
    const from = await account(op.fromId),
      to = await account(op.toId);
    await unlockedDate(from.id, op.date);
    await unlockedDate(to.id, op.date);
    if (op.date <= from.asOf || op.date <= to.asOf)
      throw new PublicError("Transfer must be after both opening snapshots");
    if (op.date > civilToday(s.settings.timezone))
      throw new PublicError("Future transfers are not actuals");
  }
  if (op.kind === "budget") {
    if (op.newCategory) {
      if (
        s.categories.some(
          (c) =>
            c.id === op.categoryId ||
            c.name.toLocaleLowerCase() ===
              op.newCategory!.name.toLocaleLowerCase(),
        )
      )
        throw new PublicError(
          "This category already exists. Select it from the list.",
        );
    } else await owned<Category>(db, "categories", userId, op.categoryId);
  }
  if (op.kind === "recurrence") await account(op.accountId);
  if (op.kind === "reconcile") {
    const a = await account(op.accountId);
    await unlockedDate(a.id, op.date);
    if (op.date < a.asOf || op.date > civilToday(s.settings.timezone))
      throw new PublicError(
        "Statement date must be between opening date and today",
      );
    if (balance(a, s.transactions, op.date) !== op.statement)
      throw new PublicError(
        `Statement and cleared ledger differ. Statement: ${money(op.statement)}; cleared ledger: ${money(balance(a, s.transactions, op.date))}. Investigate missing entries, dates and pending items before reconciling.`,
      );
  }
  await validatePlanning(db, userId, op, s);
  return s;
}
function beforeValue(s: FinanceState, op: Operation): unknown {
  if (op.kind === "editTransaction" || op.kind === "deleteTransaction") {
    const t = s.transactions.find((v) => v.id === op.id)!;
    return t.transferId
      ? s.transactions.filter((v) => v.transferId === t.transferId)
      : t;
  }
  if (op.kind === "budget")
    return (
      s.budgets.find(
        (v) => v.categoryId === op.categoryId && v.month === op.month,
      ) || null
    );
  if (op.kind === "reconcile")
    return {
      balance: balance(
        s.accounts.find((a) => a.id === op.accountId)!,
        s.transactions,
        op.date,
      ),
      through: op.date,
    };
  return planningBefore(s, op);
}
export async function propose(
  db: FinanceDb,
  session: Session,
  input: unknown,
): Promise<Proposal> {
  const op = await normalizePlanning(
    db,
    session.userId,
    operationSchema.parse(input),
  );
  const s = await validate(db, session.userId, op);
  const p: Proposal = {
    id: randomUUID(),
    version: 1,
    digest: "",
    operation: op,
    before: beforeValue(s, op),
    impact: financialImpact(s, op),
    status: "awaiting_review",
    revision: s.revision,
    createdAt: Date.now(),
    expiresAt: Date.now() + 86400000,
    source: session.principal,
  };
  p.digest = proposalDigest(session.userId, p);
  await db
    .prepare("INSERT INTO proposals VALUES(?,?,?)")
    .run(p.id, session.userId, JSON.stringify(p));
  return p;
}
async function activeSession(db: FinanceDb, session: Session) {
  const row = (await db
    .prepare(
      "SELECT user_id,principal FROM sessions WHERE hash=? AND expires>?",
    )
    .get(session.sessionHash, Date.now())) as
    | {
        user_id: string;
        principal: string;
      }
    | undefined;
  if (
    !row ||
    row.user_id !== session.userId ||
    row.principal !== "human" ||
    session.principal !== "human"
  )
    throw new PublicError("Independent human session required");
}
export async function review(
  db: FinanceDb,
  session: Session,
  proposalId: string,
) {
  await activeSession(db, session);
  const p = await owned<Proposal>(db, "proposals", session.userId, proposalId);
  verifyDigest(session.userId, p);
  if (p.status !== "awaiting_review" || p.expiresAt <= Date.now())
    throw new PublicError("Proposal unavailable or expired");
  if (p.revision !== (await currentRevision(db, session.userId)))
    throw new PublicError(
      "Proposal is stale. Prepare a new proposal from current records.",
    );
  await validate(db, session.userId, p.operation);
  const token = secret();
  await db
    .prepare("INSERT INTO challenges VALUES(?,?,?,?,?,?,?,0)")
    .run(
      hash(token),
      session.userId,
      session.sessionHash,
      p.id,
      p.digest,
      p.version,
      Date.now() + 300000,
    );
  return { proposal: p, token };
}
async function insertTransaction(
  db: FinanceDb,
  userId: string,
  value: Transaction,
) {
  await db
    .prepare("INSERT INTO transactions VALUES(?,?,?,?,?)")
    .run(
      value.id,
      userId,
      value.accountId,
      value.transferId,
      JSON.stringify(value),
    );
  for (const split of value.splits)
    await db
      .prepare("INSERT INTO allocations VALUES(?,?,?,?)")
      .run(value.id, userId, split.categoryId, split.amount);
}
async function apply(db: FinanceDb, userId: string, op: Operation) {
  const id = randomUUID();
  const current = await state(db, userId, false);
  if (
    await applyPlanning(db, userId, current, op, (t) =>
      insertTransaction(db, userId, t),
    )
  )
    return;
  if (
    (op.kind === "transaction" ||
      op.kind === "editTransaction" ||
      op.kind === "transfer") &&
    op.occurrence
  )
    await ensureOccurrence(db, userId, current, op.occurrence);
  switch (op.kind) {
    case "account": {
      const a: Account = {
        id,
        name: op.name,
        type: op.type,
        opening: op.opening,
        asOf: op.asOf,
        currency: "USD",
      };
      await db
        .prepare("INSERT INTO accounts VALUES(?,?,?)")
        .run(id, userId, JSON.stringify(a));
      break;
    }
    case "category":
      await db
        .prepare("INSERT INTO categories VALUES(?,?,?)")
        .run(id, userId, JSON.stringify({ id, name: op.name }));
      break;
    case "transaction":
      await insertTransaction(db, userId, {
        ...op,
        id,
        transferId: null,
        reconciledAt: null,
      });
      break;
    case "editTransaction": {
      await db
        .prepare("DELETE FROM transactions WHERE id=? AND user_id=?")
        .run(op.id, userId);
      await insertTransaction(db, userId, {
        ...op,
        id: op.id,
        transferId: null,
        reconciledAt: null,
      });
      break;
    }
    case "deleteTransaction": {
      const t = await owned<Transaction>(db, "transactions", userId, op.id);
      if (t.transferId) {
        await db
          .prepare("DELETE FROM transactions WHERE transfer_id=? AND user_id=?")
          .run(t.transferId, userId);
        await db
          .prepare("DELETE FROM transfers WHERE id=? AND user_id=?")
          .run(t.transferId, userId);
      } else
        await db
          .prepare("DELETE FROM transactions WHERE id=? AND user_id=?")
          .run(op.id, userId);
      break;
    }
    case "transfer": {
      await db.prepare("INSERT INTO transfers VALUES(?,?)").run(id, userId);
      for (const [accountId, amount] of [
        [op.fromId, -op.amount],
        [op.toId, op.amount],
      ] as const)
        await insertTransaction(db, userId, {
          id: randomUUID(),
          accountId,
          amount,
          date: op.date,
          description: op.description,
          status: op.status,
          transferId: id,
          reconciledAt: null,
          splits: [],
          ...(amount < 0 && op.occurrence ? { occurrence: op.occurrence } : {}),
        });
      break;
    }
    case "budget": {
      if (op.newCategory)
        await db
          .prepare("INSERT INTO categories VALUES(?,?,?)")
          .run(
            op.categoryId,
            userId,
            JSON.stringify({ id: op.categoryId, name: op.newCategory.name }),
          );
      const existing = (await db
        .prepare(
          "SELECT id FROM budgets WHERE user_id=? AND category_id=? AND month=?",
        )
        .get(userId, op.categoryId, op.month)) as
        | {
            id: string;
          }
        | undefined;
      const budgetId = existing?.id || id;
      await db
        .prepare(
          "INSERT INTO budgets VALUES(?,?,?,?,?) ON CONFLICT(user_id,category_id,month) DO UPDATE SET data=excluded.data",
        )
        .run(
          budgetId,
          userId,
          op.categoryId,
          op.month,
          JSON.stringify({ ...op, id: budgetId }),
        );
      break;
    }
    case "recurrence":
      await db
        .prepare("INSERT INTO recurrences VALUES(?,?,?,?)")
        .run(id, userId, op.accountId, JSON.stringify({ ...op, id }));
      break;
    case "reconcile": {
      const s = await state(db, userId, false);
      const selected = s.transactions.filter(
        (t) =>
          t.accountId === op.accountId &&
          t.status === "cleared" &&
          t.date <= op.date,
      );
      for (const t of selected)
        await db
          .prepare("UPDATE transactions SET data=? WHERE id=? AND user_id=?")
          .run(JSON.stringify({ ...t, reconciledAt: op.date }), t.id, userId);
      await db.prepare("INSERT INTO reconciliations VALUES(?,?,?,?)").run(
        id,
        userId,
        op.accountId,
        JSON.stringify({
          ...op,
          id,
          transactionIds: selected.map((t) => t.id),
        }),
      );
      break;
    }
  }
}
export async function confirm(
  db: FinanceDb,
  session: Session,
  input: {
    proposalId: string;
    version: number;
    digest: string;
    token: string;
    idempotencyKey: string;
  },
) {
  await activeSession(db, session);
  if (
    !/^[a-f0-9]{64}$/.test(input.token) ||
    !/^[\w-]{16,100}$/.test(input.idempotencyKey)
  )
    throw new PublicError("Invalid confirmation");
  await db.exec("BEGIN IMMEDIATE");
  try {
    await activeSession(db, session);
    const p = await owned<Proposal>(
      db,
      "proposals",
      session.userId,
      input.proposalId,
    );
    verifyDigest(session.userId, p);
    if (p.operation.kind === "correctOpening") {
      const row = (await db
        .prepare("SELECT created_at FROM sessions WHERE hash=? AND user_id=?")
        .get(session.sessionHash, session.userId)) as
        { created_at: number } | undefined;
      if (!row || Date.now() - Number(row.created_at) > 300000)
        throw new PublicError(
          "Sign in again before correcting an opening snapshot",
        );
    }
    const challenge = (await db
      .prepare(
        "SELECT * FROM challenges WHERE hash=? AND user_id=? AND session_hash=? AND proposal_id=?",
      )
      .get(hash(input.token), session.userId, session.sessionHash, p.id)) as
      | {
          digest: string;
          version: number;
          expires: number;
          used: number;
        }
      | undefined;
    if (
      !challenge ||
      challenge.digest !== input.digest ||
      challenge.version !== input.version ||
      p.digest !== input.digest ||
      p.version !== input.version
    )
      throw new PublicError("Confirmation does not match reviewed proposal");
    const old = (await db
      .prepare(
        "SELECT data,idempotency_key FROM receipts WHERE proposal_id=? AND user_id=?",
      )
      .get(p.id, session.userId)) as
      | {
          data: string;
          idempotency_key: string;
        }
      | undefined;
    if (old) {
      if (old.idempotency_key !== input.idempotencyKey)
        throw new PublicError("Proposal already committed");
      await db.exec("COMMIT");
      return JSON.parse(old.data) as {
        id: string;
        proposalId: string;
        committedAt: number;
      };
    }
    if (
      challenge.used ||
      challenge.expires <= Date.now() ||
      p.expiresAt <= Date.now() ||
      p.status !== "awaiting_review"
    )
      throw new PublicError("Confirmation expired or already used");
    if (p.revision !== (await currentRevision(db, session.userId)))
      throw new PublicError("Proposal is stale. Review a new proposal.");
    await validate(db, session.userId, p.operation);
    await apply(db, session.userId, p.operation);
    const receipt = {
      id: randomUUID(),
      proposalId: p.id,
      committedAt: Date.now(),
    };
    await db
      .prepare("UPDATE users SET revision=revision+1 WHERE id=?")
      .run(session.userId);
    await db
      .prepare("UPDATE proposals SET data=? WHERE id=? AND user_id=?")
      .run(JSON.stringify({ ...p, status: "approved" }), p.id, session.userId);
    await db
      .prepare("UPDATE challenges SET used=1 WHERE proposal_id=?")
      .run(p.id);
    await db
      .prepare("INSERT INTO receipts VALUES(?,?,?,?)")
      .run(p.id, session.userId, input.idempotencyKey, JSON.stringify(receipt));
    await db
      .prepare("INSERT INTO audit VALUES(?,?,?,?,?)")
      .run(randomUUID(), session.userId, p.id, "approved", Date.now());
    await db.exec("COMMIT");
    return receipt;
  } catch (error) {
    await db.exec("ROLLBACK");
    await db
      .prepare("INSERT INTO audit VALUES(?,?,?,?,?)")
      .run(
        randomUUID(),
        session.userId,
        input.proposalId || "unknown",
        "rejected",
        Date.now(),
      );
    throw error;
  }
}
export async function discard(db: FinanceDb, session: Session, id: string) {
  await db.exec("BEGIN IMMEDIATE");
  try {
    await activeSession(db, session);
    const p = await owned<Proposal>(db, "proposals", session.userId, id);
    if (p.status !== "awaiting_review")
      throw new PublicError("Only pending proposals can be discarded");
    await db
      .prepare("UPDATE proposals SET data=? WHERE id=? AND user_id=?")
      .run(JSON.stringify({ ...p, status: "rejected" }), id, session.userId);
    await db
      .prepare("UPDATE challenges SET used=1 WHERE proposal_id=?")
      .run(id);
    await db
      .prepare("INSERT INTO audit VALUES(?,?,?,?,?)")
      .run(randomUUID(), session.userId, id, "discarded", Date.now());
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}
