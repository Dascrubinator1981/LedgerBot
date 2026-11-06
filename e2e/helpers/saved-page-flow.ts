import { expect, type Page } from "@playwright/test";
import { openReview } from "./open-review";
export async function savedPageFlow(
  page: Page,
  approve: (p: Page) => Promise<void>,
) {
  await page.getByRole("link", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Synthetic same-day pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("1000");
  const today = await page.getByLabel("Opening as-of date").inputValue();
  await expect(
    page.getByLabel("Opening balance timing", { exact: true }),
  ).toHaveValue("start-of-day");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  await approve(page);
  await page.getByRole("link", { name: "Ledger", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Synthetic same-day pocket · checking" });
  await page
    .getByLabel("Description", { exact: true })
    .fill("Synthetic interrupted purchase");
  await page.getByRole("link", { name: "Budget", exact: true }).click();
  await page
    .getByRole("dialog", { name: "Unfinished page changes" })
    .getByRole("button", { name: "Keep editing" })
    .click();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "Synthetic interrupted purchase",
  );
  await page.getByRole("link", { name: "Budget", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save changes for later review", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByLabel("Would you like to choose an expiration?")
    .selectOption("yes");
  await page
    .getByRole("dialog")
    .getByLabel("Review timeframe")
    .selectOption("today");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Save for later", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Budget", exact: true }),
  ).toBeVisible();
  let data = await (await page.request.get("/api/state")).json();
  expect(data.transactions).toEqual([]);
  const saved = data.proposals.find(
    (p: { status: string }) => p.status === "saved_for_later",
  );
  expect(saved).toBeTruthy();
  await page.reload();
  await page.getByRole("link", { name: /^Inbox/ }).click();
  await page.getByRole("button", { name: "Resume saved review" }).click();
  await expect(page.getByLabel("Description", { exact: true })).toHaveValue(
    "Synthetic interrupted purchase",
  );
  await expect(
    page.getByLabel("Signed amount ($)", { exact: true }),
  ).toHaveValue("");
  await page.getByLabel("Date", { exact: true }).fill(today);
  await page.getByLabel("Entry type", { exact: true }).selectOption("expense");
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("185");
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await openReview(page);
  await expect(page.getByRole("dialog")).toContainText("$815.00");
  await approve(page);
  data = await (await page.request.get("/api/state")).json();
  expect(data.transactions).toHaveLength(1);
  expect(
    data.proposals.find((p: { id: string }) => p.id === saved.id).status,
  ).toBe("completed");
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(page.locator("#forecast")).toContainText("$815.00");
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
}
