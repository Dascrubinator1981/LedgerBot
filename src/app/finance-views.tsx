"use client";
import { useId } from "react";
import { money, type FinanceState } from "@/lib/domain";
import { budgetProgress, recentPaidBills } from "@/lib/insights";
export function BudgetCharts({
  state,
  month,
  today,
  onMonth,
  onOpen,
  filtered = false,
  summaryOnly = false,
}: {
  state: FinanceState;
  month: string;
  today: string;
  onMonth: (month: string) => void;
  onOpen?: () => void;
  filtered?: boolean;
  summaryOnly?: boolean;
}) {
  const id = useId(),
    data = budgetProgress(state, month, today);
  const numbers = data.series.flatMap((d) =>
      d.actual === null
        ? [d.planned, d.withPending]
        : [d.planned, d.actual, d.withPending],
    ),
    minimum = Math.min(0, ...numbers),
    maximum = Math.max(1, ...numbers),
    range = maximum - minimum;
  const x = (i: number) => 40 + (i * 560) / Math.max(1, data.series.length - 1),
    y = (value: number) => 170 - ((value - minimum) * 130) / range;
  const planned = data.series
      .map((d, i) => `${x(i)},${y(d.planned)}`)
      .join(" "),
    actual = data.series
      .filter((d) => d.actual !== null)
      .map((d, i) => `${x(i)},${y(d.actual!)}`)
      .join(" ");
  const pendingLine = data.series
    .map((d, i) => `${x(i)},${y(d.withPending)}`)
    .join(" ");
  return (
    <section className="card">
      <div className="row">
        <h2>Budget progress</h2>
        <label>
          Chart month
          <input
            type="month"
            min="2000-01"
            max="2100-12"
            value={month}
            onChange={(e) => {
              if (/^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(e.target.value))
                onMonth(e.target.value);
            }}
          />
        </label>
      </div>
      {onOpen && (
        <p>
          <a
            href={`/?section=budget&month=${month}`}
            onClick={(event) => {
              if (
                event.metaKey ||
                event.ctrlKey ||
                event.shiftKey ||
                event.altKey
              )
                return;
              event.preventDefault();
              onOpen();
            }}
          >
            View and filter this budget
          </a>
        </p>
      )}
      {filtered && <p>Selected view totals — not your overall budget.</p>}
      {!data.configured ? (
        <div>
          <p>
            No monthly plan is set up for this month. Add your own category
            targets to begin.
          </p>
          {state.transactions.length > 0 && (
            <p>
              Cleared spending without a selected target:{" "}
              <strong data-testid="budget-actual">
                {money(data.totalActual)}
              </strong>
              . Pending spending: {money(data.pending)}. An on-plan comparison
              is unavailable.
            </p>
          )}
        </div>
      ) : (
        <>
          <p className="pill" data-testid="budget-status">
            {data.status}
          </p>
          <div className="grid">
            <div>
              <p>Monthly plan</p>
              <strong>{money(data.totalTarget)}</strong>
            </div>
            <div>
              <p>Cleared spending, net of refunds</p>
              <strong data-testid="budget-actual">
                {money(data.totalActual)}
              </strong>
            </div>
            <div>
              <p>Remaining against plan</p>
              <strong>{money(data.remaining)}</strong>
            </div>
          </div>
          <p>
            <small>
              Income and internal transfers are excluded. Uncategorized spending
              ({money(data.uncategorized)}) and spending in categories without
              targets ({money(data.unbudgeted)}) are included in this chart’s
              total. Pending spending ({money(data.pending)}) is separate.
              Remaining after pending: {money(data.remainingAfterPending)}.
            </small>
          </p>
          {data.unclassifiedPositive !== 0 && (
            <p className="notice">
              Legacy positive entries need their income/refund type reviewed
              before relying on this comparison.
            </p>
          )}
          {!summaryOnly && (
            <>
              <a
                href={onOpen ? `/?section=budget&month=${month}` : undefined}
                aria-label={
                  onOpen ? "Open budget filters from graph" : undefined
                }
                onClick={
                  onOpen
                    ? (event) => {
                        if (
                          event.metaKey ||
                          event.ctrlKey ||
                          event.shiftKey ||
                          event.altKey
                        )
                          return;
                        event.preventDefault();
                        onOpen();
                      }
                    : undefined
                }
              >
                <svg
                  viewBox="0 0 640 210"
                  role="img"
                  aria-labelledby={`${id}-title ${id}-description`}
                  className="finance-chart"
                >
                  <title id={`${id}-title`}>
                    Cumulative spending compared with monthly plan
                  </title>
                  <desc id={`${id}-description`}>
                    Dashed line is a straight-line pacing assumption, not extra
                    money or a guarantee. Solid line is approved cleared
                    spending through today. Exact values are available below.
                  </desc>
                  <line
                    x1="40"
                    x2="600"
                    y1={y(0)}
                    y2={y(0)}
                    stroke="currentColor"
                    opacity=".5"
                  />
                  <polyline
                    points={planned}
                    fill="none"
                    stroke="#c7adff"
                    strokeWidth="3"
                    strokeDasharray="7 5"
                  />
                  <polyline
                    points={actual}
                    fill="none"
                    stroke="#66e5ca"
                    strokeWidth="3"
                  />
                  <polyline
                    data-testid="budget-pending-line"
                    aria-label="Cleared plus pending or planned spending"
                    points={pendingLine}
                    fill="none"
                    stroke="#f0c878"
                    strokeWidth="3"
                    strokeDasharray="2 5"
                    strokeLinecap="round"
                  />
                  <text x="40" y="20" fill="currentColor" fontSize="12">
                    {money(maximum)}
                  </text>
                  <text x="40" y="201" fill="currentColor" fontSize="12">
                    {month}-01
                  </text>
                  <text x="510" y="201" fill="currentColor" fontSize="12">
                    {data.series.at(-1)?.date}
                  </text>
                </svg>
              </a>
              <p>
                Solid: cleared spending · Dotted amber: cleared plus pending /
                planned · Dashed purple: even daily plan pace. “Ahead of planned
                pace” is not the same as exceeding the monthly limit.
              </p>
            </>
          )}
          {data.rows.map((row) => (
            <article className="budget-row" key={row.id}>
              <div className="row">
                <h3>{row.name}</h3>
                <span className="pill">{row.status}</span>
              </div>
              <progress
                aria-label={`${row.name} spending ${money(row.actual)} against ${money(row.target)}`}
                max={Math.max(row.target, 1)}
                value={Math.max(
                  0,
                  Math.min(row.actual, Math.max(row.target, 1)),
                )}
              />
              <p>
                Spent {money(row.actual)} · Target {money(row.target)} ·
                Remaining {money(row.remaining)}
              </p>
            </article>
          ))}
          <details>
            <summary>Show exact chart data</summary>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Planned cumulative pace</th>
                    <th>Cleared cumulative spending</th>
                    <th>Cleared plus pending / planned</th>
                  </tr>
                </thead>
                <tbody>
                  {data.series.map((day) => (
                    <tr key={day.date}>
                      <td>{day.date}</td>
                      <td>{money(day.planned)}</td>
                      <td>
                        {day.actual === null
                          ? "Future — no actuals"
                          : money(day.actual)}
                      </td>
                      <td>{money(day.withPending)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
export function RecentBills({
  state,
  today,
}: {
  state: FinanceState;
  today: string;
}) {
  const bills = recentPaidBills(state, today);
  return (
    <section className="card">
      <h2>Bill payments in the last 7 days</h2>
      <p>
        Cleared payments explicitly linked to a bill schedule. Ordinary
        expenses, pending payments and income are excluded.
      </p>
      {!bills.length ? (
        <p>No confirmed bill payments in this seven-day window.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bill</th>
                <th>Paid / cleared date</th>
                <th>Scheduled due date</th>
                <th>Payment</th>
                <th>Review status</th>
              </tr>
            </thead>
            <tbody>
              {bills.map((b) => (
                <tr key={b.transactionId}>
                  <td>{b.name}</td>
                  <td>{b.paidOn}</td>
                  <td>{b.dueDate}</td>
                  <td>{money(b.amount)}</td>
                  <td>{b.settled ? "Confirmed in full" : "Partial payment"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <small>
        Seven inclusive calendar dates in {state.settings.timezone || "Etc/UTC"}
        , ending {today}. This is a view of ledger payments, never another
        withdrawal.
      </small>
    </section>
  );
}
export function ForecastChart({
  days,
  opening,
}: {
  days: { date: string; amount: number | null }[];
  opening: number | null;
}) {
  const id = useId(),
    values = days.flatMap((d) => (d.amount === null ? [] : [d.amount]));
  if (opening === null || !values.length)
    return (
      <p>
        Add known dated cash balances before drawing a forecast. No zero balance
        has been assumed.
      </p>
    );
  const minimum = Math.min(opening, ...values),
    maximum = Math.max(opening, ...values),
    range = Math.max(1, maximum - minimum),
    x = (i: number) => 40 + (i * 560) / Math.max(1, days.length - 1),
    y = (n: number) => 170 - ((n - minimum) * 130) / range;
  const points = days.map((d, i) => `${x(i)},${y(d.amount!)}`).join(" ");
  return (
    <figure>
      <svg
        viewBox="0 0 640 210"
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
        className="finance-chart"
      >
        <title id={`${id}-title`}>Estimated cash forecast</title>
        <desc id={`${id}-desc`}>
          The dot is cleared opening cash. The dashed line is an estimate
          including only recorded pending entries and approved schedule
          assumptions. Exact daily values follow in the table.
        </desc>
        <polyline
          points={points}
          fill="none"
          stroke="#66e5ca"
          strokeWidth="3"
          strokeDasharray="6 4"
        />
        <circle cx="40" cy={y(opening)} r="5" fill="#c7adff" />
        <text x="40" y="20" fill="currentColor" fontSize="12">
          High {money(maximum)} · Low {money(minimum)}
        </text>
        <text x="40" y="201" fill="currentColor" fontSize="12">
          {days[0]?.date}
        </text>
        <text x="510" y="201" fill="currentColor" fontSize="12">
          {days.at(-1)?.date}
        </text>
      </svg>
      <figcaption>
        Cleared opening cash: {money(opening)}. All line points are estimates,
        not bank-cleared balances.
      </figcaption>
    </figure>
  );
}
