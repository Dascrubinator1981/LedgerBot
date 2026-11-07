"use client";
import { useId } from "react";
import { money } from "@/lib/domain";
import type { periodForecast } from "@/lib/forecast-dashboard";
const palette = [
  "#66e5ca",
  "#c7adff",
  "#f0c878",
  "#8ebcff",
  "#e8a8bd",
  "#a4cb95",
];
export function ForecastPeriodChart({
  title,
  rows,
  today,
}: {
  title: string;
  rows: ReturnType<typeof periodForecast>;
  today: string;
}) {
  const id = useId();
  const values = rows.flatMap((r) => [
    r.paid,
    r.paid + r.expected,
    ...r.balances.map((b) => b.amount).filter((n): n is number => n !== null),
  ]);
  const low = Math.min(0, ...values),
    high = Math.max(1, ...values),
    x = (i: number) => 35 + (i * 565) / Math.max(1, rows.length - 1),
    y = (v: number) => 128 - ((v - low) * 105) / (high - low);
  function line(values: (number | null)[], color: string, dashed = false) {
    return (
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeDasharray={dashed ? "5 4" : undefined}
        points={values
          .map((v, i) => (v === null ? null : `${x(i)},${y(v)}`))
          .filter(Boolean)
          .join(" ")}
      />
    );
  }
  return (
    <section className="period-chart">
      <h3>{title}</h3>
      <svg
        className="finance-chart"
        viewBox="0 0 640 158"
        role="img"
        aria-labelledby={id}
      >
        <title id={id}>
          {title}: account balances, paid expenses and entered projected
          expenses
        </title>
        <text x="35" y="13" fill="currentColor" fontSize="10">
          {money(high)}
        </text>
        <line
          x1="35"
          x2="600"
          y1={y(0)}
          y2={y(0)}
          stroke="currentColor"
          opacity=".4"
        />
        {rows[0]?.balances.map((b, j) => (
          <g key={b.id}>
            {line(
              rows.map((r) => (r.date <= today ? r.balances[j].amount : null)),
              palette[j % palette.length],
            )}
            {line(
              rows.map((r) => (r.date >= today ? r.balances[j].amount : null)),
              palette[j % palette.length],
              true,
            )}
          </g>
        ))}
        {line(
          rows.map((r) => (r.date <= today ? r.paid : null)),
          "#f0c878",
        )}
        {line(
          rows.map((r) => (r.date >= today ? r.paid + r.expected : null)),
          "#e8a8bd",
          true,
        )}
        <text x="35" y="153" fill="currentColor" fontSize="10">
          {rows[0]?.date}
        </text>
        <text x="510" y="153" fill="currentColor" fontSize="10">
          {rows.at(-1)?.date}
        </text>
      </svg>
      <div className="chart-key">
        {rows[0]?.balances.map((b, i) => (
          <span key={b.id}>
            <i style={{ background: palette[i % palette.length] }} />
            {b.name}
          </span>
        ))}
        <span>Gold: cleared spending</span>
        <span>Pink dashed: spending plus entered future withdrawals</span>
      </div>
      <small>
        Solid = recorded; dashed = projection. Balances and cumulative spending
        are separate series, never added together. Credit/loan balances show
        amounts owed.
      </small>
      <details>
        <summary>Exact {title.toLowerCase()} values</summary>
        <div className="table-wrap">
          <table>
            <caption>{title} exact values</caption>
            <thead>
              <tr>
                <th>Date</th>
                {rows[0]?.balances.map((b) => (
                  <th key={b.id}>{b.name}</th>
                ))}
                <th>Paid expenses</th>
                <th>Entered future expenses</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.date}>
                  <td>{r.date}</td>
                  {r.balances.map((b) => (
                    <td key={b.id}>{money(b.amount)}</td>
                  ))}
                  <td>{money(r.paid)}</td>
                  <td>{money(r.expected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
}
