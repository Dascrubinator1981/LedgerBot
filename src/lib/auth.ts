import { PublicError } from "./errors";
import {
  randomBytes,
  randomUUID,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

export const hash = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const secret = () => randomBytes(32).toString("hex");
export type Session = {
  userId: string;
  sessionHash: string;
  csrf: string;
  principal: "human" | "ai";
};
export const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(12).max(128),
});
export function throttle(db: DatabaseSync, key: string, now = Date.now()) {
  const old = db
    .prepare("SELECT count,reset_at FROM auth_attempts WHERE key=?")
    .get(hash(key)) as { count: number; reset_at: number } | undefined;
  if (old && old.reset_at > now && old.count >= 15)
    throw new PublicError("Too many attempts. Try again in 15 minutes.");
  db.prepare(
    "INSERT INTO auth_attempts VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET count=excluded.count,reset_at=excluded.reset_at",
  ).run(
    hash(key),
    old && old.reset_at > now ? old.count + 1 : 1,
    old && old.reset_at > now ? old.reset_at : now + 900000,
  );
}
export function authenticate(
  db: DatabaseSync,
  input: unknown,
  signup: boolean,
) {
  const { email, password } = credentials.parse(input);
  throttle(db, email);
  const existing = db
    .prepare("SELECT id,password FROM users WHERE email=?")
    .get(email) as { id: string; password: string } | undefined;
  // Execute the same KDF for absent users to reduce account-enumeration timing differences.
  const salt =
    existing?.password.split(":")[0] || randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64);
  if (signup) {
    if (existing)
      throw new PublicError("Unable to create account with these credentials");
    const id = randomUUID();
    db.prepare("INSERT INTO users(id,email,password) VALUES(?,?,?)").run(
      id,
      email,
      `${salt}:${derived.toString("hex")}`,
    );
    return createSession(db, id);
  }
  if (
    !existing ||
    !timingSafeEqual(
      derived,
      Buffer.from(existing.password.split(":")[1], "hex"),
    )
  )
    throw new PublicError("Invalid email or password");
  return createSession(db, existing.id);
}
export function createSession(db: DatabaseSync, userId: string) {
  const token = secret(),
    csrf = secret();
  db.prepare(
    "INSERT INTO sessions(hash,user_id,expires,csrf,principal,created_at) VALUES(?,?,?,?,?,?)",
  ).run(
    hash(token),
    userId,
    Date.now() + 8 * 3600000,
    csrf,
    "human",
    Date.now(),
  );
  return { token, csrf };
}
export function getSession(db: DatabaseSync, token?: string): Session {
  if (!token) throw new PublicError("Sign in required", 401);
  const row = db
    .prepare(
      "SELECT user_id,csrf,principal FROM sessions WHERE hash=? AND expires>?",
    )
    .get(hash(token), Date.now()) as
    { user_id: string; csrf: string; principal: "human" | "ai" } | undefined;
  if (!row) throw new PublicError("Sign in required", 401);
  return {
    userId: row.user_id,
    csrf: row.csrf,
    principal: row.principal,
    sessionHash: hash(token),
  };
}
