import { afterEach, beforeEach, it, expect, vi } from "vitest";
import { openDatabase } from "../src/lib/db";
import { authenticate, getSession, type Session } from "../src/lib/auth";
import { saveReview } from "../src/lib/saved-reviews";
import { state, review, discard } from "../src/lib/finance";
import { reviewExpiration, localInstant } from "../src/lib/review-expiration";
import type { DatabaseSync } from "node:sqlite";
let db: DatabaseSync, user: Session, other: Session;
beforeEach(() => {
  db = openDatabase(":memory:");
  user = getSession(
    db,
    authenticate(
      db,
      {
        email: "saved-review@example.test",
        password: "synthetic-password-123",
      },
      true,
    ).token,
  );
  other = getSession(
    db,
    authenticate(
      db,
      { email: "saved-other@example.test", password: "synthetic-password-456" },
      true,
    ).token,
  );
});
afterEach(() => {
  db.close();
  vi.useRealTimers();
});
it("persists unfinished input encrypted, scoped and incapable of financial approval", async () => {
  const saved = await saveReview(db, user, {
    operation: {
      kind: "draft",
      section: "Ledger",
      operations: [],
      forms: [
        {
          section: "Ledger",
          formIndex: 0,
          values: [
            ["description", "Private fictional draft"],
            ["amount", "185"],
          ],
        },
      ],
    },
  });
  const raw = db
    .prepare("SELECT data FROM proposals WHERE id=?")
    .get(saved.id) as { data: string };
  expect(raw.data).not.toContain("Private fictional draft");
  expect(JSON.parse(raw.data).ciphertext).toBeTruthy();
  const own = await state(db, user.userId);
  expect(own.proposals[0].operation.kind).toBe("draft");
  expect(own.transactions).toEqual([]);
  expect((await state(db, other.userId)).proposals).toEqual([]);
  await expect(review(db, user, saved.id)).rejects.toThrow();
  await expect(review(db, other, saved.id)).rejects.toThrow();
  await expect(
    saveReview(
      db,
      { ...user, principal: "ai" },
      {
        operation: {
          kind: "draft",
          section: "Budget",
          operations: [],
          forms: [],
        },
      },
    ),
  ).rejects.toThrow();
  await discard(db, user, saved.id);
  expect(
    (
      db.prepare("SELECT data FROM proposals WHERE id=?").get(saved.id) as {
        data: string;
      }
    ).data,
  ).not.toContain("Private fictional draft");
});
it("uses midnight review deadlines, 1am cutoffs, Saturday and exact default durations", () => {
  const now = Date.parse("2026-11-06T18:00:00Z"),
    zone = "America/Denver";
  const e = reviewExpiration("today", zone, 30, now);
  expect(e.deadlineAt).toBe(Date.parse("2026-11-07T07:00:00Z"));
  expect(e.expiresAt).toBe(Date.parse("2026-11-07T08:00:00Z"));
  expect(e.remindAt).toBe(Date.parse("2026-11-07T03:30:00Z"));
  expect(reviewExpiration("saturday", zone, 30, now).expiresAt).toBe(
    Date.parse("2026-11-08T08:00:00Z"),
  );
  expect(reviewExpiration("week", zone, 30, now).expiresAt - now).toBe(
    7 * 86400000,
  );
  expect(reviewExpiration("default", zone, 30, now).expiresAt - now).toBe(
    30 * 86400000,
  );
  expect(localInstant("2026-11-01", 1, 0, zone)).toBe(
    Date.parse("2026-11-01T08:00:00Z"),
  );
});

