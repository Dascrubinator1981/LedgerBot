import { it, expect } from "vitest";
import { similarLabels, repeatedPrefix } from "../src/lib/label-suggestions";
it("suggests existing spelling/plural choices without assuming unrelated names are duplicates", () => {
  expect(similarLabels("Grocery", ["Groceries", "Fuel"])).toEqual([
    "Groceries",
  ]);
  expect(similarLabels("  GROCERIES ", ["Groceries"])).toEqual(["Groceries"]);
  expect(similarLabels("Groceris", ["Groceries"])).toEqual(["Groceries"]);
  expect(similarLabels("Rent", ["Fuel", "Restaurants"])).toEqual([]);
  expect(similarLabels("", ["Groceries"])).toEqual([]);
});
it("flags repeated prefixes as optional organization suggestions only", () => {
  const names = ["Grocery Food", "Grocery House", "Grocery Clothes"];
  expect(repeatedPrefix(names)).toEqual(names);
  expect(names[0]).toBe("Grocery Food");
});
