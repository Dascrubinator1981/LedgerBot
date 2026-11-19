import { nextOccurrence, minor, type BudgetPeriod } from "./domain";
export function periodBudgetTarget(month: string, period: BudgetPeriod) {
  const end = new Date(
    Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5)), 0),
  )
    .toISOString()
    .slice(0, 10);
  const start = `${month}-01`;
  const occurrence = (i: number) =>
    nextOccurrence(
      period.anchor,
      period.cadence === "quarterly" ? "monthly" : period.cadence,
      i * (period.cadence === "quarterly" ? 3 : 1),
    );
  let low = 0,
    high = 10000;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (occurrence(mid) < start) low = mid + 1;
    else high = mid;
  }
  let count = 0;
  for (let i = low; i < 10000 && occurrence(i) <= end; i++) count++;
  return { count, target: minor.parse(period.amount * count) };
}
