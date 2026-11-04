import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticate } from "@/lib/auth";
import { database } from "@/lib/db";
import { body, COOKIE, failure, mutation, sameOrigin } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const input = z
      .object({
        mode: z.enum(["signup", "login"]),
        email: z.string(),
        password: z.string(),
      })
      .parse(await body(request));
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
