import { NextRequest } from "next/server";
import { z } from "@/lib/schema";
import { review } from "@/lib/finance";
import { body } from "@/lib/http";
import { withFinance } from "@/lib/backend";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return withFinance(request, true, async (db, s) => {
    const { id } = z.object({ id: z.uuid() }).parse(await body(request));
    return review(db, s, id);
  });
}
