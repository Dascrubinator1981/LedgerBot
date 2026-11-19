import { it, expect } from "vitest";
import { originalDraftValues } from "../src/lib/draft-fields";
import { formSnapshotSchema, type SingleOperation } from "../src/lib/domain";
const id = "69351361-d78e-422a-9800-c8feb00e337e";
it("restores original exact split values and drops changed sensitive fields", () => {
  const op: SingleOperation = {
    kind: "transaction",
    accountId: id,
    date: "2026-01-02",
    description: "Synthetic",
    amount: -1234,
    status: "cleared",
    splits: [{ categoryId: id, amount: -1234 }],
    flow: "expense",
    balanceImpact: "included",
    occurrence: null,
  };
  const values = Object.fromEntries(
    originalDraftValues(op, [
      ["amount", "99"],
      ["splitAmount-4", "99"],
      ["email", "unused"],
      ["billSettles", "on"],
      ["newCategoryName:category-0", "Unfinished"],
    ]),
  );
  expect(values).toMatchObject({
    amount: "-12.34",
    "splitAmount-0": "-12.34",
    "category-0": id,
    includedInOpening: "on",
    billRule: "",
    billDue: "",
  });
  expect(values).not.toHaveProperty("email");
  expect(values).not.toHaveProperty("splitAmount-4");
  expect(values).not.toHaveProperty("billSettles");
  expect(values).not.toHaveProperty("newCategoryName:category-0");
});
it("restores per-period budget amount rather than combined monthly total", () => {
  const values = Object.fromEntries(
    originalDraftValues(
      {
        kind: "budget",
        categoryId: id,
        month: "2026-05",
        target: 50005,
        period: { cadence: "weekly", anchor: "2026-05-01", amount: 10001 },
      },
      [["newBudgetCategory", "Changed"]],
    ),
  );
  expect(values).toMatchObject({
    target: "100.01",
    cadence: "weekly",
    anchor: "2026-05-01",
  });
  expect(values).not.toHaveProperty("newBudgetCategory");
});
it("rejects credentials even inside original saved-edit values", () => {
  const snapshot = {
    section: "Ledger",
    formIndex: 0,
    values: [],
    replaces: {
      index: 0,
      operation: { kind: "category", name: "Synthetic" },
      originalValues: [["password", "unused"]],
    },
  };
  expect(formSnapshotSchema.safeParse(snapshot).success).toBe(false);
  snapshot.replaces.originalValues = [["name", "Synthetic"]];
  expect(formSnapshotSchema.safeParse(snapshot).success).toBe(true);
});
