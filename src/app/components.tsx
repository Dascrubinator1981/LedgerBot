"use client";
import {
  cloneElement,
  useId,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
} from "react";
import {
  money,
  type Account,
  type FinanceState,
  type Proposal,
  type Transaction,
} from "@/lib/domain";
import { CategorySelect } from "./category-select";
export const dollars = (value: number) =>
  `${value < 0 ? "-" : ""}${Math.floor(Math.abs(value) / 100)}.${String(Math.abs(value) % 100).padStart(2, "0")}`;
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children as ReactElement<{ id: string }>, { id })}
    </div>
  );
}
export function Input({
  label,
  name,
  type = "text",
  value,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  value?: string;
  required?: boolean;
}) {
  return (
    <Field label={label}>
      <input
        name={name}
        type={type}
        defaultValue={value}
        required={required}
        maxLength={type === "text" ? 100 : undefined}
      />
    </Field>
  );
}
export function AccountSelect({
  accounts,
  name,
  label = "Account",
  value,
}: {
  accounts: Account[];
  name: string;
  label?: string;
  value?: string;
}) {
  return (
    <Field label={label}>
      <select name={name} defaultValue={value} required>
        <option value="">Choose account</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name} · {a.type}
          </option>
        ))}
      </select>
    </Field>
  );
}
export function SplitFields({
  state,
  edit,
  onCreateCategory,
  busy,
}: {
  state: FinanceState;
  edit: Transaction | null;
  onCreateCategory?: (name: string) => void;
  busy?: boolean;
}) {
  const [count, setCount] = useState(Math.max(1, edit?.splits.length || 0));
  return (
    <fieldset>
      <legend>Optional category allocations</legend>
      <p>
        <small>
          Split amounts must add up to the total. With Expense, Income or
          Refund, enter positive amounts; the selected entry type sets their
          direction. With automatic direction, use signed amounts. Leave
          categories blank to keep it uncategorized.
        </small>
      </p>
      {Array.from({ length: count }, (_, i) => (
        <div className="fields" key={i}>
          <CategorySelect
            categories={state.categories}
            name={`category-${i}`}
            label={`Split ${i + 1} category`}
            value={edit?.splits[i]?.categoryId || ""}
            busy={busy}
            onCreate={onCreateCategory}
          />
          <Input
            label={`Split ${i + 1} signed amount ($)`}
            name={`splitAmount-${i}`}
            required={false}
            value={edit?.splits[i] ? dollars(edit.splits[i].amount) : undefined}
          />
        </div>
      ))}
      <div className="actions">
        <button
          type="button"
          disabled={count >= 50}
          onClick={() => setCount(count + 1)}
        >
          Add another split
        </button>
      </div>
    </fieldset>
  );
}
function Diff({ value, state }: { value: unknown; state: FinanceState }) {
  const labels: Record<string, string> = {
    kind: "Change",
    name: "Name",
    type: "Account type",
    opening: "Opening balance",
    asOf: "Opening snapshot date (end of day)",
    accountId: "Account",
    fromId: "From account",
    toId: "To account",
    categoryId: "Category",
    amount: "Signed amount",
    date: "Date",
    description: "Description",
    status: "Status",
    splits: "Category allocations",
    month: "Month",
    target: "Monthly target",
    start: "First due date",
    cadence: "Frequency",
    clearingDays: "Estimated clearing delay (days)",
    statement: "Statement ending balance",
    balance: "Cleared balance",
    through: "Through date",
    id: "Record ID",
    transferId: "Linked transfer ID",
    reconciledAt: "Reconciled through",
    currency: "Currency",
    recurrenceId: "Bill / income schedule",
    dueDate: "Scheduled due date",
    expectedClearDate: "Estimated clearance date",
    settles: "Confirms this occurrence is settled in full",
    occurrence: "Bill / income link",
    transactionId: "Recorded payment",
    sourceProposalId: "Approved deletion to restore",
    entries: "Restored records",
    flow: "Entry type",
    paused: "Pause future estimates",
    active: "Active future estimates",
    archived: "Archived schedule",
    source: "Prepared by",
  };
  function show(key: string, v: unknown): ReactNode {
    if (v === null)
      return key === "occurrence"
        ? "Not linked — ordinary transaction"
        : "Unknown / not set up";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (key === "recurrenceId")
      return state.recurrences.find((r) => r.id === v)?.name || String(v);
    if (key === "transactionId") {
      const t = state.transactions.find((t) => t.id === v);
      return t
        ? `${t.date} · ${t.description} · ${money(t.amount)}`
        : String(v);
    }
    if (
      ["opening", "amount", "target", "statement", "balance"].includes(key) &&
      typeof v === "number"
    )
      return money(v);
    if (["accountId", "fromId", "toId"].includes(key))
      return state.accounts.find((a) => a.id === v)?.name || String(v);
    if (key === "categoryId")
      return state.categories.find((c) => c.id === v)?.name || String(v);
    if (key === "splits" && Array.isArray(v))
      return v.length
        ? v.map((s, i) => (
            <div key={i}>
              {state.categories.find((c) => c.id === s.categoryId)?.name}:{" "}
              {money(s.amount)}
            </div>
          ))
        : "Uncategorized (no additional balance change)";
    if (v && typeof v === "object") return <Diff value={v} state={state} />;
    return String(v);
  }
  if (value === null) return <p>No existing record.</p>;
  if (Array.isArray(value))
    return (
      <>
        {value.map((v, i) => (
          <Diff key={i} value={v} state={state} />
        ))}
      </>
    );
  return (
    <dl>
      {Object.entries(value as Record<string, unknown>).map(([key, v]) => (
        <div key={key}>
          <dt>{labels[key] || key}</dt>
          <dd>{show(key, v)}</dd>
        </div>
      ))}
    </dl>
  );
}
export function Review({
  data,
  state,
  busy,
  error,
  onConfirm,
  onClose,
}: {
  data: { proposal: Proposal; token: string; key: string };
  state: FinanceState;
  busy: boolean;
  error: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointer: number; start: number; width: number } | null>(
    null,
  );
  const [position, setPosition] = useState(0),
    [stage, setStage] = useState(1),
    [slideHint, setSlideHint] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="review"
      aria-labelledby="review-title"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onClose();
      }}
    >
      <h2 id="review-title">
        {stage === 1
          ? "Review these exact changes"
          : "Confirm this reviewed change"}
      </h2>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <p className="notice">
        Nothing saved yet.{" "}
        {data.proposal.source === "ai"
          ? "Pip prepared this proposal. Only you can approve it here."
          : "You prepared this proposal."}{" "}
        No money will move between financial institutions.
      </p>
      <div className="diff">
        <section>
          <h3>Before</h3>
          <Diff value={data.proposal.before} state={state} />
        </section>
        <section>
          <h3>After / intended operation</h3>
          <Diff value={data.proposal.operation} state={state} />
        </section>
      </div>
      {data.proposal.impact && (
        <section>
          <h3>Cleared balance impact</h3>
          {data.proposal.impact.accounts.map((a, i) => (
            <p key={i}>
              {a.name}
              {a.owed ? " (owed)" : ""}: {money(a.before)} → {money(a.after)}
            </p>
          ))}
          <p>
            Net worth: {money(data.proposal.impact.netWorthBefore)} →{" "}
            {money(data.proposal.impact.netWorthAfter)}
          </p>
          <small>
            Pending entries and plan changes do not immediately change cleared
            balances. Recurring changes affect estimates only; category targets
            compare against actuals without moving money.
          </small>
          {data.proposal.impact.plan && (
            <p>
              Budget {data.proposal.impact.plan.month}: cleared spending{" "}
              {money(data.proposal.impact.plan.actualBefore)} →{" "}
              {money(data.proposal.impact.plan.actualAfter)}; target{" "}
              {money(data.proposal.impact.plan.targetBefore)} →{" "}
              {money(data.proposal.impact.plan.targetAfter)}.
            </p>
          )}
          {data.proposal.impact.projection && (
            <p>
              30-day estimated low cash as of{" "}
              {data.proposal.impact.projection.asOf}:{" "}
              {money(data.proposal.impact.projection.lowestBefore)} →{" "}
              {money(data.proposal.impact.projection.lowestAfter)}. This is a
              projection, not a cleared bank balance.
            </p>
          )}
        </section>
      )}
      {data.proposal.operation.kind === "deleteTransaction" && (
        <p className="notice">
          The entry will be removed from actuals. A linked transfer removes both
          legs. A later reviewed restore is available from Inbox unless a newer
          snapshot or reconciliation makes restoration unsafe.
        </p>
      )}
      {data.proposal.operation.kind === "transfer" && (
        <p>
          One linked pair: decreases the source and increases the destination in
          net-worth terms. Paying a liability reduces the amount owed. No budget
          spending is added.
        </p>
      )}
      <p className="muted">
        Review expires in five minutes. Another saved financial change
        invalidates this review.
      </p>
      {stage === 1 ? (
        <>
          <div ref={track} className="slide-track">
            <span>Slide to save, then release →</span>
            <button
              className="slide-thumb"
              type="button"
              aria-label="Slide to confirm; accessible confirmation available below"
              disabled={busy}
              style={{ transform: `translateX(${position}px)` }}
              onPointerDown={(e) => {
                if (!e.isTrusted || !track.current) return;
                const width =
                  track.current.clientWidth - e.currentTarget.offsetWidth - 8;
                if (width <= 0) return;
                setSlideHint("");
                drag.current = {
                  pointer: e.pointerId,
                  start: e.clientX,
                  width,
                };
                e.currentTarget.setPointerCapture(e.pointerId);
                setPosition(0);
              }}
              onPointerMove={(e) => {
                if (drag.current?.pointer === e.pointerId)
                  setPosition(
                    Math.max(
                      0,
                      Math.min(
                        drag.current.width,
                        e.clientX - drag.current.start,
                      ),
                    ),
                  );
              }}
              onPointerCancel={() => {
                setSlideHint(
                  "Slide cancelled. Nothing saved. You can use accessible confirmation below.",
                );
                drag.current = null;
                setPosition(0);
              }}
              onLostPointerCapture={() => {
                if (drag.current)
                  setSlideHint(
                    "Slide interrupted. Nothing saved. You can use accessible confirmation below.",
                  );
                drag.current = null;
                setPosition(0);
              }}
              onPointerUp={(e) => {
                const d = drag.current;
                const bounds = track.current?.getBoundingClientRect();
                drag.current = null;
                setPosition(0);
                if (
                  e.isTrusted &&
                  d?.pointer === e.pointerId &&
                  e.clientX - d.start >= d.width * 0.95 &&
                  bounds &&
                  e.clientX <= bounds.right &&
                  e.clientX >= bounds.right - 64 &&
                  e.clientY >= bounds.top &&
                  e.clientY <= bounds.bottom &&
                  !busy
                ) {
                  setSlideHint("");
                  onConfirm();
                } else if (d) {
                  setSlideHint(
                    "Nothing saved. Drag the arrow all the way right and release inside the bar, or use accessible confirmation below.",
                  );
                }
              }}
            >
              →
            </button>
          </div>
          {slideHint && <p role="status">{slideHint}</p>}
          <button
            onClick={() => {
              drag.current = null;
              setPosition(0);
              setStage(2);
            }}
          >
            Use accessible confirmation
          </button>
          <p>
            <small>
              Continue to a separate confirmation step using keyboard, tap,
              switch, or your device’s voice control. No dragging required.
            </small>
          </p>
        </>
      ) : (
        <div className="actions">
          <button
            className="primary"
            autoFocus
            disabled={busy}
            onClick={onConfirm}
          >
            {busy ? "Saving…" : "Confirm these exact changes"}
          </button>
          <button disabled={busy} onClick={() => setStage(1)}>
            Back to review
          </button>
        </div>
      )}
      <div className="actions">
        <button disabled={busy} onClick={onClose}>
          Cancel / save for later
        </button>
      </div>
      <p>
        <small>
          Biometric/passkey step-up is not implemented. This local milestone
          uses your signed-in session and deliberate approval.
        </small>
      </p>
    </dialog>
  );
}
