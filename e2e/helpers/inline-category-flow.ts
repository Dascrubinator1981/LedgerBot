import { expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
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
export async function inlineCategoryFlow(page: Page) {
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Synthetic inline pocket");
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
    .selectOption({ label: "Synthetic inline pocket · checking" });
  await page.getByLabel("Date", { exact: true }).fill("2026-01-02");
  await page
    .getByLabel("Description", { exact: true })
    .fill("Synthetic preserved purchase");
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("-12.34");
  await page.getByLabel("Split 1 signed amount ($)").fill("-12.34");
  await page
    .getByLabel("Split 1 category", { exact: true })
    .selectOption("+add");
  await page
    .getByLabel("New category for Split 1 category")
    .fill("Synthetic groceries");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByLabel("New category for Split 1 category").press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  let data = await (await page.request.get("/api/state")).json();
  expect(data.categories).toEqual([]);
  expect(data.transactions).toEqual([]);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: /Cancel|Keep.*draft/i })
    .click();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "Synthetic preserved purchase",
  );
  await expect(
    page.getByLabel("Signed amount ($)", { exact: true }),
  ).toHaveValue("-12.34");
  await page
    .getByLabel("Split 1 category", { exact: true })
    .selectOption("+add");
  await expect(
    page.getByLabel("New category for Split 1 category"),
  ).toHaveValue("Synthetic groceries");
  await page
    .getByRole("button", { name: "Review new category", exact: true })
    .click();
  await approve(page);
  await expect(page.getByLabel("Account", { exact: true })).toHaveValue(
    data.accounts[0].id,
  );
  await expect(page.getByLabel("Date", { exact: true })).toHaveValue(
    "2026-01-02",
  );
  await expect(page.getByLabel("Split 1 signed amount ($)")).toHaveValue(
    "-12.34",
  );
  await page
    .getByLabel("Split 1 category", { exact: true })
    .selectOption({ label: "Synthetic groceries" });
  data = await (await page.request.get("/api/state")).json();
  expect(data.categories).toHaveLength(1);
  expect(data.transactions).toEqual([]);
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await approve(page);
  await expect(
    page.getByRole("cell", { name: "$87.66", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Budget", exact: true }).click();
  await page.getByLabel("Planned target ($)").fill("123.45");
  await page
    .getByLabel("Budget category", { exact: true })
    .selectOption({ label: "Synthetic groceries" });
  await page
    .getByLabel("Budget category", { exact: true })
    .selectOption("+add");
  await page
    .getByLabel("New category for Budget category")
    .fill("Synthetic household");
  await page
    .getByRole("button", { name: "Keep working without adding" })
    .click();
  await expect(page.getByLabel("Budget category", { exact: true })).toHaveValue(
    data.categories[0].id,
  );
  await page
    .getByLabel("Budget category", { exact: true })
    .selectOption("+add");
  await page
    .getByRole("button", { name: "Review new category", exact: true })
    .click();
  await approve(page);
  await expect(page.getByLabel("Planned target ($)")).toHaveValue("123.45");
  await page
    .getByLabel("Budget category", { exact: true })
    .selectOption({ label: "Synthetic household" });
  data = await (await page.request.get("/api/state")).json();
  expect(data.categories).toHaveLength(2);
  expect(data.transactions).toHaveLength(1);
  expect(data.budgets).toEqual([]);
}
