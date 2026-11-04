import { test, expect, type Page } from "@playwright/test";
async function signup(page: Page) {
  await page.goto("/");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`synthetic-${crypto.randomUUID()}@example.test`);
  await page
    .getByLabel("Password (at least 12 characters)")
    .fill("fabricated-password-123");
  await page.getByRole("button", { name: "Create my empty account" }).click();
  await expect(
    page.getByRole("heading", { name: "Your financial workspace" }),
  ).toBeVisible();
}
async function approve(page: Page) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: "Use accessible confirmation" })
    .click();
  await dialog
    .getByRole("button", { name: "Confirm these exact changes" })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("status")).toContainText("Change saved");
}
test("two users, empty start, reviewed account, expense, reload, and isolation", async ({
  page,
  browser,
}) => {
  await signup(page);
  await expect(
    page.getByText("A fresh start. Nothing added yet."),
  ).toBeVisible();
  await expect(page.getByText("$0.00", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Skip setup", exact: true }).click();
  await page.getByRole("button", { name: "Accounts", exact: true }).click();
  await page
    .getByLabel("Account name", { exact: true })
    .fill("Fictional pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("100");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  await expect(
    page.getByRole("dialog").getByText("Nothing saved yet.", { exact: false }),
  ).toBeVisible();
  const uncommitted = await page.request.get("/api/state");
  expect((await uncommitted.json()).accounts).toHaveLength(0);
  await approve(page);
  await page.getByRole("button", { name: "Ledger", exact: true }).click();
  await page
    .getByLabel("Account", { exact: true })
    .selectOption({ label: "Fictional pocket · checking" });
  await page.getByLabel("Date", { exact: true }).fill("2026-01-02");
  await page.getByLabel("Description", { exact: true }).fill("Fictional snack");
  await page.getByLabel("Signed amount ($)", { exact: true }).fill("-15");
  await page
    .getByRole("button", { name: "Prepare transaction for review" })
    .click();
  await approve(page);
  await expect(
    page.getByRole("cell", { name: "$85.00", exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole("button", { name: "Ledger", exact: true }).click();
  await expect(
    page.getByRole("cell", { name: /Fictional snack/ }),
  ).toBeVisible();
  const other = await browser.newContext();
  const bob = await other.newPage();
  await signup(bob);
  await expect(
    bob.getByText("A fresh start. Nothing added yet."),
  ).toBeVisible();
  const response = await bob.request.get("/api/state"),
    data = await response.json();
  expect(data.accounts).toEqual([]);
  expect(data.transactions).toEqual([]);
  const aliceData = await (await page.request.get("/api/state")).json();
  const denied = await bob.request.post("/api/proposals", {
    headers: { origin: "http://127.0.0.1:3100", "x-csrf-token": data.csrf },
    data: { kind: "deleteTransaction", id: aliceData.transactions[0].id },
  });
  expect(denied.status()).toBe(400);
  const forged = await page.request.post("/api/proposals", {
    headers: { origin: "http://127.0.0.1:3100", "x-csrf-token": "forged" },
    data: { kind: "category", name: "Forgery" },
  });
  expect(forged.status()).toBe(400);
  await other.close();
});
test("cancelled review stays a draft, keyboard confirmation saves known zero", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signup(page);
  await page.getByRole("button", { name: "Accounts", exact: true }).click();
  await page.getByLabel("Account name", { exact: true }).fill("Zero pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("0");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel / save for later" })
    .click();
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(0);
  await page.getByRole("button", { name: /Inbox/ }).click();
  await page.getByRole("button", { name: "Review exact changes" }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByRole("button", { name: "Use accessible confirmation" })
    .focus();
  await page.keyboard.press("Enter");
  await dialog
    .getByRole("button", { name: "Confirm these exact changes" })
    .focus();
  await page.keyboard.press("Enter");
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Accounts", exact: true }).click();
  await expect(
    page.locator(".amount").getByText("$0.00", { exact: true }),
  ).toBeVisible();
});

test("slide requires release and aborted slide cannot commit", async ({
  page,
}) => {
  await signup(page);
  await page.getByRole("button", { name: "Accounts", exact: true }).click();
  await page.getByLabel("Account name", { exact: true }).fill("Gesture pocket");
  await page
    .getByLabel("Opening balance ($, positive owed for liabilities)")
    .fill("0");
  await page.getByLabel("Opening as-of date").fill("2026-01-01");
  await page
    .getByRole("button", { name: "Prepare account for review" })
    .click();
  const dialog = page.getByRole("dialog");
  const thumb = dialog.getByRole("button", {
    name: "Slide to confirm; accessible confirmation available below",
  });
  const box = (await thumb.boundingBox())!;
  const track = (await dialog.locator(".slide-track").boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width - 30, box.y + box.height / 2, {
    steps: 8,
  });
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(0);
  // Returning to the start before release must not commit.
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(
    track.x + track.width - 30,
    track.y + track.height + 40,
    { steps: 8 },
  );
  await page.mouse.up();
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(0);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(track.x + track.width - 30, box.y + box.height / 2, {
    steps: 8,
  });
  await page.mouse.up();
  await expect(dialog).not.toBeVisible();
  expect(
    (await (await page.request.get("/api/state")).json()).accounts,
  ).toHaveLength(1);
});
