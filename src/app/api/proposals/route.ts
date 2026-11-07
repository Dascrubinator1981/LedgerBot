import { NextRequest } from "next/server";
import { z } from "@/lib/schema";
import { propose, discard } from "@/lib/finance";
import { body } from "@/lib/http";
import { withFinance } from "@/lib/backend";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return withFinance(request, true, async (db, s) => {
    const input = await body(request);
    if (input && typeof input === "object" && "operation" in input) {
      const value = z
        .object({ operation: z.unknown(), sourceSavedReviewId: z.uuid() })
        .parse(input);
      return propose(db, s, value.operation, true, value.sourceSavedReviewId);
    }
    return propose(db, s, input);
  });
}
export async function DELETE(request: NextRequest) {
  return withFinance(request, true, async (db, s) => {
    const { id } = z.object({ id: z.uuid() }).parse(await body(request));
    await discard(db, s, id);
    return { ok: true };
  });
}
