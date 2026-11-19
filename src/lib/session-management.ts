import { randomUUID } from "node:crypto";
import { hash, type Session } from "./auth";
import type { FinanceDb } from "./finance-db";
import { PublicError } from "./errors";
type Row = {
  hash: string;
  user_id: string;
  principal: string;
  created_at: number;
  expires: number;
};
// Public handle is domain-separated from the stored verifier; it is never a cookie credential.
const handle = (stored: string) =>
  hash(`ledgerbot-public-session:v1:${stored}`);
async function live(db: FinanceDb, session: Session, fresh: boolean) {
  const row = (await db
    .prepare(
      "SELECT hash,user_id,principal,created_at,expires FROM sessions WHERE hash=? AND user_id=?",
    )
    .get(session.sessionHash, session.userId)) as Row | undefined;
  if (!row || Number(row.expires) <= Date.now())
    throw new PublicError("Sign in required", 401);
  if (session.principal !== "human" || row.principal !== "human")
    throw new PublicError("Independent human session required", 403);
  if (
    fresh &&
    (!row.created_at || Date.now() - Number(row.created_at) > 300000)
  )
    throw new PublicError("Sign in again before revoking other sign-ins");
  return row;
}
export async function listSessions(db: FinanceDb, session: Session) {
  const current = await live(db, session, false);
  const rows = (await db
    .prepare(
      "SELECT hash,user_id,principal,created_at,expires FROM sessions WHERE user_id=? AND expires>? AND principal='human' ORDER BY created_at DESC,hash LIMIT 51",
    )
    .all(session.userId, Date.now())) as Row[];
  const truncated = rows.length > 50,
    visible = rows.slice(0, 50);
  if (!visible.some((row) => row.hash === current.hash)) visible.push(current);
  return {
    truncated,
    sessions: visible.map((row) => ({
      id: handle(row.hash),
      current: row.hash === current.hash,
      createdAt: Number(row.created_at) || null,
      expiresAt: Number(row.expires),
    })),
  };
}
export async function revokeSession(
  db: FinanceDb,
  session: Session,
  input: { others: true } | { id: string },
) {
  await db.exec("BEGIN IMMEDIATE");
  try {
    await live(db, session, true);
    const now = Date.now();
    if ("others" in input) {
      await db
        .prepare(
          "UPDATE challenges SET used=1 WHERE user_id=? AND session_hash<>?",
        )
        .run(session.userId, session.sessionHash);
      await db
        .prepare(
          "UPDATE sessions SET expires=0 WHERE user_id=? AND hash<>? AND expires>?",
        )
        .run(session.userId, session.sessionHash, now);
    } else {
      const candidates = (await db
        .prepare(
          "SELECT hash FROM sessions WHERE user_id=? AND expires>? ORDER BY created_at DESC,hash LIMIT 1000",
        )
        .all(session.userId, now)) as { hash: string }[];
      const target = candidates.find((row) => handle(row.hash) === input.id);
      if (!target) throw new PublicError("Sign-in unavailable", 404);
      if (target.hash === session.sessionHash)
        throw new PublicError("Use Sign out to end your current sign-in");
      await db
        .prepare(
          "UPDATE challenges SET used=1 WHERE user_id=? AND session_hash=?",
        )
        .run(session.userId, target.hash);
      await db
        .prepare("UPDATE sessions SET expires=0 WHERE user_id=? AND hash=?")
        .run(session.userId, target.hash);
    }
    await db
      .prepare(
        "INSERT INTO security_events(id,user_id,event,created) VALUES(?,?,?,?)",
      )
      .run(
        randomUUID(),
        session.userId,
        "others" in input ? "other_sessions_revoked" : "session_revoked",
        now,
      );
    await db.exec("COMMIT");
    return { ok: true };
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  }
}
