"use client";
import { useEffect, useRef, useState } from "react";
import type { FinanceState } from "@/lib/domain";
import { parseMoney } from "@/lib/domain";
import { Input, Field } from "./components";
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
        Set an exact monthly target. A new category and its target are reviewed
        and saved together; neither changes your account balance.
      </p>
      <form
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
            <Input label="New budget category name" name="newBudgetCategory" />
          )}
          <Input label="Budget month" name="month" type="month" value={month} />
          <Input label="Planned target ($)" name="target" />
        </div>
        <div className="actions">
          <button disabled={busy}>Prepare budget target</button>
        </div>
      </form>
    </section>
  );
}
