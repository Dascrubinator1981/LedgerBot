"use client";
import { forecast, money, type FinanceState } from "@/lib/domain";
import {
  defaultForecastPreferences,
  forecastView,
} from "@/lib/forecast-preferences";
import { ForecastChart, RecentBills } from "./finance-views";
export function DashboardForecast({
  state,
  today,
  onSettings,
}: {
  state: FinanceState;
  today: string;
  onSettings: () => void;
}) {
  const preferences = state.settings.forecaster || defaultForecastPreferences();
  const view = forecastView(state, preferences);
  const projection = forecast(view, today, preferences.horizon);
  return (
    <section id="forecast" className="card" aria-labelledby="forecast-title">
      <h2 id="forecast-title">Forecaster</h2>
      <p>
        Automatically updated from approved ledger records and recurring plans ·{" "}
        {preferences.horizon} days.
      </p>
      <p>
        {preferences.accountIds.length
          ? "Selected accounts only"
          : "All accounts"}{" "}
        · Estimates, not cleared bank balances.
      </p>
      <p>
        Starting cash: <strong>{money(projection.opening)}</strong>. Projected
        closing cash:{" "}
        <strong>{money(projection.days.at(-1)?.amount ?? null)}</strong>.
      </p>
      {preferences.showChart && (
        <ForecastChart days={projection.days} opening={projection.opening} />
      )}
      {projection.warnings.map((w) => (
        <p key={w} className="notice">
          {w}
        </p>
      ))}
      {preferences.showRecentBills && (
        <RecentBills state={view} today={today} />
      )}
      {preferences.showDailyDetails && (
        <div className="table-wrap">
          <table>
            <caption>Daily forecast estimates</caption>
            <thead>
              <tr>
                <th>Date</th>
                <th>Estimated cash</th>
                <th>Assumptions</th>
              </tr>
            </thead>
            <tbody>
              {projection.days.map((d) => (
                <tr key={d.date}>
                  <td>{d.date}</td>
                  <td>{money(d.amount)}</td>
                  <td>
                    {projection.events
                      .filter((e) => e.date === d.date)
                      .map((e) => `${e.name}: ${money(e.amount)} (${e.state})`)
                      .join("; ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p>
        Pending entries and schedules are assumptions; budget targets are not
        added as extra withdrawals.
      </p>
      <button onClick={onSettings}>Configure Forecaster in Settings</button>
    </section>
  );
}
