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
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "Private beta: use your approved test account. Public registration is closed.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Create a new account" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await expect(
    page.getByRole("button", { name: "Send recovery email" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Email", { exact: true })
    .fill("synthetic-ui@example.test");
  await expect(page.getByLabel("Email", { exact: true })).toHaveValue(
    "synthetic-ui@example.test",
  );
  expect(violations).toEqual([]);
  const second = await request.get("/");
  expect(second.headers()["content-security-policy"]).not.toBe(policy);
  expect((await request.get("/api/health")).status()).toBe(200);
  expect((await request.get("/api/health?ready=1")).status()).toBe(503);
  expect((await request.get("/api/state")).status()).toBe(503);
  expect(
    (
      await request.post("/api/auth", {
        headers: { origin: "http://127.0.0.1:3200" },
        data: {
          mode: "signup",
          email: "blocked-beta@example.test",
          password: "synthetic-blocked-password",
        },
      })
    ).status(),
  ).toBe(403);
});
