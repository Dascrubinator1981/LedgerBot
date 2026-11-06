import { afterEach, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { signupsDisabled } from "../src/lib/registration";
import { POST } from "../src/app/api/auth/route";
afterEach(() => vi.unstubAllEnvs());
it("defaults production to closed registration and keeps local testing available", () => {
  expect(
    signupsDisabled({
      NODE_ENV: "production",
      LEDGERBOT_SIGNUPS_DISABLED: "false",
    }),
  ).toBe(true);
  expect(signupsDisabled({ NODE_ENV: "development" })).toBe(false);
  expect(
    signupsDisabled({
      NODE_ENV: "development",
      LEDGERBOT_SIGNUPS_DISABLED: "true",
    }),
  ).toBe(true);
});
it("blocks direct signup requests before database/provider mutation when registration is closed", async () => {
  vi.stubEnv("LEDGERBOT_SIGNUPS_DISABLED", "true");
  vi.stubEnv("LEDGERBOT_APP_ORIGIN", "http://127.0.0.1:3000");
  const request = new NextRequest("http://127.0.0.1:3000/api/auth", {
    method: "POST",
    headers: {
      origin: "http://127.0.0.1:3000",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      mode: "signup",
      email: "blocked@example.test",
      password: "synthetic-blocked-password",
    }),
  });
  const result = await POST(request);
  expect(result.status).toBe(403);
  expect(await result.json()).toHaveProperty(
    "error",
    expect.stringContaining("approved test accounts"),
  );
});
