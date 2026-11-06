"use client";
import { useState, type FormEvent } from "react";
import { Field, Input, AccountSelect, dollars } from "./components";
import {
  paymentCoverage,
  money,
  nextOccurrence,
  parseMoney,
  type FinanceState,
  type Operation,
  type Recurrence,
  type Transaction,
} from "@/lib/domain";
export type SubmitFinance = (
  event: FormEvent<HTMLFormElement>,
  build: (data: FormData) => Operation,
) => void;
const value = (f: FormData, name: string) => String(f.get(name) || "");
export function occurrenceInput(f: FormData, prefix = "bill") {
  const recurrenceId = value(f, `${prefix}Rule`);
  return recurrenceId
    ? {
        recurrenceId,
        dueDate: value(f, `${prefix}Due`),
        settles: f.get(`${prefix}Settles`) === "on",
      }
    : undefined;
}
export function OccurrenceFields({
  state,
  prefix = "bill",
  current,
  today,
}: {
  state: FinanceState;
  prefix?: string;
  current?: Transaction["occurrence"];
  today: string;
}) {
  const [linked, setLinked] = useState(!!current?.recurrenceId);
  return (
    <fieldset>
      <legend>Optional bill / recurring-income link</legend>
      <Field
        label={
          prefix === "bill"
            ? "Recurring bill / income (optional)"
            : "Transfer bill (optional)"
        }
      >
        <select
          name={`${prefix}Rule`}
          defaultValue={current?.recurrenceId || ""}
          onChange={(e) => {
            setLinked(!!e.target.value);
            const rule = state.recurrences.find((r) => r.id === e.target.value),
              input = e.currentTarget.form?.elements.namedItem(
                `${prefix}Due`,
              ) as HTMLInputElement | null;
            if (!rule || !input) return;
            let low = 0,
              high = 10000;
            while (low < high) {
              const middle = Math.floor((low + high) / 2);
              if (nextOccurrence(rule.start, rule.cadence, middle) <= today)
                low = middle + 1;
              else high = middle;
            }
            input.value = nextOccurrence(
              rule.start,
              rule.cadence,
              Math.max(0, low - 1),
            );
          }}
        >
          <option value="">Ordinary transaction — not a bill payment</option>
          {state.recurrences.map((r) => (
            <option value={r.id} key={r.id}>
              {r.name} · {r.amount < 0 ? "bill" : "income"}
              {r.archived ? " · archived" : ""}
            </option>
          ))}
        </select>
      </Field>
      <div hidden={!linked}>
        <Input
          name={`${prefix}Due`}
          label={
            prefix === "bill" ? "Occurrence due date" : "Transfer bill due date"
          }
          type="date"
          value={current?.dueDate || today}
          required={false}
        />
        <label className="checkbox">
          <input
            name={`${prefix}Settles`}
            type="checkbox"
            defaultChecked={current?.settles ?? true}
          />
          This payment settles the selected occurrence in full
        </label>
        <small>
          Check the due date. Clear this checkbox for a partial payment. This
          link does not post an extra expense.
        </small>
      </div>
    </fieldset>
  );
}
export function PlanningPanel({
  state,
  today,
  busy,
  submit,
  prepare,
}: {
  state: FinanceState;
  today: string;
  busy: boolean;
  submit: SubmitFinance;
  prepare: (op: Operation) => void;
}) {
  const [editing, setEditing] = useState<Recurrence | null>(null);
  const getRule = (f: FormData) => ({
    accountId: value(f, "accountId"),
    name: value(f, "name"),
    amount: parseMoney(value(f, "amount")),
    start: value(f, "start"),
    cadence: value(f, "cadence") as Recurrence["cadence"],
    clearingDays: Number(value(f, "clearingDays")),
  });
  return (
    <>
      <section className="card">
        <h2>
          {editing
            ? "Edit recurring plan"
            : "Add recurring bill / income assumption"}
        </h2>
        <p>
          Negative for bills, positive for income. Schedules are approved plans,
          never cleared transactions. An edit changes future estimates; recorded
          occurrences and actual payments retain their history.
        </p>
        <form
          data-financial="true"
          key={editing?.id || "new-rule"}
          onSubmit={(e) =>
            submit(e, (f) => {
              const fields = getRule(f);
              const result: Operation = editing
                ? { kind: "editRecurrence", id: editing.id, ...fields }
                : { kind: "recurrence", ...fields };
              setEditing(null);
              return result;
            })
          }
        >
          <div className="fields">
            <AccountSelect
              accounts={state.accounts}
              name="accountId"
              value={editing?.accountId}
            />
            <Input label="Schedule name" name="name" value={editing?.name} />
            <Input
              label="Signed recurring amount ($)"
              name="amount"
              value={editing ? dollars(editing.amount) : undefined}
            />
            <Input
              label="First due / expected date"
              name="start"
              type="date"
              value={editing?.start || today}
            />
            <Field label="Cadence">
              <select
                name="cadence"
                defaultValue={editing?.cadence || "weekly"}
              >
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly (clamp to month end)</option>
              </select>
            </Field>
            <Input
              label="Estimated clearing delay (0–30 days)"
              name="clearingDays"
              type="number"
              value={String(editing?.clearingDays || 0)}
            />
          </div>
          <div className="actions">
            <button
              className="primary"
              disabled={busy || !state.accounts.length}
            >
              {editing
                ? "Prepare schedule changes"
                : "Prepare recurring assumption"}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)}>
                Cancel schedule edit
              </button>
            )}
          </div>
        </form>
      </section>
      <section className="card">
        <h2>Approved schedules</h2>
        {state.recurrences.map((r) => (
          <article className="card" key={r.id}>
            <h3>{r.name}</h3>
            <p>
              {money(r.amount)} · {r.cadence} from {r.start} + {r.clearingDays}{" "}
              days ·{" "}
              {r.archived
                ? "Archived"
                : r.active === false
                  ? "Paused"
                  : "Active estimate"}
            </p>
            <div className="actions">
              <button disabled={r.archived} onClick={() => setEditing(r)}>
                Edit schedule
              </button>
              <button
                disabled={busy}
                onClick={() =>
                  prepare({
                    kind: "pauseRecurrence",
                    id: r.id,
                    paused: r.active !== false,
                  })
                }
              >
                {r.active === false ? "Review resume" : "Review pause"}
              </button>
              {!r.archived && (
                <button
                  disabled={busy || r.archived}
                  onClick={() =>
                    prepare({ kind: "archiveRecurrence", id: r.id })
                  }
                >
                  Review archive
                </button>
              )}
            </div>
          </article>
        ))}
        {!state.recurrences.length && (
          <p>No recurring bills or income configured.</p>
        )}
        <small>
          Pausing/archiving stops new estimates. Explicit unpaid occurrences
          stay visible until paid or deliberately skipped; actual ledger history
          remains.
        </small>
      </section>
      <section className="card">
        <h2>Match an existing payment</h2>
        <p>
          Link an existing ledger entry to its bill or income occurrence. This
          updates classification and forecast coverage without changing the
          account balance again.
        </p>
        <form
          data-financial="true"
          onSubmit={(e) =>
            submit(e, (f) => ({
              kind: "matchOccurrence",
              transactionId: value(f, "transactionId"),
              ...occurrenceInput(f)!,
            }))
          }
        >
          <Field label="Existing payment">
            <select name="transactionId" required>
              <option value="">Choose an entry</option>
              {state.transactions.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.date} · {t.description} · {money(t.amount)} · {t.status}
                </option>
              ))}
            </select>
          </Field>
          <OccurrenceFields state={state} today={today} />
          <div className="actions">
            <button
              disabled={
                busy || !state.transactions.length || !state.recurrences.length
              }
            >
              Prepare payment match
            </button>
          </div>
        </form>
      </section>
      <section className="card">
        <h2>Review an unpaid or skipped occurrence</h2>
        <p>
          Use this for a known unpaid/overdue bill or an occurrence you
          deliberately skip. A due date never marks a bill cleared. Past
          untracked history is not guessed.
        </p>
        <form
          data-financial="true"
          onSubmit={(e) =>
            submit(e, (f) => ({
              kind: "occurrence",
              recurrenceId: value(f, "rule"),
              dueDate: value(f, "due"),
              expectedClearDate: value(f, "clear"),
              status: value(f, "occurrenceStatus") as "unpaid" | "skipped",
            }))
          }
        >
          <div className="fields">
            <Field label="Occurrence schedule">
              <select name="rule" required>
                <option value="">Choose a schedule</option>
                {state.recurrences.map((r) => (
                  <option value={r.id} key={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </Field>
            <Input
              label="Scheduled occurrence date"
              name="due"
              type="date"
              value={today}
            />
            <Input
              label="Estimated clearance date"
              name="clear"
              type="date"
              value={today}
            />
            <Field label="Occurrence plan status">
              <select name="occurrenceStatus">
                <option value="unpaid">Known unpaid / expected</option>
                <option value="skipped">Deliberately skipped</option>
              </select>
            </Field>
          </div>
          <div className="actions">
            <button disabled={busy || !state.recurrences.length}>
              Prepare occurrence review
            </button>
          </div>
        </form>
        {(state.occurrences || []).map((o) => {
          const coverage = paymentCoverage(
              state.transactions,
              o.recurrenceId,
              o.dueDate,
              o.amount,
            ),
            rule = state.recurrences.find((r) => r.id === o.recurrenceId);
          return (
            <article className="card" key={o.id}>
              <h3>
                {rule?.name || "Recorded schedule"} · due {o.dueDate}
              </h3>
              <p>
                {o.status === "skipped"
                  ? "Deliberately skipped"
                  : coverage.paid
                    ? "Covered by cleared payments"
                    : coverage.pending
                      ? "Pending / partially paid"
                      : coverage.cleared
                        ? "Partially paid"
                        : "Known unpaid plan"}
              </p>
              <p>
                Cleared {money(coverage.cleared)} · Pending{" "}
                {money(coverage.pending)} · Remaining estimate{" "}
                {money(coverage.remaining)}
              </p>
            </article>
          );
        })}
      </section>
    </>
  );
}
export function AccountTools({
  state,
  today,
  busy,
  submit,
}: {
  state: FinanceState;
  today: string;
  busy: boolean;
  submit: SubmitFinance;
}) {
  return (
    <section className="card">
      <h2>Account and category corrections</h2>
      <form
        data-financial="true"
        onSubmit={(e) =>
          submit(e, (f) => ({
            kind: "renameAccount",
            id: value(f, "id"),
            name: value(f, "name"),
          }))
        }
      >
        <div className="fields">
          <AccountSelect
            accounts={state.accounts}
            name="id"
            label="Account to rename"
          />
          <Input label="New account name" name="name" />
        </div>
        <div className="actions">
          <button disabled={busy}>Review account rename</button>
        </div>
      </form>
      <form
        data-financial="true"
        onSubmit={(e) =>
          submit(e, (f) => ({
            kind: "correctOpening",
            id: value(f, "id"),
            opening:
              value(f, "opening") === ""
                ? null
                : parseMoney(value(f, "opening")),
            asOf: value(f, "asOf"),
            openingBasis: value(f, "openingBasis") as
              "start-of-day" | "end-of-day",
          }))
        }
      >
        <p>
          Opening corrections require a sign-in from the last five minutes. They
          cannot rewrite a reconciled account. The date can be earlier than when
          you added the account. Starting balance counts same-day entries; a
          closing snapshot includes them already. Check the exact before/after
          balance in review. Changing the starting balance re-evaluates older
          entries; check all resulting balances before confirming.
        </p>
        <div className="fields">
          <AccountSelect
            accounts={state.accounts}
            name="id"
            label="Account opening to correct"
          />
          <Input
            label="Corrected opening balance ($, blank means unknown)"
            name="opening"
            required={false}
          />
          <Field label="Corrected opening balance timing">
            <select name="openingBasis" defaultValue="end-of-day">
              <option value="end-of-day">
                Statement closing snapshot — includes this day
              </option>
              <option value="start-of-day">
                Starting balance — before this day’s entries
              </option>
            </select>
          </Field>
          <Input
            label="Replacement snapshot date"
            name="asOf"
            type="date"
            value={today}
          />
        </div>
        <div className="actions">
          <button disabled={busy}>Review opening correction</button>
        </div>
      </form>
      <form
        data-financial="true"
        onSubmit={(e) =>
          submit(e, (f) => ({
            kind: "renameCategory",
            id: value(f, "id"),
            name: value(f, "name"),
          }))
        }
      >
        <div className="fields">
          <Field label="Category to rename">
            <select name="id" required>
              <option value="">Choose category</option>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Input label="New category name" name="name" />
        </div>
        <div className="actions">
          <button disabled={busy}>Review category rename</button>
        </div>
      </form>
    </section>
  );
}
