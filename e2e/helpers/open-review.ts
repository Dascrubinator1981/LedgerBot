import { expect, type Page } from "@playwright/test";
export async function openReview(page: Page) {
  const dialog = page
    .getByRole("dialog")
    .filter({
      has: page.getByRole("heading", {
        name: /Review these exact changes|Confirm this reviewed change/,
      }),
    });
  const button = page.getByRole("button", {
    name: "Review staged changes",
    exact: true,
  });
  await expect
    .poll(
      async () =>
        (await dialog.isVisible()) ||
        ((await button.isVisible()) && (await button.isEnabled())),
    )
    .toBe(true);
  if (!(await dialog.isVisible())) await button.click();
  await expect(dialog).toBeVisible();
}
