import { test, expect, type Page } from "@playwright/test";
import { openAccountTools } from "./helpers/workspace-navigation";
async function approve(page: Page) {
  await page
    .getByRole("button", { name: "Review staged changes", exact: true })
    .click();
  const review = page.getByRole("dialog");
  await expect(review).toBeVisible();
  await review
    .getByRole("button", { name: "Use accessible confirmation" })
    .click();
  await review
    .getByRole("button", { name: "Confirm these exact changes" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
}
test("account tabs, persisted default/order, compact ledger, precise review and budget panels work together", async ({
  page,
}) => {
  const email = `layout-${crypto.randomUUID()}@example.test`;
  await page.goto("/");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password (at least 12 characters)")
    .fill("fictional-password-123");
  await page.getByRole("button", { name: "Create my empty account" }).click();
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Create New Account" }),
  ).toHaveAttribute("aria-selected", "true");
  for (const [name, type, amount] of [
    ["Fictional checking", "checking", "1000"],
    ["Fictional saving", "savings", "0"],
    ["Fictional card", "credit", "50"],
  ]) {
    await page.getByRole("tab", { name: "Create New Account" }).click();
    await page.getByLabel("Account name", { exact: true }).fill(name);
    await page.getByLabel("Account type", { exact: true }).selectOption(type);
    await page
      .getByLabel("Opening balance ($, positive owed for liabilities)")
      .fill(amount);
    await page.getByLabel("Opening as-of date").fill("2026-01-01");
    await page
      .getByRole("button", { name: "Prepare account for review" })
      .click();
    await expect(
      page.getByRole("region", { name: "Page changes" }),
    ).toContainText(name);
    await page
      .getByRole("button", { name: "Review staged changes", exact: true })
      .click();
    const review = page.getByRole("dialog");
    await expect(review.getByRole("table")).toHaveCount(1);
    await expect(review.locator("tbody tr")).toHaveCount(1);
    if (name !== "Fictional checking")
      await expect(
        review.getByRole("region", { name: "Changed balances" }),
      ).not.toContainText("Fictional checking");
    await review
      .getByRole("button", { name: "Use accessible confirmation" })
      .click();
    await review
      .getByRole("button", { name: "Confirm these exact changes" })
      .click();
    await expect(
      page.getByRole("region", { name: "Page changes" }),
    ).toHaveCount(0);
    await expect(page.getByRole("tab", { name, exact: true })).toBeVisible();
  }
  await page
    .getByRole("button", { name: "Edit page layout", exact: true })
    .click();
  await page
    .getByLabel("Default account", { exact: true })
    .selectOption({ label: "Fictional card" });
  await expect(
    page.getByRole("status").filter({ hasText: "Account layout saved" }),
  ).toBeVisible();
  await expect(page.getByRole("tab").first()).toHaveText("Fictional card");
  await page
    .getByRole("button", { name: "Move Fictional saving up", exact: true })
    .click();
  await expect(
    page.getByRole("status").filter({ hasText: "Account layout saved" }),
  ).toBeVisible();
  await expect(page.getByRole("tab").nth(1)).toHaveText("Fictional saving");
  await page.reload();
  await expect(page.getByRole("tab").first()).toHaveText("Fictional card");
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Fictional card", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("tab", { name: "Fictional checking", exact: true })
    .click();
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  await expect(
    page.getByLabel("Account", { exact: true }).locator("option:checked"),
  ).toHaveText("Fictional checking · checking");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Fictional layout expense");
  await page.getByLabel("Amount ($)", { exact: true }).fill("185");
  await approveEntry();
  async function approveEntry() {
    await page
      .getByRole("button", { name: "Prepare transaction for review" })
      .click();
    await approve(page);
  }
  await expect(page.locator("#ledger-register")).toContainText("$815.00");
  await page
    .getByRole("button", { name: "Expand ledger", exact: true })
    .click();
  await expect(page.locator("#ledger-register")).toHaveClass(/expanded/);
  await page
    .getByRole("button", { name: "Full ledger view", exact: true })
    .click();
  await expect(page.locator("#ledger-register")).toHaveClass(/full/);
  await page
    .getByRole("button", { name: "Exit full view", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Reduce ledger", exact: true })
    .click();
  await page.getByRole("link", { name: "Budget", exact: true }).click();
  const tabs = page.getByRole("navigation", { name: "Budget sections" });
  await expect(tabs.getByRole("button").first()).toHaveText(
    "Create New Budget",
  );
  await page
    .getByLabel("Budget category", { exact: true })
    .selectOption("+add");
  await page.getByLabel("New budget category name").fill("Fictional plan");
  await page.getByLabel("Planned target ($)").fill("100");
  await page.getByRole("button", { name: "Prepare budget target" }).click();
  await approve(page);
  await expect(tabs.getByRole("button").first()).toHaveText("Current budget");
  await expect(
    tabs.getByRole("button", { name: "Current budget" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.getByText(`Signed in as ${email}.`, { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your saved data" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Already registered? Sign in" })
    .click();
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page
    .getByLabel("Password (at least 12 characters)")
    .fill("fictional-password-123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Forecast", exact: true }),
  ).toBeVisible();
  const state = await (await page.request.get("/api/state")).json();
  expect(state.accounts).toHaveLength(3);
  expect(state.transactions).toHaveLength(1);
  expect(state.settings.workspace.defaultAccountId).toBe(
    state.accounts.find((a: { name: string }) => a.name === "Fictional card")
      .id,
  );
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await openAccountTools(page);
  await expect(
    page.getByRole("heading", { name: "Reconcile an account" }),
  ).toBeVisible();
});
