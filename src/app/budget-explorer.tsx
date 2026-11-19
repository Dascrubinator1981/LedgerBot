"use client";
import { useState } from "react";
import { money, type FinanceState } from "@/lib/domain";
import { budgetView, UNCATEGORIZED } from "@/lib/budget-view";
import { BudgetCharts } from "./finance-views";
export function BudgetExplorer({
  state,
  month,
  today,
  onMonth,
}: {
  state: FinanceState;
  month: string;
  today: string;
  onMonth: (month: string) => void;
}) {
  const [selected, setSelected] = useState<string[] | undefined>(),
    [accountId, setAccountId] = useState("");
  const options = [
    ...state.categories,
    { id: UNCATEGORIZED, name: "Uncategorized" },
  ];
  const filtered = selected !== undefined || !!accountId;
  const view = budgetView(state, { categoryIds: selected, accountId });
  const entries = view.transactions.filter(
    (t) =>
      !t.transferId &&
      t.date.startsWith(month) &&
      t.flow !== "income" &&
      (t.amount < 0 || t.flow === "refund" || (!t.flow && t.splits.length > 0)),
  );
  return (
    <>
      <section className="card">
        <h2>Explore your budget</h2>
        <p>
          Choose what you want to see. Filters change this view only; they never
          change your plan or ledger.
        </p>
        <label>
          Budget account filter
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          >
            <option value="">All accounts</option>
            {state.accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        <fieldset>
          <legend>Categories to show</legend>
          <div className="fields">
            {options.map((c) => (
              <label className="checkbox" key={c.id}>
                <input
                  type="checkbox"
                  checked={selected === undefined || selected.includes(c.id)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...(selected || []), c.id]
                        : (selected || options.map((v) => v.id)).filter(
                            (id) => id !== c.id,
                          ),
                    )
                  }
                />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="actions">
          <button
            onClick={() => {
              setSelected(undefined);
              setAccountId("");
            }}
          >
            Clear budget filters
          </button>
          <button onClick={() => setSelected([])}>Select no categories</button>
        </div>
        <p aria-live="polite" data-testid="budget-view-scope">
          {filtered
            ? "Showing selected accounts/categories only. Your overall budget is unchanged."
            : "Showing all accounts and categories."}
        </p>
        {accountId && (
          <p className="notice">
            Spending is filtered to this account. Targets remain the full
            selected category targets across all accounts; account-specific
            targets are not configured.
          </p>
        )}
      </section>
      <BudgetCharts
        state={{ ...state, ...view }}
        month={month}
        today={today}
        onMonth={onMonth}
        filtered={filtered}
      />
      <section className="card">
        <h2>Spending behind this view</h2>
        <p>
          Each split purchase shows only the selected category portions. Refunds
          reduce spending; pending entries stay separate from cleared totals.
        </p>
        {!entries.length ? (
          <p>No spending matches these filters.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <caption>Matching ledger allocations for {month}</caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Account</th>
                  <th>Categories</th>
                  <th>Status</th>
                  <th>Selected spending</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td>
                      {state.accounts.find((a) => a.id === t.accountId)?.name}
                    </td>
                    <td>
                      {t.splits.length
                        ? t.splits
                            .map(
                              (s) =>
                                state.categories.find(
                                  (c) => c.id === s.categoryId,
                                )?.name,
                            )
                            .join(", ")
                        : "Uncategorized"}
                    </td>
                    <td>{t.status}</td>
                    <td>{money(-t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
