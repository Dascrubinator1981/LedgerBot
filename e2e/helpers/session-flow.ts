import { openReview } from "./open-review";
import { expect, type Page } from "@playwright/test";
export async function sessionFlow(
  page: Page,
  other: Page,
  email: string,
  password: string,
) {
  await other.goto("/");
  await other
    .getByRole("button", { name: "Already registered? Sign in" })
    .click();
  await other.getByLabel("Email", { exact: true }).fill(email);
  await other
    .getByLabel("Password (at least 12 characters)", { exact: true })
    .fill(password);
  await other.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(other.getByRole("heading", { name: "Forecast" })).toBeVisible();
  await other.getByRole("link", { name: "Budget", exact: true }).click();
  await other
    .getByLabel("New category name")
    .fill("Synthetic revoked category");
  await other
    .getByRole("button", { name: "Prepare category", exact: true })
    .click();
  await openReview(other);
  await expect(other.getByRole("dialog")).toBeVisible();
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByRole("button", { name: "Refresh login list" }).click();
  await expect(page.getByText(/Current sign-in · Started/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review signing out this login" }),
  ).toHaveCount(1);
  await page
    .getByRole("button", { name: "Review signing out this login" })
    .click();
  await page.getByRole("button", { name: "Keep logins signed in" }).click();
  expect((await other.request.get("/api/state")).status()).toBe(200);
  await page
    .getByRole("button", { name: "Review signing out this login" })
    .click();
  await page.getByRole("button", { name: "Confirm sign-out" }).click();
  await expect(
    page.getByRole("button", { name: "Review signing out this login" }),
  ).toHaveCount(0);
  expect((await other.request.get("/api/state")).status()).toBe(401);
  await other
    .getByRole("dialog")
    .getByRole("button", { name: "Use accessible confirmation" })
    .click();
  await other
    .getByRole("dialog")
    .getByRole("button", { name: "Confirm these exact changes" })
    .click();
  await expect(
    other.getByRole("button", { name: "Sign in", exact: true }),
  ).toBeVisible();
  expect(
    (await (await page.request.get("/api/state")).json()).categories,
  ).toEqual([]);
}
