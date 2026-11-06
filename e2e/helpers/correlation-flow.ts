import { openReview } from "./open-review";
import { expect, type Page } from "@playwright/test";
async function approve(page: Page) {
  await openReview(page);
  const dialog = page.getByRole("dialog");
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
export async function correlationFlow(page: Page) {
  const today = new Date().toISOString().slice(0, 10),
    month = today.slice(0, 7);
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Correlation pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("1000");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  await approve(page);
  await page.getByRole("link", { name: "Budget", exact: true }).click();
  await page.getByLabel("New category name").fill("Correlation bills");
  await page
    .getByRole("button", { name: "Prepare category", exact: true })
    .click();
  await approve(page);
  await page
    .getByLabel("Budget category", { exact: true })
    .selectOption({ label: "Correlation bills" });
  await page.getByLabel("Budget month", { exact: true }).fill(month);
  await page.getByLabel("Planned target ($)").fill("100");
  await page.getByRole("button", { name: "Prepare budget target" }).click();
  await approve(page);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByText("Manage forecast bills and income plans", { exact: true })
    .click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Correlation pocket · checking" });
  await page.getByLabel("Schedule name").fill("Correlation water bill");
  await page.getByLabel("Signed recurring amount ($)").fill("-100");
  await page.getByLabel("First due / expected date").fill(today);
  await page
    .getByRole("button", { name: "Prepare recurring assumption" })
    .click();
  await approve(page);
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  async function enter(description: string, amount: string, link: boolean) {
    await page
      .getByLabel("Account", { exact: true })
      .selectOption({ label: "Correlation pocket · checking" });
    await page.getByLabel("Date", { exact: true }).fill(today);
    await page.getByLabel("Description", { exact: true }).fill(description);
    await page.getByLabel("Signed amount ($)", { exact: true }).fill(amount);
    if (link) {
      await page
        .getByLabel("Split 1 category", { exact: true })
        .selectOption({ label: "Correlation bills" });
      await page
        .getByLabel("Split 1 signed amount ($)", { exact: true })
        .fill(amount);
      await page
        .getByLabel("Recurring bill / income (optional)", { exact: true })
        .selectOption({ label: "Correlation water bill · bill" });
      await page.getByLabel("Occurrence due date", { exact: true }).fill(today);
    }
    await page
      .getByRole("button", { name: "Prepare transaction for review" })
      .click();
  }
  await enter("Correlation water bill", "-5", false);
  await approve(page);
  expect(
    (await (await page.request.get("/api/overview")).json()).recentBills,
  ).toEqual([]);
  await enter("Approved correlation payment", "-100", true);
  const before = await (await page.request.get("/api/overview")).json();
  expect(before.budget.totalActual).toBe(500);
  expect(before.recentBills).toEqual([]);
  await expect(
    page.getByRole("dialog").getByText("[object Object]", { exact: true }),
  ).toHaveCount(0);
  await approve(page);
  let after = await (await page.request.get("/api/overview")).json();
  expect(after.budget.totalActual).toBe(10500);
  expect(after.budget.status).toBe("Over budget");
  expect(after.forecast.opening).toBe(89500);
  expect(after.forecast.days[0].amount).toBe(89500);
  expect(after.recentBills).toHaveLength(1);
  expect(after.recentBills[0].amount).toBe(10000);
  await page.getByRole("link", { name: "Budget", exact: true }).click();
  await expect(page.getByTestId("budget-actual")).toHaveText("$105.00");
  await expect(page.getByTestId("budget-status")).toHaveText("Over budget");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.getByTestId("budget-actual")).toHaveText("$105.00");
  const original = await (await page.request.get("/api/state")).json();
  await page
    .getByRole("link", { name: "Open budget filters from graph", exact: true })
    .click();
  await expect(page).toHaveURL(/section=budget&month=\d{4}-\d{2}/);
  await expect(
    page.getByRole("heading", { name: "Explore your budget" }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Correlation bills", exact: true })
    .uncheck();
  await expect(page.getByTestId("budget-actual")).toHaveText("$5.00");
  await expect(page.getByTestId("budget-status")).toHaveCount(0);
  await page
    .getByRole("checkbox", { name: "Uncategorized", exact: true })
    .uncheck();
  await expect(page.getByTestId("budget-actual")).toHaveCount(0);
  await expect(
    page.getByText("No spending matches these filters."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear budget filters" }).click();
  await expect(page.getByTestId("budget-actual")).toHaveText("$105.00");
  expect(await (await page.request.get("/api/state")).json()).toEqual(original);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Explore your budget" }),
  ).toBeVisible();
  await expect(page.getByTestId("budget-actual")).toHaveText("$105.00");
  const chartMonth = await page
    .getByLabel("Chart month", { exact: true })
    .inputValue();
  const anotherMonth =
    chartMonth.slice(0, 4) + (chartMonth.endsWith("-01") ? "-02" : "-01");
  await page.getByLabel("Chart month", { exact: true }).fill(anotherMonth);
  await page.reload();
  await expect(page.getByLabel("Chart month", { exact: true })).toHaveValue(
    anotherMonth,
  );
  await page.getByLabel("Chart month", { exact: true }).fill(chartMonth);
  await expect(page.getByTestId("budget-actual")).toHaveText("$105.00");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  const recent = page.locator("#forecast section.card").filter({
    has: page.getByRole("heading", {
      name: "Bill payments in the last 7 days",
      exact: true,
    }),
  });
  await expect(
    recent.getByRole("cell", { name: "Correlation water bill", exact: true }),
  ).toHaveCount(1);
  await expect(
    recent.getByRole("cell", { name: "$100.00", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  const row = page
    .getByRole("row")
    .filter({ hasText: "Approved correlation payment" });
  await row.getByRole("button", { name: "Review delete", exact: true }).click();
  await approve(page);
  after = await (await page.request.get("/api/overview")).json();
  expect(after.budget.totalActual).toBe(500);
  expect(after.recentBills).toEqual([]);
  expect(after.forecast.opening).toBe(99500);
  expect(after.forecast.days[0].amount).toBe(89500);
  await page.getByRole("link", { name: /Inbox/ }).click();
  await page
    .getByRole("button", { name: "Review undo deletion", exact: true })
    .click();
  await approve(page);
  after = await (await page.request.get("/api/overview")).json();
  expect(after.budget.totalActual).toBe(10500);
  expect(after.recentBills).toHaveLength(1);
  expect(after.forecast.opening).toBe(89500);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page
    .getByRole("button", { name: "Review export", exact: true })
    .click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Confirm private download" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/ledgerbot-.*\.json$/);
}
