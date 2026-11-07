import { randomUUID } from "node:crypto";
import { PublicError } from "./errors";
// Per-request metadata only: never persist a request body, identity or error text.
export function supportResponse() {
  const configuredRelease = process.env.LEDGERBOT_RELEASE_ID || "";
  const release = /^[a-f0-9]{7,40}$/i.test(configuredRelease)
    ? configuredRelease
    : "unknown";
  const id = randomUUID(),
    start = performance.now();
  let stage = "checking-access";
  return {
    running() {
      stage = "running-action";
    },
    complete() {
      stage = "completed";
    },
    finish<T extends Response>(response: T, error?: unknown): T {
      let outcome = response.ok ? "ok" : "rejected";
      if (error instanceof PublicError) {
        if (error.message.includes("does not allow future dates"))
          outcome = "future-date";
        else if (error.message.includes("opening snapshot"))
          outcome = "opening-date";
      } else if (error instanceof Error && error.name === "ZodError")
        outcome = "invalid-input";
      response.headers.set("X-LedgerBot-Request-Id", id);
      response.headers.set("X-LedgerBot-Release", release);
      response.headers.set("X-LedgerBot-Stage", stage);
      response.headers.set("X-LedgerBot-Outcome", outcome);
      response.headers.set(
        "Server-Timing",
        `ledgerbot;dur=${Math.round(performance.now() - start)}`,
      );
      response.headers.set("Cache-Control", "no-store");
      return response;
    },
  };
}
