import { NextRequest } from "next/server";
import { z } from "zod";
import { confirm } from "@/lib/finance";
import { body } from "@/lib/http";
import { withFinance } from "@/lib/backend";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return withFinance(request, true, async (db, s) => {
    const input = z
      .object({
        proposalId: z.uuid(),
        version: z.number().int(),
        digest: z.string().regex(/^[a-f0-9]{64}$/),
        token: z.string().regex(/^[a-f0-9]{64}$/),
        idempotencyKey: z.string().min(16).max(100),
      })
      .parse(await body(request));
    return confirm(db, s, input);
  });
}
