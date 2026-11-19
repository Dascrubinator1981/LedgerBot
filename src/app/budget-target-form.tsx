"use client";
import { useEffect, useRef, useState } from "react";
import type { FinanceState } from "@/lib/domain";
import { parseMoney, type BudgetPeriod } from "@/lib/domain";
import { Input, Field } from "./components";
import { LabelEntry } from "./label-entry";
import type { SubmitFinance } from "./planning-forms";
export function BudgetTargetForm({
  state,
  month,
  busy,
  submit,
}: {
  state: FinanceState;
  month: string;
  busy: boolean;
  submit: SubmitFinance;
}) {
  const [category, setCategory] = useState("");
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const element = form.current;
    const reset = () => setCategory("");
    element?.addEventListener("reset", reset);
    return () => element?.removeEventListener("reset", reset);
  }, []);
  return (
    <section className="card">
      <h2>Monthly PLAN</h2>
      <p>
        Choose an exact amount and period. The selected month’s target counts
        actual weekly, two-week, monthly or quarterly allocation dates, never an
        average. A new category and its target are saved together after review.
        Targets do not withdraw money or automatically create future month
        plans.
      </p>
      <form
        data-financial="true"
        ref={form}
        onSubmit={(e) =>
          submit(e, (f) => ({
            kind: "budget",
            categoryId:
              category === "+add"
                ? crypto.randomUUID()
                : String(f.get("categoryId")),
            ...(category === "+add"
              ? { newCategory: { name: String(f.get("newBudgetCategory")) } }
              : {}),
            month: String(f.get("month")),
            target: parseMoney(String(f.get("target"))),
            period: {
              cadence: String(f.get("cadence")) as BudgetPeriod["cadence"],
              anchor: String(f.get("anchor")),
              amount: parseMoney(String(f.get("target"))),
            },
          }))
        }
      >
        <div className="fields">
          <Field label="Budget category">
            <select
              name="categoryId"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="">Choose category</option>
              <option value="+add">＋ Add a new category…</option>
              {state.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          {category === "+add" && (
            <LabelEntry
              label="New budget category name"
              name="newBudgetCategory"
              existing={state.categories.map((c) => c.name)}
              onUseExisting={(name) =>
                setCategory(state.categories.find((c) => c.name === name)!.id)
              }
            />
          )}
          <Input label="Budget month" name="month" type="month" value={month} />
          <Input label="Planned target ($)" name="target" />
          <Field label="Budget frequency">
            <select name="cadence" defaultValue="monthly">
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly — every 14 days</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </Field>
          <Input
            label="Budget period start date"
            name="anchor"
            type="date"
            value={`${month}-01`}
          />
        </div>
        <div className="actions">
          <button disabled={busy}>Prepare budget target</button>
        </div>
      </form>
    </section>
  );
}
