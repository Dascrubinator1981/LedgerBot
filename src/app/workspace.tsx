"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Field,
  Input,
  AccountSelect,
  SplitFields,
  Review,
  dollars,
} from "./components";
import {
  balance,
  budgetActual,
  forecast,
  liability,
  money,
  netWorth,
  parseMoney,
  type FinanceState,
  type Operation,
  type Proposal,
  type Transaction,
} from "@/lib/domain";

type Tab =
  | "Dashboard"
  | "Accounts"
  | "Ledger"
  | "Budget"
  | "Forecaster"
  | "Inbox"
  | "Settings";
const tabs: Tab[] = [
  "Dashboard",
  "Accounts",
  "Ledger",
  "Budget",
  "Forecaster",
  "Inbox",
  "Settings",
];
const today = () => new Date().toISOString().slice(0, 10);
export default function Workspace() {
  const [state, setState] = useState<FinanceState | null>(null),
    [csrf, setCsrf] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>("Dashboard"),
    [mode, setMode] = useState<"login" | "signup">("signup"),
    [notice, setNotice] = useState(""),
    [error, setError] = useState("");
  const [review, setReview] = useState<{
      proposal: Proposal;
      token: string;
      key: string;
    } | null>(null),
    [edit, setEdit] = useState<Transaction | null>(null);
  const [accountFilter, setAccountFilter] = useState(""),
    [statusFilter, setStatusFilter] = useState(""),
    [query, setQuery] = useState(""),
    [monthFilter, setMonthFilter] = useState("");
  const [horizon, setHorizon] = useState(30);
  const guard = useRef(false);
  async function api(path: string, method = "GET", payload?: unknown) {
    const response = await fetch(`/api/${path}`, {
      method,
      headers:
        method === "GET"
          ? {}
          : { "Content-Type": "application/json", "x-csrf-token": csrf },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Request failed");
    return result;
  }
  async function refresh() {
    const result = await api("state");
    setState(result);
    setCsrf(result.csrf);
  }
  useEffect(() => {
    fetch("/api/state")
      .then(async (r) => {
        if (r.ok) {
          const result = await r.json();
          setState(result);
          setCsrf(result.csrf);
        } else if (r.status !== 401)
          setError("Could not load your records. Try reloading.");
      })
      .catch(() => setError("Server unavailable. Try reloading."))
      .finally(() => setLoading(false));
  }, []);
  async function run(action: () => Promise<void>) {
    if (guard.current) return;
    guard.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to complete request");
    } finally {
      setBusy(false);
      guard.current = false;
    }
  }
  async function prepare(operation: Operation) {
    const proposal = await api("proposals", "POST", operation);
    await refresh();
    const r = await api("review", "POST", { id: proposal.id });
    setReview({ ...r, key: crypto.randomUUID() });
  }
  function submit(
    event: FormEvent<HTMLFormElement>,
    build: (f: FormData) => Operation,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    void run(async () => {
      await prepare(build(new FormData(form)));
      form.reset();
      setEdit(null);
    });
  }
  const str = (f: FormData, key: string) => String(f.get(key) || "");
  if (loading)
    return (
      <main>
        <p role="status">Opening your private workspace…</p>
      </main>
    );
  if (!state)
    return (
      <main className="auth">
        <div className="brand">
          ▣ Ledger<span>Bot</span>
        </div>
        <p className="eyebrow">Your money. Your rules.</p>
        <h1>A clearer picture starts with you.</h1>
        <p>Record reality. Build your plan. See what’s ahead.</p>
        <div className="card">
          <h2>
            {mode === "signup" ? "Start an empty workspace" : "Welcome back"}
          </h2>
          <p>
            No bank connection, AI key, or payment required. New accounts
            contain no financial records.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              void run(async () => {
                await api("auth", "POST", {
                  mode,
                  email: str(f, "email"),
                  password: str(f, "password"),
                });
                await refresh();
              });
            }}
          >
            <Field label="Email">
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </Field>
            <Field label="Password (at least 12 characters)">
              <input
                name="password"
                type="password"
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                minLength={12}
                maxLength={128}
                required
              />
            </Field>
            <button className="primary" disabled={busy}>
              {mode === "signup" ? "Create my empty account" : "Sign in"}
            </button>
          </form>
          <div className="actions">
            <button
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              {mode === "signup"
                ? "Already registered? Sign in"
                : "Create a new account"}
            </button>
          </div>
        </div>
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <p>
          <small>
            Development milestone · Use fabricated values only. Email
            verification, password recovery, MFA, and isolated demo mode are not
            implemented.
          </small>
        </p>
      </main>
    );
  const pending = state.proposals.filter((p) => p.status === "awaiting_review");
  const accounts = state.accounts;
  const transactions = [...state.transactions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
  );
  const projections = forecast(state, today(), horizon);
  const currentMonth = today().slice(0, 7);
  return (
    <div className="shell">
      <a className="skip" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          ▣ Ledger<span>Bot</span>
        </div>
        <nav aria-label="Main navigation">
          {tabs.map((t) => (
            <button
              key={t}
              aria-current={tab === t ? "page" : undefined}
              onClick={() => {
                setTab(t);
                setEdit(null);
              }}
            >
              {t}
              {t === "Inbox" && pending.length ? ` (${pending.length})` : ""}
            </button>
          ))}
        </nav>
        <footer>
          Manual finance · USD
          <br />
          Private development milestone
          <br />
          Live integrations disabled
          <br />
          <button
            onClick={() =>
              void run(async () => {
                await api("auth", "DELETE", {});
                setState(null);
                setCsrf("");
              })
            }
          >
            Sign out
          </button>
        </footer>
      </aside>
      <main id="main-content">
        <div className="topline">
          <div>
            <p className="eyebrow">Ledger · Plan · Possibility</p>
            <h1>{tab === "Dashboard" ? "Your financial workspace" : tab}</h1>
          </div>
          <div className="actions">
            <span className="pill">Manual · no live integrations</span>
            <button className="primary" onClick={() => setTab("Ledger")}>
              + Add transaction
            </button>
            <button
              onClick={() =>
                void run(async () => {
                  await api("auth", "DELETE", {});
                  setState(null);
                  setCsrf("");
                })
              }
            >
              Sign out
            </button>
          </div>
        </div>
        <p className="notice">
          Development build: use invented financial information only. This
          application has not passed an independent security or accessibility
          review.
        </p>
        <div aria-live="polite">
          {notice && (
            <p className="notice success" role="status">
              {notice}
            </p>
          )}
        </div>
        {error && (
          <p className="notice error" role="alert">
            {error}
          </p>
        )}
        {tab === "Dashboard" && (
          <>
            {!accounts.length ? (
              <div className="card empty">
                <div className="pip" aria-hidden="true">
                  [•ᴗ•]
                </div>
                <h2>A fresh start. Nothing added yet.</h2>
                <p>
                  Add your own account when you’re ready. Unknown balances stay
                  unknown.
                </p>
                <div className="actions">
                  <button
                    className="primary"
                    onClick={() => setTab("Accounts")}
                  >
                    Set up manually
                  </button>
                  <button
                    onClick={() =>
                      void run(async () => {
                        await api("state", "PATCH", {
                          ...state.settings,
                          setup: "skipped",
                        });
                        await refresh();
                        setNotice(
                          "Setup skipped. Return through Settings → Setup & Personalization.",
                        );
                      })
                    }
                  >
                    Skip setup
                  </button>
                </div>
                <p>
                  <small>
                    Voice onboarding and isolated demo are not available in this
                    milestone.
                  </small>
                </p>
              </div>
            ) : (
              <div className="grid">
                <div className="card">
                  <p className="muted">Net worth · cleared actuals</p>
                  <div className="amount">
                    {money(netWorth(accounts, transactions))}
                  </div>
                  <small>Assets minus amounts owed</small>
                </div>
                <div className="card">
                  <p className="muted">Cash at opening of forecast</p>
                  <div className="amount">
                    {money(projections.days[0].amount)}
                  </div>
                  <small>Checking, savings and cash · dated snapshots</small>
                </div>
                <div className="card">
                  <p className="muted">Pending reviews</p>
                  <div className="amount">{pending.length}</div>
                  <button onClick={() => setTab("Inbox")}>
                    Review changes
                  </button>
                </div>
              </div>
            )}
            <div className="grid">
              <section className="card">
                <h2>Ledger records reality</h2>
                <p>
                  Every balance comes from a dated opening snapshot and cleared
                  entries after it. Pending entries remain separate.
                </p>
                <button onClick={() => setTab("Ledger")}>Open ledger</button>
              </section>
              <section className="card">
                <h2>Budget creates the plan</h2>
                <p>
                  Set custom monthly targets. Category allocations compare
                  actual spending without changing your balances.
                </p>
                <button onClick={() => setTab("Budget")}>Build a plan</button>
              </section>
              <section className="card">
                <h2>Forecaster looks ahead</h2>
                <p>
                  Explore estimated cash from your accounts, pending entries,
                  and approved recurring assumptions.
                </p>
                <button onClick={() => setTab("Forecaster")}>
                  See forecast
                </button>
              </section>
            </div>
            <section className="card">
              <h2>Pip’s notes</h2>
              <p>
                {!accounts.length
                  ? "Add an account to begin. No financial assumptions have been made for you."
                  : !state.recurrences.length
                    ? "Your forecast has limited coverage because recurring income and bills are not set up."
                    : "Your recurring schedules are estimates, not cleared transactions. Review them when your plans change."}
              </p>
              <small>
                Deterministic setup guidance · live Pip chat, voice, bank sync,
                receipt OCR, and billing disabled.
              </small>
            </section>
          </>
        )}
        {tab === "Accounts" && (
          <>
            <div className="grid">
              {accounts.map((a) => (
                <div key={a.id} className="card">
                  <span className="pill">{a.type} · USD</span>
                  <h2>{a.name}</h2>
                  <div className="amount">
                    {money(balance(a, transactions))}
                  </div>
                  <p>
                    <small>
                      {liability(a) ? "Amount owed" : "Cleared balance"} ·
                      opening snapshot {a.asOf}
                      <br />
                      Opening: {money(a.opening)}
                    </small>
                  </p>
                </div>
              ))}
            </div>
            <section className="card">
              <h2>Add a manual account</h2>
              <p>
                Enter an end-of-day opening snapshot. Transactions on or before
                that date are already included; only later dates change the
                balance. Leave opening balance blank if unknown.
              </p>
              <form
                onSubmit={(e) =>
                  submit(e, (f) => ({
                    kind: "account",
                    name: str(f, "name"),
                    type: str(f, "type") as "checking",
                    opening:
                      str(f, "opening") === ""
                        ? null
                        : parseMoney(str(f, "opening")),
                    asOf: str(f, "asOf"),
                  }))
                }
              >
                <div className="fields">
                  <Input label="Account name" name="name" />
                  <Field label="Account type">
                    <select name="type">
                      {[
                        "checking",
                        "savings",
                        "cash",
                        "credit",
                        "loan",
                        "asset",
                        "liability",
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </Field>
                  <Input
                    label="Opening balance ($, positive owed for liabilities)"
                    name="opening"
                    required={false}
                  />
                  <Input
                    label="Opening as-of date"
                    name="asOf"
                    type="date"
                    value={today()}
                  />
                </div>
                <div className="actions">
                  <button disabled={busy} className="primary">
                    Prepare account for review
                  </button>
                </div>
              </form>
            </section>
            <section className="card">
              <h2>Reconcile an account</h2>
              <p>
                Compare a statement against cleared actuals through its ending
                date. A mismatch blocks reconciliation; nothing is silently
                adjusted.
              </p>
              <form
                onSubmit={(e) =>
                  submit(e, (f) => ({
                    kind: "reconcile",
                    accountId: str(f, "accountId"),
                    date: str(f, "date"),
                    statement: parseMoney(str(f, "statement")),
                  }))
                }
              >
                <div className="fields">
                  <AccountSelect accounts={accounts} name="accountId" />
                  <Input
                    label="Statement ending date"
                    name="date"
                    type="date"
                    value={today()}
                  />
                  <Input
                    label="Statement ending balance ($)"
                    name="statement"
                  />
                </div>
                <div className="actions">
                  <button disabled={busy}>
                    Compare and prepare reconciliation
                  </button>
                </div>
              </form>
            </section>
          </>
        )}
        {tab === "Ledger" && (
          <>
            {!accounts.length && (
              <p className="notice">
                Add a manual account first in Accounts. No transactions exist
                yet.
              </p>
            )}
            <section className="card">
              <h2>{edit ? "Edit transaction" : "Add deposit or expense"}</h2>
              <p>
                Use a positive amount for income or refunds, negative for
                expenses or card purchases. Card payments belong in Transfer.
                Blank splits remain uncategorized.
              </p>
              <form
                key={edit?.id || "new"}
                onSubmit={(e) =>
                  submit(e, (f) => {
                    const amount = parseMoney(str(f, "amount"));
                    const splits = Array.from(f.keys())
                      .filter(
                        (key) => key.startsWith("category-") && str(f, key),
                      )
                      .map((key) => ({
                        categoryId: str(f, key),
                        amount: parseMoney(
                          str(f, `splitAmount-${key.split("-")[1]}`),
                        ),
                      }));
                    return {
                      kind: edit ? "editTransaction" : "transaction",
                      ...(edit ? { id: edit.id } : {}),
                      accountId: str(f, "accountId"),
                      date: str(f, "date"),
                      description: str(f, "description"),
                      amount,
                      status: str(f, "status") as "pending" | "cleared",
                      splits,
                    } as Operation;
                  })
                }
              >
                <div className="fields">
                  <AccountSelect
                    accounts={accounts}
                    name="accountId"
                    value={edit?.accountId}
                  />
                  <Input
                    label="Date"
                    name="date"
                    type="date"
                    value={edit?.date || today()}
                  />
                  <Input
                    label="Description"
                    name="description"
                    value={edit?.description}
                  />
                  <Input
                    label="Signed amount ($)"
                    name="amount"
                    value={edit ? dollars(edit.amount) : undefined}
                  />
                  <Field label="Status">
                    <select
                      name="status"
                      defaultValue={edit?.status || "cleared"}
                    >
                      <option value="cleared">Cleared</option>
                      <option value="pending">Pending</option>
                    </select>
                  </Field>
                </div>
                <SplitFields state={state} edit={edit} />
                <div className="actions">
                  <button
                    disabled={busy || !accounts.length}
                    className="primary"
                  >
                    Prepare transaction for review
                  </button>
                  {edit && (
                    <button type="button" onClick={() => setEdit(null)}>
                      Cancel edit
                    </button>
                  )}
                </div>
              </form>
            </section>
            <section className="card">
              <h2>Transfer / card payment</h2>
              <p>
                A paired internal transfer moves value between your accounts. It
                creates no new income or spending.
              </p>
              <form
                onSubmit={(e) =>
                  submit(e, (f) => ({
                    kind: "transfer",
                    fromId: str(f, "fromId"),
                    toId: str(f, "toId"),
                    amount: parseMoney(str(f, "amount")),
                    date: str(f, "date"),
                    description: str(f, "description"),
                    status: str(f, "status") as "cleared" | "pending",
                  }))
                }
              >
                <div className="fields">
                  <AccountSelect
                    accounts={accounts}
                    name="fromId"
                    label="From account"
                  />
                  <AccountSelect
                    accounts={accounts}
                    name="toId"
                    label="To account (card for payment)"
                  />
                  <Input label="Transfer amount ($, positive)" name="amount" />
                  <Input label="Transfer description" name="description" />
                  <Input
                    label="Transfer date"
                    name="date"
                    type="date"
                    value={today()}
                  />
                  <Field label="Transfer status">
                    <select name="status">
                      <option value="cleared">Cleared</option>
                      <option value="pending">Pending</option>
                    </select>
                  </Field>
                </div>
                <div className="actions">
                  <button disabled={busy || accounts.length < 2}>
                    Prepare paired transfer
                  </button>
                </div>
              </form>
            </section>
            <section className="card">
              <h2>Actual ledger</h2>
              <div className="fields">
                <Field label="Filter account">
                  <select
                    value={accountFilter}
                    onChange={(e) => setAccountFilter(e.target.value)}
                  >
                    <option value="">All accounts</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Filter status">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All statuses</option>
                    <option value="cleared">Cleared</option>
                    <option value="pending">Pending</option>
                  </select>
                </Field>
                <Field label="Search description">
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </Field>
                <Field label="Filter month">
                  <input
                    type="month"
                    value={monthFilter}
                    onChange={(e) => setMonthFilter(e.target.value)}
                  />
                </Field>
              </div>
              <div className="table-wrap">
                <table>
                  <caption className="visually-hidden">
                    Transactions with per-account end-of-day cleared running
                    balances
                  </caption>
                  <thead>
                    <tr>
                      {[
                        "Date",
                        "Account / description",
                        "Amount",
                        "Status",
                        "Cleared balance through day",
                        "Actions",
                      ].map((v) => (
                        <th key={v} scope="col">
                          {v}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .filter(
                        (t) =>
                          (!accountFilter || t.accountId === accountFilter) &&
                          (!statusFilter || t.status === statusFilter) &&
                          t.description
                            .toLowerCase()
                            .includes(query.toLowerCase()) &&
                          (!monthFilter || t.date.startsWith(monthFilter)),
                      )
                      .map((t) => {
                        const a = accounts.find((a) => a.id === t.accountId)!;
                        return (
                          <tr key={t.id}>
                            <td>{t.date}</td>
                            <td>
                              {a.name}
                              <br />
                              {t.description}
                              {t.transferId && (
                                <>
                                  <br />
                                  <span className="pill">
                                    Paired transfer · no spending
                                  </span>
                                </>
                              )}
                            </td>
                            <td
                              className={t.amount < 0 ? "negative" : "positive"}
                            >
                              {money(t.amount)}
                            </td>
                            <td>
                              {t.status}
                              {t.reconciledAt && " · reconciled"}
                            </td>
                            <td>
                              {money(balance(a, transactions, t.date))}
                              {liability(a) && " owed"}
                            </td>
                            <td>
                              <div className="actions">
                                {!t.transferId && !t.reconciledAt && (
                                  <button
                                    onClick={() => {
                                      setEdit(t);
                                      window.scrollTo({
                                        top: 0,
                                        behavior: "instant",
                                      });
                                    }}
                                  >
                                    Edit
                                  </button>
                                )}
                                {!t.reconciledAt && (
                                  <button
                                    className="danger"
                                    disabled={busy}
                                    onClick={() =>
                                      void run(() =>
                                        prepare({
                                          kind: "deleteTransaction",
                                          id: t.id,
                                        }),
                                      )
                                    }
                                  >
                                    Review delete{t.transferId ? " pair" : ""}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
              {!transactions.length && (
                <p>No ledger entries yet. Nothing has been posted.</p>
              )}
              <small>
                Balances include all cleared entries through each day, including
                rows hidden by filters. Pending entries do not alter cleared
                balances.
              </small>
            </section>
          </>
        )}
        {tab === "Budget" && (
          <>
            <section className="card">
              <h2>Your categories</h2>
              <p>
                Custom labels describe allocations; they never post another
                debit.
              </p>
              <div className="row">
                {state.categories.map((c) => (
                  <span className="pill" key={c.id}>
                    {c.name}
                  </span>
                ))}
              </div>
              <form
                onSubmit={(e) =>
                  submit(e, (f) => ({ kind: "category", name: str(f, "name") }))
                }
              >
                <div className="fields">
                  <Input label="New category name" name="name" />
                </div>
                <div className="actions">
                  <button disabled={busy}>Prepare category</button>
                </div>
              </form>
            </section>
            <section className="card">
              <h2>Monthly PLAN</h2>
              <p>
                Targets are intentions. Spending comparisons come from approved,
                cleared allocations. Uncategorized spending is excluded and must
                be reviewed in the Ledger.
              </p>
              <form
                onSubmit={(e) =>
                  submit(e, (f) => ({
                    kind: "budget",
                    categoryId: str(f, "categoryId"),
                    month: str(f, "month"),
                    target: parseMoney(str(f, "target")),
                  }))
                }
              >
                <div className="fields">
                  <Field label="Budget category">
                    <select name="categoryId" required>
                      <option value="">Choose category</option>
                      {state.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Input
                    label="Budget month"
                    name="month"
                    type="month"
                    value={currentMonth}
                  />
                  <Input label="Planned target ($)" name="target" />
                </div>
                <div className="actions">
                  <button disabled={busy || !state.categories.length}>
                    Prepare budget target
                  </button>
                </div>
              </form>
            </section>
            {!state.budgets.length ? (
              <p className="notice">
                Budget not set up yet. No spending targets have been assumed.
              </p>
            ) : (
              <div className="grid">
                {state.budgets.map((b) => {
                  const actual = budgetActual(
                    b.categoryId,
                    b.month,
                    transactions,
                  );
                  return (
                    <section className="card" key={b.id}>
                      <h2>
                        {
                          state.categories.find((c) => c.id === b.categoryId)
                            ?.name
                        }
                      </h2>
                      <span className="pill">{b.month} · PLAN</span>
                      <p>Target: {money(b.target)}</p>
                      <p>Cleared actuals: {money(actual)}</p>
                      <p>
                        Remaining against target: {money(b.target - actual)}
                      </p>
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
        {tab === "Forecaster" && (
          <>
            <section className="card">
              <div className="row">
                <h2>Estimated cash ahead</h2>
                <Field label="Forecast horizon">
                  <select
                    value={horizon}
                    onChange={(e) => setHorizon(Number(e.target.value))}
                  >
                    {[7, 30, 60, 90].map((n) => (
                      <option value={n} key={n}>
                        {n} days
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <span className="pill">Preliminary / incomplete coverage</span>
              {projections.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
              <p>
                Pending items are assumed to clear on their entered future date,
                or tomorrow if overdue. Schedules never mark anything cleared.
                Category targets are not added as extra withdrawals.
              </p>
              <div className="table-wrap">
                <table>
                  <caption className="visually-hidden">
                    Daily estimated cash balance
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Estimated cash</th>
                      <th scope="col">Assumptions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projections.days.map((d) => (
                      <tr key={d.date}>
                        <td>{d.date}</td>
                        <td>{money(d.amount)}</td>
                        <td>
                          {projections.events
                            .filter((v) => v.date === d.date)
                            .map((v, i) => (
                              <div key={i}>
                                {v.name}: {money(v.amount)} · {v.state}
                              </div>
                            ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="card">
              <h2>Add recurring bill / income assumption</h2>
              <p>
                Negative for bills, positive for income. Does not create an
                actual ledger entry. Recurring matching and schedule editing are
                not implemented.
              </p>
              <form
                onSubmit={(e) =>
                  submit(e, (f) => ({
                    kind: "recurrence",
                    accountId: str(f, "accountId"),
                    name: str(f, "name"),
                    amount: parseMoney(str(f, "amount")),
                    start: str(f, "start"),
                    cadence: str(f, "cadence") as "weekly",
                    clearingDays: Number(str(f, "clearingDays")),
                  }))
                }
              >
                <div className="fields">
                  <AccountSelect accounts={accounts} name="accountId" />
                  <Input label="Schedule name" name="name" />
                  <Input label="Signed recurring amount ($)" name="amount" />
                  <Input
                    label="First due / expected date"
                    name="start"
                    type="date"
                    value={today()}
                  />
                  <Field label="Cadence">
                    <select name="cadence">
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Biweekly</option>
                      <option value="monthly">
                        Monthly (clamp to month end)
                      </option>
                    </select>
                  </Field>
                  <Input
                    label="Estimated clearing delay (0–30 days)"
                    name="clearingDays"
                    type="number"
                    value="0"
                  />
                </div>
                <div className="actions">
                  <button disabled={busy || !accounts.length}>
                    Prepare recurring assumption
                  </button>
                </div>
              </form>
            </section>
            <section className="card">
              <h2>Approved assumptions</h2>
              {state.recurrences.length ? (
                state.recurrences.map((r) => (
                  <p key={r.id}>
                    {r.name} · {money(r.amount)} · {r.cadence} from {r.start} +{" "}
                    {r.clearingDays} days · estimate only
                  </p>
                ))
              ) : (
                <p>No recurring bills or income configured.</p>
              )}
            </section>
          </>
        )}
        {tab === "Inbox" && (
          <>
            <section className="card">
              <h2>Pending reviews</h2>
              <p>
                Nothing in this queue changes actuals until you approve its
                exact contents. A financial save makes older proposals stale;
                discard and recreate stale proposals.
              </p>
              {pending.length ? (
                pending.map((p) => (
                  <article key={p.id} className="card">
                    <div className="row">
                      <div>
                        <h3>
                          {p.operation.kind} ·{" "}
                          {p.source === "human" ? "Manual draft" : "Pip draft"}
                        </h3>
                        <small>
                          {new Date(p.createdAt).toLocaleString()} ·{" "}
                          {p.revision !== state.revision
                            ? "Stale — recreate from current data"
                            : "Awaiting review (expiry checked when opened)"}
                        </small>
                      </div>
                      <div className="actions">
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              const r = await api("review", "POST", {
                                id: p.id,
                              });
                              setReview({ ...r, key: crypto.randomUUID() });
                            })
                          }
                        >
                          Review exact changes
                        </button>
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await api("proposals", "DELETE", { id: p.id });
                              await refresh();
                            })
                          }
                        >
                          Discard
                        </button>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <p>No pending financial changes.</p>
              )}
            </section>
            <section className="card">
              <h2>Setup suggestions</h2>
              <p>
                Setup status: {state.settings.setup}.{" "}
                {!accounts.length
                  ? "Add a manual account to see your cash position."
                  : !state.recurrences.length
                    ? "Add bills and income assumptions for better forecast coverage."
                    : "Review assumptions and reconcile statements regularly."}
              </p>
              <button onClick={() => setTab("Settings")}>
                Setup & Personalization
              </button>
              <p>
                <small>
                  Promotional preferences are independent from these safety and
                  setup messages.
                </small>
              </p>
            </section>
            <section className="card">
              <h2>Review history</h2>
              {state.proposals
                .filter((p) => p.status !== "awaiting_review")
                .map((p) => (
                  <p key={p.id}>
                    {p.operation.kind} · {p.status} · {p.id}
                  </p>
                ))}
            </section>
          </>
        )}
        {tab === "Settings" && (
          <>
            <section className="card">
              <h2>Setup & Personalization</h2>
              <p>
                Skipped setup stays available here. This status is your
                preference, not a claim of complete forecast coverage.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  void run(async () => {
                    await api("state", "PATCH", {
                      setup: str(f, "setup"),
                      promotions: f.get("promotions") === "on",
                    });
                    await refresh();
                    setNotice("Preferences saved.");
                  });
                }}
              >
                <div className="fields">
                  <Field label="Setup status">
                    <select name="setup" defaultValue={state.settings.setup}>
                      <option value="needs-review">Needs review</option>
                      <option value="skipped">Skipped</option>
                      <option value="complete">Complete</option>
                      <option value="not-applicable">Not applicable</option>
                    </select>
                  </Field>
                </div>
                <p>
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      name="promotions"
                      defaultChecked={state.settings.promotions}
                    />
                    Allow optional promotional suggestions (none sent in this
                    milestone)
                  </label>
                </p>
                <button disabled={busy}>Save preferences</button>
              </form>
              <div className="actions">
                <button onClick={() => setTab("Accounts")}>
                  Resume account setup
                </button>
                <button onClick={() => setTab("Forecaster")}>
                  Resume bills & income
                </button>
                <button onClick={() => setTab("Budget")}>
                  Resume budget setup
                </button>
              </div>
            </section>
            <section className="card">
              <h2>Integration status</h2>
              {[
                "Bank sync",
                "Live Pip AI chat / voice",
                "Receipt OCR",
                "Subscriptions / paid billing",
                "External payments",
                "Passkey / biometric step-up",
                "Isolated synthetic demo",
              ].map((v) => (
                <p key={v}>
                  {v} <span className="pill">Not implemented · disabled</span>
                </p>
              ))}
            </section>
          </>
        )}
        {review && (
          <Review
            key={review.proposal.id}
            data={review}
            state={state}
            busy={busy}
            error={error}
            onClose={() => {
              setReview(null);
              setNotice("Draft kept in Inbox. No financial change saved.");
            }}
            onConfirm={() =>
              void run(async () => {
                const receipt = await api("confirm", "POST", {
                  proposalId: review.proposal.id,
                  version: review.proposal.version,
                  digest: review.proposal.digest,
                  token: review.token,
                  idempotencyKey: review.key,
                });
                setReview(null);
                setNotice(`Change saved. Receipt ${receipt.id}.`);
                await refresh();
              })
            }
          />
        )}
      </main>
    </div>
  );
}
