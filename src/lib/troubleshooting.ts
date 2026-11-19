// Deliberately accepts codes, never request bodies, field values or DOM text.
export const supportRoutes = [
  "auth",
  "state",
  "proposals",
  "draft-validation",
  "saved-reviews",
  "review",
  "confirm",
  "receipts",
  "sessions",
  "export",
  "overview",
] as const;
export type SupportRoute = (typeof supportRoutes)[number];
export type SupportEvent = {
  event:
    | "unexpected-error"
    | "navigation"
    | "started"
    | "button"
    | "field-edited"
    | "form-invalid"
    | "request"
    | "response"
    | "network-error"
    | "unreadable-response";
  page?:
    | "Dashboard"
    | "Accounts"
    | "Ledger"
    | "Budget"
    | "Forecaster"
    | "Inbox"
    | "Settings";
  action?: "prepare-transaction" | "review-page" | "button";
  field?:
    | "date"
    | "status"
    | "amount"
    | "description"
    | "accountId"
    | "flow"
    | "other";
  route?: SupportRoute;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  status?: number;
  requestId?: string;
  release?: string;
  stage?: "checking-access" | "running-action" | "completed";
  outcome?:
    "ok" | "future-date" | "opening-date" | "invalid-input" | "rejected";
  durationMs?: number;
};
export type SupportEntry = SupportEvent & { at: string; sequence: number };
const empty = { enabled: false, entries: [] as SupportEntry[] };
export class Troubleshooting {
  private value = empty;
  private listeners = new Set<() => void>();
  getSnapshot = () => this.value;
  getServerSnapshot = () => empty;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private publish() {
    for (const listener of this.listeners) listener();
  }
  start() {
    this.value = { enabled: true, entries: [] };
    this.record({ event: "started" });
  }
  stop() {
    this.value = { ...this.value, enabled: false };
    this.publish();
  }
  clear() {
    this.value = { enabled: false, entries: [] };
    this.publish();
  }
  record(input: SupportEvent) {
    if (!this.value.enabled) return;
    // Copy only bounded, allowlisted primitives even if an unsafe caller casts its input.
    const safe: SupportEvent = { event: input.event };
    if (
      ![
        "unexpected-error",
        "navigation",
        "started",
        "button",
        "field-edited",
        "form-invalid",
        "request",
        "response",
        "network-error",
        "unreadable-response",
      ].includes(input.event)
    )
      return;
    if (
      [
        "Dashboard",
        "Accounts",
        "Ledger",
        "Budget",
        "Forecaster",
        "Inbox",
        "Settings",
      ].includes(input.page || "")
    )
      safe.page = input.page;
    if (
      ["prepare-transaction", "review-page", "button"].includes(
        input.action || "",
      )
    )
      safe.action = input.action;
    if (
      [
        "date",
        "status",
        "amount",
        "description",
        "accountId",
        "flow",
        "other",
      ].includes(input.field || "")
    )
      safe.field = input.field;
    if (supportRoutes.includes(input.route!)) safe.route = input.route;
    if (["GET", "POST", "PATCH", "DELETE"].includes(input.method || ""))
      safe.method = input.method;
    if (
      Number.isInteger(input.status) &&
      input.status! >= 100 &&
      input.status! <= 599
    )
      safe.status = input.status;
    if (
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        input.requestId || "",
      )
    )
      safe.requestId = input.requestId;
    if (/^(?:[a-f0-9]{7,40}|unknown)$/i.test(input.release || ""))
      safe.release = input.release;
    if (
      ["checking-access", "running-action", "completed"].includes(
        input.stage || "",
      )
    )
      safe.stage = input.stage;
    if (
      [
        "ok",
        "future-date",
        "opening-date",
        "invalid-input",
        "rejected",
      ].includes(input.outcome || "")
    )
      safe.outcome = input.outcome;
    if (Number.isFinite(input.durationMs) && input.durationMs! >= 0)
      safe.durationMs = Math.min(600000, Math.round(input.durationMs!));
    const sequence = (this.value.entries.at(-1)?.sequence || 0) + 1;
    this.value = {
      enabled: true,
      entries: [
        ...this.value.entries,
        { ...safe, at: new Date().toISOString(), sequence },
      ].slice(-200),
    };
    this.publish();
  }
  report() {
    return JSON.stringify(
      {
        format: "ledgerbot-support-v1",
        ...this.value,
        note: "Session-only, sanitized diagnostics. No financial values or request/response bodies. Server entries reflect response headers, not a complete server audit log.",
      },
      null,
      2,
    );
  }
}

export async function supportFetch(
  recorder: Troubleshooting,
  path: string,
  method: string,
  init: RequestInit,
) {
  const started = performance.now();
  const meta = {
    route: path as SupportRoute,
    method: method as SupportEvent["method"],
  };
  recorder.record({ event: "request", ...meta });
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, init);
  } catch (error) {
    recorder.record({ event: "network-error", ...meta });
    throw error;
  }
  recorder.record({
    event: "response",
    ...meta,
    status: response.status,
    requestId: response.headers.get("X-LedgerBot-Request-Id") || undefined,
    release: response.headers.get("X-LedgerBot-Release") || undefined,
    stage: response.headers.get("X-LedgerBot-Stage") as SupportEvent["stage"],
    outcome: response.headers.get(
      "X-LedgerBot-Outcome",
    ) as SupportEvent["outcome"],
    durationMs: performance.now() - started,
  });
  return response;
}
