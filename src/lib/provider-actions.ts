import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  provider,
  verifiedIdentity,
  newProviderSession,
  providerSession,
  setAppCookie,
  appCookie,
} from "./provider-auth";
import { withTenantDatabase } from "./postgres";
import { PublicError } from "./errors";
export async function providerAction(
  request: NextRequest,
  input: { mode: string; email?: string; password?: string },
) {
  const startedAt = Date.now();
  const auth = provider(request),
    origin = process.env.LEDGERBOT_APP_ORIGIN || "http://127.0.0.1:3000";
  if (input.mode === "recover") {
    const email = z.email().max(254).parse(input.email);
    await auth.client.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?flow=recovery`,
    });
    return auth.finish(
      NextResponse.json({
        pending: true,
        message:
          "If the address is registered, a recovery email will arrive. Follow it in this browser.",
      }),
    );
  }
  if (input.mode === "password") {
    const verified = await verifiedIdentity(request),
      password = z.string().min(12).max(128).parse(input.password);
    await withTenantDatabase(verified.user.id, async (db) => {
      const s = await providerSession(db, request, verified.user.id);
      if (request.headers.get("x-csrf-token") !== s.csrf)
        throw new PublicError("Invalid request token");
      const row = (await db
        .prepare("SELECT created_at FROM sessions WHERE hash=? AND user_id=?")
        .get(s.sessionHash, s.userId)) as { created_at: number };
      if (!row || Date.now() - row.created_at > 300000)
        throw new PublicError(
          "Sign in again or follow a fresh recovery email before changing your password",
        );
    });
    // Do not hold a database transaction open across the provider network request.
    const { error } = await verified.client.auth.updateUser({ password });
    if (error)
      throw new PublicError(
        "Password could not be updated. Request a new recovery email.",
      );
    let revoked = false;
    for (let attempt = 0; attempt < 3 && !revoked; attempt++) {
      try {
        await withTenantDatabase(verified.user.id, async (db) => {
          await db
            .prepare("UPDATE users SET security_changed_at=? WHERE id=?")
            .run(Date.now(), verified.user.id);
          await db
            .prepare("DELETE FROM challenges WHERE user_id=?")
            .run(verified.user.id);
          await db
            .prepare("DELETE FROM sessions WHERE user_id=?")
            .run(verified.user.id);
        });
        revoked = true;
      } catch (error) {
        if ((error as { code?: string }).code !== "40001") break;
      }
    }
    await verified.client.auth.signOut({ scope: "global" });
    if (!revoked) {
      const response = verified.finish(
        NextResponse.json(
          {
            signedOut: true,
            message:
              "Password changed, but revocation of all app sessions could not be confirmed. Contact support before using financial data.",
          },
          { status: 503 },
        ),
      );
      response.cookies.delete(appCookie);
      return response;
    }
    const response = verified.finish(
      NextResponse.json({
        signedOut: true,
        message:
          "Password updated. All app sessions were revoked. Sign in again.",
      }),
    );
    response.cookies.delete(appCookie);
    return response;
  }
  const email = z.email().max(254).parse(input.email),
    password = z.string().min(12).max(128).parse(input.password);
  if (input.mode === "signup") {
    const { data, error } = await auth.client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    if (error)
      throw new PublicError(
        "Unable to register. Check your details or try signing in.",
      );
    if (!data.session)
      return auth.finish(
        NextResponse.json({
          pending: true,
          message:
            "Check your email to verify your account. Open the link in this browser. No financial records have been created.",
        }),
      );
    // Auto-confirm must not silently weaken the verified-email product policy.
    await auth.client.auth.signOut({ scope: "local" });
    throw new PublicError(
      "Email verification must be enabled by the authentication administrator",
      503,
    );
  }
  const { data, error } = await auth.client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user?.email_confirmed_at)
    throw new PublicError("Invalid credentials or email not verified");
  const session = await withTenantDatabase(data.user.id, (db) =>
    newProviderSession(db, data.user, startedAt),
  );
  return auth.finish(
    setAppCookie(NextResponse.json({ csrf: session.csrf }), session.token),
  );
}
