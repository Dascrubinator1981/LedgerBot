import { beforeEach, afterEach, it, expect } from "vitest";
import { randomUUID } from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { openDatabase } from "../src/lib/db";
import {
  authenticate,
  createSession,
  getSession,
  type Session,
} from "../src/lib/auth";
import { listSessions, revokeSession } from "../src/lib/session-management";
import { propose, review, confirm, state } from "../src/lib/finance";
let db: DatabaseSync,
  current: Session,
  other: Session,
  foreign: Session,
  otherToken: string;
beforeEach(() => {
  db = openDatabase(":memory:");
  current = getSession(
    db,
    authenticate(
      db,
      {
        email: "sessions@example.test",
        password: "synthetic-session-password",
      },
      true,
    ).token,
  );
  otherToken = createSession(db, current.userId).token;
  other = getSession(db, otherToken);
  foreign = getSession(
    db,
    authenticate(
      db,
      {
        email: "foreign-session@example.test",
        password: "synthetic-session-password",
      },
      true,
    ).token,
  );
});
afterEach(() => db.close());
it("lists only owner sessions without tokens/verifiers and public IDs cannot sign in", async () => {
  const result = await listSessions(db, current);
  expect(result.sessions).toHaveLength(2);
  expect(result.sessions.filter((s) => s.current)).toHaveLength(1);
  const text = JSON.stringify(result);
  expect(text).not.toContain(current.sessionHash);
  expect(text).not.toContain(current.csrf);
  expect(text).not.toContain(otherToken);
  expect(() => getSession(db, result.sessions[0].id)).toThrow();
});
it("revokes another session and its prepared approval, never posts its category", async () => {
  const p = await propose(db, other, {
      kind: "category",
      name: "Synthetic revoked draft",
    }),
    r = await review(db, other, p.id);
  const target = (await listSessions(db, current)).sessions.find(
    (s) => !s.current,
  )!;
  await revokeSession(db, current, { id: target.id });
  expect(() => getSession(db, otherToken)).toThrow();
  await expect(
    confirm(db, other, {
      proposalId: p.id,
      version: p.version,
      digest: p.digest,
      token: r.token,
      idempotencyKey: randomUUID(),
    }),
  ).rejects.toThrow();
  expect((await state(db, current.userId)).categories).toEqual([]);
  expect((await state(db, current.userId)).revision).toBe(0);
  expect((await listSessions(db, current)).sessions).toHaveLength(1);
});
it("refuses foreign IDs, current-session revocation and AI principals", async () => {
  const foreignId = (await listSessions(db, foreign)).sessions[0].id,
    own = (await listSessions(db, current)).sessions.find((s) => s.current)!.id;
  await expect(revokeSession(db, current, { id: foreignId })).rejects.toThrow(
    /unavailable/,
  );
  await expect(revokeSession(db, current, { id: own })).rejects.toThrow(
    /Sign out/,
  );
  await expect(
    revokeSession(db, { ...current, principal: "ai" }, { others: true }),
  ).rejects.toThrow(/human/);
  expect((await listSessions(db, foreign)).sessions).toHaveLength(1);
});
it("requires recent sign-in and rolls back partial revocation on an audit failure", async () => {
  db.prepare("UPDATE sessions SET created_at=? WHERE hash=?").run(
    Date.now() - 301000,
    current.sessionHash,
  );
  await expect(revokeSession(db, current, { others: true })).rejects.toThrow(
    /Sign in again/,
  );
  expect(getSession(db, otherToken).userId).toBe(current.userId);
  db.prepare("UPDATE sessions SET created_at=? WHERE hash=?").run(
    Date.now(),
    current.sessionHash,
  );
  db.exec(
    "CREATE TRIGGER fail_security_event BEFORE INSERT ON security_events BEGIN SELECT RAISE(ABORT,'synthetic audit fault'); END",
  );
  await expect(revokeSession(db, current, { others: true })).rejects.toThrow();
  expect(getSession(db, otherToken).userId).toBe(current.userId);
});
it("revoke-all-others preserves current approval and unrelated owners", async () => {
  const p = await propose(db, current, {
      kind: "category",
      name: "Synthetic retained draft",
    }),
    r = await review(db, current, p.id);
  await revokeSession(db, current, { others: true });
  expect(() => getSession(db, otherToken)).toThrow();
  expect((await listSessions(db, foreign)).sessions).toHaveLength(1);
  await confirm(db, current, {
    proposalId: p.id,
    version: p.version,
    digest: p.digest,
    token: r.token,
    idempotencyKey: randomUUID(),
  });
  expect((await state(db, current.userId)).categories).toHaveLength(1);
});
