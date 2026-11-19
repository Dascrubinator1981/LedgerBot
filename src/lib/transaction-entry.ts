import { parseMoney } from "./domain";
// The chosen entry type controls direction; an explicit expense accepts either
// a magnitude or an already signed amount. Mixed-direction splits remain invalid.
export function entryAmount(value: string, flow: string) {
  const amount = parseMoney(value);
  if (flow === "expense") return -Math.abs(amount);
  if (flow === "income" || flow === "refund") return Math.abs(amount);
  return amount;
}
