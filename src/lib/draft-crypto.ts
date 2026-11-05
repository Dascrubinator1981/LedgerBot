import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
export function draftKey(): Buffer {
  const raw = process.env.LEDGERBOT_DRAFT_KEY;
  if (!raw || !/^[a-f0-9]{64}$/.test(raw))
    throw new Error("Draft encryption key is not configured");
  return Buffer.from(raw, "hex");
}
export function encryptDraft(
  text: string,
  owner: string,
  key = draftKey(),
): string {
  const value = JSON.parse(text) as { id: string };
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(Buffer.from(`${owner}:${value.id}:v1`));
  const ciphertext = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return JSON.stringify({
    v: 1,
    id: value.id,
    nonce: nonce.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  });
}
export function decryptDraft(
  text: string,
  owner: string,
  id: string,
  key = draftKey(),
): string {
  const value = JSON.parse(text) as {
    v: number;
    id: string;
    nonce: string;
    tag: string;
    ciphertext: string;
  };
  if (value.v !== 1 || value.id !== id)
    throw new Error("Invalid encrypted draft");
  const decipher = createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(value.nonce, "base64"),
  );
  decipher.setAAD(Buffer.from(`${owner}:${id}:v1`));
  decipher.setAuthTag(Buffer.from(value.tag, "base64"));
  return Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
}
