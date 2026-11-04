import { NextRequest, NextResponse } from "next/server";
import { database } from "./db";
import { getSession, type Session } from "./auth";
export const COOKIE = "ledgerbot_session";
export function session(request: NextRequest) {
  return getSession(database(), request.cookies.get(COOKIE)?.value);
}
export function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  const expected = new URL(
    process.env.LEDGERBOT_APP_ORIGIN || "http://127.0.0.1:3000",
  ).origin;
  if (
    !origin ||
    origin !== expected ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    throw new Error("Same-origin request required");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new Error("JSON required");
}
export function mutation(request: NextRequest): Session {
  sameOrigin(request);
  const s = session(request);
  if (request.headers.get("x-csrf-token") !== s.csrf)
    throw new Error("Invalid request token");
  return s;
}
export async function body(request: NextRequest): Promise<unknown> {
  // Bound actual streamed bytes, not only the caller-controlled Content-Length header.
  const reader = request.body?.getReader();
  if (!reader) throw new Error("Request body required");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 65536) {
      await reader.cancel();
      throw new Error("Request too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function failure(error: unknown) {
  if (error instanceof Error && error.message === "Sign in required")
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  // Never expose SQL, filesystem paths, or submitted financial payloads.
  const message =
    error instanceof Error &&
    !/SQLITE|constraint|database|JSON|Unexpected/i.test(error.message)
      ? error.message
      : "Request could not be completed";
  return NextResponse.json(
    {
      error:
        message.length < 300
          ? message
          : "Invalid input. Check the form fields.",
    },
    { status: 400 },
  );
}
