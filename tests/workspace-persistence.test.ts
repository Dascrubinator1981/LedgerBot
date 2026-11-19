import { it, expect, vi } from "vitest";
import { mkdtempSync, rmSync, existsSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { openDatabase } from "../src/lib/db";
import { authenticate, getSession } from "../src/lib/auth";
import { propose, review, confirm, state } from "../src/lib/finance";
import {
  orderedAccounts,
  workspacePreferencesSchema,
} from "../src/lib/workspace-preferences";
import type { Account } from "../src/lib/domain";
it("retains approved records through connection restart and expired login, and refuses a missing known file", async () => {
  const dir = mkdtempSync(join(tmpdir(), "ledgerbot-persistence-"));
  const file = join(dir, "test.sqlite");
  vi.stubEnv("LEDGERBOT_DATABASE_PATH", file);
  let db = openDatabase();
  try {
    const credentials = {
      email: "restart-only@example.test",
      password: "fictional-password-123",
    };
    const token = authenticate(db, credentials, true).token;
    const session = getSession(db, token);
    const p = await propose(db, session, {
      kind: "account",
      name: "Fictional durable account",
      type: "checking",
      opening: 100000,
      asOf: "2026-01-01",
      openingBasis: "start-of-day",
    });
    const r = await review(db, session, p.id);
    await confirm(db, session, {
      proposalId: p.id,
      version: p.version,
      digest: p.digest,
      token: r.token,
      idempotencyKey: randomUUID(),
    });
    const first = await state(db, session.userId);
    expect(first.accounts).toHaveLength(1);
    expect(first.settings.workspace?.defaultAccountId).toBe(
      first.accounts[0].id,
    );
    db.close();
    const future = Date.now() + 9 * 86400000;
    vi.spyOn(Date, "now").mockReturnValue(future);
    db = openDatabase();
    expect(() => getSession(db, token)).toThrow("Sign in required");
    const next = getSession(db, authenticate(db, credentials, false).token);
    const restored = await state(db, next.userId);
    expect(restored.accounts).toEqual(first.accounts);
    expect(restored.accounts[0].opening).toBe(100000);
    expect(restored.settings.workspace).toEqual(first.settings.workspace);
    const other = getSession(
      db,
      authenticate(
        db,
        {
          email: "different-empty@example.test",
          password: "fictional-password-456",
        },
        true,
      ).token,
    );
    expect((await state(db, other.userId)).accounts).toEqual([]);
    db.close();
    unlinkSync(file);
    expect(() => openDatabase()).toThrow("saved data file is missing");
    expect(existsSync(file)).toBe(false);
  } finally {
    try {
      db.close();
    } catch {}
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    rmSync(dir, { recursive: true, force: true });
  }
});
it("validates persisted default/order and keeps default first without losing accounts", () => {
  const ids = [randomUUID(), randomUUID(), randomUUID()];
  const accounts = ids.map((id, i) => ({
    id,
    name: `Fictional ${i}`,
    type: "checking",
    opening: 0,
    asOf: "2026-01-01",
    currency: "USD",
  })) as Account[];
  const p = workspacePreferencesSchema.parse({
    defaultAccountId: ids[1],
    accountOrder: [ids[2], ids[0], ids[1]],
  });
  expect(orderedAccounts(accounts, p).map((a) => a.id)).toEqual([
    ids[1],
    ids[2],
    ids[0],
  ]);
  expect(
    workspacePreferencesSchema.safeParse({ accountOrder: [ids[0], ids[0]] })
      .success,
  ).toBe(false);
});
