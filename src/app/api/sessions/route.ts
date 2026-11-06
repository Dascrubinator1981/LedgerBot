import { NextRequest } from "next/server";
import { withFinance } from "@/lib/backend";
import { body } from "@/lib/http";
import { z } from "@/lib/schema";
import { listSessions, revokeSession } from "@/lib/session-management";
export async function GET(request: NextRequest) {
  return withFinance(request, false, (db, session) =>
    listSessions(db, session),
  );
}
export async function DELETE(request: NextRequest) {
  return withFinance(request, true, async (db, session) => {
    const input = z
      .union([
        z.object({ others: z.literal(true) }).strict(),
        z.object({ id: z.string().regex(/^[a-f0-9]{64}$/) }).strict(),
      ])
      .parse(await body(request));
    return revokeSession(db, session, input);
  });
}
