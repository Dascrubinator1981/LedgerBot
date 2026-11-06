import { afterEach, describe, it, expect, vi } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import {
  encryptDraft,
  decryptDraft,
  draftConfiguration,
} from "../src/lib/draft-crypto";
afterEach(() => vi.unstubAllEnvs());
describe("versioned draft key recovery and rotation", () => {
  it("reads an old draft while new drafts use the active authenticated key ID", () => {
    const old = randomBytes(32).toString("hex"),
      next = randomBytes(32).toString("hex"),
      owner = randomUUID(),
      id = randomUUID(),
      text = JSON.stringify({ id, note: "Synthetic rotation note" });
    vi.stubEnv("LEDGERBOT_DRAFT_KEY", old);
    vi.stubEnv("LEDGERBOT_DRAFT_KEYS", "");
    const legacy = encryptDraft(text, owner);
    expect(JSON.parse(legacy).v).toBe(1);
    vi.stubEnv(
      "LEDGERBOT_DRAFT_KEYS",
      JSON.stringify({ first: old, second: next }),
    );
    vi.stubEnv("LEDGERBOT_DRAFT_ACTIVE_KEY_ID", "second");
    expect(decryptDraft(legacy, owner, id)).toBe(text);
    const rotated = encryptDraft(decryptDraft(legacy, owner, id), owner);
    expect(JSON.parse(rotated).v).toBe(2);
    expect(JSON.parse(rotated).kid).toBe("second");
    expect(decryptDraft(rotated, owner, id)).toBe(text);
    vi.stubEnv("LEDGERBOT_DRAFT_KEY", "");
    vi.stubEnv("LEDGERBOT_DRAFT_KEYS", JSON.stringify({ second: next }));
    expect(decryptDraft(rotated, owner, id)).toBe(text);
    expect(() => decryptDraft(legacy, owner, id)).toThrow(/unavailable/);
  });
  it("authenticates key identifiers and supports old v2 keys during staged rotation", () => {
    const key = randomBytes(32).toString("hex"),
      next = randomBytes(32).toString("hex"),
      owner = randomUUID(),
      id = randomUUID(),
      text = JSON.stringify({ id });
    vi.stubEnv("LEDGERBOT_DRAFT_KEY", "");
    vi.stubEnv(
      "LEDGERBOT_DRAFT_KEYS",
      JSON.stringify({ first: key, alias: key, second: next }),
    );
    vi.stubEnv("LEDGERBOT_DRAFT_ACTIVE_KEY_ID", "first");
    const original = encryptDraft(text, owner);
    vi.stubEnv("LEDGERBOT_DRAFT_ACTIVE_KEY_ID", "second");
    expect(decryptDraft(original, owner, id)).toBe(text);
    const forged = { ...JSON.parse(original), kid: "alias" };
    expect(() => decryptDraft(JSON.stringify(forged), owner, id)).toThrow();
    expect(() => decryptDraft(original, randomUUID(), id)).toThrow();
    expect(() => decryptDraft(original, owner, randomUUID())).toThrow();
  });
  it("fails closed on malformed or missing key configuration", () => {
    expect(() =>
      draftConfiguration({ LEDGERBOT_DRAFT_KEYS: "bad-secret-config" }),
    ).toThrow("Invalid draft key configuration");
    expect(() => draftConfiguration({ LEDGERBOT_DRAFT_KEYS: "[]" })).toThrow();
    expect(() =>
      draftConfiguration({
        LEDGERBOT_DRAFT_KEYS: JSON.stringify({ a: "not-a-key" }),
        LEDGERBOT_DRAFT_ACTIVE_KEY_ID: "a",
      }),
    ).toThrow();
    expect(() =>
      draftConfiguration({
        LEDGERBOT_DRAFT_KEYS: JSON.stringify({
          a: randomBytes(32).toString("hex"),
        }),
        LEDGERBOT_DRAFT_ACTIVE_KEY_ID: "b",
      }),
    ).toThrow(/unavailable/);
    expect(() => draftConfiguration({})).toThrow();
  });
});
