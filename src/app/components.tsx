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
import { operationSummary } from "@/lib/operation-summary";
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
        autoComplete={
          /\$|amount|balance|target/i.test(label) ? "off" : undefined
        }
        inputMode={
          type === "text" && /\$|amount|balance|target/i.test(label)
            ? "decimal"
            : undefined
        }
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
  onChange,
}: {
  accounts: Account[];
  onChange?: (id: string) => void;
  name: string;
  label?: string;
  value?: string;
}) {
  return (
    <Field label={label}>
      <select
        name={name}
        defaultValue={value}
        required
        onChange={(e) => onChange?.(e.target.value)}
      >
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
  onCreateCategory?: (name: string, form?: HTMLFormElement) => void;
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
            label={`Split ${i + 1} amount ($)`}
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
    opening: "Starting balance",
    asOf: "Balance date",
    date: "Date",
    amount: "Amount",
    status: "Status",
    flow: "Entry type",
    splits: "Categories",
    month: "Month",
    period: "Budget period",
    cadence: "Frequency",
    anchor: "Period start",
    openingBasis: "Balance timing",
    currency: "Currency",
    occurrence: "Bill link",
    settles: "Settles in full",
    newCategory: "New category",
    target: "Monthly target",
    balanceImpact: "Starting-balance treatment",
    fromBalanceImpact: "From account balance treatment",
    toBalanceImpact: "To account balance treatment",
    accountId: "Account",
    fromId: "From account",
    toId: "To account",
    categoryId: "Category",
    description: "Description",
    start: "First due date",
    clearingDays: "Estimated clearing delay (days)",
    statement: "Statement ending balance",
    balance: "Cleared balance",
    through: "Through date",
    id: "Record ID",
    transferId: "Linked transfer ID",
    reconciledAt: "Reconciled through",
    recurrenceId: "Bill / income schedule",
    dueDate: "Scheduled due date",
    expectedClearDate: "Estimated clearance date",
    transactionId: "Recorded payment",
    sourceProposalId: "Approved deletion to restore",
    entries: "Restored records",
    paused: "Pause future estimates",
    active: "Active future estimates",
    archived: "Archived schedule",
    source: "Prepared by",
  };
  function show(key: string, v: unknown): ReactNode {
    if (["balanceImpact", "fromBalanceImpact", "toBalanceImpact"].includes(key))
      return v === "included"
        ? "Already included in the starting balance; keep history without applying again"
        : "Apply this entry to the balance (when cleared)";
    if (v === null)
      return key === "occurrence"
        ? "Not linked — ordinary transaction"
        : "Unknown / not set up";
    if (typeof v === "boolean") return v ? "Yes" : "No";
    if (key === "openingBasis")
      return v === "start-of-day"
        ? "Before that day’s entries"
        : "Closing snapshot, includes that day";
    if (key === "kind") return String(v).replace(/([A-Z])/g, " $1");
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
      {Object.entries(value as Record<string, unknown>)
        .filter(
          ([key]) =>
            ![
              "balanceAnchor",
              "fromBalanceAnchor",
              "toBalanceAnchor",
              "openingVersion",
            ].includes(key),
        )
        .map(([key, v]) => (
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
  const operations =
    data.proposal.operation.kind === "batch" ||
    data.proposal.operation.kind === "draft"
      ? data.proposal.operation.operations
      : [data.proposal.operation];
  const displayState = {
    ...state,
    categories: [
      ...state.categories,
      ...operations.flatMap((op) =>
        op.kind === "category" && op.id
          ? [{ id: op.id, name: op.name }]
          : op.kind === "budget" && op.newCategory
            ? [{ id: op.categoryId, name: op.newCategory.name }]
            : [],
      ),
    ],
  };
  const dialog = useRef<HTMLElement>(null),
    track = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    pointer: number;
    start: number;
    width: number;
    scale: number;
  } | null>(null);
  const [position, setPosition] = useState(0),
    [stage, setStage] = useState(1),
    [slideHint, setSlideHint] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element?.focus();
    element?.scrollIntoView({ block: "start" });
  }, []);
  return (
    <section
      ref={dialog}
      role="dialog"
      aria-modal="false"
      tabIndex={-1}
      className="review inline-review"
      aria-labelledby="review-title"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          if (!busy) onClose();
        }
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
        Nothing saved yet. These changes will not take place until confirmed.
        {data.proposal.source === "ai"
          ? " Pip prepared this draft; only you can confirm."
          : ""}
      </p>
      <div className="table-wrap review-table">
        <table>
          <caption>Changes you are approving</caption>
          <thead>
            <tr>
              <th scope="col">Change</th>
              <th scope="col">Exact entry</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op, index) => {
              const summary = operationSummary(op, displayState);
              return (
                <tr key={index}>
                  <td>{summary.title}</td>
                  <td>
                    {summary.detail}
                    <details>
                      <summary>Before and after details</summary>
                      <div className="diff">
                        <section>
                          <h3>Before</h3>
                          <Diff
                            value={
                              Array.isArray(data.proposal.before)
                                ? data.proposal.before[index]
                                : data.proposal.before
                            }
                            state={displayState}
                          />
                        </section>
                        <section>
                          <h3>After</h3>
                          <Diff value={op} state={displayState} />
                        </section>
                      </div>
                    </details>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data.proposal.impact && (
        <section aria-label="Changed balances">
          <h3>Balance changes</h3>
          {data.proposal.impact.accounts
            .filter((a) => a.before !== a.after)
            .map((a, i) => (
              <p key={i}>
                {a.name}
                {a.owed ? " (owed)" : ""}: {money(a.before)} → {money(a.after)}
              </p>
            ))}
          {data.proposal.impact.plan &&
            (data.proposal.impact.plan.targetBefore !==
              data.proposal.impact.plan.targetAfter ||
              data.proposal.impact.plan.actualBefore !==
                data.proposal.impact.plan.actualAfter) && (
              <p>
                Budget {data.proposal.impact.plan.month}: spending{" "}
                {money(data.proposal.impact.plan.actualBefore)} →{" "}
                {money(data.proposal.impact.plan.actualAfter)}; target{" "}
                {money(data.proposal.impact.plan.targetBefore)} →{" "}
                {money(data.proposal.impact.plan.targetAfter)}.
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
        Confirm within five minutes. If records change, review again.
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
              draggable={false}
              onDragStart={(e) => e.preventDefault()}
              style={{ transform: `translateX(${position}px)` }}
              onPointerDown={(e) => {
                if (!e.isTrusted || !track.current) return;
                e.preventDefault();
                const bounds = track.current.getBoundingClientRect();
                const scale = bounds.width / track.current.clientWidth;
                const width =
                  bounds.width -
                  e.currentTarget.getBoundingClientRect().width -
                  8 * scale;
                if (width <= 0) return;
                setSlideHint("");
                drag.current = {
                  pointer: e.pointerId,
                  start: e.clientX,
                  width,
                  scale,
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
                    ) / drag.current.scale,
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
          Cancel review / keep page draft
        </button>
      </div>
      <p>
        <small>
          Biometric/passkey step-up is not implemented. This local milestone
          uses your signed-in session and deliberate approval.
        </small>
      </p>
    </section>
  );
}
