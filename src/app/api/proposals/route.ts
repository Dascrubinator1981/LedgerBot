import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { propose, discard } from "@/lib/finance";
import { body, failure, mutation } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      propose(database(), mutation(request), await body(request)),
    );
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const s = mutation(request);
    const { id } = z.object({ id: z.uuid() }).parse(await body(request));
    discard(database(), s, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
