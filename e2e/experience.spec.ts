import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("deep links, reminder persistence, keyboard, zoom, and cross-tab financial invalidation", async ({
  page,
  context,
}) => {
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`experience-${crypto.randomUUID()}@example.test`);
  await page
    .getByLabel("Password (at least 12 characters)")
    .fill("fabricated-experience-password");
  await page.getByRole("button", { name: "Create my empty account" }).click();
  await expect(
    page.getByRole("heading", { name: "Your financial workspace" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/section=settings/);
  await page
    .getByRole("button", { name: "Dismiss budget reminder", exact: true })
    .click();
  await expect(page.getByText("Reminder dismissed")).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Restore budget reminder" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    document.documentElement.style.zoom = "2";
  });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.evaluate(() => {
    document.documentElement.style.zoom = "1";
  });
  await page.setViewportSize({ width: 1280, height: 900 });
  const other = await context.newPage();
  await other.goto("/?section=accounts");
  await expect(
    other.getByRole("heading", { name: "Accounts", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Synthetic synchronized pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("0");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page.getByRole("button", { name: "Prepare account for review" }).click();
  const dialog = page.getByRole("dialog");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await dialog
    .getByRole("button", { name: "Use accessible confirmation" })
    .click();
  await dialog
    .getByRole("button", { name: "Confirm these exact changes" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(dialog).not.toBeVisible();
  await expect(
    other.getByRole("heading", {
      name: "Synthetic synchronized pocket",
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sign out", exact: true })
    .first()
    .click();
  await expect(
    other.getByRole("button", { name: "Create my empty account" }),
  ).toBeVisible();
  await other.close();
});
