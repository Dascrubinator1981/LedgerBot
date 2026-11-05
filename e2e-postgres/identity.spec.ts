import { inlineCategoryFlow } from "../e2e/helpers/inline-category-flow";
import { correlationFlow } from "../e2e/helpers/correlation-flow";
import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test";
const password = "fabricated-verified-password-123";
async function emailLink(
  request: APIRequestContext,
  email: string,
  subject: string,
) {
  let messageId = "";
  await expect
    .poll(
      async () => {
        const result = await (
          await request.get("http://127.0.0.1:58025/api/v1/messages")
        ).json();
        const message = result.messages.find(
          (m: { ID: string; To: { Address: string }[]; Subject: string }) =>
            m.To.some((to) => to.Address === email) &&
            m.Subject.toLowerCase().includes(subject),
        );
        messageId = message?.ID || "";
        return !!messageId;
      },
      { timeout: 20000 },
    )
    .toBe(true);
  const message = await (
    await request.get(`http://127.0.0.1:58025/api/v1/message/${messageId}`)
  ).json();
  const link = String(message.HTML || message.Text).match(
    /http:\/\/127\.0\.0\.1:55321\/auth\/v1\/verify[^"\s<]+/,
  )?.[0];
  if (!link)
    throw new Error("Synthetic message did not contain a verification link");
  return link.replaceAll("&amp;", "&");
}
async function signup(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password (at least 12 characters)", { exact: true })
    .fill(password);
  await page.getByRole("button", { name: "Create my empty account" }).click();
  await expect(page.getByRole("status")).toContainText("Check your email");
  expect((await page.request.get("/api/state")).status()).toBe(401);
  await page.goto(await emailLink(page.request, email, "confirm"));
  await expect(
    page.getByRole("heading", { name: "Your financial workspace" }),
  ).toBeVisible();
}
async function approve(page: Page) {
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Use accessible confirmation" })
    .click();
  await dialog
    .getByRole("button", { name: "Confirm these exact changes" })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText("Change saved");
}
test("verified identity, PostgreSQL ledger and second-user isolation work together", async ({
  page,
  browser,
}) => {
  await signup(page, `verified-${crypto.randomUUID()}@example.test`);
  expect((await page.request.get("/api/health?ready=1")).status()).toBe(200);
  let data = await (await page.request.get("/api/state")).json();
  for (const key of [
    "accounts",
    "transactions",
    "categories",
    "budgets",
    "recurrences",
  ])
    expect(data[key]).toEqual([]);
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Verified synthetic cash");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("100");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  await approve(page);
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Verified synthetic cash · checking" });
  await page
    .getByLabel("Description", { exact: true })
    .fill("Verified synthetic expense");
  await page.getByLabel("Date", { exact: true }).fill("2026-01-02");
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("-15");
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await approve(page);
  await expect(
    page.getByRole("cell", { name: "$85.00", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: "$85.00", exact: true }),
  ).toBeVisible();
  data = await (await page.request.get("/api/state")).json();
  expect(
    (
      await page.request.get(`/api/receipts?proposalId=${data.proposals[0].id}`)
    ).status(),
  ).toBe(200);
  const other = await browser.newContext(),
    bob = await other.newPage();
  await signup(bob, `verified-${crypto.randomUUID()}@example.test`);
  const b = await (await bob.request.get("/api/state")).json();
  expect(b.accounts).toEqual([]);
  expect(
    (
      await bob.request.post("/api/proposals", {
        headers: { origin: "http://127.0.0.1:3101", "x-csrf-token": b.csrf },
        data: { kind: "deleteTransaction", id: data.transactions[0].id },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await bob.request.get(`/api/receipts?proposalId=${data.proposals[0].id}`)
    ).status(),
  ).toBe(404);
  await other.close();
});
test("email recovery changes the password and revokes the other app session", async ({
  page,
  browser,
}) => {
  const email = `recovery-${crypto.randomUUID()}@example.test`;
  await signup(page, email);
  const other = await browser.newContext(),
    second = await other.newPage();
  await second.goto("/");
  await second
    .getByRole("button", { name: "Already registered? Sign in" })
    .click();
  await second.getByLabel("Email", { exact: true }).fill(email);
  await second
    .getByLabel("Password (at least 12 characters)", { exact: true })
    .fill(password);
  await second.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    second.getByRole("heading", { name: "Your financial workspace" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("heading", { name: "Start an empty workspace" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Forgot your password?" }).click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Send recovery email" }).click();
  await expect(page.getByRole("status")).toContainText("recovery email");
  await page.goto(await emailLink(page.request, email, "reset"));
  await expect(
    page.getByRole("heading", { name: "Account security" }),
  ).toBeVisible();
  await page
    .getByLabel("New password (at least 12 characters)", { exact: true })
    .fill("fabricated-new-password-456");
  await page
    .getByRole("button", { name: "Change password and revoke sessions" })
    .click();
  await expect(page.getByRole("status")).toContainText("Password updated");
  expect((await second.request.get("/api/state")).status()).toBe(401);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password (at least 12 characters)", { exact: true })
    .fill("fabricated-new-password-456");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your financial workspace" }),
  ).toBeVisible();
  await other.close();
});

test("verified PostgreSQL paid bills and budget charts maintain the shared contract", async ({
  page,
}) => {
  await signup(page, `correlation-${crypto.randomUUID()}@example.test`);
  await correlationFlow(page);
});

test("verified inline category review preserves unfinished financial entries", async ({
  page,
}) => {
  await signup(page, `inline-${crypto.randomUUID()}@example.test`);
  await inlineCategoryFlow(page);
});
