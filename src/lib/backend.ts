import { NextRequest, NextResponse } from "next/server";
import { database } from "./db";
import { mutation, session, sameOrigin, failure } from "./http";
import {
  postgresMode,
  verifiedIdentity,
  providerSession,
} from "./provider-auth";
import { withTenantDatabase } from "./postgres";
import type { FinanceDb } from "./finance-db";
import type { Session } from "./auth";
import { PublicError } from "./errors";
export async function withFinance(
  request: NextRequest,
  write: boolean,
  work: (db: FinanceDb, user: Session) => Promise<unknown>,
) {
  let finish = (response: NextResponse) => response;
  try {
    if (postgresMode()) {
      if (write) sameOrigin(request);
      const auth = await verifiedIdentity(request);
      finish = auth.finish;
      const result = await withTenantDatabase(auth.user.id, async (db) => {
        const s = await providerSession(db, request, auth.user.id);
        if (write && request.headers.get("x-csrf-token") !== s.csrf)
          throw new PublicError("Invalid request token");
        return await work(db, s);
      });
      return auth.finish(
        NextResponse.json(result, { headers: { "Cache-Control": "no-store" } }),
      );
    }
    if (process.env.NODE_ENV === "production")
      throw new PublicError(
        "A verified PostgreSQL backend is required for production",
        503,
      );
    const s = write ? mutation(request) : session(request);
    return NextResponse.json(await work(database(), s), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return finish(failure(error));
  }
}
