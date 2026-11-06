import { expect, type Page } from "@playwright/test";
export async function ownerFeedbackFlow(
  page: Page,
  approve: (page: Page) => Promise<void>,
) {
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Fictional owner check");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("1000");
  const today = await page.getByLabel("Opening as-of date").inputValue();
  const yesterday = new Date(`${today}T12:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  await page
    .getByLabel("Opening as-of date")
    .fill(yesterday.toISOString().slice(0, 10));
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
    .fill("Fictional owner groceries");
  await page.getByLabel("Planned target ($)").fill("100");
  await page.getByRole("button", { name: "Prepare budget target" }).click();
  await approve(page);
  // Additional categories use the existing independently reviewed path.
  for (const name of [
    "Fictional owner household",
    "Fictional owner automotive",
  ]) {
    await page.getByLabel("New category name", { exact: true }).fill(name);
    await page
      .getByRole("button", { name: "Prepare category", exact: true })
      .click();
    await approve(page);
  }
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Fictional owner check · checking" });
  await page
    .getByLabel("Description", { exact: true })
    .fill("Fictional split purchase");
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("185");
  await page.getByLabel("Entry type", { exact: true }).selectOption("expense");
  const tomorrow = new Date(`${today}T12:00:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  await page
    .getByLabel("Date", { exact: true })
    .fill(tomorrow.toISOString().slice(0, 10));
  for (let i = 0; i < 3; i++) {
    if (i)
      await page.getByRole("button", { name: "Add another split" }).click();
    await page
      .getByLabel(`Split ${i + 1} category`, { exact: true })
      .selectOption({
        label: [
          "Fictional owner groceries",
          "Fictional owner household",
          "Fictional owner automotive",
        ][i],
      });
    await page
      .getByLabel(`Split ${i + 1} signed amount ($)`)
      .fill(["80", "50", "55"][i]);
  }
  const prepare = page.getByRole("button", {
    name: "Prepare transaction for review",
  });
  await prepare.click();
  const form = page.locator("form").filter({ has: prepare });
  await expect(form.getByRole("alert")).toContainText("future dates");
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "Fictional split purchase",
  );
  await page.getByLabel("Date", { exact: true }).fill(today);
  await prepare.click();
  await expect(page.getByRole("dialog")).toContainText("$815.00");
  await approve(page);
  let state = await (await page.request.get("/api/state")).json();
  expect(state.transactions[0].amount).toBe(-18500);
  const overview = await (await page.request.get("/api/overview")).json();
  expect(overview.budget.totalActual).toBe(18500);
  expect(overview.budget.totalTarget).toBe(10000);
  expect(overview.budget.rows[0].actual).toBe(8000);
  expect(overview.budget.rows[0].remaining).toBe(2000);
  expect(overview.forecast.opening).toBe(81500);
  expect(
    state.transactions[0].splits.map((s: { amount: number }) => s.amount),
  ).toEqual([-8000, -5000, -5500]);
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Fictional owner check · checking" });
  await page.getByLabel("Statement ending balance ($)").fill("1000");
  const compare = page.getByRole("button", {
    name: "Compare and prepare reconciliation",
  });
  await compare.click();
  await expect(
    page.locator("form").filter({ has: compare }).getByRole("alert"),
  ).toContainText("differ");
  await page.getByLabel("Statement ending balance ($)").fill("815");
  await compare.click();
  await approve(page);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByLabel("Dashboard forecast horizon").selectOption("7");
  await page.getByLabel("Show daily estimates and assumptions").check();
  await page.getByRole("button", { name: "Save Forecaster display" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Forecaster display saved",
  );
  state = await (await page.request.get("/api/state")).json();
  const rejected = await page.request.patch("/api/state", {
    headers: { origin: new URL(page.url()).origin, "x-csrf-token": state.csrf },
    data: {
      ...state.settings,
      forecaster: {
        ...state.settings.forecaster,
        accountIds: [crypto.randomUUID()],
      },
    },
  });
  expect(rejected.status()).toBe(400);
  await page.reload();
  await expect(page.getByLabel("Dashboard forecast horizon")).toHaveValue("7");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.locator("#forecast")).toContainText("$815.00");
  await expect(page.locator("#forecast")).toContainText("7 days");
  // Today plus seven following days; the existing engine includes its opening day.
  await expect(page.locator("#forecast tbody tr")).toHaveCount(8);
  expect(
    (await page.locator(".finance-chart").first().boundingBox())!.height,
  ).toBeLessThanOrEqual(240);
  await page
    .getByRole("button", { name: "Configure Forecaster in Settings" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("Dashboard forecast horizon")).toHaveValue("7");
}
