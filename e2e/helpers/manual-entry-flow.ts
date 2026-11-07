import { expect, type Page } from "@playwright/test";
import { openReview } from "./open-review";
export async function manualEntryFlow(
  page: Page,
  approve: (page: Page) => Promise<void>,
) {
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Synthetic flexible pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("1000");
  await page
    .getByLabel("Opening balance timing", { exact: true })
    .selectOption("end-of-day");
  const today = await page.getByLabel("Opening as-of date").inputValue();
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  await approve(page);
  await page.getByRole("link", { name: "Budget", exact: true }).click();
  await page
    .getByLabel("Budget category", { exact: true })
    .selectOption("+add");
  await page
    .getByLabel("New budget category name")
    .fill("Synthetic pending groceries");
  await page.getByLabel("Planned target ($)").fill("100");
  await page.getByRole("button", { name: "Prepare budget target" }).click();
  await approve(page);
  for (const name of [
    "Synthetic pending household",
    "Synthetic pending automotive",
  ]) {
    await page.getByLabel("New category name", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Prepare category", exact: true })
      .click();
    await approve(page);
  }
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Synthetic flexible pocket · checking" });
  await page.getByLabel("Date", { exact: true }).fill(today);
  await page
    .getByLabel("Description", { exact: true })
    .fill("Synthetic human purchase");
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("185");
  await page.getByLabel("Entry type", { exact: true }).selectOption("expense");
  await page.getByLabel("Status", { exact: true }).selectOption("pending");
  await expect(
    page.getByRole("checkbox", {
      name: "Already included in my starting balance",
      exact: true,
    }),
  ).not.toBeChecked();
  for (let i = 0; i < 3; i++) {
    if (i)
      await page.getByRole("button", { name: "Add another split" }).click();
    await page
      .getByLabel(`Split ${i + 1} category`, { exact: true })
      .selectOption({
        label: [
          "Synthetic pending groceries",
          "Synthetic pending household",
          "Synthetic pending automotive",
        ][i],
      });
    await page
      .getByLabel(`Split ${i + 1} signed amount ($)`)
      .fill(["80", "50", "55"][i]);
  }
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await openReview(page);
  await expect(page.getByRole("dialog")).toContainText("$1,000.00 → $1,000.00");
  await expect(page.getByRole("dialog")).not.toContainText("balanceAnchor");
  await approve(page);
  let data = await (await page.request.get("/api/state")).json();
  const originalId = data.transactions[0].id;
  expect(data.transactions).toHaveLength(1);
  expect(data.accounts[0].openingBasis).toBe("end-of-day");
  expect(data.transactions[0].status).toBe("pending");
  await page.getByRole("link", { name: "Budget", exact: true }).click();
  await expect(page.getByTestId("budget-actual")).toHaveText("$0.00");
  await expect(page.getByTestId("budget-pending-line")).toHaveAttribute(
    "stroke-dasharray",
    "2 5",
  );
  const groceryCard = page.locator(".card").filter({
    has: page.getByRole("heading", {
      name: "Synthetic pending groceries",
      exact: true,
      level: 2,
    }),
  });
  await expect(groceryCard).toContainText("Pending / planned: $80.00");
  let overview = await (await page.request.get("/api/overview")).json();
  expect(overview.budget.pending).toBe(18500);
  expect(overview.forecast.opening).toBe(100000);
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  const row = page
    .locator("#ledger-register tbody tr")
    .filter({ hasText: "Synthetic human purchase" });
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await page
    .getByLabel("Description", { exact: true })
    .fill("Readable synthetic shop");
  await page.getByLabel("Status", { exact: true }).selectOption("cleared");
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await openReview(page);
  await expect(page.getByRole("dialog")).toContainText("$1,000.00 → $815.00");
  await approve(page);
  data = await (await page.request.get("/api/state")).json();
  expect(data.transactions).toHaveLength(1);
  expect(data.transactions[0].id).toBe(originalId);
  expect(data.transactions[0].status).toBe("cleared");
  overview = await (await page.request.get("/api/overview")).json();
  expect(overview.budget.totalActual).toBe(18500);
  expect(overview.budget.pending).toBe(0);
  expect(overview.forecast.opening).toBe(81500);
  await page.getByRole("button", { name: "Add entry", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Synthetic flexible pocket · checking" });
  const previous = new Date(`${today}T12:00:00Z`);
  previous.setUTCDate(previous.getUTCDate() - 1);
  await page
    .getByLabel("Date", { exact: true })
    .fill(previous.toISOString().slice(0, 10));
  await page
    .getByLabel("Description", { exact: true })
    .fill("Synthetic already included history");
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("10");
  await page.getByLabel("Entry type", { exact: true }).selectOption("expense");
  await page
    .getByRole("checkbox", {
      name: "Already included in my starting balance",
      exact: true,
    })
    .check();
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await openReview(page);
  await expect(page.getByRole("dialog")).toContainText("$815.00 → $815.00");
  await approve(page);
  data = await (await page.request.get("/api/state")).json();
  expect(data.transactions).toHaveLength(2);
  expect(
    (await (await page.request.get("/api/overview")).json()).forecast.opening,
  ).toBe(81500);
}
