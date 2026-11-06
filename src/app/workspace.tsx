"use client";
import { useEffect, useRef, useState, useMemo, type FormEvent } from "react";
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
  civilToday,
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

import { BudgetCharts, RecentBills, ForecastChart } from "./finance-views";
import { ExportPanel } from "./export-panel";
import {
  PlanningPanel,
  AccountTools,
  OccurrenceFields,
  occurrenceInput,
} from "./planning-forms";
import { runningBalances } from "@/lib/insights";
import {
  sections as tabs,
  sectionFromUrl,
  sectionHref,
  type Section as Tab,
} from "@/lib/navigation";
import { SetupReminders } from "./setup-reminders";
import { BudgetExplorer } from "./budget-explorer";
import { CategorySelect } from "./category-select";
import { SessionPanel } from "./session-panel";
import { ReconciliationInvestigator } from "./reconciliation-investigator";

export default function Workspace() {
  const [state, setState] = useState<FinanceState | null>(null),
    [csrf, setCsrf] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false);
  const [tab, updateTab] = useState<Tab>("Dashboard"),
    [mode, setMode] = useState<"login" | "signup" | "recover">("signup"),
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
  const [authProvider, setAuthProvider] = useState("local-development");
  const [allowSignup, setAllowSignup] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [budgetMonth, setBudgetMonth] = useState("");
  const [transferEdit, setTransferEdit] = useState<Transaction | null>(null);
  const currentDay = civilToday(state?.settings.timezone);
  const today = () => currentDay;
  const sortedTransactions = useMemo(
    () =>
      state
        ? [...state.transactions].sort(
            (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
          )
        : [],
    [state],
  );
  const projected = useMemo(
    () => (state ? forecast(state, currentDay, horizon) : null),
    [state, currentDay, horizon],
  );
  const runningValues = useMemo(
    () =>
      new Map(
        state
          ? state.accounts.flatMap((a) => [
              ...runningBalances(a, state.transactions),
            ])
          : [],
      ),
    [state],
  );
  const updates = useRef<BroadcastChannel | null>(null);
  const requestSequence = useRef(0);
  function setTab(next: Tab) {
    updateTab(next);
    history.pushState(null, "", sectionHref(next));
  }
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
    if (!response.ok) {
      if (response.status === 401 || result.signedOut) {
        setState(null);
        setCsrf("");
        setReview(null);
        setEdit(null);
        setTransferEdit(null);
      }
      throw new Error(result.error || result.message || "Request failed");
    }
    if (method !== "GET" && path !== "review")
      updates.current?.postMessage("invalidate");
    return result;
  }
  async function refresh() {
    const sequence = ++requestSequence.current;
    const result = await api("state");
    if (sequence !== requestSequence.current) return;
    setState(result);
    setCsrf(result.csrf);
  }
  useEffect(() => {
    const navigate = () => {
      updateTab(sectionFromUrl(new URL(location.href)));
      {
        const month = new URL(location.href).searchParams.get("month");
        if (month && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month))
          setBudgetMonth(month);
      }
      setReview(null);
    };
    const channel =
      typeof BroadcastChannel !== "undefined"
        ? new BroadcastChannel("ledgerbot-invalidations")
        : null;
    updates.current = channel;
    const invalidate = async () => {
      if (guard.current) return;
      const sequence = ++requestSequence.current;
      try {
        const response = await fetch("/api/state", { cache: "no-store" });
        if (sequence !== requestSequence.current) return;
        if (response.status === 401) {
          setState(null);
          setCsrf("");
          setReview(null);
          setEdit(null);
          setTransferEdit(null);
        } else if (response.ok) {
          const result = await response.json();
          if (sequence === requestSequence.current) {
            setState(result);
            setCsrf(result.csrf);
          }
        } else
          setError(
            "Could not refresh records. Displayed values may be out of date; retry before relying on them.",
          );
      } catch {
        setError(
          "Connection unavailable. Displayed values may be out of date.",
        );
      }
    };
    const visible = () => {
      if (document.visibilityState === "visible") void invalidate();
    };
    if (channel)
      channel.onmessage = (event) => {
        if (event.data === "invalidate") void invalidate();
      };
    window.addEventListener("popstate", navigate);
    window.addEventListener("focus", invalidate);
    document.addEventListener("visibilitychange", visible);
    return () => {
      channel?.close();
      updates.current = null;
      window.removeEventListener("popstate", navigate);
      window.removeEventListener("focus", invalidate);
      document.removeEventListener("visibilitychange", visible);
    };
  }, []);
  useEffect(() => {
    void fetch("/api/config")
      .then((r) => r.json())
      .then((result) => {
        setAuthProvider(result.authProvider);
        setAllowSignup(result.allowSignup !== false);
        if (result.allowSignup === false) setMode("login");
        setAuthReady(true);
      })
      .catch(() =>
        setError("Could not load sign-in options. Reload to try again."),
      );
    fetch("/api/state")
      .then(async (r) => {
        if (r.ok) {
          const result = await r.json();
          setState(result);
          setCsrf(result.csrf);
          setAuthProvider(result.authProvider);
          updateTab(sectionFromUrl(new URL(location.href)));
          {
            const month = new URL(location.href).searchParams.get("month");
            if (month && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month))
              setBudgetMonth(month);
          }
          if (
            new URLSearchParams(window.location.search).get("recovery") === "1"
          )
            setTab("Settings");
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
    setReview({ ...r, key: approvalKey(proposal.id) });
  }
  function changeBudgetMonth(month: string) {
    setBudgetMonth(month);
    const url = new URL(location.href);
    url.searchParams.set("month", month);
    history.replaceState(null, "", url);
  }
  function approvalKey(id: string) {
    const name = `ledgerbot-approval:${id}`;
    const key = sessionStorage.getItem(name) || crypto.randomUUID();
    sessionStorage.setItem(name, key);
    return key;
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
            {mode === "signup"
              ? "Start an empty workspace"
              : mode === "recover"
                ? "Recover your account"
                : "Welcome back"}
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
                const result = await api("auth", "POST", {
                  mode,
                  email: str(f, "email"),
                  password: str(f, "password"),
                });
                if (result.pending) setNotice(result.message);
                else {
                  await refresh();
                  setTab("Dashboard");
                }
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
            {mode !== "recover" && (
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
            )}
            <button className="primary" disabled={busy || !authReady}>
              {mode === "signup"
                ? "Create my empty account"
                : mode === "recover"
                  ? "Send recovery email"
                  : "Sign in"}
            </button>
          </form>
          <div className="actions">
            {!allowSignup && mode === "recover" && (
              <button onClick={() => setMode("login")}>Back to sign in</button>
            )}
            {allowSignup && (
              <button
                onClick={() => setMode(mode === "signup" ? "login" : "signup")}
              >
                {mode === "signup"
                  ? "Already registered? Sign in"
                  : "Create a new account"}
              </button>
            )}
            {!allowSignup && authReady && (
              <p>
                Private beta: use your approved test account. Public
                registration is closed.
              </p>
            )}
          </div>
          {authProvider === "supabase" && (
            <div className="actions">
              <button onClick={() => setMode("recover")}>
                Forgot your password?
              </button>
            </div>
          )}
        </div>
        {notice && (
          <p className="notice success" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
        <p>
          <small>
            {authProvider === "supabase"
              ? "Verified email and password recovery are enabled for this configured provider."
              : "Local development authentication: email verification and recovery are unavailable in SQLite mode."}{" "}
            Use fabricated values only. MFA and isolated demo are not
            implemented.
          </small>
        </p>
      </main>
    );
  const pending = state.proposals.filter((p) => p.status === "awaiting_review");
  const accounts = state.accounts;
  const transactions = sortedTransactions;
  const projections = projected!;
  const chartMonth = budgetMonth || today().slice(0, 7);
  const running = runningValues;
  const pairEditing = transferEdit
    ? transactions.filter((t) => t.transferId === transferEdit.transferId)
    : [];
  const pairFrom = pairEditing.find((t) => t.amount < 0),
    pairTo = pairEditing.find((t) => t.amount > 0);

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
            <a
              href={sectionHref(t)}
              key={t}
              aria-current={tab === t ? "page" : undefined}
              onClick={(event) => {
                if (
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                setTab(t);
                setEdit(null);
              }}
            >
              {t}
              {t === "Inbox" && pending.length ? ` (${pending.length})` : ""}
            </a>
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
                  <div className="amount">{money(projections.opening)}</div>
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
            <BudgetCharts
              state={state}
              month={chartMonth}
              today={today()}
              onMonth={changeBudgetMonth}
              onOpen={() => {
                setTab("Budget");
                history.replaceState(
                  null,
                  "",
                  `/?section=budget&month=${chartMonth}`,
                );
              }}
            />
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
            <ReconciliationInvestigator
              key={state.revision}
              state={state}
              today={today()}
            />
            <details>
              <summary>
                Rename or correct existing accounts and categories
              </summary>
              <AccountTools
                state={state}
                today={today()}
                busy={busy}
                submit={submit}
              />
            </details>
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
                      flow:
                        str(f, "flow") === "auto"
                          ? undefined
                          : (str(f, "flow") as "income" | "expense" | "refund"),
                      occurrence: occurrenceInput(f) || null,
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
                <Field label="Entry type">
                  <select name="flow" defaultValue={edit?.flow || "auto"}>
                    <option value="auto">
                      Use amount direction (negative expense, positive income)
                    </option>
                    <option value="expense">Expense / card purchase</option>
                    <option value="income">Income / deposit</option>
                    <option value="refund">Refund of spending</option>
                  </select>
                </Field>
                <SplitFields
                  state={state}
                  edit={edit}
                  busy={busy}
                  onCreateCategory={(name) =>
                    void run(() => prepare({ kind: "category", name }))
                  }
                />
                <OccurrenceFields
                  state={state}
                  current={edit?.occurrence}
                  today={today()}
                />
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
                key={transferEdit?.transferId || "new-transfer"}
                onSubmit={(e) =>
                  submit(e, (f) => {
                    const kind = transferEdit ? "editTransfer" : "transfer";
                    const editingId = transferEdit?.id;
                    setTransferEdit(null);
                    return {
                      kind,
                      ...(editingId ? { id: editingId } : {}),
                      fromId: str(f, "fromId"),
                      toId: str(f, "toId"),
                      amount: parseMoney(str(f, "amount")),
                      date: str(f, "date"),
                      description: str(f, "description"),
                      status: str(f, "status") as "cleared" | "pending",
                      occurrence: occurrenceInput(f, "transferBill") || null,
                    } as Operation;
                  })
                }
              >
                <div className="fields">
                  <AccountSelect
                    accounts={accounts}
                    name="fromId"
                    label="From account"
                    value={pairFrom?.accountId}
                  />
                  <AccountSelect
                    accounts={accounts}
                    name="toId"
                    label="To account (card for payment)"
                    value={pairTo?.accountId}
                  />
                  <Input
                    label="Transfer amount ($, positive)"
                    name="amount"
                    value={pairFrom ? dollars(-pairFrom.amount) : undefined}
                  />
                  <Input
                    label="Transfer description"
                    name="description"
                    value={pairFrom?.description}
                  />
                  <Input
                    label="Transfer date"
                    name="date"
                    type="date"
                    value={pairFrom?.date || today()}
                  />
                  <Field label="Transfer status">
                    <select
                      name="status"
                      defaultValue={pairFrom?.status || "cleared"}
                    >
                      <option value="cleared">Cleared</option>
                      <option value="pending">Pending</option>
                    </select>
                  </Field>
                </div>
                <OccurrenceFields
                  state={state}
                  prefix="transferBill"
                  current={pairFrom?.occurrence}
                  today={today()}
                />
                <div className="actions">
                  {transferEdit && (
                    <button type="button" onClick={() => setTransferEdit(null)}>
                      Cancel pair edit
                    </button>
                  )}
                  <button disabled={busy || accounts.length < 2}>
                    {transferEdit
                      ? "Prepare paired transfer changes"
                      : "Prepare paired transfer"}
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
                        "Cleared running balance",
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
                              {money(running.get(t.id) ?? null)}
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
            <BudgetExplorer
              state={state}
              month={chartMonth}
              today={today()}
              onMonth={changeBudgetMonth}
            />
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
                Targets are intentions. Category rows compare approved, cleared
                allocations. The overall chart also includes uncategorized
                spending. These planning controls show your full plan; filters
                above apply to the chart and matching entries.
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
                  <CategorySelect
                    categories={state.categories}
                    name="categoryId"
                    label="Budget category"
                    required
                    busy={busy}
                    onCreate={(name) =>
                      void run(() => prepare({ kind: "category", name }))
                    }
                  />
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
            <RecentBills state={state} today={today()} />
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
              <ForecastChart
                days={projections.days}
                opening={projections.opening}
              />
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
            <PlanningPanel
              state={state}
              today={today()}
              busy={busy}
              submit={submit}
              prepare={(op) => void run(() => prepare(op))}
            />
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
                  <article key={p.id} id={`proposal-${p.id}`} className="card">
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
                              setReview({ ...r, key: approvalKey(p.id) });
                            })
                          }
                        >
                          Review exact changes
                        </button>
                        <a
                          href={
                            sectionHref("Inbox", p.id) + `#proposal-${p.id}`
                          }
                        >
                          Link to this draft
                        </a>
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
                    {p.status === "approved" &&
                      p.operation.kind === "deleteTransaction" && (
                        <button
                          disabled={busy}
                          onClick={() =>
                            void run(() =>
                              prepare({
                                kind: "restoreTransaction",
                                sourceProposalId: p.id,
                              }),
                            )
                          }
                        >
                          Review undo deletion
                        </button>
                      )}
                    {p.status === "approved" && (
                      <button
                        onClick={() =>
                          void run(async () => {
                            const receipt = await api(
                              `receipts?proposalId=${p.id}`,
                            );
                            setNotice(
                              `Saved receipt ${receipt.id}. Confirmed ${new Date(receipt.committedAt).toLocaleString()}.`,
                            );
                          })
                        }
                      >
                        Check saved receipt
                      </button>
                    )}
                  </p>
                ))}
            </section>
          </>
        )}
        {tab === "Settings" && (
          <>
            <SessionPanel
              busy={busy}
              load={() => api("sessions")}
              revoke={(input) => api("sessions", "DELETE", input)}
            />
            <ExportPanel
              busy={busy}
              download={(format, includeDrafts) =>
                void run(async () => {
                  const result = await api("export", "POST", {
                    format,
                    includeDrafts,
                  });
                  const url = URL.createObjectURL(
                    new Blob([result.data], { type: result.type }),
                  );
                  const anchor = document.createElement("a");
                  anchor.href = url;
                  anchor.download = result.filename;
                  document.body.appendChild(anchor);
                  anchor.click();
                  anchor.remove();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                  setNotice(
                    "Private export downloaded. No financial records were changed.",
                  );
                })
              }
            />
            {authProvider === "supabase" && (
              <section className="card">
                <h2>Account security</h2>
                <p>
                  A password change requires a fresh sign-in or recovery link
                  from the last five minutes. It revokes all LedgerBot app
                  sessions.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const f = new FormData(e.currentTarget);
                    void run(async () => {
                      const result = await api("auth", "POST", {
                        mode: "password",
                        password: str(f, "newPassword"),
                      });
                      setState(null);
                      setCsrf("");
                      setReview(null);
                      setMode("login");
                      setNotice(result.message);
                    });
                  }}
                >
                  <Field label="New password (at least 12 characters)">
                    <input
                      type="password"
                      name="newPassword"
                      minLength={12}
                      maxLength={128}
                      autoComplete="new-password"
                      required
                    />
                  </Field>
                  <div className="actions">
                    <button disabled={busy}>
                      Change password and revoke sessions
                    </button>
                  </div>
                </form>
              </section>
            )}
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
                      timezone: str(f, "timezone"),
                      promotions: f.get("promotions") === "on",
                    });
                    await refresh();
                    setNotice("Preferences saved.");
                  });
                }}
              >
                <div className="fields">
                  <Input
                    label="Timezone (IANA name)"
                    name="timezone"
                    value={state.settings.timezone || "Etc/UTC"}
                  />
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
            <SetupReminders
              state={state}
              busy={busy}
              navigate={setTab}
              save={(reminders) =>
                void run(async () => {
                  await api("state", "PATCH", { ...state.settings, reminders });
                  await refresh();
                  setNotice("Reminder preference saved.");
                })
              }
            />
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
