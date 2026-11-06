"use client";
import {
  defaultForecastPreferences,
  type ForecastPreferences,
} from "@/lib/forecast-preferences";
import type { FinanceState } from "@/lib/domain";
export function ForecasterSettings({
  state,
  busy,
  save,
}: {
  state: FinanceState;
  busy: boolean;
  save: (p: ForecastPreferences) => Promise<void>;
}) {
  const p = state.settings.forecaster || defaultForecastPreferences();
  return (
    <section id="forecaster-settings" className="card">
      <h2>Forecaster display</h2>
      <p>
        Choose what appears automatically on Dashboard. These filters do not
        change ledger records, budget targets or recurring plans. No accounts
        selected means all accounts.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void save({
            horizon: Number(
              f.get("forecastHorizon"),
            ) as ForecastPreferences["horizon"],
            accountIds: f.getAll("forecastAccount").map(String),
            showChart: f.has("forecastChart"),
            showRecentBills: f.has("forecastRecent"),
            showDailyDetails: f.has("forecastDaily"),
          });
        }}
      >
        <label>
          Dashboard forecast horizon
          <select name="forecastHorizon" defaultValue={p.horizon}>
            {[7, 30, 60, 90].map((n) => (
              <option key={n} value={n}>
                {n} days
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Accounts in forecast</legend>
          {state.accounts.map((a) => (
            <label key={a.id} className="checkbox">
              <input
                type="checkbox"
                name="forecastAccount"
                value={a.id}
                defaultChecked={p.accountIds.includes(a.id)}
              />
              {a.name}
            </label>
          ))}
        </fieldset>
        <label className="checkbox">
          <input
            type="checkbox"
            name="forecastChart"
            defaultChecked={p.showChart}
          />
          Show forecast chart
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            name="forecastRecent"
            defaultChecked={p.showRecentBills}
          />
          Show bills paid in the last 7 days
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            name="forecastDaily"
            defaultChecked={p.showDailyDetails}
          />
          Show daily estimates and assumptions
        </label>
        <button disabled={busy}>Save Forecaster display</button>
      </form>
    </section>
  );
}
