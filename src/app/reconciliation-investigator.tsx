"use client";
import { useState } from "react";
import { money, parseMoney, type FinanceState } from "@/lib/domain";
import { investigateReconciliation } from "@/lib/reconciliation";
import { AccountSelect, Input } from "./components";
export function ReconciliationInvestigator({
  state,
  today,
}: {
  state: FinanceState;
  today: string;
}) {
  const [result, setResult] =
      useState<ReturnType<typeof investigateReconciliation>>(null),
    [error, setError] = useState("");
  return (
    <details className="card">
      <summary>Investigate a statement difference</summary>
      <p>
        {state.reconciliations?.length || 0} approved statement comparisons
        preserved in history and JSON export. Locked periods cannot be rewritten
        here.
      </p>
      <p>
        This read-only check never changes an entry or forces a match. Enter a
        positive amount owed for a liability; enter a negative amount for a
        credit balance.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const f = new FormData(event.currentTarget);
          try {
            setResult(
              investigateReconciliation(
                state,
                String(f.get("accountId")),
                String(f.get("through")),
                parseMoney(String(f.get("statement"))),
              ),
            );
            setError("");
          } catch {
            setError("Enter a valid statement amount.");
          }
        }}
      >
        <div className="fields">
          <AccountSelect
            accounts={state.accounts}
            name="accountId"
            label="Investigate account"
          />
          <Input
            label="Investigate through date"
            name="through"
            type="date"
            value={today}
          />
          <Input label="Balance to investigate ($)" name="statement" />
        </div>
        <button>Investigate without saving</button>
      </form>
      {error && <p role="alert">{error}</p>}
      {result && (
        <div aria-live="polite">
          <p>
            Snapshot {result.asOf}: {money(result.opening)}. Cleared ledger
            through the selected date: {money(result.actual)} (positive owed for
            liabilities).
          </p>
          <p>
            Statement minus ledger: <strong>{money(result.difference)}</strong>.{" "}
            {result.difference === null
              ? "An unknown opening balance prevents reconciliation."
              : result.difference === 0
                ? "Amounts agree. Use the separate reviewed reconciliation to lock this period."
                : "Check missing or duplicated entries, posting dates, splits, transfer pairs and pending clearance against the statement. Make any legitimate correction in Ledger through review, then compare again."}
          </p>
          <p>
            {result.cleared.length} cleared entries included;{" "}
            {result.pending.length} pending entries excluded. Changing a target
            or category cannot repair an account discrepancy.
          </p>
          <div className="table-wrap">
            <table>
              <caption>Entries in the comparison window</caption>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Status</th>
                  <th>Signed amount</th>
                </tr>
              </thead>
              <tbody>
                {[...result.cleared, ...result.pending].map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td>{t.description}</td>
                    <td>{t.status}</td>
                    <td>{money(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </details>
  );
}
