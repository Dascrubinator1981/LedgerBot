import { randomBytes, createCipheriv, createDecipheriv } from "node:crypto";
type Configuration = {
  version: 1 | 2;
  activeId: string;
  keys: Map<string, Buffer>;
  legacy?: Buffer;
};
const validKey = (raw: string | undefined) => {
  if (!raw || !/^[a-f0-9]{64}$/.test(raw))
    throw new Error("Draft encryption key is not configured");
  return Buffer.from(raw, "hex");
};
export function draftConfiguration(
  environment: Record<string, string | undefined> = process.env,
): Configuration {
  const legacy = environment.LEDGERBOT_DRAFT_KEY
    ? validKey(environment.LEDGERBOT_DRAFT_KEY)
    : undefined;
  if (!environment.LEDGERBOT_DRAFT_KEYS) {
    return {
      version: 1,
      activeId: "legacy",
      keys: new Map([["legacy", legacy || validKey(undefined)]]),
      legacy,
    };
  }
  let raw: unknown;
  try {
    raw = JSON.parse(environment.LEDGERBOT_DRAFT_KEYS);
  } catch {
    throw new Error("Invalid draft key configuration");
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new Error("Invalid draft key configuration");
  const entries = Object.entries(raw),
    activeId = environment.LEDGERBOT_DRAFT_ACTIVE_KEY_ID || "";
  if (
    !entries.length ||
    entries.length > 16 ||
    !/^[a-zA-Z0-9._-]{1,64}$/.test(activeId)
  )
    throw new Error("Invalid draft key configuration");
  const keys = new Map<string, Buffer>();
  for (const [id, value] of entries) {
    if (!/^[a-zA-Z0-9._-]{1,64}$/.test(id) || typeof value !== "string")
      throw new Error("Invalid draft key configuration");
    keys.set(id, validKey(value));
  }
  if (!keys.has(activeId)) throw new Error("Active draft key is unavailable");
  return { version: 2, activeId, keys, legacy };
}
export function draftKey(): Buffer {
  const config = draftConfiguration();
  return config.keys.get(config.activeId)!;
}
export function encryptDraft(
  text: string,
  owner: string,
  override?: Buffer,
): string {
  const value = JSON.parse(text) as { id: string };
  if (typeof value.id !== "string") throw new Error("Invalid draft identity");
  const config = override ? null : draftConfiguration();
  const key = override || config!.keys.get(config!.activeId)!;
  const version = config?.version || 1;
  const keyId = version === 2 ? config!.activeId : undefined;
  const nonce = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key, nonce);
  cipher.setAAD(
    Buffer.from(`${owner}:${value.id}:v${version}${keyId ? `:${keyId}` : ""}`),
  );
  const ciphertext = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  return JSON.stringify({
    v: version,
    id: value.id,
    ...(keyId ? { kid: keyId } : {}),
    nonce: nonce.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    ciphertext: ciphertext.toString("base64"),
  });
}
export function decryptDraft(
  text: string,
  owner: string,
  id: string,
  override?: Buffer,
): string {
  const value = JSON.parse(text) as {
    v: number;
    id: string;
    kid?: string;
    nonce: string;
    tag: string;
    ciphertext: string;
  };
  if ((value.v !== 1 && value.v !== 2) || value.id !== id)
    throw new Error("Invalid encrypted draft");
  const config = override ? null : draftConfiguration();
  const key =
    override ||
    (value.v === 1 ? config!.legacy : config!.keys.get(value.kid || ""));
  if (
    !key ||
    (value.v === 2 && (!value.kid || !/^[a-zA-Z0-9._-]{1,64}$/.test(value.kid)))
  )
    throw new Error("Draft decryption key is unavailable");
  const nonce = Buffer.from(value.nonce, "base64"),
    tag = Buffer.from(value.tag, "base64");
  if (nonce.length !== 12 || tag.length !== 16)
    throw new Error("Invalid encrypted draft");
  const decipher = createDecipheriv("aes-256-gcm", key, nonce);
  decipher.setAAD(
    Buffer.from(
      `${owner}:${id}:v${value.v}${value.v === 2 ? `:${value.kid}` : ""}`,
    ),
  );
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([
    decipher.update(Buffer.from(value.ciphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  if ((JSON.parse(plain) as { id?: string }).id !== id)
    throw new Error("Invalid decrypted identity");
  return plain;
}
