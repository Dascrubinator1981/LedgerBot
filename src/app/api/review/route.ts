import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { review } from "@/lib/finance";
import { body, failure, mutation } from "@/lib/http";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const s = mutation(request);
    const { id } = z.object({ id: z.uuid() }).parse(await body(request));
    return NextResponse.json(review(database(), s, id));
  } catch (error) {
    return failure(error);
  }
}
