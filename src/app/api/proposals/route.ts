import { NextRequest } from "next/server";
import { z } from "zod";
import { propose, discard } from "@/lib/finance";
import { body } from "@/lib/http";
import { withFinance } from "@/lib/backend";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  return withFinance(request, true, async (db, s) =>
    propose(db, s, await body(request)),
  );
}
export async function DELETE(request: NextRequest) {
  return withFinance(request, true, async (db, s) => {
    const { id } = z.object({ id: z.uuid() }).parse(await body(request));
    await discard(db, s, id);
    return { ok: true };
  });
}
