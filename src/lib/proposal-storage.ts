import { DatabaseSync } from "node:sqlite";
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { encryptDraft, decryptDraft } from "./draft-crypto";
import type { FinanceDb } from "./finance-db";
import type { Proposal } from "./domain";
const keys = new WeakMap<object, Buffer>();
function localKey(db: DatabaseSync) {
  let key = keys.get(db);
  if (key) return key;
  const file = (db.prepare("PRAGMA database_list").get() as { file: string })
    .file;
  if (!file) key = randomBytes(32);
  else {
    const path = `${file}.draft-key`;
    try {
      key = readFileSync(path);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      const generated = randomBytes(32);
      try {
        writeFileSync(path, generated, { flag: "wx", mode: 0o600 });
        key = generated;
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
        key = readFileSync(path);
      }
    }
  }
  if (key.length !== 32) throw new Error("Local draft key unavailable");
  keys.set(db, key);
  return key;
}
export function proposalText(db: FinanceDb, value: string, userId: string) {
  const envelope = JSON.parse(value);
  if (db instanceof DatabaseSync && envelope.ciphertext && envelope.nonce)
    return decryptDraft(value, userId, envelope.id, localKey(db));
  return value;
}
export function storedProposal(db: FinanceDb, p: Proposal, userId: string) {
  const plain = JSON.stringify(p);
  return db instanceof DatabaseSync && p.operation.kind === "draft"
    ? encryptDraft(plain, userId, localKey(db))
    : plain;
}
