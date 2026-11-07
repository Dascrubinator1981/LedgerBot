import { describe, it, expect } from "vitest";
import { randomBytes, randomUUID } from "node:crypto";
import { encryptDraft, decryptDraft } from "../src/lib/draft-crypto";
describe("owner-bound encrypted proposal storage", () => {
  it("round-trips without exposing the draft text", () => {
    const key = randomBytes(32),
      owner = randomUUID(),
      id = randomUUID(),
      plain = JSON.stringify({
        id,
        description: "Fictional confidential plan",
      });
    const encrypted = encryptDraft(plain, owner, key);
    expect(encrypted).not.toContain("Fictional");
    expect(decryptDraft(encrypted, owner, id, key)).toBe(plain);
  });
  it("rejects a wrong tenant, ID, key or altered ciphertext", () => {
    const key = randomBytes(32),
      owner = randomUUID(),
      id = randomUUID(),
      encrypted = encryptDraft(JSON.stringify({ id }), owner, key);
    expect(() => decryptDraft(encrypted, randomUUID(), id, key)).toThrow();
    expect(() => decryptDraft(encrypted, owner, randomUUID(), key)).toThrow();
    expect(() => decryptDraft(encrypted, owner, id, randomBytes(32))).toThrow();
    const value = JSON.parse(encrypted);
    value.tag = Buffer.alloc(16).toString("base64");
    expect(() => decryptDraft(JSON.stringify(value), owner, id, key)).toThrow();
  });
});
