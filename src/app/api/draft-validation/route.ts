import { NextRequest } from "next/server";
import { withFinance } from "@/lib/backend";
import { body } from "@/lib/http";
import { propose, activeSession } from "@/lib/finance";
export async function POST(request: NextRequest) {
  return withFinance(request, true, async (db, session) => {
    await activeSession(db, session);
    return propose(db, session, await body(request), false);
  });
}
