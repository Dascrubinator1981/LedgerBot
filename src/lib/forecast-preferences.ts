import { z } from "./schema";
import type { FinanceState } from "./domain";
export const forecastPreferencesSchema = z
  .object({
    accountIds: z.array(z.uuid()).max(100).default([]),
    horizon: z
      .union([z.literal(7), z.literal(30), z.literal(60), z.literal(90)])
      .default(30),
    showChart: z.boolean().default(true),
    showRecentBills: z.boolean().default(true),
    showDailyDetails: z.boolean().default(false),
  })
  .strict();
export type ForecastPreferences = z.infer<typeof forecastPreferencesSchema>;
export const defaultForecastPreferences = () =>
  forecastPreferencesSchema.parse({});
// An account filter changes only the displayed forecast, never canonical actuals.
export function forecastView(
  state: FinanceState,
  preferences: ForecastPreferences,
): FinanceState {
  if (!preferences.accountIds.length) return state;
  const ids = new Set(preferences.accountIds);
  return {
    ...state,
    accounts: state.accounts.filter((a) => ids.has(a.id)),
    transactions: state.transactions.filter((t) => ids.has(t.accountId)),
    recurrences: state.recurrences.filter((r) => ids.has(r.accountId)),
  };
}
