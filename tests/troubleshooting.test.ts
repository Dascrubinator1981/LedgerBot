import { expect, it, vi } from "vitest";
import {
  Troubleshooting,
  supportFetch,
  type SupportEvent,
} from "../src/lib/troubleshooting";
it("starts off, excludes private values and unsafe metadata, and clears without persistence", () => {
  const recorder = new Troubleshooting();
  recorder.record({ event: "button" });
  expect(recorder.getSnapshot().entries).toHaveLength(0);
  recorder.start();
  recorder.record({
    event: "response",
    route: "state",
    status: 400,
    body: "PRIVATE",
    accountId: "PRIVATE",
    amount: 185,
    requestId: "PRIVATE",
    field: "PRIVATE",
    outcome: "PRIVATE",
  } as unknown as SupportEvent);
  expect(recorder.report()).not.toContain("PRIVATE");
  expect(recorder.getSnapshot().entries.at(-1)).toMatchObject({
    event: "response",
    route: "state",
    status: 400,
  });
  recorder.stop();
  recorder.record({ event: "button" });
  expect(recorder.getSnapshot().entries).toHaveLength(2);
  recorder.clear();
  expect(recorder.getSnapshot().entries).toHaveLength(0);
  expect(new Troubleshooting().getSnapshot().enabled).toBe(false);
});
it("bounds session memory and preserves only safe server correlation fields", () => {
  const recorder = new Troubleshooting();
  recorder.start();
  for (let i = 0; i < 250; i++)
    recorder.record({
      event: "response",
      requestId: "64f63b91-66a9-4fef-958a-8cb25ebd072a",
      stage: "running-action",
      outcome: "future-date",
      durationMs: 2.2,
    });
  expect(recorder.getSnapshot().entries).toHaveLength(200);
  expect(recorder.getSnapshot().entries.at(-1)).toMatchObject({
    sequence: 251,
    durationMs: 2,
    outcome: "future-date",
  });
});

import { supportResponse } from "../src/lib/support-response";
import { PublicError } from "../src/lib/errors";
it("server traces identify execution stage without exposing exception values", () => {
  const trace = supportResponse();
  trace.running();
  const response = trace.finish(
    new Response(null, { status: 400 }),
    new PublicError("PRIVATE does not allow future dates"),
  );
  expect(response.headers.get("X-LedgerBot-Stage")).toBe("running-action");
  expect(response.headers.get("X-LedgerBot-Outcome")).toBe("future-date");
  expect(JSON.stringify([...response.headers])).not.toContain("PRIVATE");
  expect(response.headers.get("X-LedgerBot-Request-Id")).toMatch(
    /^[a-f0-9-]{36}$/,
  );
  const done = supportResponse();
  done.complete();
  expect(done.finish(new Response()).headers.get("X-LedgerBot-Stage")).toBe(
    "completed",
  );
});

it("transport records failures without retaining request bodies or exception text", async () => {
  const recorder = new Troubleshooting();
  recorder.start();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("PRIVATE")));
  try {
    await expect(
      supportFetch(recorder, "draft-validation", "POST", {
        method: "POST",
        body: "PRIVATE",
      }),
    ).rejects.toThrow("PRIVATE");
    expect(recorder.getSnapshot().entries.at(-1)?.event).toBe("network-error");
    expect(recorder.report()).not.toContain("PRIVATE");
  } finally {
    vi.unstubAllGlobals();
  }
});
it("transport accepts only safe server headers and never copies financial responses", async () => {
  const recorder = new Troubleshooting();
  recorder.start();
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      new Response('{"private":"PRIVATE"}', {
        status: 400,
        headers: {
          "X-LedgerBot-Outcome": "future-date",
          "X-LedgerBot-Release": "PRIVATE",
          "X-LedgerBot-Request-Id": "PRIVATE",
          "X-LedgerBot-Stage": "running-action",
          "Set-Cookie": "PRIVATE",
        },
      }),
    ),
  );
  try {
    await supportFetch(recorder, "draft-validation", "POST", {
      method: "POST",
      body: "PRIVATE",
    });
    expect(recorder.getSnapshot().entries.at(-1)).toMatchObject({
      event: "response",
      outcome: "future-date",
      stage: "running-action",
      status: 400,
    });
    expect(recorder.report()).not.toContain("PRIVATE");
  } finally {
    vi.unstubAllGlobals();
  }
});
