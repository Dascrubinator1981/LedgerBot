import { PublicError } from "./errors";
import { randomUUID } from "node:crypto";
import { financialImpact } from "./preview";
import type { DatabaseSync } from "node:sqlite";
import { hash, secret, type Session } from "./auth";
import {
  balance,
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
  | "proposals";
function records<T>(db: DatabaseSync, table: Table, userId: string): T[] {
  return (
    db.prepare(`SELECT data FROM ${table} WHERE user_id=?`).all(userId) as {
      data: string;
    }[]
  ).map((r) => JSON.parse(r.data) as T);
}
function owned<T>(
  db: DatabaseSync,
  table: Table,
  userId: string,
  id: string,
): T {
  const row = db
    .prepare(`SELECT data FROM ${table} WHERE id=? AND user_id=?`)
    .get(id, userId) as { data: string } | undefined;
  if (!row) throw new PublicError("Record unavailable");
  return JSON.parse(row.data) as T;
}
function currentRevision(db: DatabaseSync, userId: string): number {
  const row = db
    .prepare("SELECT revision FROM users WHERE id=?")
    .get(userId) as { revision: number } | undefined;
  if (!row) throw new PublicError("Sign in required", 401);
  return row.revision;
}
export function state(
  db: DatabaseSync,
  userId: string,
  includeProposals = true,
): FinanceState {
  const user = db
    .prepare("SELECT revision,setup,promotions FROM users WHERE id=?")
    .get(userId) as
    { revision: number; setup: string; promotions: number } | undefined;
  if (!user) throw new PublicError("Sign in required");
  return {
    accounts: records<Account>(db, "accounts", userId),
    transactions: records<Transaction>(db, "transactions", userId),
    categories: records<Category>(db, "categories", userId),
    budgets: records<Budget>(db, "budgets", userId),
    recurrences: records<Recurrence>(db, "recurrences", userId),
    proposals: includeProposals
      ? records<Proposal>(db, "proposals", userId)
      : [],
    revision: user.revision,
    settings: { setup: user.setup, promotions: !!user.promotions },
  };
}
function validate(db: DatabaseSync, userId: string, op: Operation) {
  const s = state(db, userId, false);
  const account = (id: string) => owned<Account>(db, "accounts", userId, id);
  const unlockedDate = (accountId: string, date: string) => {
    const rows = db
      .prepare(
        "SELECT data FROM reconciliations WHERE user_id=? AND account_id=?",
      )
      .all(userId, accountId) as { data: string }[];
    if (rows.some((row) => JSON.parse(row.data).date >= date))
      throw new PublicError(
        "Date falls in a reconciled period. Use a new dated correction.",
      );
  };
  if (op.kind === "transaction" || op.kind === "editTransaction") {
    const a = account(op.accountId);
    unlockedDate(a.id, op.date);
    if (op.date <= a.asOf)
      throw new PublicError(
        "Transaction must be after the opening snapshot date. Same-day entries are already included in that end-of-day snapshot.",
      );
    if (op.date > new Date().toISOString().slice(0, 10))
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
      owned<Category>(db, "categories", userId, split.categoryId);
      if (
        split.amount !== 0 &&
        Math.sign(split.amount) !== Math.sign(op.amount)
      )
        throw new PublicError("Split directions must match the transaction");
    }
    if (op.kind === "editTransaction") {
      const t = owned<Transaction>(db, "transactions", userId, op.id);
      if (t.transferId || t.reconciledAt)
        throw new PublicError(
          "Reconciled entries and transfer pairs cannot be edited. Use a reviewed reversal.",
        );
    }
  }
  if (op.kind === "deleteTransaction") {
    const t = owned<Transaction>(db, "transactions", userId, op.id);
    const affected = t.transferId
      ? s.transactions.filter((v) => v.transferId === t.transferId)
      : [t];
    if (affected.some((v) => v.reconciledAt))
      throw new PublicError(
        "Reconciled entries cannot be deleted. Use a reviewed reversal.",
      );
  }
  if (op.kind === "account" && op.asOf > new Date().toISOString().slice(0, 10))
    throw new PublicError("Opening snapshot cannot be in the future");
  if (op.kind === "transfer") {
    if (op.fromId === op.toId)
      throw new PublicError("Choose two different accounts");
    const from = account(op.fromId),
      to = account(op.toId);
    unlockedDate(from.id, op.date);
    unlockedDate(to.id, op.date);
    if (op.date <= from.asOf || op.date <= to.asOf)
      throw new PublicError("Transfer must be after both opening snapshots");
    if (op.date > new Date().toISOString().slice(0, 10))
      throw new PublicError("Future transfers are not actuals");
  }
  if (op.kind === "budget")
    owned<Category>(db, "categories", userId, op.categoryId);
  if (op.kind === "recurrence") account(op.accountId);
  if (op.kind === "reconcile") {
    const a = account(op.accountId);
    unlockedDate(a.id, op.date);
    if (op.date < a.asOf || op.date > new Date().toISOString().slice(0, 10))
      throw new PublicError(
        "Statement date must be between opening date and today",
      );
    if (balance(a, s.transactions, op.date) !== op.statement)
      throw new PublicError(
        "Statement and cleared ledger differ. Investigate the difference before reconciling.",
      );
  }
  return s;
}
function proposalDigest(userId: string, p: Proposal): string {
  return hash(
    JSON.stringify({
      id: p.id,
      version: p.version,
      operation: p.operation,
      before: p.before,
      impact: p.impact,
      revision: p.revision,
      userId,
    }),
  );
}
function verifyDigest(userId: string, p: Proposal) {
  if (proposalDigest(userId, p) !== p.digest)
    throw new PublicError(
      "Proposal integrity check failed. Prepare a new proposal.",
    );
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
  return null;
}
export function propose(
  db: DatabaseSync,
  session: Session,
  input: unknown,
): Proposal {
  const op = operationSchema.parse(input);
  const s = validate(db, session.userId, op);
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
  db.prepare("INSERT INTO proposals VALUES(?,?,?)").run(
    p.id,
    session.userId,
    JSON.stringify(p),
  );
  return p;
}
function activeSession(db: DatabaseSync, session: Session) {
  const row = db
    .prepare(
      "SELECT user_id,principal FROM sessions WHERE hash=? AND expires>?",
    )
    .get(session.sessionHash, Date.now()) as
    { user_id: string; principal: string } | undefined;
  if (
    !row ||
    row.user_id !== session.userId ||
    row.principal !== "human" ||
    session.principal !== "human"
  )
    throw new PublicError("Independent human session required");
}
export function review(db: DatabaseSync, session: Session, proposalId: string) {
  activeSession(db, session);
  const p = owned<Proposal>(db, "proposals", session.userId, proposalId);
  verifyDigest(session.userId, p);
  if (p.status !== "awaiting_review" || p.expiresAt <= Date.now())
    throw new PublicError("Proposal unavailable or expired");
  if (p.revision !== currentRevision(db, session.userId))
    throw new PublicError(
      "Proposal is stale. Prepare a new proposal from current records.",
    );
  validate(db, session.userId, p.operation);
  const token = secret();
  db.prepare("INSERT INTO challenges VALUES(?,?,?,?,?,?,?,0)").run(
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
function insertTransaction(
  db: DatabaseSync,
  userId: string,
  value: Transaction,
) {
  db.prepare("INSERT INTO transactions VALUES(?,?,?,?,?)").run(
    value.id,
    userId,
    value.accountId,
    value.transferId,
    JSON.stringify(value),
  );
  for (const split of value.splits)
    db.prepare("INSERT INTO allocations VALUES(?,?,?,?)").run(
      value.id,
      userId,
      split.categoryId,
      split.amount,
    );
}
function apply(db: DatabaseSync, userId: string, op: Operation) {
  const id = randomUUID();
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
      db.prepare("INSERT INTO accounts VALUES(?,?,?)").run(
        id,
        userId,
        JSON.stringify(a),
      );
      break;
    }
    case "category":
      db.prepare("INSERT INTO categories VALUES(?,?,?)").run(
        id,
        userId,
        JSON.stringify({ id, name: op.name }),
      );
      break;
    case "transaction":
      insertTransaction(db, userId, {
        ...op,
        id,
        transferId: null,
        reconciledAt: null,
      });
      break;
    case "editTransaction": {
      db.prepare("DELETE FROM transactions WHERE id=? AND user_id=?").run(
        op.id,
        userId,
      );
      insertTransaction(db, userId, {
        ...op,
        id: op.id,
        transferId: null,
        reconciledAt: null,
      });
      break;
    }
    case "deleteTransaction": {
      const t = owned<Transaction>(db, "transactions", userId, op.id);
      if (t.transferId) {
        db.prepare(
          "DELETE FROM transactions WHERE transfer_id=? AND user_id=?",
        ).run(t.transferId, userId);
        db.prepare("DELETE FROM transfers WHERE id=? AND user_id=?").run(
          t.transferId,
          userId,
        );
      } else
        db.prepare("DELETE FROM transactions WHERE id=? AND user_id=?").run(
          op.id,
          userId,
        );
      break;
    }
    case "transfer": {
      db.prepare("INSERT INTO transfers VALUES(?,?)").run(id, userId);
      for (const [accountId, amount] of [
        [op.fromId, -op.amount],
        [op.toId, op.amount],
      ] as const)
        insertTransaction(db, userId, {
          id: randomUUID(),
          accountId,
          amount,
          date: op.date,
          description: op.description,
          status: op.status,
          transferId: id,
          reconciledAt: null,
          splits: [],
        });
      break;
    }
    case "budget": {
      const existing = db
        .prepare(
          "SELECT id FROM budgets WHERE user_id=? AND category_id=? AND month=?",
        )
        .get(userId, op.categoryId, op.month) as { id: string } | undefined;
      const budgetId = existing?.id || id;
      db.prepare(
        "INSERT INTO budgets VALUES(?,?,?,?,?) ON CONFLICT(user_id,category_id,month) DO UPDATE SET data=excluded.data",
      ).run(
        budgetId,
        userId,
        op.categoryId,
        op.month,
        JSON.stringify({ ...op, id: budgetId }),
      );
      break;
    }
    case "recurrence":
      db.prepare("INSERT INTO recurrences VALUES(?,?,?,?)").run(
        id,
        userId,
        op.accountId,
        JSON.stringify({ ...op, id }),
      );
      break;
    case "reconcile": {
      const s = state(db, userId, false);
      const selected = s.transactions.filter(
        (t) =>
          t.accountId === op.accountId &&
          t.status === "cleared" &&
          t.date <= op.date,
      );
      for (const t of selected)
        db.prepare(
          "UPDATE transactions SET data=? WHERE id=? AND user_id=?",
        ).run(JSON.stringify({ ...t, reconciledAt: op.date }), t.id, userId);
      db.prepare("INSERT INTO reconciliations VALUES(?,?,?,?)").run(
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
export function confirm(
  db: DatabaseSync,
  session: Session,
  input: {
    proposalId: string;
    version: number;
    digest: string;
    token: string;
    idempotencyKey: string;
  },
) {
  activeSession(db, session);
  if (
    !/^[a-f0-9]{64}$/.test(input.token) ||
    !/^[\w-]{16,100}$/.test(input.idempotencyKey)
  )
    throw new PublicError("Invalid confirmation");
  db.exec("BEGIN IMMEDIATE");
  try {
    activeSession(db, session);
    const p = owned<Proposal>(
      db,
      "proposals",
      session.userId,
      input.proposalId,
    );
    verifyDigest(session.userId, p);
    const challenge = db
      .prepare(
        "SELECT * FROM challenges WHERE hash=? AND user_id=? AND session_hash=? AND proposal_id=?",
      )
      .get(hash(input.token), session.userId, session.sessionHash, p.id) as
      | { digest: string; version: number; expires: number; used: number }
      | undefined;
    if (
      !challenge ||
      challenge.digest !== input.digest ||
      challenge.version !== input.version ||
      p.digest !== input.digest ||
      p.version !== input.version
    )
      throw new PublicError("Confirmation does not match reviewed proposal");
    const old = db
      .prepare(
        "SELECT data,idempotency_key FROM receipts WHERE proposal_id=? AND user_id=?",
      )
      .get(p.id, session.userId) as
      { data: string; idempotency_key: string } | undefined;
    if (old) {
      if (old.idempotency_key !== input.idempotencyKey)
        throw new PublicError("Proposal already committed");
      db.exec("COMMIT");
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
    if (p.revision !== currentRevision(db, session.userId))
      throw new PublicError("Proposal is stale. Review a new proposal.");
    validate(db, session.userId, p.operation);
    apply(db, session.userId, p.operation);
    const receipt = {
      id: randomUUID(),
      proposalId: p.id,
      committedAt: Date.now(),
    };
    db.prepare("UPDATE users SET revision=revision+1 WHERE id=?").run(
      session.userId,
    );
    db.prepare("UPDATE proposals SET data=? WHERE id=? AND user_id=?").run(
      JSON.stringify({ ...p, status: "approved" }),
      p.id,
      session.userId,
    );
    db.prepare("UPDATE challenges SET used=1 WHERE proposal_id=?").run(p.id);
    db.prepare("INSERT INTO receipts VALUES(?,?,?,?)").run(
      p.id,
      session.userId,
      input.idempotencyKey,
      JSON.stringify(receipt),
    );
    db.prepare("INSERT INTO audit VALUES(?,?,?,?,?)").run(
      randomUUID(),
      session.userId,
      p.id,
      "approved",
      Date.now(),
    );
    db.exec("COMMIT");
    return receipt;
  } catch (error) {
    db.exec("ROLLBACK");
    db.prepare("INSERT INTO audit VALUES(?,?,?,?,?)").run(
      randomUUID(),
      session.userId,
      input.proposalId || "unknown",
      "rejected",
      Date.now(),
    );
    throw error;
  }
}
export function discard(db: DatabaseSync, session: Session, id: string) {
  db.exec("BEGIN IMMEDIATE");
  try {
    activeSession(db, session);
    const p = owned<Proposal>(db, "proposals", session.userId, id);
    if (p.status !== "awaiting_review")
      throw new PublicError("Only pending proposals can be discarded");
    db.prepare("UPDATE proposals SET data=? WHERE id=? AND user_id=?").run(
      JSON.stringify({ ...p, status: "rejected" }),
      id,
      session.userId,
    );
    db.prepare("UPDATE challenges SET used=1 WHERE proposal_id=?").run(id);
    db.prepare("INSERT INTO audit VALUES(?,?,?,?,?)").run(
      randomUUID(),
      session.userId,
      id,
      "discarded",
      Date.now(),
    );
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
