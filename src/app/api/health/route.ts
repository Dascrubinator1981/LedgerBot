import { NextRequest, NextResponse } from "next/server";
import { postgresReady } from "@/lib/postgres";
import { draftKey } from "@/lib/draft-crypto";
import { assertProductionConfiguration } from "@/lib/deployment-config";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const headers = { "Cache-Control": "no-store" };
  if (request.nextUrl.searchParams.get("ready") !== "1")
    return NextResponse.json({ status: "alive" }, { headers });
  let ready = false;
  try {
    assertProductionConfiguration();
    const origin = new URL(process.env.LEDGERBOT_APP_ORIGIN || "");
    const production = process.env.NODE_ENV === "production";
    if (
      production &&
      (origin.protocol !== "https:" ||
        process.env.LEDGERBOT_COOKIE_SECURE === "false")
    )
      throw new Error("Invalid secure origin");
    if (process.env.LEDGERBOT_BACKEND !== "postgres")
      throw new Error("Verified backend required");
    draftKey();
    if (!process.env.LEDGERBOT_SUPABASE_ANON_KEY)
      throw new Error("Provider not configured");
    const health = new URL(
      "/auth/v1/health",
      process.env.LEDGERBOT_SUPABASE_URL,
    );
    const response = await fetch(health, {
      headers: { apikey: process.env.LEDGERBOT_SUPABASE_ANON_KEY },
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });
    ready = response.ok && (await postgresReady());
  } catch {
    /* Return no credentials, errors, URLs, or financial content. */
  }
  return NextResponse.json(
    { status: ready ? "ready" : "not-ready" },
    { headers, status: ready ? 200 : 503 },
  );
}
