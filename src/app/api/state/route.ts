import { NextRequest } from "next/server";
import { z } from "zod";
import { state } from "@/lib/finance";
import { timezoneSchema } from "@/lib/domain";
import { body } from "@/lib/http";
import { withFinance } from "@/lib/backend";
import { postgresMode } from "@/lib/provider-auth";
import { PublicError } from "@/lib/errors";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  return withFinance(request, false, async (db, s) => ({
    ...(await state(db, s.userId)),
    csrf: s.csrf,
    authProvider: postgresMode() ? "supabase" : "local-development",
  }));
}
export async function PATCH(request: NextRequest) {
  return withFinance(request, true, async (db, s) => {
    if (s.principal !== "human")
      throw new PublicError("Human session required");
    const settings = z
      .object({
        setup: z.enum([
          "needs-review",
          "skipped",
          "complete",
          "not-applicable",
        ]),
        promotions: z.boolean(),
        timezone: timezoneSchema.optional(),
      })
      .parse(await body(request));
    await db.exec("BEGIN IMMEDIATE");
    try {
      const old = (await db
        .prepare("SELECT timezone FROM users WHERE id=?")
        .get(s.userId)) as { timezone: string };
      await db
        .prepare("UPDATE users SET setup=?,promotions=?,timezone=? WHERE id=?")
        .run(
          settings.setup,
          settings.promotions ? 1 : 0,
          settings.timezone || old.timezone,
          s.userId,
        );
      if (settings.timezone && settings.timezone !== old.timezone)
        await db
          .prepare("UPDATE users SET revision=revision+1 WHERE id=?")
          .run(s.userId);
      await db.exec("COMMIT");
    } catch (error) {
      await db.exec("ROLLBACK");
      throw error;
    }
    return { ok: true };
  });
}
