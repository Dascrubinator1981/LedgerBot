import { NextRequest, NextResponse } from "next/server";
import { database } from "./db";
import { getSession, type Session } from "./auth";
import { PublicError, publicFailure } from "./errors";
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
    throw new PublicError("Same-origin request required");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new PublicError("JSON required");
}
export function mutation(request: NextRequest): Session {
  sameOrigin(request);
  const s = session(request);
  if (request.headers.get("x-csrf-token") !== s.csrf)
    throw new PublicError("Invalid request token");
  return s;
}
export async function body(request: NextRequest): Promise<unknown> {
  // Bound actual streamed bytes, not only the caller-controlled Content-Length header.
  const reader = request.body?.getReader();
  if (!reader) throw new PublicError("Request body required");
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > 65536) {
      await reader.cancel();
      throw new PublicError("Request too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function failure(error: unknown) {
  const result = publicFailure(error);
  return NextResponse.json({ error: result.error }, { status: result.status });
}
