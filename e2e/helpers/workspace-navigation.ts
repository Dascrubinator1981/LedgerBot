import { type Page } from "@playwright/test";
export async function openAccountCreation(page: Page) {
  if (
    await page
      .getByRole("heading", { name: "Accounts", exact: true })
      .isVisible()
  )
    await page
      .getByRole("tab", { name: "Create New Account", exact: true })
      .click();
}
export async function openBudgetEntry(page: Page) {
  if (
    await page.getByRole("heading", { name: "Budget", exact: true }).isVisible()
  )
    await page
      .getByRole("navigation", { name: "Budget sections" })
      .getByRole("button", { name: "Create New Budget", exact: true })
      .click();
}
export async function openCategories(page: Page) {
  if (
    await page.getByRole("heading", { name: "Budget", exact: true }).isVisible()
  )
    await page
      .getByRole("navigation", { name: "Budget sections" })
      .getByRole("button", { name: "Categories", exact: true })
      .click();
}
export async function openAccountTools(page: Page) {
  if (
    await page
      .getByRole("heading", { name: "Accounts", exact: true })
      .isVisible()
  ) {
    const summary = page.getByText("Account tools and reconciliation", {
      exact: true,
    });
    if (await summary.count()) {
      const open = await summary.evaluate((e) => !!e.closest("details")?.open);
      if (!open) await summary.click();
    }
  }
}
