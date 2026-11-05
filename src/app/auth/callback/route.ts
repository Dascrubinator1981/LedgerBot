import { NextRequest, NextResponse } from "next/server";
import {
  provider,
  newProviderSession,
  setAppCookie,
} from "@/lib/provider-auth";
import { withTenantDatabase } from "@/lib/postgres";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  const origin = process.env.LEDGERBOT_APP_ORIGIN || "http://127.0.0.1:3000";
  try {
    const code = request.nextUrl.searchParams.get("code");
    if (!code) return NextResponse.redirect(`${origin}/?auth=invalid-link`);
    const auth = provider(request);
    const { error } = await auth.client.auth.exchangeCodeForSession(code);
    if (error)
      return auth.finish(NextResponse.redirect(`${origin}/?auth=invalid-link`));
    const { data } = await auth.client.auth.getUser();
    if (!data.user?.email_confirmed_at)
      return auth.finish(NextResponse.redirect(`${origin}/?auth=invalid-link`));
    const session = await withTenantDatabase(data.user.id, (db) =>
      newProviderSession(db, data.user),
    );
    const suffix =
      request.nextUrl.searchParams.get("flow") === "recovery"
        ? "?recovery=1"
        : "";
    return auth.finish(
      setAppCookie(NextResponse.redirect(`${origin}/${suffix}`), session.token),
    );
  } catch {
    return NextResponse.redirect(`${origin}/?auth=unavailable`);
  }
}
