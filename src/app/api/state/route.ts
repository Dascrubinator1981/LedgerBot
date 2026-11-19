import { workspacePreferencesSchema } from "@/lib/workspace-preferences";
import { storageReference } from "@/lib/local-storage";
import { forecastPreferencesSchema } from "@/lib/forecast-preferences";
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
    identity: {
      email: (
        (await db
          .prepare("SELECT email FROM users WHERE id=?")
          .get(s.userId)) as { email: string }
      ).email,
    },
    storage: postgresMode()
      ? {
          label: "Connected database",
          reference: "verified-provider",
          fileName: null,
          folder: null,
        }
      : storageReference(),
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
        forecaster: forecastPreferencesSchema.optional(),
        workspace: workspacePreferencesSchema.optional(),
      })
      .parse(await body(request));
    if (settings.forecaster?.accountIds.length) {
      const ownedState = await state(db, s.userId, false);
      if (
        settings.forecaster.accountIds.some(
          (id) => !ownedState.accounts.some((a) => a.id === id),
        )
      )
        throw new PublicError("Choose only your own forecast accounts");
    }
    if (settings.workspace) {
      const owned = await state(db, s.userId, false);
      const ids = [
        ...settings.workspace.accountOrder,
        ...(settings.workspace.defaultAccountId
          ? [settings.workspace.defaultAccountId]
          : []),
      ];
      if (ids.some((id) => !owned.accounts.some((a) => a.id === id)))
        throw new PublicError("Choose only your own accounts");
    }
    await db.exec("BEGIN IMMEDIATE");
    try {
      const old = (await db
        .prepare(
          "SELECT timezone,reminders,forecast_preferences,workspace_preferences FROM users WHERE id=?",
        )
        .get(s.userId)) as {
        timezone: string;
        reminders: string;
        forecast_preferences: string;
        workspace_preferences: string;
      };
      await db
        .prepare(
          "UPDATE users SET setup=?,promotions=?,timezone=?,reminders=?,forecast_preferences=?,workspace_preferences=? WHERE id=?",
        )
        .run(
          settings.setup,
          settings.promotions ? 1 : 0,
          settings.timezone || old.timezone,
          settings.reminders
            ? JSON.stringify(settings.reminders)
            : old.reminders,
          settings.forecaster
            ? JSON.stringify(settings.forecaster)
            : old.forecast_preferences,
          settings.workspace
            ? JSON.stringify(settings.workspace)
            : old.workspace_preferences,
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
