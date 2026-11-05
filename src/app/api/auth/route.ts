import { NextRequest, NextResponse } from "next/server";
import { z } from "@/lib/schema";
import { authenticate } from "@/lib/auth";
import { database } from "@/lib/db";
import { body, COOKIE, failure, mutation, sameOrigin } from "@/lib/http";
import { postgresMode, provider, appCookie } from "@/lib/provider-auth";
import { providerAction } from "@/lib/provider-actions";
import { withFinance } from "@/lib/backend";
import { PublicError } from "@/lib/errors";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    if (process.env.NODE_ENV === "production" && !postgresMode())
      throw new PublicError(
        "Verified authentication must be configured for production",
        503,
      );
    const input = z
      .object({
        mode: z.enum(["signup", "login", "recover", "password"]),
        email: z.string().optional(),
        password: z.string().optional(),
      })
      .parse(await body(request));
    if (postgresMode()) return await providerAction(request, input);
    if (input.mode === "recover" || input.mode === "password")
      throw new PublicError(
        "Email recovery is available only with verified authentication configured",
        503,
      );
    const { token, csrf } = authenticate(
      database(),
      input,
      input.mode === "signup",
    );
    const response = NextResponse.json({ csrf });
    response.cookies.set(COOKIE, token, {
      httpOnly: true,
      secure:
        process.env.LEDGERBOT_COOKIE_SECURE === "true" ||
        process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 8 * 3600,
    });
    return response;
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    if (postgresMode()) {
      const response = await withFinance(request, true, async (db, s) => {
        await db
          .prepare("DELETE FROM challenges WHERE session_hash=?")
          .run(s.sessionHash);
        await db
          .prepare("DELETE FROM sessions WHERE hash=? AND user_id=?")
          .run(s.sessionHash, s.userId);
        return { ok: true };
      });
      if (!response.ok) return response;
      const auth = provider(request);
      await auth.client.auth.signOut({ scope: "local" });
      response.cookies.delete(appCookie);
      return auth.finish(response);
    }
    const s = mutation(request);
    database()
      .prepare("DELETE FROM challenges WHERE session_hash=?")
      .run(s.sessionHash);
    database().prepare("DELETE FROM sessions WHERE hash=?").run(s.sessionHash);
    const response = NextResponse.json({ ok: true });
    response.cookies.delete(COOKIE);
    return response;
  } catch (error) {
    return failure(error);
  }
}
