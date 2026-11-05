import { NextRequest } from "next/server";
import { z } from "zod";
import { withFinance } from "@/lib/backend";
import { PublicError } from "@/lib/errors";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return withFinance(request, false, async (db, s) => {
    const id = z.uuid().parse(request.nextUrl.searchParams.get("proposalId"));
    const row = (await db
      .prepare("SELECT data FROM receipts WHERE proposal_id=? AND user_id=?")
      .get(id, s.userId)) as { data: string } | undefined;
    if (!row) throw new PublicError("Receipt not found", 404);
    return JSON.parse(row.data);
  });
}
