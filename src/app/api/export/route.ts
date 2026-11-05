import { NextRequest } from "next/server";
import { z } from "zod";
import { withFinance } from "@/lib/backend";
import { body } from "@/lib/http";
import { state } from "@/lib/finance";
import { civilToday } from "@/lib/domain";
import { financialExport, ledgerCsv } from "@/lib/exports";
import { PublicError } from "@/lib/errors";
export async function POST(request: NextRequest) {
  return withFinance(request, true, async (db, s) => {
    if (s.principal !== "human")
      throw new PublicError("Independent human session required", 403);
    const session = (await db
      .prepare("SELECT created_at FROM sessions WHERE hash=? AND user_id=?")
      .get(s.sessionHash, s.userId)) as { created_at: number };
    if (!session || Date.now() - Number(session.created_at) > 300000)
      throw new PublicError(
        "Sign in again before exporting private financial data",
      );
    const input = z
      .object({
        format: z.enum(["json", "csv"]),
        includeDrafts: z.boolean().default(false),
      })
      .parse(await body(request));
    const data = await state(db, s.userId, input.includeDrafts);
    return {
      filename: `ledgerbot-${civilToday(data.settings.timezone)}.${input.format}`,
      type: input.format === "json" ? "application/json" : "text/csv",
      data:
        input.format === "json"
          ? JSON.stringify(financialExport(data, input.includeDrafts), null, 2)
          : ledgerCsv(data),
    };
  });
}
