import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";
import { hash, secret, type Session } from "./auth";
import type { FinanceDb } from "./finance-db";
import { PublicError } from "./errors";
export const postgresMode = () => process.env.LEDGERBOT_BACKEND === "postgres";
export const appCookie = "ledgerbot_session";
export function provider(request: NextRequest) {
  const url = process.env.LEDGERBOT_SUPABASE_URL,
    key = process.env.LEDGERBOT_SUPABASE_ANON_KEY;
  if (!url || !key)
    throw new PublicError("Verified authentication is not configured", 503);
  const changes: { name: string; value: string; options: CookieOptions }[] = [];
  const secure =
    process.env.NODE_ENV === "production" ||
    process.env.LEDGERBOT_COOKIE_SECURE === "true";
  const client = createServerClient(url, key, {
    cookieOptions: { httpOnly: true, sameSite: "lax", secure, path: "/" },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        for (const item of items) {
          request.cookies.set(item.name, item.value);
          changes.push(item);
        }
      },
    },
  });
  return {
    client,
    finish: (response: NextResponse) => {
      for (const item of changes)
        response.cookies.set(item.name, item.value, {
          ...item.options,
          httpOnly: true,
          secure,
          sameSite: "lax",
          path: "/",
        });
      return response;
    },
  };
}
export async function verifiedIdentity(request: NextRequest) {
  const context = provider(request);
  const { data, error } = await context.client.auth.getUser();
  if (error || !data.user?.email_confirmed_at)
    throw new PublicError("Sign in with a verified email account", 401);
  return { ...context, user: data.user };
}
export async function newProviderSession(
  db: FinanceDb,
  user: { id: string; email?: string },
  startedAt = Date.now(),
) {
  await db
    .prepare(
      "INSERT INTO users(id,email,password) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING",
    )
    .run(user.id, user.email || `${user.id}@identity.invalid`, null);
  const security = (await db
    .prepare("SELECT security_changed_at FROM users WHERE id=?")
    .get(user.id)) as { security_changed_at: string | number };
  if (startedAt < Number(security.security_changed_at))
    throw new PublicError(
      "Credentials changed while signing in. Sign in again.",
    );
  const token = secret(),
    csrf = secret();
  await db
    .prepare(
      "INSERT INTO sessions(hash,user_id,expires,csrf,principal) VALUES(?,?,?,?,?)",
    )
    .run(hash(token), user.id, Date.now() + 8 * 3600000, csrf, "human");
  return { token, csrf };
}
export async function providerSession(
  db: FinanceDb,
  request: NextRequest,
  userId: string,
): Promise<Session> {
  const token = request.cookies.get(appCookie)?.value;
  if (!token) throw new PublicError("Sign in required", 401);
  const row = (await db
    .prepare(
      "SELECT user_id,csrf,principal FROM sessions WHERE hash=? AND user_id=? AND expires>?",
    )
    .get(hash(token), userId, Date.now())) as
    { user_id: string; csrf: string; principal: "human" | "ai" } | undefined;
  if (!row || row.principal !== "human")
    throw new PublicError("Sign in required", 401);
  return {
    userId,
    sessionHash: hash(token),
    csrf: row.csrf,
    principal: row.principal,
  };
}
export function setAppCookie(response: NextResponse, token: string) {
  response.cookies.set(appCookie, token, {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === "production" ||
      process.env.LEDGERBOT_COOKIE_SECURE === "true",
    sameSite: "strict",
    path: "/",
    maxAge: 8 * 3600,
  });
  return response;
}
