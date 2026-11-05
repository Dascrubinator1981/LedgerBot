import { test, expect } from "@playwright/test";
test("production nonce CSP hydrates and unconfigured production fails closed", async ({
  page,
  request,
}) => {
  const violations: string[] = [];
  await page.addInitScript(() => {
    document.addEventListener("securitypolicyviolation", (event) => {
      console.error(
        `CSP-VIOLATION:${event.violatedDirective}:${event.blockedURI}:${event.sourceFile}:${event.lineNumber}`,
      );
    });
  });
  page.on("console", (event) => {
    if (event.text().startsWith("CSP-VIOLATION:"))
      violations.push(event.text());
  });
  const first = await page.goto("/");
  const policy = first!.headers()["content-security-policy"];
  expect(policy).toContain("'strict-dynamic'");
  expect(
    policy.split("; ").find((s) => s.startsWith("script-src")),
  ).not.toMatch(/unsafe-inline|unsafe-eval/);
  const nonce = /'nonce-([^']+)'/.exec(policy)![1];
  const nonces = await page
    .locator("script")
    .evaluateAll((scripts) => scripts.map((s) => s.nonce));
  expect(nonces.filter(Boolean).length).toBeGreaterThan(0);
  expect(nonces.filter(Boolean).every((value) => value === nonce)).toBe(true);
  await expect(
    page.getByRole("button", { name: "Create my empty account" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Already registered? Sign in" })
    .click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(violations).toEqual([]);
  const second = await request.get("/");
  expect(second.headers()["content-security-policy"]).not.toBe(policy);
  expect((await request.get("/api/health")).status()).toBe(200);
  expect((await request.get("/api/health?ready=1")).status()).toBe(503);
  expect((await request.get("/api/state")).status()).toBe(503);
});
