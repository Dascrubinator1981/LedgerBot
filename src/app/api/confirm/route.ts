import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { confirm } from "@/lib/finance";
import { body, failure, mutation } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const s = mutation(request);
    const input = z
      .object({
        proposalId: z.uuid(),
        version: z.number().int(),
        digest: z.string().regex(/^[a-f0-9]{64}$/),
        token: z.string().regex(/^[a-f0-9]{64}$/),
        idempotencyKey: z.string().min(16).max(100),
      })
      .parse(await body(request));
    return NextResponse.json(confirm(database(), s, input));
  } catch (error) {
    return failure(error);
  }
}
