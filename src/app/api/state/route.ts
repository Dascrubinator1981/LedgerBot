import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { database } from "@/lib/db";
import { state } from "@/lib/finance";
import { body, failure, mutation, session } from "@/lib/http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  try {
    const s = session(request);
    return NextResponse.json(
      { ...state(database(), s.userId), csrf: s.csrf },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return failure(error);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const s = mutation(request);
    if (s.principal !== "human") throw new Error("Human session required");
    const settings = z
      .object({
        setup: z.enum([
          "needs-review",
          "skipped",
          "complete",
          "not-applicable",
        ]),
        promotions: z.boolean(),
      })
      .parse(await body(request));
    database()
      .prepare("UPDATE users SET setup=?,promotions=? WHERE id=?")
      .run(settings.setup, settings.promotions ? 1 : 0, s.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return failure(error);
  }
}
