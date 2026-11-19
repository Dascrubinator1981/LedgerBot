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
import { supportResponse } from "./support-response";
export async function withFinance(
  request: NextRequest,
  write: boolean,
  work: (db: FinanceDb, user: Session) => Promise<unknown>,
) {
  const trace = supportResponse();
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
        trace.running();
        return await work(db, s);
      });
      trace.complete();
      return trace.finish(
        auth.finish(
          NextResponse.json(result, {
            headers: { "Cache-Control": "no-store" },
          }),
        ),
      );
    }
    if (process.env.NODE_ENV === "production")
      throw new PublicError(
        "A verified PostgreSQL backend is required for production",
        503,
      );
    const s = write ? mutation(request) : session(request);
    trace.running();
    const result = await work(database(), s);
    trace.complete();
    return trace.finish(
      NextResponse.json(result, {
        headers: { "Cache-Control": "no-store" },
      }),
    );
  } catch (error) {
    return trace.finish(finish(failure(error)), error);
  }
}
