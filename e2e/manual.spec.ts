import { ownerFeedbackFlow } from "./helpers/owner-feedback-flow";
import { sessionFlow } from "./helpers/session-flow";
import { inlineCategoryFlow } from "./helpers/inline-category-flow";
import { correlationFlow } from "./helpers/correlation-flow";
import { test, expect, type Page } from "@playwright/test";
async function signup(page: Page) {
  const email = `synthetic-${crypto.randomUUID()}@example.test`;
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password (at least 12 characters)")
    .fill("fabricated-password-123");
  await page.getByRole("button", { name: "Create my empty account" }).click();
  await expect(
    page.getByRole("heading", { name: "Your financial workspace" }),
  ).toBeVisible();
  return email;
}
async function approve(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Use accessible confirmation" })
    .click();
  await dialog
    .getByRole("button", { name: "Confirm these exact changes" })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText("Change saved");
}
test("two users, empty start, reviewed account, expense, reload, and isolation", async ({
  page,
  browser,
}) => {
  await signup(page);
  await expect(
    page.getByText("A fresh start. Nothing added yet."),
  ).toBeVisible();
  await expect(page.getByText("$0.00", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Skip setup", exact: true }).click();
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Fictional pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("100");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Nothing saved yet.", { exact: false }),
  ).toBeVisible();
  const uncommitted = await page.request.get("/api/state");
  expect((await uncommitted.json()).accounts).toHaveLength(0);
  await approve(page);
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Fictional pocket · checking" });
  await page.getByLabel("Date", { exact: true }).fill("2026-01-02");
  await page.getByLabel("Description", { exact: true }).fill("Fictional snack");
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
    page.getByRole("cell", { name: /Fictional snack/ }),
  ).toBeVisible();
  const other = await browser.newContext();
  const bob = await other.newPage();
  await signup(bob);
  await expect(
    bob.getByText("A fresh start. Nothing added yet."),
  ).toBeVisible();
  const response = await bob.request.get("/api/state"),
    data = await response.json();
  expect(data.accounts).toEqual([]);
  expect(data.transactions).toEqual([]);
  const aliceData = await (await page.request.get("/api/state")).json();
  const denied = await bob.request.post("/api/proposals", {
    headers: { origin: "http://127.0.0.1:3100", "x-csrf-token": data.csrf },
    data: { kind: "deleteTransaction", id: aliceData.transactions[0].id },
  });
  expect(denied.status()).toBe(400);
  const forged = await page.request.post("/api/proposals", {
    headers: { origin: "http://127.0.0.1:3100", "x-csrf-token": "forged" },
    data: { kind: "category", name: "Forgery" },
  });
  expect(forged.status()).toBe(400);
  await other.close();
});
test("cancelled review stays a draft, keyboard confirmation saves known zero", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signup(page);
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page.getByLabel("Account name", { exact: true }).fill("Zero pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("0");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel / save for later" })
    .click();
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(0);
  await page.getByRole("link", { name: /Inbox/ }).click();
  await page.getByRole("button", { name: "Review exact changes" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Use accessible confirmation" })
    .focus();
  await page.keyboard.press("Enter");
  await dialog
    .getByRole("button", { name: "Confirm these exact changes" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await expect(
    page.locator(".amount").getByText("$0.00", { exact: true }),
  ).toBeVisible();
});

test("slide requires release and aborted slide cannot commit", async ({
  page,
}) => {
  await signup(page);
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page.getByLabel("Account name", { exact: true }).fill("Gesture pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("0");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  const dialog = page.getByRole("dialog");
  const thumb = dialog.getByRole("button", {
    name: "Slide to confirm; accessible confirmation available below",
  });
  const box = (await thumb.boundingBox())!;
  const track = (await dialog.locator(".slide-track").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width - 30, box.y + box.height / 2, {
    steps: 8,
  });
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(0);
  // Returning to the start before release must not commit.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(dialog.getByRole("status")).toContainText("Nothing saved");
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    track.x + track.width - 30,
    track.y + track.height + 40,
    { steps: 8 },
  );
  await page.mouse.up();
  await expect(dialog.getByRole("status")).toContainText("Nothing saved");
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width - 30, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(dialog).not.toBeVisible();
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(1);
});

test("successful commit receipt survives a failed balance refresh", async ({
  page,
}) => {
  await signup(page);
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Refresh test pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("10");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.route("**/api/state", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Synthetic balance refresh failure" }),
    }),
  );
  await approve(page);
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Synthetic balance refresh failure" }),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(1);
  await page.unroute("**/api/state");
  await page.reload();
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Refresh test pocket", exact: true }),
  ).toBeVisible();
});

