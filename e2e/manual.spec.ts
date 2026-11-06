import { manualEntryFlow } from "./helpers/manual-entry-flow";
import AxeBuilder from "@axe-core/playwright";
import { savedPageFlow } from "./helpers/saved-page-flow";
import { openReview } from "./helpers/open-review";
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
  await expect(page.getByRole("heading", { name: "Forecast" })).toBeVisible();
  return email;
}
async function approve(page: Page) {
  await openReview(page);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Use accessible confirmation" })
    .click();
  await dialog
    .getByRole("button", { name: "Confirm these exact changes" })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Change saved" }),
  ).toContainText("Change saved");
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
  await openReview(page);
  await expect(
    page.getByRole("dialog").getByText("Nothing saved yet.", { exact: false }),
  ).toBeVisible();
  const uncommitted = await page.request.get("/api/state");
  expect((await uncommitted.json()).accounts).toHaveLength(0);
  await approve(page);
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
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
    page.getByRole("cell", {
      name: "Fictional pocket Fictional snack",
      exact: true,
    }),
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
  await openReview(page);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel review / keep page draft" })
    .click();
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(0);
  await page.getByRole("link", { name: /Inbox/ }).click();
  await page
    .getByRole("button", { name: "Save changes for later review", exact: true })
    .last()
    .click();
  await page
    .getByRole("button", { name: "Save for later", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Resume saved review", exact: true })
    .click();
  await openReview(page);
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
  await openReview(page);
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
  await openReview(page);
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
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
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
  await page
    .getByRole("button", { name: "Transfer / card payment", exact: true })
    .click();
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
  const pairedRow = page
    .locator("#ledger-register tbody tr")
    .filter({ has: page.getByRole("cell", { name: "-$30.00", exact: true }) });
  await pairedRow.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Transfer amount ($, positive)")).toHaveValue(
    "30.00",
  );
  await expect(
    page.getByLabel("From account", { exact: true }).locator("option:checked"),
  ).toHaveText("Synthetic checking · checking");
  await page.getByLabel("Transfer amount ($, positive)").fill("0");
  await page
    .getByRole("button", {
      name: "Prepare paired transfer changes",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Transfer amount ($, positive)")).toHaveValue(
    "0",
  );
  await expect(
    page.getByRole("button", { name: "Cancel pair edit", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cancel pair edit", exact: true })
    .click();
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await pairedRow.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Transfer amount ($, positive)")).toHaveValue(
    "30.00",
  );
  await page
    .getByRole("button", {
      name: "Prepare paired transfer changes",
      exact: true,
    })
    .click();
  await approve(page);
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
    page.getByRole("heading", {
      name: "Your outlook: Needs information",
      exact: false,
    }),
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

test("unfinished page saves encrypted and resumes a same-day transaction without duplication", async ({
  page,
}) => {
  await signup(page);
  await savedPageFlow(page, approve);
});

test("custom quick actions move only their strip and held swipes do not navigate", async ({
  page,
}) => {
  await signup(page);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  const controls = page.getByRole("group", {
    name: "Quick actions",
    exact: true,
  });
  for (const box of await controls.getByRole("checkbox").all())
    await box.check();
  await page.getByRole("button", { name: "Save forecast settings" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Forecast settings saved",
  );
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const strip = page.locator(".quick-strip.overflow");
  await page.getByRole("button", { name: "More →", exact: true }).click();
  await expect
    .poll(() => strip.evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.scrollX)).toBe(0);
  await page.getByRole("button", { name: "← Back", exact: true }).click();
  await expect.poll(() => strip.evaluate((e) => e.scrollLeft)).toBe(0);
  const box = (await strip.boundingBox())!;
  await page.mouse.move(box.x + box.width - 15, box.y + 20);
  await page.mouse.down();
  await page.waitForTimeout(450);
  await page.mouse.move(box.x + 10, box.y + 20, { steps: 10 });
  await page.mouse.up();
  await expect
    .poll(() => strip.evaluate((e) => e.scrollLeft))
    .toBeGreaterThan(0);
  await expect(
    page.getByRole("heading", { name: "Forecast", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});

test("Ledger opens as a register with compact editors, selected-row editing and mobile rows", async ({
  page,
}) => {
  await signup(page);
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Synthetic register pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("1000");
  const today = await page.getByLabel("Opening as-of date").inputValue();
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  await approve(page);
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  const register = page.locator("#ledger-register"),
    editor = page.locator("#ledger-transaction-editor");
  await expect(
    register.getByRole("heading", { name: "Transactions", exact: true }),
  ).toBeVisible();
  await expect(editor).not.toHaveAttribute("open", "");
  await expect(
    page.getByLabel("Description", { exact: true }),
  ).not.toBeVisible();
  await expect(
    page.getByRole("region", { name: "Account balances" }),
  ).toContainText("$1,000.00");
  expect(
    await register.evaluate(
      (element) =>
        !!(
          element.compareDocumentPosition(
            document.getElementById("ledger-transaction-editor")!,
          ) & Node.DOCUMENT_POSITION_FOLLOWING
        ),
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Synthetic register pocket · checking" });
  await page
    .getByLabel("Description", { exact: true })
    .fill("Synthetic register purchase");
  await page.getByLabel("Date", { exact: true }).fill(today);
  await page.getByLabel("Entry type", { exact: true }).selectOption("expense");
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("185");
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await expect(register).not.toContainText("Synthetic register purchase");
  await approve(page);
  await expect(
    register.getByRole("cell", { name: "$815.00", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await expect(
    page.getByLabel("Description", { exact: true }),
  ).not.toBeVisible();
  await register
    .getByRole("radio", {
      name: /Select transaction.*Synthetic register purchase/,
    })
    .check();
  await page
    .getByRole("button", { name: "Edit selected", exact: true })
    .click();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "Synthetic register purchase",
  );
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("190");
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await approve(page);
  await expect(
    register.getByRole("cell", { name: "$810.00", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search description").fill("not-a-match");
  await expect(register).toContainText("No transactions match these filters");
  await expect(
    page.getByRole("region", { name: "Account balances" }),
  ).toContainText("$810.00");
  await page.getByRole("button", { name: "Clear ledger filters" }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    register.getByRole("cell", {
      name: "Synthetic register pocket Synthetic register purchase",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const data = await (await page.request.get("/api/state")).json();
  expect(data.transactions).toHaveLength(1);
  expect(data.transactions[0].amount).toBe(-19000);
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await page
    .getByRole("button", { name: "+ Add transaction", exact: true })
    .click();
  await expect(page.getByLabel("Description", { exact: true })).toBeVisible();
});

test("manual same-day and historical entry choices keep pending, budget and cleared balances consistent", async ({
  page,
}) => {
  await signup(page);
  await manualEntryFlow(page, approve);
});

test("plain-language settings and Dashboard entry shortcut retain independent preferences", async ({
  page,
}) => {
  await signup(page);
  await page
    .getByRole("navigation", { name: "Forecast quick actions" })
    .getByRole("button", { name: "Add Transaction", exact: true })
    .click();
  await expect(page.getByLabel("Description", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByLabel("How far ahead to look").selectOption("60");
  await page
    .getByLabel("Warn me when a balance falls below ($)")
    .fill("125.34");
  await page
    .getByLabel("Warn me when category spending reaches (%)")
    .fill("101");
  await page
    .getByRole("button", { name: "Save forecast settings", exact: true })
    .click();
  expect(
    (await (await page.request.get("/api/state")).json()).settings.forecaster
      ?.horizon ?? 30,
  ).toBe(30);
  await page
    .getByLabel("Warn me when category spending reaches (%)")
    .fill("90");
  await page
    .getByRole("button", { name: "Save forecast settings", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Forecast settings saved" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Use this device’s time zone", exact: true })
    .click();
  const zone = await page.evaluate(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
  );
  await expect(page.getByLabel("Your time zone", { exact: true })).toHaveValue(
    zone,
  );
  await page
    .getByRole("button", { name: "Save preferences", exact: true })
    .click();
  await page.reload();
  const state = await (await page.request.get("/api/state")).json();
  expect(state.settings.forecaster).toMatchObject({
    horizon: 60,
    lowBalanceCents: 12534,
    nearBudgetPercent: 90,
  });
  expect(state.settings.timezone).toBe(zone);
  expect(state.transactions).toEqual([]);
  await page
    .getByRole("button", { name: "Review export", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cancel export", exact: true })
    .click();
  await expect(
    page.getByRole("combobox", { name: "Export format", exact: true }),
  ).toBeVisible();
});
