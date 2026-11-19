"use client";
import {
  forecast,
  money,
  balance,
  netWorth,
  liability,
  type FinanceState,
} from "@/lib/domain";
import {
  defaultForecastPreferences,
  forecastView,
} from "@/lib/forecast-preferences";
import {
  forecastAssessment,
  periodForecast,
  weekBounds,
} from "@/lib/forecast-dashboard";
import { BudgetCharts, RecentBills } from "./finance-views";
import { QuickActions } from "./quick-actions";
import { ForecastPeriodChart } from "./forecast-period-chart";
import type { Section } from "@/lib/navigation";
export function DashboardForecast({
  state,
  today,
  month,
  onMonth,
  onBudget,
  onOpen,
  onSettings,
}: {
  state: FinanceState;
  today: string;
  month: string;
  onMonth: (month: string) => void;
  onBudget: () => void;
  onOpen: (tab: Section) => void;
  onSettings: () => void;
}) {
  const preferences = state.settings.forecaster || defaultForecastPreferences();
  const view = forecastView(state, preferences);
  const outlook = forecastAssessment(state, today);
  const week = weekBounds(today);
  const projection = forecast(view, today, preferences.horizon);
  const monthEnd = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0),
  )
    .toISOString()
    .slice(0, 10);
  const monthRows = periodForecast(view, `${month}-01`, monthEnd, today),
    weekRows = periodForecast(view, week.start, week.end, today);
  const upcoming = forecast(view, today, 7)
    .events.filter(
      (e) => e.date <= week.end && e.amount < 0 && e.kind !== "transfer",
    )
    .sort((a, b) => a.date.localeCompare(b.date));
  return (
    <section id="forecast" aria-labelledby="forecast-title">
      <QuickActions actions={preferences.quickActions} onOpen={onOpen} />
      <div className={`notice outlook ${outlook.level}`}>
        <h2 id="forecast-title">Your outlook: {outlook.label}</h2>
        {outlook.reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
      </div>
      {preferences.accountIds.length > 0 && (
        <p className="notice">
          Selected-account view below. The overall safety assessment still
          checks all accounts.
        </p>
      )}
      {state.accounts
        .filter((a) => outlook.overdrawn.includes(a.id))
        .map((a) => (
          <p key={a.id} className="notice error">
            ⚠ {a.name}: recorded overdraft{" "}
            {money(balance(a, state.transactions, today))}. Review this account
            even if it is hidden by a display filter.
          </p>
        ))}
      <div className="forecast-layout">
        <div>
          <section className="card">
            <h2>Account balances</h2>
            {view.accounts.length ? (
              view.accounts.map((a) => (
                <article className="balance-row" key={a.id}>
                  <strong>
                    {a.name}
                    {liability(a) ? " · owed" : ""}
                  </strong>
                  <span>{money(balance(a, view.transactions, today))}</span>
                  {outlook.overdrawn.includes(a.id) && (
                    <strong className="notice error">
                      ⚠ Recorded overdraft — review this account
                    </strong>
                  )}
                  {!outlook.overdrawn.includes(a.id) &&
                    outlook.shortages.includes(a.id) && (
                      <strong>⚠ Projected shortage</strong>
                    )}
                </article>
              ))
            ) : (
              <p>Add accounts to see balances. Nothing has been assumed.</p>
            )}
            <p>
              Net worth: {money(netWorth(view.accounts, view.transactions))}
            </p>
            <p>
              Cash from dated records: {money(projection.opening)} · Selected
              projection: {preferences.horizon} days.
            </p>
            <button onClick={() => onOpen("Inbox")}>
              Review changes (
              {
                state.proposals.filter((p) => p.status === "awaiting_review")
                  .length
              }
              )
            </button>
          </section>
          <BudgetCharts
            state={view}
            month={month}
            today={today}
            onMonth={onMonth}
            onOpen={onBudget}
            summaryOnly
            filtered={!!preferences.accountIds.length}
          />
        </div>
        <div>
          {preferences.showChart && view.accounts.length > 0 && (
            <>
              <a
                href={`/?section=budget&month=${month}`}
                aria-label="Open budget filters from graph"
                onClick={(e) => {
                  if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
                  e.preventDefault();
                  onBudget();
                }}
              >
                <ForecastPeriodChart
                  title="This month"
                  rows={monthRows}
                  today={today}
                />
              </a>
              <ForecastPeriodChart
                title="This week"
                rows={weekRows}
                today={today}
              />
            </>
          )}
          <p>
            Weekly period: Sunday–Saturday. Projections use entered schedules
            and pending items; targets alone are not extra withdrawals.
          </p>
        </div>
      </div>
      <section className="card">
        <h2>Expected expenses and bills this week</h2>
        <div className="table-wrap">
          <table>
            <caption>Upcoming weekly withdrawals</caption>
            <thead>
              <tr>
                <th>Expense / bill</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Expected date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.length ? (
                upcoming.map((e, i) => (
                  <tr key={`${e.accountId}-${e.date}-${i}`}>
                    <td>{e.name}</td>
                    <td>
                      {view.accounts.find((a) => a.id === e.accountId)?.name}
                    </td>
                    <td>{money(Math.abs(e.amount))}</td>
                    <td>{e.date}</td>
                    <td>
                      {e.kind} ·{" "}
                      {e.state === "pending"
                        ? "pending"
                        : "scheduled, not paid"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    No upcoming withdrawals in the entered plan. Missing bills
                    are not assumed to be zero.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
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
      <details>
        <summary>Forecast assumptions and coverage</summary>
        {projection.warnings.map((w) => (
          <p key={w}>{w}</p>
        ))}
      </details>
      <button onClick={onSettings}>Configure Forecaster in Settings</button>
    </section>
  );
}
