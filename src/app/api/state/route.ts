import { NextRequest } from "next/server";
import { z } from "@/lib/schema";
import { state } from "@/lib/finance";
import { timezoneSchema } from "@/lib/domain";
import { body } from "@/lib/http";
import { withFinance } from "@/lib/backend";
import { postgresMode } from "@/lib/provider-auth";
import { PublicError } from "@/lib/errors";
import { remindersSchema } from "@/lib/reminders";
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
        reminders: remindersSchema.optional(),
      })
      .parse(await body(request));
    await db.exec("BEGIN IMMEDIATE");
    try {
      const old = (await db
        .prepare("SELECT timezone,reminders FROM users WHERE id=?")
        .get(s.userId)) as { timezone: string; reminders: string };
      await db
        .prepare(
          "UPDATE users SET setup=?,promotions=?,timezone=?,reminders=? WHERE id=?",
        )
        .run(
          settings.setup,
          settings.promotions ? 1 : 0,
          settings.timezone || old.timezone,
          settings.reminders
            ? JSON.stringify(settings.reminders)
            : old.reminders,
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