it("binds a resumed source to one confirmed change and rejects replay", async () => {
  const { propose, confirm } = await import("../src/lib/finance");
  const { randomUUID } = await import("node:crypto");
  const saved = await saveReview(db, user, {
    operation: {
      kind: "draft",
      section: "Budget",
      operations: [{ kind: "category", name: "Saved fictional category" }],
      forms: [],
    },
  });
  const p = await propose(
    db,
    user,
    { kind: "category", name: "Saved fictional category" },
    true,
    saved.id,
  );
  const r = await review(db, user, p.id);
  const input = {
    proposalId: p.id,
    version: p.version,
    digest: p.digest,
    token: r.token,
    idempotencyKey: randomUUID(),
  };
  await confirm(db, user, input);
  await confirm(db, user, input);
  expect((await state(db, user.userId)).categories).toHaveLength(1);
  expect(
    (await state(db, user.userId)).proposals.find((p) => p.id === saved.id)
      ?.status,
  ).toBe("completed");
  await expect(
    propose(db, user, { kind: "category", name: "Replay" }, true, saved.id),
  ).rejects.toThrow("already completed");
});

it("supersedes an earlier saved draft atomically when saving resumed edits again", async () => {
  const operation = {
    kind: "draft",
    section: "Budget",
    operations: [],
    forms: [],
  };
  const first = await saveReview(db, user, { operation });
  const next = await saveReview(db, user, { operation, replaceId: first.id });
  const own = await state(db, user.userId);
  expect(own.proposals.find((p) => p.id === first.id)?.status).toBe(
    "superseded",
  );
  expect(own.proposals.find((p) => p.id === next.id)?.status).toBe(
    "saved_for_later",
  );
  await expect(
    saveReview(db, other, { operation, replaceId: next.id }),
  ).rejects.toThrow();
  expect((await state(db, other.userId)).proposals).toEqual([]);
});

it("keeps saved draft decryption working after closing and reopening its local database", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { join } = await import("node:path");
  const { tmpdir } = await import("node:os");
  const dir = mkdtempSync(join(tmpdir(), "ledgerbot-private-review-")),
    path = join(dir, "synthetic.sqlite");
  let local: DatabaseSync | undefined;
  try {
    local = openDatabase(path);
    const token = authenticate(
      local,
      { email: "reopen@example.test", password: "synthetic-reopen-password" },
      true,
    ).token;
    const owner = getSession(local, token);
    const saved = await saveReview(local, owner, {
      operation: {
        kind: "draft",
        section: "Ledger",
        forms: [
          {
            section: "Ledger",
            formIndex: 0,
            values: [["description", "Synthetic saved input"]],
          },
        ],
        operations: [],
      },
    });
    local.close();
    local = openDatabase(path);
    const restored = await state(local, owner.userId);
    expect(
      restored.proposals.find((p) => p.id === saved.id)?.operation,
    ).toMatchObject({
      kind: "draft",
      forms: [{ values: [["description", "Synthetic saved input"]] }],
    });
  } finally {
    local?.close();
    rmSync(dir, { recursive: true, force: true });
  }
});
it("rejects a saved source that expires after its fresh review was opened", async () => {
  const { propose, confirm } = await import("../src/lib/finance");
  const { randomUUID } = await import("node:crypto");
  const saved = await saveReview(db, user, {
    choice: "today",
    operation: { kind: "draft", section: "Budget", forms: [], operations: [] },
  });
  db.prepare("UPDATE sessions SET expires=? WHERE user_id=?").run(
    saved.expiresAt + 3600000,
    user.userId,
  );
  vi.useFakeTimers();
  vi.setSystemTime(saved.expiresAt - 1000);
  const p = await propose(
    db,
    user,
    { kind: "category", name: "Expired synthetic source" },
    true,
    saved.id,
  );
  const r = await review(db, user, p.id);
  vi.setSystemTime(saved.expiresAt + 1);
  await expect(
    confirm(db, user, {
      proposalId: p.id,
      version: p.version,
      digest: p.digest,
      token: r.token,
      idempotencyKey: randomUUID(),
    }),
  ).rejects.toThrow("expired");
  expect((await state(db, user.userId)).categories).toEqual([]);
});
