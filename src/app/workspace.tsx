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
  affectsBalance,
  budgetPending,
  civilToday,
  budgetActual,
  forecast,
  liability,
  money,
  parseMoney,
  sumMoney,
  type FinanceState,
  type Operation,
  type Proposal,
  type Transaction,
} from "@/lib/domain";

import { RecentBills, ForecastChart } from "./finance-views";
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
import { BudgetTargetForm } from "./budget-target-form";
import { DashboardForecast } from "./dashboard-forecast";
import { ForecasterSettings } from "./forecaster-settings";
import { usePageDraft } from "./page-draft";
import { AccountTabs, AccountLayoutSettings } from "./account-tabs";
import {
  orderedAccounts,
  defaultWorkspacePreferences,
  type WorkspacePreferences,
} from "@/lib/workspace-preferences";
import { LabelEntry } from "./label-entry";
import { repeatedPrefix } from "@/lib/label-suggestions";
import { FormFeedback } from "./form-feedback";
import { entryAmount } from "@/lib/transaction-entry";
import { TimeZoneField } from "./time-zone-field";
import { SessionPanel } from "./session-panel";
import {
  Troubleshooting,
  supportFetch,
  type SupportEvent,
  type SupportRoute,
} from "@/lib/troubleshooting";
import { TroubleshootingPanel } from "./troubleshooting-panel";
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
  const [selectedTransaction, setSelectedTransaction] = useState("");
  const [accountsPane, setAccountsPane] = useState("");
  const [budgetPane, setBudgetPane] = useState("");
  const [ledgerSize, setLedgerSize] = useState<"compact" | "expanded" | "full">(
    "compact",
  );
  const [transactionAccount, setTransactionAccount] = useState("");

  const [accountFilter, setAccountFilter] = useState("__default"),
    [statusFilter, setStatusFilter] = useState(""),
    [query, setQuery] = useState(""),
    [monthFilter, setMonthFilter] = useState("");
  const [horizon, setHorizon] = useState(30);
  const [authProvider, setAuthProvider] = useState("local-development");
  const [allowSignup, setAllowSignup] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [budgetMonth, setBudgetMonth] = useState("");
  const [clockNow, setClockNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setClockNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);
  const [transferEdit, setTransferEdit] = useState<Transaction | null>(null);
  function selectLedgerAccount(id: string) {
    if (pageDraft.dirty) {
      setNotice(
        "Prepare, save for later or discard your unfinished entry before switching accounts.",
      );
      return;
    }
    setAccountFilter(id);
    setTransactionAccount(id);
  }
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
  const projected = state ? forecast(state, currentDay, horizon) : null;
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
  function openLedgerForm(kind: "transaction" | "transfer") {
    requestAnimationFrame(() => {
      const panel = document.getElementById(
        `ledger-${kind}-editor`,
      ) as HTMLDetailsElement | null;
      if (!panel) return;
      panel.open = true;
      panel.scrollIntoView({ block: "start" });
      panel
        .querySelector<HTMLInputElement | HTMLSelectElement>("input, select")
        ?.focus();
    });
  }
  function editLedgerRow(transaction: Transaction) {
    if (pageDraft.dirty) {
      setNotice(
        "Finish preparing your current entry, or save it for later, before editing another transaction.",
      );
      return;
    }
    if (transaction.transferId) {
      setTransferEdit(transaction);
      openLedgerForm("transfer");
    } else {
      setEdit(transaction);
      openLedgerForm("transaction");
    }
  }
  function navigateNow(next: Tab | "SignOut") {
    if (next === "SignOut") {
      void api("auth", "DELETE", {})
        .then(() => {
          setState(null);
          setCsrf("");
        })
        .catch((error) =>
          setError(
            error instanceof Error ? error.message : "Could not sign out",
          ),
        );
      return;
    }
    setEdit(null);
    setTransferEdit(null);
    if (next === "Budget") setBudgetPane("");
    updateTab(next);
    history.pushState(null, "", sectionHref(next));
  }
  function setTab(next: Tab) {
    if (review) {
      setNotice("Finish or cancel the current review before changing pages.");
      return;
    }
    pageDraft.navigate(next);
  }
  const routeGuard = useRef<((next: Tab) => boolean) | null>(null);
  const pageDraft = usePageDraft({
    tab,
    identity: csrf,
    busy,
    state,
    api,
    run,
    navigateNow,
    onReview: (r) => setReview({ ...r, key: approvalKey(r.proposal.id) }),
    refresh,
    onCancelEdit: () => {
      setEdit(null);
      setTransferEdit(null);
    },
    onRestore: (snapshot) => {
      if (snapshot.section === "Budget")
        setBudgetPane(
          snapshot.formKey === "Prepare category" ? "categories" : "create",
        );
      if (snapshot.section === "Accounts") setAccountsPane("__new");
      if (snapshot.editingId) {
        const t =
          state?.transactions.find((t) => t.id === snapshot.editingId) || null;
        if (snapshot.editingKind === "transfer") setTransferEdit(t);
        else setEdit(t);
      }
    },
  });
  const pendingPageChanges = pageDraft.hasChanges,
    requestPageNavigation = pageDraft.navigate;
  useEffect(() => {
    routeGuard.current = (next) => {
      if (pendingPageChanges) {
        history.replaceState(null, "", sectionHref(tab));
        requestPageNavigation(next);
        return true;
      }
      return false;
    };
  }, [pendingPageChanges, requestPageNavigation, tab]);
  const guard = useRef(false);
  const reviewedForm = useRef<HTMLFormElement | null>(null);
  const submittedForm = useRef<HTMLFormElement | null>(null);
  const [failedForm, setFailedForm] = useState<HTMLFormElement | null>(null);
  const troubleshooting = useMemo(
    () => ({ scope: csrf, log: new Troubleshooting() }),
    [csrf],
  ).log;
  async function api(path: string, method = "GET", payload?: unknown) {
    const meta = {
      route: path as SupportRoute,
      method: method as SupportEvent["method"],
    };
    const response = await supportFetch(troubleshooting, path, method, {
      method,
      headers:
        method === "GET"
          ? {}
          : { "Content-Type": "application/json", "x-csrf-token": csrf },
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });
    let result;
    try {
      result = await response.json();
    } catch {
      troubleshooting.record({ event: "unreadable-response", ...meta });
      throw new Error(
        "We could not read the server’s reply. A save may have completed. Check your records or saved receipt before trying again.",
      );
    }
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
    if (method !== "GET" && path !== "review" && path !== "draft-validation")
      updates.current?.postMessage("invalidate");
    return result;
  }
  async function refresh() {
    const sequence = ++requestSequence.current;
    const result = await api("state");
    if (sequence !== requestSequence.current) return;
    setState(result);
    setCsrf(result.csrf);
    return result as FinanceState;
  }
  useEffect(() => {
    const navigate = () => {
      const next = sectionFromUrl(new URL(location.href));
      if (routeGuard.current?.(next)) return;
      updateTab(next);
      {
        const month = new URL(location.href).searchParams.get("month");
        if (month && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month)) {
          setBudgetMonth(month);
          setBudgetPane("plan");
        }
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
            if (month && /^(20\d{2}|2100)-(0[1-9]|1[0-2])$/.test(month)) {
              setBudgetMonth(month);
              setBudgetPane("plan");
            }
          }
          if (
            new URLSearchParams(window.location.search).get("recovery") === "1"
          ) {
            const recoveryUrl = new URL(location.href);
            recoveryUrl.searchParams.set("section", "settings");
            history.replaceState(null, "", recoveryUrl);
            updateTab("Settings");
          }
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
    setFailedForm(null);
    setNotice("");
    try {
      await action();
    } catch (e) {
      setFailedForm(
        submittedForm.current?.isConnected ? submittedForm.current : null,
      );
      setError(e instanceof Error ? e.message : "Unable to complete request");
    } finally {
      setBusy(false);
      guard.current = false;
      submittedForm.current = null;
    }
  }
  async function prepare(operation: Operation) {
    await pageDraft.add(operation);
  }
  function changeBudgetMonth(month: string) {
    setBudgetMonth(month);
    setBudgetPane("plan");
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
    onPrepared?: () => void,
  ) {
    event.preventDefault();
    const form = event.currentTarget;
    submittedForm.current = form;
    void run(async () => {
      const fields = new FormData(form);
      if (
        Array.from(fields.keys()).some((key) =>
          key.startsWith("newCategoryMode:"),
        )
      )
        throw new Error(
          "Finish adding the new category, or choose Keep working without adding, before preparing this entry.",
        );
      await pageDraft.add(build(fields), form);
      onPrepared?.();
      if (form.dataset.draftForm === "transaction") setEdit(null);
      if (form.dataset.draftForm === "transfer") setTransferEdit(null);
      setNotice(
        "Added to page review. Your balances have not changed. Review and confirm when you are ready.",
      );
      requestAnimationFrame(() => {
        const panel = document.querySelector<HTMLElement>(".page-draft");
        panel?.focus();
        panel?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
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
  const savedActive = state.proposals.filter(
    (p) => p.status === "saved_for_later" && p.expiresAt > clockNow,
  );
  const dueSaved =
    state.settings.reminders?.reviews?.status === "dismissed"
      ? []
      : savedActive.filter(
          (p) => p.savedReview && p.savedReview.remindAt <= clockNow,
        );
  const workspace = state.settings.workspace || defaultWorkspacePreferences();
  const accounts = orderedAccounts(state.accounts, workspace);
  const defaultAccount = workspace.defaultAccountId || accounts[0]?.id || "";
  const accountSelection =
    accountsPane === "__new"
      ? "__new"
      : accounts.some((a) => a.id === accountsPane)
        ? accountsPane
        : accounts.length
          ? defaultAccount
          : "__new";
  const ledgerSelection =
    accountFilter === "__default" ? defaultAccount : accountFilter;
  const hasCurrentBudget = state.budgets.some(
    (b) => b.month === (budgetMonth || currentDay.slice(0, 7)),
  );
  const budgetSelection = budgetPane || (hasCurrentBudget ? "plan" : "create");
  const selectedEntryAccount = accounts.find(
    (a) =>
      a.id ===
      (edit?.accountId ||
        transactionAccount ||
        ledgerSelection ||
        defaultAccount),
  );
  function saveWorkspace(preferences: WorkspacePreferences) {
    void run(async () => {
      await api("state", "PATCH", {
        ...state!.settings,
        workspace: preferences,
      });
      await refresh();
      setNotice("Account layout saved.");
    });
  }

  const entryState = {
    ...state,
    categories: [
      ...state.categories,
      ...pageDraft.items.flatMap((item) =>
        item.operation.kind === "category" && item.operation.id
          ? [{ id: item.operation.id, name: item.operation.name }]
          : item.operation.kind === "budget" && item.operation.newCategory
            ? [
                {
                  id: item.operation.categoryId,
                  name: item.operation.newCategory.name,
                },
              ]
            : [],
      ),
    ],
  };
  const transactions = sortedTransactions;
  const visibleTransactions = transactions.filter(
    (t) =>
      (!ledgerSelection || t.accountId === ledgerSelection) &&
      (!statusFilter || t.status === statusFilter) &&
      t.description.toLowerCase().includes(query.toLowerCase()) &&
      (!monthFilter || t.date.startsWith(monthFilter)),
  );
  const selectedLedgerRow = visibleTransactions.find(
    (t) => t.id === selectedTransaction,
  );
  const projections = projected!;
  const chartMonth = budgetMonth || today().slice(0, 7);
  const running = runningValues;
  const pairEditing = transferEdit
    ? transactions.filter((t) => t.transferId === transferEdit.transferId)
    : [];
  const pairFrom = pairEditing.find((t) => t.amount < 0),
    pairTo = pairEditing.find((t) => t.amount > 0);

  return (
    <div
      className="shell"
      onClickCapture={(event) => {
        const target = event.target as HTMLElement;
        const button = target.closest("button"),
          link = target.closest("a");
        if (button)
          troubleshooting.record({
            event: "button",
            action: (button.getAttribute("data-support-action") ||
              "button") as SupportEvent["action"],
          });
        else if (link && link.origin === location.origin)
          troubleshooting.record({
            event: "navigation",
            page: sectionFromUrl(new URL(link.href)),
          });
      }}
    >
      <a className="skip" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar">
        <div className="brand">
          ▣ Ledger<span>Bot</span>
        </div>
        <nav aria-label="Main navigation">
          {tabs
            .filter((t) => t !== "Forecaster")
            .map((t) => (
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
                }}
              >
                {t}
                {t === "Inbox" && pending.length + savedActive.length
                  ? ` (${pending.length + savedActive.length})`
                  : ""}
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
          <button onClick={() => pageDraft.navigate("SignOut")}>
            Sign out
          </button>
        </footer>
      </aside>
      <main
        id="main-content"
        onInputCapture={pageDraft.mark}
        onBlurCapture={(event) => {
          const field = event.target;
          if (
            field instanceof HTMLInputElement ||
            field instanceof HTMLSelectElement ||
            field instanceof HTMLTextAreaElement
          )
            troubleshooting.record({
              event: "field-edited",
              field: (field.name || "other") as SupportEvent["field"],
            });
        }}
        onChangeCapture={pageDraft.mark}
        onInvalidCapture={(event) => {
          const input = event.target as HTMLInputElement;
          troubleshooting.record({
            event: "form-invalid",
            field: input.name as SupportEvent["field"],
          });
          if (input.form) {
            setFailedForm(input.form);
            setError(
              `${input.labels?.[0]?.textContent || "Field"}: ${input.validationMessage}`,
            );
          }
        }}
      >
        <div className="topline">
          <div>
            <p className="eyebrow">Ledger · Plan · Possibility</p>
            <small>
              Signed in as {state.identity?.email || "your account"}
            </small>
            <h1>{tab === "Dashboard" ? "Forecast" : tab}</h1>
          </div>
          <div className="actions">
            <TroubleshootingPanel key={csrf} recorder={troubleshooting} />
            <span className="pill">Manual · no live integrations</span>
            <button
              className="primary"
              onClick={() => {
                setTab("Ledger");
                if (tab === "Ledger" || !pageDraft.hasChanges)
                  openLedgerForm("transaction");
              }}
            >
              + Add transaction
            </button>
            <button onClick={() => pageDraft.navigate("SignOut")}>
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
        {!!dueSaved.length && (
          <p className="notice" role="status">
            You have {dueSaved.length} saved review
            {dueSaved.length === 1 ? "" : "s"} approaching its deadline.{" "}
            <button onClick={() => setTab("Inbox")}>Open saved reviews</button>
          </p>
        )}
        <div
          className={
            pageDraft.hasChanges
              ? "workspace-columns"
              : "workspace-columns no-pending"
          }
        >
          <div className="workspace-primary">
            {review && (
              <Review
                key={review.proposal.id}
                data={review}
                state={state}
                busy={busy}
                error={error}
                onClose={() =>
                  void run(async () => {
                    await pageDraft.cancelReview();
                    reviewedForm.current = null;
                    setReview(null);
                    setNotice("Review closed. Nothing applied.");
                  })
                }
                onConfirm={() =>
                  void run(async () => {
                    const receipt = await api("confirm", "POST", {
                      proposalId: review.proposal.id,
                      version: review.proposal.version,
                      digest: review.proposal.digest,
                      token: review.token,
                      idempotencyKey: review.key,
                    });
                    reviewedForm.current?.reset();
                    reviewedForm.current = null;
                    setEdit(null);
                    const destination = pageDraft.committed();
                    setReview(null);
                    setNotice(`Change saved. Receipt ${receipt.id}.`);
                    try {
                      const fresh = await refresh();
                      const ops =
                        review.proposal.operation.kind === "batch"
                          ? review.proposal.operation.operations
                          : [review.proposal.operation];
                      const added = ops.find((op) => op.kind === "account");
                      if (added?.kind === "account")
                        setAccountsPane(
                          fresh?.accounts.find((a) => a.name === added.name)
                            ?.id || "",
                        );
                      const savedBudget = ops.find(
                        (op) => op.kind === "budget",
                      );
                      if (savedBudget?.kind === "budget") {
                        setBudgetMonth(savedBudget.month);
                        setBudgetPane("plan");
                      }
                    } finally {
                      if (destination) navigateNow(destination);
                    }
                  })
                }
              />
            )}
            <div inert={!!review}>
              {pageDraft.dialog}
              <FormFeedback form={failedForm} message={error} />
              {error && !failedForm?.isConnected && (
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
                        No saved accounts are visible for this login and data
                        source. If you previously added accounts, check Settings
                        → Your saved data before creating replacements.
                      </p>
                      <p>
                        Add your own account when you’re ready. Unknown balances
                        stay unknown.
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
                          Voice onboarding and isolated demo are not available
                          in this milestone.
                        </small>
                      </p>
                    </div>
                  ) : null}
                  <DashboardForecast
                    state={state}
                    today={today()}
                    month={chartMonth}
                    onMonth={changeBudgetMonth}
                    onOpen={(next) => {
                      setTab(next);
                      if (next === "Ledger" && !pageDraft.hasChanges)
                        openLedgerForm("transaction");
                    }}
                    onSettings={() => setTab("Settings")}
                    onBudget={() => {
                      setTab("Budget");
                      setBudgetPane("plan");
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
                      Deterministic setup guidance · live Pip chat, voice, bank
                      sync, receipt OCR, and billing disabled.
                    </small>
                  </section>
                </>
              )}
              {tab === "Accounts" && (
                <>
                  <AccountTabs
                    scope="accounts"
                    accounts={accounts}
                    preferences={workspace}
                    selected={accountSelection}
                    onSelect={setAccountsPane}
                    onCreate={() => setAccountsPane("__new")}
                    busy={busy}
                    save={saveWorkspace}
                  />
                  <div
                    role="tabpanel"
                    id="accounts-account-panel"
                    aria-labelledby={`accounts-tab-${accountSelection}`}
                  >
                    <div className="grid" hidden={accountSelection === "__new"}>
                      {accounts
                        .filter((a) => a.id === accountSelection)
                        .map((a) => (
                          <div key={a.id} className="card">
                            <span className="pill">{a.type} · USD</span>
                            <h2>{a.name}</h2>
                            <div className="amount">
                              {money(balance(a, transactions))}
                            </div>
                            <p>
                              <small>
                                {liability(a)
                                  ? "Amount owed"
                                  : "Cleared balance"}{" "}
                                · opening snapshot {a.asOf}
                                <br />
                                Opening: {money(a.opening)} ·{" "}
                                {a.openingBasis === "start-of-day"
                                  ? "before this day’s entries"
                                  : "end-of-day snapshot"}
                              </small>
                            </p>
                          </div>
                        ))}
                    </div>
                    <div hidden={accountSelection !== "__new"}>
                      <section className="card">
                        <h2>Add a manual account</h2>
                        <p>
                          Enter your balance before the transactions you will
                          record. Starting balance includes same-day entries as
                          you add them. Choose a statement closing snapshot only
                          when that day’s purchases are already included. Leave
                          the amount blank if unknown.
                        </p>
                        <form
                          data-financial="true"
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
                              openingBasis: str(f, "openingBasis") as
                                "start-of-day" | "end-of-day",
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
                            <Field label="Opening balance timing">
                              <select
                                name="openingBasis"
                                defaultValue="start-of-day"
                              >
                                <option value="start-of-day">
                                  Starting balance — before this day’s entries
                                </option>
                                <option value="end-of-day">
                                  Statement closing balance — includes this day
                                </option>
                              </select>
                            </Field>
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
                    </div>
                    <details className="card account-tools">
                      <summary>Account tools and reconciliation</summary>
                      <section>
                        <h2>Reconcile an account</h2>
                        <p>
                          Compare a statement against cleared actuals through
                          its ending date. A mismatch blocks reconciliation;
                          nothing is silently adjusted. This compares a
                          statement; it does not change the opening balance. To
                          correct that date, use “Rename or correct existing
                          accounts and categories” below.
                        </p>
                        <form
                          data-financial="true"
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
                            <AccountSelect
                              accounts={accounts}
                              name="accountId"
                            />
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
                      <details open>
                        <summary>
                          Edit starting balance, date, account or category name
                        </summary>
                        <AccountTools
                          state={state}
                          today={today()}
                          busy={busy}
                          submit={submit}
                        />
                      </details>
                    </details>
                  </div>
                </>
              )}
              {tab === "Ledger" && (
                <>
                  <AccountTabs
                    scope="ledger"
                    accounts={accounts}
                    preferences={workspace}
                    selected={accounts.length ? ledgerSelection : "__new"}
                    onSelect={selectLedgerAccount}
                    onCreate={() => {
                      setTab("Accounts");
                      setAccountsPane("__new");
                    }}
                    allowAll
                    busy={busy}
                    save={saveWorkspace}
                  />
                  <div
                    role="tabpanel"
                    id="ledger-account-panel"
                    aria-labelledby={`ledger-tab-${accounts.length ? ledgerSelection || "all" : "__new"}`}
                  >
                    {!accounts.length && (
                      <p className="notice">
                        Add a manual account first in Accounts. No transactions
                        exist yet.
                      </p>
                    )}
                    <nav
                      className="actions ledger-actions"
                      aria-label="Ledger actions"
                    >
                      <button
                        type="button"
                        onClick={() => openLedgerForm("transaction")}
                        disabled={!accounts.length}
                      >
                        Add entry
                      </button>
                      <button
                        type="button"
                        disabled={
                          !selectedLedgerRow ||
                          !!selectedLedgerRow.reconciledAt ||
                          busy
                        }
                        onClick={() =>
                          selectedLedgerRow && editLedgerRow(selectedLedgerRow)
                        }
                      >
                        Edit selected
                      </button>
                      <button
                        type="button"
                        onClick={() => openLedgerForm("transfer")}
                        disabled={accounts.length < 2}
                      >
                        Transfer / card payment
                      </button>
                    </nav>
                    <section
                      className="ledger-account-strip"
                      aria-label="Account balances"
                    >
                      {accounts
                        .filter(
                          (a) => !ledgerSelection || a.id === ledgerSelection,
                        )
                        .map((a) => (
                          <article className="card" key={a.id}>
                            <h2>{a.name}</h2>
                            <strong>
                              {money(balance(a, transactions))}
                              {liability(a) ? " owed" : ""}
                            </strong>
                            <p>
                              Cleared balance ·{" "}
                              {
                                transactions.filter(
                                  (t) =>
                                    t.accountId === a.id &&
                                    t.status === "pending",
                                ).length
                              }{" "}
                              pending
                            </p>
                            <small>
                              Starting balance: {money(a.opening)} on {a.asOf} (
                              {a.openingBasis === "start-of-day"
                                ? "before that day’s entries"
                                : "after that day’s entries"}
                              )
                            </small>
                          </article>
                        ))}
                    </section>
                    <section
                      className={`card ledger-register ${ledgerSize}`}
                      id="ledger-register"
                    >
                      <div className="ledger-register-heading">
                        <h2>Transactions</h2>
                        <div className="actions">
                          <button
                            onClick={() =>
                              setLedgerSize(
                                ledgerSize === "compact"
                                  ? "expanded"
                                  : "compact",
                              )
                            }
                          >
                            {ledgerSize === "compact"
                              ? "Expand ledger"
                              : "Reduce ledger"}
                          </button>
                          <button
                            onClick={() =>
                              setLedgerSize(
                                ledgerSize === "full" ? "expanded" : "full",
                              )
                            }
                          >
                            {ledgerSize === "full"
                              ? "Exit full view"
                              : "Full ledger view"}
                          </button>
                        </div>
                        <strong>
                          {ledgerSelection
                            ? `${accounts.find((a) => a.id === ledgerSelection)?.name}: ${money(
                                balance(
                                  accounts.find(
                                    (a) => a.id === ledgerSelection,
                                  )!,
                                  transactions,
                                ),
                              )}${liability(accounts.find((a) => a.id === ledgerSelection)!) ? " owed" : ""}`
                            : "All account transactions"}
                        </strong>
                      </div>
                      <p>
                        Select a row to edit it, or use its Edit button. Only
                        confirmed changes appear here.
                      </p>
                      <div className="fields">
                        <Field label="Filter account">
                          <select
                            value={ledgerSelection}
                            onChange={(e) =>
                              selectLedgerAccount(e.target.value)
                            }
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
                            <option value="pending">Pending / planned</option>
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
                      <div
                        className="table-wrap ledger-scroll"
                        tabIndex={0}
                        role="region"
                        aria-label="Scrollable transactions"
                      >
                        <table role="table">
                          <caption className="visually-hidden">
                            Transactions and per-account cleared running
                            balances
                          </caption>
                          <thead>
                            <tr role="row">
                              {[
                                "Select",
                                "Date",
                                "Account / description",
                                "Categories / splits",
                                "Amount",
                                "Status",
                                "Cleared running balance",
                                "Actions",
                              ].map((v) => (
                                <th role="columnheader" key={v} scope="col">
                                  {v}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {visibleTransactions.map((t) => {
                              const a = accounts.find(
                                (a) => a.id === t.accountId,
                              )!;
                              return (
                                <tr role="row" key={t.id}>
                                  <td role="cell" data-label="Select">
                                    <input
                                      type="radio"
                                      name="selectedTransaction"
                                      aria-label={`Select transaction ${t.date} ${t.description}`}
                                      checked={selectedTransaction === t.id}
                                      onChange={() =>
                                        setSelectedTransaction(t.id)
                                      }
                                    />
                                  </td>
                                  <td role="cell" data-label="Date">
                                    {t.date}
                                  </td>
                                  <td
                                    role="cell"
                                    data-label="Account / description"
                                  >
                                    {a.name}
                                    <br />
                                    {t.description}
                                    {t.transferId && (
                                      <>
                                        <br />
                                        <span className="pill">
                                          {t.amount < 0 ? "To " : "From "}
                                          {accounts.find(
                                            (other) =>
                                              other.id ===
                                              transactions.find(
                                                (pair) =>
                                                  pair.transferId ===
                                                    t.transferId &&
                                                  pair.id !== t.id,
                                              )?.accountId,
                                          )?.name || "linked account"}{" "}
                                          · transfer, no spending
                                        </span>
                                      </>
                                    )}
                                  </td>
                                  <td
                                    role="cell"
                                    data-label="Categories / splits"
                                  >
                                    {t.splits.length
                                      ? t.splits.map((split) => (
                                          <div key={split.categoryId}>
                                            {state.categories.find(
                                              (c) => c.id === split.categoryId,
                                            )?.name || "Uncategorized"}
                                            : {money(split.amount)}
                                          </div>
                                        ))
                                      : t.transferId
                                        ? "Transfer"
                                        : "Uncategorized"}
                                  </td>
                                  <td
                                    role="cell"
                                    data-label="Amount"
                                    className={
                                      t.amount < 0 ? "negative" : "positive"
                                    }
                                  >
                                    {money(t.amount)}
                                  </td>
                                  <td role="cell" data-label="Status">
                                    {t.status === "pending"
                                      ? "Pending / planned"
                                      : "Cleared"}
                                    {t.reconciledAt && " · reconciled"}
                                    {!affectsBalance(a, t) && (
                                      <small>
                                        {" "}
                                        · Already included in starting balance
                                      </small>
                                    )}
                                  </td>
                                  <td
                                    role="cell"
                                    data-label="Cleared running balance"
                                  >
                                    {money(running.get(t.id) ?? null)}
                                    {liability(a) && " owed"}
                                  </td>
                                  <td role="cell" data-label="Actions">
                                    <div className="actions">
                                      {!t.reconciledAt && (
                                        <button
                                          onClick={() => editLedgerRow(t)}
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
                                          Review delete
                                          {t.transferId ? " pair" : ""}
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
                      {!visibleTransactions.length &&
                        transactions.length > 0 && (
                          <p>No transactions match these filters.</p>
                        )}
                      <button
                        type="button"
                        onClick={() => {
                          setAccountFilter("");
                          setStatusFilter("");
                          setQuery("");
                          setMonthFilter("");
                        }}
                      >
                        Clear ledger filters
                      </button>
                      <small>
                        Running balances include earlier cleared entries in each
                        account, including rows hidden by filters. Pending
                        entries do not alter cleared balances.
                      </small>
                    </section>
                    <details
                      className="card ledger-editor"
                      id="ledger-transaction-editor"
                    >
                      <summary>Add or edit a transaction</summary>
                      <section>
                        <h2>
                          {edit ? "Edit transaction" : "Add deposit or expense"}
                        </h2>
                        <p>
                          Choose Expense, Income or Refund and enter the amount
                          normally. The entry type sets its direction, including
                          split amounts. Card payments belong in Transfer. Blank
                          splits remain uncategorized.
                        </p>
                        <p>
                          Today is {currentDay} in {state.settings.timezone}.
                          Future entries stay Pending / planned. Mark an entry
                          Cleared when it has actually completed.
                        </p>
                        <form
                          data-financial="true"
                          data-draft-form="transaction"
                          key={edit?.id || `new-${ledgerSelection}`}
                          data-editing-id={edit?.id}
                          data-editing-kind="transaction"
                          onSubmit={(e) =>
                            submit(e, (f) => {
                              const flow = str(f, "flow");
                              const amount = entryAmount(
                                str(f, "amount"),
                                flow,
                              );
                              const splits = Array.from(f.keys())
                                .filter(
                                  (key) =>
                                    key.startsWith("category-") && str(f, key),
                                )
                                .map((key) => ({
                                  categoryId: str(f, key),
                                  amount: entryAmount(
                                    str(f, `splitAmount-${key.split("-")[1]}`),
                                    flow,
                                  ),
                                }));
                              return {
                                kind: edit ? "editTransaction" : "transaction",
                                ...(edit ? { id: edit.id } : {}),
                                accountId: str(f, "accountId"),
                                date: str(f, "date"),
                                description: str(f, "description"),
                                amount,
                                balanceImpact: f.has("includedInOpening")
                                  ? "included"
                                  : "additional",
                                status: str(f, "status") as
                                  "pending" | "cleared",
                                splits,
                                flow:
                                  str(f, "flow") === "auto"
                                    ? undefined
                                    : (str(f, "flow") as
                                        "income" | "expense" | "refund"),
                                occurrence: occurrenceInput(f) || null,
                              } as Operation;
                            })
                          }
                        >
                          <div className="fields">
                            <AccountSelect
                              accounts={accounts}
                              name="accountId"
                              value={
                                edit?.accountId ||
                                ledgerSelection ||
                                defaultAccount
                              }
                              onChange={setTransactionAccount}
                            />
                            <Input
                              label="Date"
                              name="date"
                              type="date"
                              value={edit?.date || today()}
                            />
                            <LabelEntry
                              label="Description"
                              name="description"
                              value={edit?.description}
                              existing={state.transactions.map(
                                (t) => t.description,
                              )}
                            />
                            <Input
                              label="Amount ($)"
                              name="amount"
                              value={edit ? dollars(edit.amount) : undefined}
                            />
                            <Field label="Status">
                              <select
                                name="status"
                                defaultValue={edit?.status || "cleared"}
                              >
                                <option value="cleared">Cleared</option>
                                <option value="pending">
                                  Pending / planned
                                </option>
                              </select>
                            </Field>
                          </div>
                          <Field label="Entry type">
                            <select
                              name="flow"
                              defaultValue={
                                edit ? edit.flow || "auto" : "expense"
                              }
                            >
                              <option value="auto">
                                Use amount direction (negative expense, positive
                                income)
                              </option>
                              <option value="expense">
                                Expense / card purchase
                              </option>
                              <option value="income">
                                {selectedEntryAccount &&
                                liability(selectedEntryAccount)
                                  ? "Payment / credit from outside your tracked accounts"
                                  : "Income / deposit"}
                              </option>
                              <option value="refund">Refund of spending</option>
                            </select>
                          </Field>
                          <label className="checkbox">
                            <input
                              type="checkbox"
                              name="includedInOpening"
                              defaultChecked={
                                edit
                                  ? !affectsBalance(
                                      accounts.find(
                                        (a) => a.id === edit.accountId,
                                      )!,
                                      edit,
                                    )
                                  : false
                              }
                            />
                            Already included in my starting balance
                          </label>
                          <p>
                            <small>
                              Leave this off for a new purchase or deposit. Turn
                              it on for history your starting balance already
                              includes. It still counts in your budget without
                              changing the balance twice. Pending entries appear
                              in planning and change the cleared balance only
                              when marked Cleared.
                            </small>
                          </p>
                          <SplitFields
                            state={entryState}
                            edit={edit}
                            busy={busy}
                            onCreateCategory={(name, form) => {
                              submittedForm.current = form || null;
                              void run(() =>
                                prepare({ kind: "category", name }),
                              );
                            }}
                          />
                          <OccurrenceFields
                            state={state}
                            current={edit?.occurrence}
                            today={today()}
                          />
                          <div className="actions">
                            <button
                              data-support-action="prepare-transaction"
                              disabled={busy || !accounts.length}
                              className="primary"
                            >
                              Prepare transaction for review
                            </button>
                            {edit && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={(event) => {
                                  if (pageDraft.editingChange)
                                    pageDraft.cancelEditingChange();
                                  else {
                                    pageDraft.cancelForm(
                                      event.currentTarget.form,
                                    );
                                    setEdit(null);
                                  }
                                }}
                              >
                                Cancel edit
                              </button>
                            )}
                          </div>
                        </form>
                      </section>
                    </details>
                    <details
                      className="card ledger-editor"
                      id="ledger-transfer-editor"
                    >
                      <summary>Transfer or pay a credit card</summary>
                      <section>
                        <h2>Transfer / card payment</h2>
                        <p>
                          A paired internal transfer moves value between your
                          accounts. It creates no new income or spending.
                        </p>
                        <form
                          data-financial="true"
                          data-draft-form="transfer"
                          key={transferEdit?.transferId || "new-transfer"}
                          data-editing-id={transferEdit?.id}
                          data-editing-kind="transfer"
                          onSubmit={(e) =>
                            submit(e, (f) => {
                              const kind = transferEdit
                                ? "editTransfer"
                                : "transfer";
                              const editingId = transferEdit?.id;
                              return {
                                kind,
                                ...(editingId ? { id: editingId } : {}),
                                fromId: str(f, "fromId"),
                                toId: str(f, "toId"),
                                amount: parseMoney(str(f, "amount")),
                                fromBalanceImpact: f.has("fromIncluded")
                                  ? "included"
                                  : "additional",
                                toBalanceImpact: f.has("toIncluded")
                                  ? "included"
                                  : "additional",
                                date: str(f, "date"),
                                description: str(f, "description"),
                                status: str(f, "status") as
                                  "cleared" | "pending",
                                occurrence:
                                  occurrenceInput(f, "transferBill") || null,
                              } as Operation;
                            })
                          }
                        >
                          <div className="fields">
                            <AccountSelect
                              accounts={accounts}
                              name="fromId"
                              label="From account"
                              value={
                                pairFrom?.accountId ||
                                ledgerSelection ||
                                defaultAccount
                              }
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
                              value={
                                pairFrom ? dollars(-pairFrom.amount) : undefined
                              }
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
                                <option value="pending">
                                  Pending / planned
                                </option>
                              </select>
                            </Field>
                          </div>
                          <label className="checkbox">
                            <input
                              type="checkbox"
                              name="fromIncluded"
                              defaultChecked={
                                pairFrom
                                  ? !affectsBalance(
                                      accounts.find(
                                        (a) => a.id === pairFrom.accountId,
                                      )!,
                                      pairFrom,
                                    )
                                  : false
                              }
                            />
                            From account starting balance already includes this
                            transfer
                          </label>
                          <label className="checkbox">
                            <input
                              type="checkbox"
                              name="toIncluded"
                              defaultChecked={
                                pairTo
                                  ? !affectsBalance(
                                      accounts.find(
                                        (a) => a.id === pairTo.accountId,
                                      )!,
                                      pairTo,
                                    )
                                  : false
                              }
                            />
                            To account starting balance already includes this
                            transfer
                          </label>
                          <p>
                            <small>
                              Choose independently for each account. Pending /
                              planned transfers change projections, not cleared
                              balances.
                            </small>
                          </p>
                          <OccurrenceFields
                            state={state}
                            prefix="transferBill"
                            current={pairFrom?.occurrence}
                            today={today()}
                          />
                          <div className="actions">
                            {transferEdit && (
                              <button
                                type="button"
                                disabled={busy}
                                onClick={(event) => {
                                  if (pageDraft.editingChange)
                                    pageDraft.cancelEditingChange();
                                  else {
                                    pageDraft.cancelForm(
                                      event.currentTarget.form,
                                    );
                                    setTransferEdit(null);
                                  }
                                }}
                              >
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
                    </details>
                  </div>
                </>
              )}
              {tab === "Budget" && (
                <>
                  <nav
                    className="budget-tabs-bar workspace-tabs"
                    aria-label="Budget sections"
                  >
                    {(hasCurrentBudget
                      ? ["plan", "create", "categories"]
                      : ["create", "plan", "categories"]
                    ).map((key) => (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={budgetSelection === key}
                        onClick={() => setBudgetPane(key)}
                      >
                        {key === "plan"
                          ? "Current budget"
                          : key === "create"
                            ? "Create New Budget"
                            : "Categories"}
                      </button>
                    ))}
                  </nav>
                  <div hidden={budgetSelection !== "create"}>
                    <BudgetTargetForm
                      state={entryState}
                      month={chartMonth}
                      busy={busy}
                      submit={submit}
                    />
                  </div>
                  <div hidden={budgetSelection !== "plan"}>
                    <BudgetExplorer
                      state={state}
                      month={chartMonth}
                      today={today()}
                      onMonth={changeBudgetMonth}
                    />
                  </div>
                  <div hidden={budgetSelection !== "categories"}>
                    <section className="card">
                      <h2>Your categories</h2>
                      <p>
                        Custom labels describe allocations; they never post
                        another debit.
                      </p>
                      {repeatedPrefix(state.categories.map((c) => c.name))
                        .length > 0 && (
                        <p className="notice">
                          Pip suggestion:{" "}
                          {repeatedPrefix(
                            state.categories.map((c) => c.name),
                          ).join(", ")}{" "}
                          share a prefix. Consider distinct purpose names such
                          as Food, Household and Clothing if that fits your
                          plan. Your names remain your choice; nothing is
                          renamed automatically.
                        </p>
                      )}
                      <div className="row">
                        {state.categories.map((c) => (
                          <span className="pill" key={c.id}>
                            {c.name}
                          </span>
                        ))}
                      </div>
                      <form
                        data-financial="true"
                        onSubmit={(e) =>
                          submit(e, (f) => ({
                            kind: "category",
                            name: str(f, "name"),
                          }))
                        }
                      >
                        <div className="fields">
                          <LabelEntry
                            label="New category name"
                            name="name"
                            existing={state.categories.map((c) => c.name)}
                          />
                        </div>
                        <div className="actions">
                          <button disabled={busy}>Prepare category</button>
                        </div>
                      </form>
                    </section>
                  </div>
                  <div hidden={budgetSelection !== "plan"}>
                    {!hasCurrentBudget ? (
                      <p className="notice">
                        Budget not set up yet. No spending targets have been
                        assumed.
                      </p>
                    ) : (
                      <div className="grid">
                        {state.budgets
                          .filter((b) => b.month === chartMonth)
                          .map((b) => {
                            const actual = budgetActual(
                              b.categoryId,
                              b.month,
                              transactions,
                            );
                            const pending = budgetPending(
                              b.categoryId,
                              b.month,
                              transactions,
                            );
                            return (
                              <section className="card" key={b.id}>
                                <h2>
                                  {
                                    state.categories.find(
                                      (c) => c.id === b.categoryId,
                                    )?.name
                                  }
                                </h2>
                                <span className="pill">{b.month} · PLAN</span>
                                <p>Target: {money(b.target)}</p>
                                {b.period && (
                                  <p>
                                    {money(b.period.amount)} {b.period.cadence}{" "}
                                    · anchored {b.period.anchor}. Monthly target
                                    counts actual allocation dates.
                                  </p>
                                )}
                                <p>Cleared actuals: {money(actual)}</p>
                                <p>
                                  Pending / planned: {money(pending)} ·
                                  Remaining after pending:{" "}
                                  {money(
                                    sumMoney([b.target, -actual, -pending]),
                                  )}
                                </p>
                                <p>
                                  Remaining against target:{" "}
                                  {money(sumMoney([b.target, -actual]))}
                                </p>
                              </section>
                            );
                          })}
                      </div>
                    )}
                  </div>
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
                    <span className="pill">
                      Preliminary / incomplete coverage
                    </span>
                    <ForecastChart
                      days={projections.days}
                      opening={projections.opening}
                    />
                    {projections.warnings.map((w) => (
                      <p key={w}>{w}</p>
                    ))}
                    <p>
                      Pending items are assumed to clear on their entered future
                      date, or tomorrow if overdue. Schedules never mark
                      anything cleared. Category targets are not added as extra
                      withdrawals.
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
                    cancelEdit={(form) => {
                      if (pageDraft.editingChange)
                        pageDraft.cancelEditingChange();
                      else pageDraft.cancelForm(form);
                    }}
                    prepare={(op) => void run(() => prepare(op))}
                  />
                </>
              )}
              {tab === "Inbox" && (
                <>
                  <section className="card">
                    <h2>Saved for review</h2>
                    <p>
                      Saved drafts are encrypted, do not change finances, and
                      require a fresh review when resumed. Expired drafts leave
                      the active queue and remain in private history; they never
                      post automatically.
                    </p>
                    {state.proposals
                      .filter(
                        (p) =>
                          p.status === "saved_for_later" &&
                          p.expiresAt > clockNow,
                      )
                      .map((p) => (
                        <article className="card" key={p.id}>
                          <h3>
                            {p.operation.kind === "draft"
                              ? p.operation.section
                              : "Saved changes"}
                          </h3>
                          <p>
                            Please review by{" "}
                            {new Date(
                              p.savedReview?.deadlineAt || p.expiresAt,
                            ).toLocaleString(undefined, {
                              timeZone:
                                p.savedReview?.timezone ||
                                state.settings.timezone,
                            })}{" "}
                            · {p.savedReview?.timezone}
                          </p>
                          {p.revision !== state.revision && (
                            <p>
                              Records have changed since saving. Resume and
                              compare a fresh review before confirming.
                            </p>
                          )}
                          {p.savedReview &&
                            clockNow >= p.savedReview.remindAt && (
                              <strong>
                                Reminder: this draft is approaching its review
                                deadline.
                              </strong>
                            )}
                          <div className="actions">
                            <button
                              disabled={busy}
                              onClick={() => pageDraft.resume(p)}
                            >
                              Resume saved review
                            </button>
                            <button
                              disabled={busy}
                              onClick={() =>
                                void run(async () => {
                                  await api("proposals", "DELETE", {
                                    id: p.id,
                                  });
                                  await refresh();
                                })
                              }
                            >
                              Discard saved review
                            </button>
                          </div>
                        </article>
                      ))}
                    <h2>Pending reviews</h2>
                    <p>
                      Nothing in this queue changes actuals until you approve
                      its exact contents. A financial save makes older proposals
                      stale; discard and recreate stale proposals.
                    </p>
                    {pending.length ? (
                      pending.map((p) => (
                        <article
                          key={p.id}
                          id={`proposal-${p.id}`}
                          className="card"
                        >
                          <div className="row">
                            <div>
                              <h3>
                                {p.operation.kind} ·{" "}
                                {p.source === "human"
                                  ? "Manual draft"
                                  : "Pip draft"}
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
                                  sectionHref("Inbox", p.id) +
                                  `#proposal-${p.id}`
                                }
                              >
                                Link to this draft
                              </a>
                              <button
                                disabled={busy}
                                onClick={() =>
                                  void run(async () => {
                                    await api("proposals", "DELETE", {
                                      id: p.id,
                                    });
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
                        Promotional preferences are independent from these
                        safety and setup messages.
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
                            p.operation.kind === "batch" &&
                            p.operation.operations.map((op, index) =>
                              op.kind === "deleteTransaction" ? (
                                <button
                                  key={index}
                                  disabled={busy}
                                  onClick={() =>
                                    void run(() =>
                                      prepare({
                                        kind: "restoreTransaction",
                                        sourceProposalId: p.id,
                                        sourceOperationIndex: index,
                                      }),
                                    )
                                  }
                                >
                                  Review restore deleted batch item {index + 1}
                                </button>
                              ) : null,
                            )}
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
                  <section className="card">
                    <h2>Accounts and page layout</h2>
                    <AccountLayoutSettings
                      accounts={accounts}
                      preferences={workspace}
                      busy={busy}
                      save={saveWorkspace}
                    />
                  </section>
                  <section className="card">
                    <h2>Your saved data</h2>
                    <p>
                      Signed in as{" "}
                      {state.identity?.email || "your current account"}.{" "}
                      {state.storage?.label || "Connected storage"}.
                    </p>
                    <p>
                      Data reference:{" "}
                      {state.storage?.reference || "Unavailable"}.{" "}
                      {state.storage?.folder}
                    </p>
                    <p>
                      Signing out or a session expiring does not delete
                      financial records. If records appear missing, keep the
                      original data folder and do not recreate accounts until
                      checked.
                    </p>
                  </section>
                  <ForecasterSettings
                    key={`forecast-${state.revision}-${JSON.stringify(state.settings.forecaster)}`}
                    state={state}
                    busy={busy}
                    save={(forecaster) =>
                      run(async () => {
                        await api("state", "PATCH", {
                          ...state.settings,
                          forecaster,
                        });
                        await refresh();
                        setNotice("Forecast settings saved.");
                      })
                    }
                  />
                  <details className="card">
                    <summary>Manage forecast bills and income plans</summary>
                    <PlanningPanel
                      state={state}
                      today={today()}
                      busy={busy}
                      submit={submit}
                      cancelEdit={(form) => {
                        if (pageDraft.editingChange)
                          pageDraft.cancelEditingChange();
                        else pageDraft.cancelForm(form);
                      }}
                      prepare={(op) => void run(() => prepare(op))}
                    />
                  </details>
                  <section className="card">
                    <h2>Saved-review reminders</h2>
                    <p>
                      In-app reminders and Inbox badges are available. Email and
                      text delivery are not configured.
                    </p>
                    <label className="checkbox">
                      <input
                        type="checkbox"
                        checked={
                          state.settings.reminders?.reviews?.status !==
                          "dismissed"
                        }
                        onChange={(e) => {
                          const enabled = e.target.checked;
                          void run(async () => {
                            await api("state", "PATCH", {
                              ...state.settings,
                              reminders: {
                                ...state.settings.reminders,
                                reviews: {
                                  status: enabled ? "active" : "dismissed",
                                },
                              },
                            });
                            await refresh();
                          });
                        }}
                      />
                      Show in-app review reminders
                    </label>
                  </section>
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
                        A password change requires a fresh sign-in or recovery
                        link from the last five minutes. It revokes all
                        LedgerBot app sessions.
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
                            Change password and sign out all logins
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
                        <TimeZoneField
                          value={state.settings.timezone || "Etc/UTC"}
                        />
                        <Field label="Setup status">
                          <select
                            name="setup"
                            defaultValue={state.settings.setup}
                          >
                            <option value="needs-review">Needs review</option>
                            <option value="skipped">Skipped</option>
                            <option value="complete">Complete</option>
                            <option value="not-applicable">
                              Not applicable
                            </option>
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
                          Allow optional promotional suggestions (none sent in
                          this milestone)
                        </label>
                      </p>
                      <button disabled={busy}>Save preferences</button>
                    </form>
                    <div className="actions">
                      <button onClick={() => setTab("Accounts")}>
                        Resume account setup
                      </button>
                      <button onClick={() => setTab("Dashboard")}>
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
                        await api("state", "PATCH", {
                          ...state.settings,
                          reminders,
                        });
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
                        {v}{" "}
                        <span className="pill">Not implemented · disabled</span>
                      </p>
                    ))}
                  </section>
                </>
              )}
            </div>
          </div>
          {pageDraft.panel && (
            <aside className="pending-sidebar" inert={!!review}>
              {pageDraft.panel}
            </aside>
          )}
        </div>
      </main>
    </div>
  );
}