test("reviewed card payment, splits, budget, forecast assumptions and reconciliation agree", async ({
  page,
}) => {
  await signup(page);
  async function addAccount(name: string, type: string, opening: string) {
    await page.getByRole("link", { name: "Accounts", exact: true }).click();
    await page.getByLabel("Account name", { exact: true }).fill(name);
    await page.getByLabel("Account type", { exact: true }).selectOption(type);
    await page
      .getByLabel("Opening balance ($, positive owed for liabilities)")
      .fill(opening);
    await page.getByLabel("Opening as-of date").fill("2026-01-01");
    await page
      .getByRole("button", { name: "Prepare account for review" })
      .click();
    await approve(page);
  }
  await addAccount("Synthetic checking", "checking", "1000");
  await addAccount("Synthetic card", "credit", "50");
  await addAccount("Synthetic savings", "savings", "0");
  for (const name of ["Synthetic food", "Synthetic home"]) {
    await page.getByRole("link", { name: "Budget", exact: true }).click();
    await page.getByLabel("New category name").fill(name);
    await page
      .getByRole("button", { name: "Prepare category", exact: true })
      .click();
    await approve(page);
  }
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Synthetic card · credit" });
  await page.getByLabel("Date", { exact: true }).fill("2026-01-02");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Synthetic mixed purchase");
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("-20");
  await page
    .getByLabel("Split 1 category", { exact: true })
    .selectOption({ label: "Synthetic food" });
  await page
    .getByLabel("Split 1 signed amount ($)", { exact: true })
    .fill("-12");
  await page.getByRole("button", { name: "Add another split" }).click();
  await page
    .getByLabel("Split 2 category", { exact: true })
    .selectOption({ label: "Synthetic home" });
  await page
    .getByLabel("Split 2 signed amount ($)", { exact: true })
    .fill("-8");
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await approve(page);
  for (const [destination, amount] of [
    ["Synthetic card · credit", "30"],
    ["Synthetic savings · savings", "25"],
  ]) {
    await page
      .getByLabel("From account", { exact: true })
      .selectOption({ label: "Synthetic checking · checking" });
    await page
      .getByLabel("To account (card for payment)", { exact: true })
      .selectOption({ label: destination });
    await page.getByLabel("Transfer amount ($, positive)").fill(amount);
    await page
      .getByLabel("Transfer description", { exact: true })
      .fill("Synthetic internal transfer");
    await page.getByLabel("Transfer date", { exact: true }).fill("2026-01-03");
    await page.getByRole("button", { name: "Prepare paired transfer" }).click();
    await approve(page);
  }
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  for (const [name, amount] of [
    ["Synthetic checking", "$945.00"],
    ["Synthetic card", "$40.00"],
    ["Synthetic savings", "$25.00"],
  ]) {
    await expect(
      page
        .locator(".card")
        .filter({ has: page.getByRole("heading", { name, exact: true }) })
        .locator(".amount"),
    ).toHaveText(amount);
  }
  await page.getByRole("link", { name: "Budget", exact: true }).click();
  await page
    .getByLabel("Budget category", { exact: true })
    .selectOption({ label: "Synthetic food" });
  await page.getByLabel("Budget month", { exact: true }).fill("2026-01");
  await page.getByLabel("Planned target ($)", { exact: true }).fill("100");
  await page.getByRole("button", { name: "Prepare budget target" }).click();
  await approve(page);
  await expect(
    page.getByText("Cleared actuals: $12.00", { exact: true }),
  ).toBeVisible();
  const before = await (await page.request.get("/api/state")).json();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByText("Manage forecast bills and income plans", { exact: true })
    .click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Synthetic checking · checking" });
  await page
    .getByLabel("Schedule name", { exact: true })
    .fill("Synthetic weekly bill");
  await page.getByLabel("Signed recurring amount ($)").fill("-10");
  await page
    .getByLabel("First due / expected date")
    .fill(new Date().toISOString().slice(0, 10));
  await page
    .getByRole("button", { name: "Prepare recurring assumption" })
    .click();
  await approve(page);
  const after = await (await page.request.get("/api/state")).json();
  expect(after.transactions).toEqual(before.transactions);
  expect(after.recurrences).toHaveLength(1);
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Forecaster", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByText("Investigate a statement difference", { exact: true })
    .click();
  await page
    .getByLabel("Investigate account", { exact: true })
    .selectOption({ label: "Synthetic checking · checking" });
  await page.getByLabel("Investigate through date").fill("2026-01-31");
  await page.getByLabel("Balance to investigate ($)").fill("950");
  await page
    .getByRole("button", { name: "Investigate without saving" })
    .click();
  await expect(page.getByText(/Statement minus ledger:/)).toContainText(
    "$5.00",
  );
  expect(
    (await (await page.request.get("/api/state")).json()).transactions,
  ).toEqual(after.transactions);
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Synthetic checking · checking" });
  await page
    .getByLabel("Statement ending date", { exact: true })
    .fill("2026-01-31");
  await page.getByLabel("Statement ending balance ($)").fill("945");
  await page
    .getByRole("button", { name: "Compare and prepare reconciliation" })
    .click();
  await approve(page);
  const final = await (await page.request.get("/api/state")).json();
  expect(final.reconciliations).toHaveLength(1);
  const checkingId = final.accounts.find(
    (a: { name: string }) => a.name === "Synthetic checking",
  ).id;
  expect(
    final.transactions
      .filter((t: { accountId: string }) => t.accountId === checkingId)
      .every((t: { reconciledAt: string }) => t.reconciledAt === "2026-01-31"),
  ).toBe(true);
});

test("approved bill payment keeps ledger, budget charts and forecast in agreement", async ({
  page,
}) => {
  await signup(page);
  await correlationFlow(page);
});

test("inline category review preserves ledger and budget work", async ({
  page,
}) => {
  await signup(page);
  await inlineCategoryFlow(page);
});

test("owner can revoke another sign-in without permitting its prepared approval", async ({
  page,
  browser,
}) => {
  const email = await signup(page);
  const context = await browser.newContext();
  await sessionFlow(
    page,
    await context.newPage(),
    email,
    "fabricated-password-123",
  );
  await context.close();
});

test("owner-reported split, inline failures, reconciliation and automatic forecast work", async ({
  page,
}) => {
  await signup(page);
  await ownerFeedbackFlow(page, approve);
});
