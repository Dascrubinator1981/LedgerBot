import {
  addDays,
  balance,
  forecast,
  liability,
  sumMoney,
  type FinanceState,
} from "./domain";
import { budgetProgress } from "./insights";
import { defaultForecastPreferences } from "./forecast-preferences";
export function weekBounds(today: string) {
  const d = new Date(`${today}T12:00:00Z`);
  const start = addDays(today, -d.getUTCDay());
  return { start, end: addDays(start, 6) };
}
export function forecastAssessment(state: FinanceState, today: string) {
  const prefs = state.settings.forecaster || defaultForecastPreferences();
  const cash = state.accounts.filter((a) =>
    ["checking", "savings", "cash"].includes(a.type),
  );
  const projections = cash.map((a) => ({
    account: a,
    actual: balance(a, state.transactions, today),
    projection: forecast({ ...state, accounts: [a] }, today, prefs.horizon),
  }));
  const budget = budgetProgress(state, today.slice(0, 7), today);
  const overdrawn = projections.filter(
    (a) => a.actual !== null && a.actual < 0,
  );
  const shortages = projections.filter((a) =>
    a.projection.days.some((d) => d.amount !== null && d.amount < 0),
  );
  const low = projections.filter((a) =>
    a.projection.days.some(
      (d) => d.amount !== null && d.amount < prefs.lowBalanceCents,
    ),
  );
  const over = budget.rows.filter((r) => r.actual > r.target);
  const pendingOver = budget.rows.filter(
    (r) => sumMoney([r.actual, r.pending]) > r.target,
  );
  const near = budget.rows.filter(
    (r) =>
      r.target > 0 &&
      BigInt(
        sumMoney(
          state.transactions
            .filter(
              (t) =>
                (t.status === "cleared" || t.status === "pending") &&
                !t.transferId &&
                !t.occurrence &&
                t.flow !== "income" &&
                (t.amount < 0 || t.flow === "refund") &&
                t.date.startsWith(today.slice(0, 7)),
            )
            .flatMap((t) =>
              t.splits
                .filter((s) => s.categoryId === r.categoryId)
                .map((s) => -s.amount),
            ),
        ),
      ) *
        100n >=
        BigInt(r.target) * BigInt(prefs.nearBudgetPercent),
  );
  const reasons: string[] = [];
  if (overdrawn.length) reasons.push("A recorded cash account is overdrawn.");
  if (shortages.length) reasons.push("Entered plans project a cash shortage.");
  if (low.length && !shortages.length)
    reasons.push("An account falls below your configured cash cushion.");
  if (over.length) reasons.push("A budget category exceeds its target.");
  if (budget.configured && budget.totalActual > budget.totalTarget)
    reasons.push("Cleared spending exceeds the overall budget plan.");
  if (
    (pendingOver.length ||
      (budget.configured &&
        sumMoney([budget.totalActual, budget.pending]) > budget.totalTarget)) &&
    !over.length
  )
    reasons.push(
      "Pending / planned spending would exceed a budget target. It is not cleared spending yet.",
    );
  const incomplete =
    !cash.length ||
    state.accounts.some(
      (a) => balance(a, state.transactions, today) === null,
    ) ||
    !budget.configured ||
    !state.recurrences.some(
      (r) => r.active !== false && !r.archived && r.amount < 0,
    ) ||
    !state.recurrences.some(
      (r) => r.active !== false && !r.archived && r.amount > 0,
    );
  const level = reasons.length
    ? "red"
    : near.length
      ? "yellow"
      : incomplete
        ? "unknown"
        : "green";
  if (level === "yellow")
    reasons.push(
      "Discretionary spending is nearing a category target; bills are excluded from this warning.",
    );
  if (incomplete)
    reasons.push(
      "Coverage is incomplete. Unknown balances or missing plans can change this outlook.",
    );
  if (level === "green")
    reasons.push(
      "No shortfall in the entered plan; spending is within configured limits. This is not a bank guarantee.",
    );
  return {
    level,
    label:
      level === "red"
        ? "Needs attention"
        : level === "yellow"
          ? "Approaching a spending limit"
          : level === "unknown"
            ? "Needs information"
            : "On track with your entered plan",
    reasons,
    overdrawn: overdrawn.map((v) => v.account.id),
    shortages: shortages.map((v) => v.account.id),
  };
}
export function periodForecast(
  state: FinanceState,
  start: string,
  end: string,
  today: string,
) {
  const length =
    Math.round((Date.parse(end) - Date.parse(start)) / 86400000) + 1;
  const horizon = Math.max(
    1,
    Math.min(366, Math.round((Date.parse(end) - Date.parse(today)) / 86400000)),
  );
  const accounts = state.accounts.map((account) => {
    const signedAccount = {
      ...account,
      type: "cash",
      opening:
        account.opening === null
          ? null
          : liability(account)
            ? -account.opening
            : account.opening,
    };
    const projected = forecast(
      { ...state, accounts: [signedAccount] },
      today,
      horizon,
    );
    return { account, projected };
  });
  const all = forecast(state, today, horizon);
  const days = Array.from({ length }, (_, i) => addDays(start, i));
  return days.map((day) => ({
    date: day,
    balances: accounts.map(({ account, projected }) => {
      const amount =
        day <= today
          ? balance(account, state.transactions, day)
          : (projected.days.find((d) => d.date === day)?.amount ?? null);
      return {
        id: account.id,
        name: account.name,
        amount:
          day > today && amount !== null && liability(account)
            ? -amount
            : amount,
      };
    }),
    paid: sumMoney(
      state.transactions
        .filter(
          (t) =>
            t.status === "cleared" &&
            !t.transferId &&
            t.flow !== "income" &&
            t.date >= start &&
            t.date <= day &&
            t.date <= today,
        )
        .map((t) => -t.amount),
    ),
    expected: sumMoney(
      all.events
        .filter(
          (e) =>
            e.kind !== "transfer" &&
            e.amount < 0 &&
            e.date >= start &&
            e.date <= day,
        )
        .map((e) => -e.amount),
    ),
  }));
}
