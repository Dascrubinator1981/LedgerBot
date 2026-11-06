import { NextResponse } from "next/server";
import { postgresMode } from "@/lib/provider-auth";
import { signupsDisabled } from "@/lib/registration";
export function GET() {
  return NextResponse.json(
    {
      authProvider: postgresMode() ? "supabase" : "local-development",
      allowSignup: !signupsDisabled(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
