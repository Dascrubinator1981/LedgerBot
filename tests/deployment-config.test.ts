import { it, expect } from "vitest";
import { randomBytes } from "node:crypto";
import { assertProductionConfiguration } from "../src/lib/deployment-config";
const base = () => ({
  NODE_ENV: "production",
  LEDGERBOT_BACKEND: "postgres",
  LEDGERBOT_POSTGRES_URL:
    "postgres://synthetic:synthetic@database.example.test/ledgerbot",
  LEDGERBOT_APP_ORIGIN: "https://beta.example.test",
  LEDGERBOT_SUPABASE_URL: "https://identity.example.test",
  LEDGERBOT_SUPABASE_ANON_KEY: "synthetic-test-anon",
  LEDGERBOT_DRAFT_KEYS: JSON.stringify({
    current: randomBytes(32).toString("hex"),
  }),
  LEDGERBOT_DRAFT_ACTIVE_KEY_ID: "current",
});
it("accepts a configured HTTPS backend and rejects insecure production configuration", () => {
  const configured = base();
  expect(() => assertProductionConfiguration(configured)).not.toThrow();
  for (const change of [
    { LEDGERBOT_APP_ORIGIN: "http://beta.example.test" },
    { LEDGERBOT_SUPABASE_URL: "http://identity.example.test" },
    { LEDGERBOT_COOKIE_SECURE: "false" },
    { LEDGERBOT_BACKEND: "sqlite" },
    { LEDGERBOT_POSTGRES_URL: "http://database.example.test" },
    { LEDGERBOT_SUPABASE_URL: "https://token@identity.example.test" },
    { LEDGERBOT_APP_ORIGIN: "https://beta.example.test/?secret=bad" },
    {
      LEDGERBOT_DRAFT_KEYS: "",
      LEDGERBOT_DRAFT_KEY: randomBytes(32).toString("hex"),
    },
  ])
    expect(() =>
      assertProductionConfiguration({ ...configured, ...change }),
    ).toThrow(/Secure production/);
});
it("does not confuse development service configuration with hosted readiness", () => {
  expect(() =>
    assertProductionConfiguration({ NODE_ENV: "development" }),
  ).not.toThrow();
  expect(() =>
    assertProductionConfiguration({ NODE_ENV: "production" }),
  ).toThrow();
});
