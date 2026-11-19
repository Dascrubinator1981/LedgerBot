import { randomUUID } from "node:crypto";
import { z } from "./schema";
import { operationSchema, type Proposal } from "./domain";
import { state, activeSession } from "./finance";
import { storedProposal, proposalText } from "./proposal-storage";
import { proposalDigest, verifyDigest } from "./proposal-integrity";
import { reviewExpiration } from "./review-expiration";
import type { FinanceDb } from "./finance-db";
import type { Session } from "./auth";
export const savedReviewSchema = z.object({
  operation: operationSchema,
  replaceId: z.uuid().optional(),
  choice: z.enum(["today", "week", "saturday", "default"]).default("default"),
  reminderMinute: z.number().int().min(0).max(60).default(30),
});
export async function saveReview(
  db: FinanceDb,
  session: Session,
  input: unknown,
) {
  await activeSession(db, session);
  const data = savedReviewSchema.parse(input);
  if (data.operation.kind !== "draft")
    throw new Error("Saved review must contain editable draft data");
  const current = await state(db, session.userId, false),
    timezone = current.settings.timezone || "Etc/UTC";
  const expiration = reviewExpiration(
    data.choice,
    timezone,
    data.reminderMinute,
  );
  const p: Proposal = {
    id: randomUUID(),
    version: 1,
    digest: "",
    operation: data.operation,
    before: null,
    status: "saved_for_later",
    createdAt: Date.now(),
    expiresAt: expiration.expiresAt,
    revision: current.revision,
    source: "human",
    savedReview: {
      deadlineAt: expiration.deadlineAt,
      remindAt: expiration.remindAt,
      timezone,
      choice: data.choice,
    },
  };
  p.digest = proposalDigest(session.userId, p);
  await db.exec("BEGIN IMMEDIATE");
  try {
    if (data.replaceId) {
      const row = (await db
        .prepare("SELECT data FROM proposals WHERE id=? AND user_id=?")
        .get(data.replaceId, session.userId)) as { data: string } | undefined;
      if (!row) throw new Error("Saved review unavailable");
      const previous = JSON.parse(
        proposalText(db, row.data, session.userId),
      ) as Proposal;
      verifyDigest(session.userId, previous);
      if (
        previous.status !== "saved_for_later" ||
        previous.expiresAt <= Date.now()
      )
        throw new Error("Saved review expired or completed");
      await db
        .prepare("UPDATE proposals SET data=? WHERE id=? AND user_id=?")
        .run(
          storedProposal(
            db,
            { ...previous, status: "superseded" },
            session.userId,
          ),
          previous.id,
          session.userId,
        );
    }
    await db
      .prepare("INSERT INTO proposals VALUES(?,?,?)")
      .run(p.id, session.userId, storedProposal(db, p, session.userId));
    await db.exec("COMMIT");
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
  return {
    id: p.id,
    expiresAt: p.expiresAt,
    deadlineAt: expiration.deadlineAt,
  };
}
