import { NextResponse } from "next/server";
import { postgresMode } from "@/lib/provider-auth";
export function GET() {
  return NextResponse.json(
    { authProvider: postgresMode() ? "supabase" : "local-development" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
