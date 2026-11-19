"use client";
import { useEffect, useState } from "react";
import { reminderVisible, type Reminders } from "@/lib/reminders";
import type { FinanceState } from "@/lib/domain";
import type { Section } from "@/lib/navigation";
export function SetupReminders({
  state,
  busy,
  save,
  navigate,
}: {
  state: FinanceState;
  busy: boolean;
  save: (reminders: Reminders) => void;
  navigate: (section: Section) => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const values = state.settings.reminders || {};
  const items = [
    {
      key: "accounts" as const,
      name: "Add a manual account",
      section: "Accounts" as const,
      done: state.accounts.length > 0,
    },
    {
      key: "budget" as const,
      name: "Set a monthly budget target",
      section: "Budget" as const,
      done: state.budgets.length > 0,
    },
    {
      key: "forecast" as const,
      name: "Review recurring bills and income",
      section: "Forecaster" as const,
      done: state.recurrences.length > 0,
    },
  ];
  return (
    <section className="card">
      <h2>Setup checklist</h2>
      <p>
        Each reminder has its own preference. Hiding a reminder does not change
        financial records or forecast coverage warnings.
      </p>
      {items.map((item) => {
        const visible = !item.done && reminderVisible(values[item.key], now);
        return (
          <div className="card" key={item.key}>
            <h3>{item.name}</h3>
            <p>
              {item.done
                ? "Configured — review whenever needed"
                : visible
                  ? "Available when you are ready"
                  : `Reminder ${values[item.key]?.status}`}
            </p>
            <div className="actions">
              <button onClick={() => navigate(item.section)}>
                Open {item.section}
              </button>
              {visible ? (
                <>
                  <button
                    disabled={busy}
                    onClick={() =>
                      save({
                        ...values,
                        [item.key]: {
                          status: "snoozed",
                          until: Date.now() + 7 * 86400000,
                        },
                      })
                    }
                  >
                    Snooze {item.key} for 7 days
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      save({ ...values, [item.key]: { status: "dismissed" } })
                    }
                  >
                    Dismiss {item.key} reminder
                  </button>
                  <button
                    disabled={busy}
                    onClick={() =>
                      save({
                        ...values,
                        [item.key]: { status: "not-applicable" },
                      })
                    }
                  >
                    {item.key}: not applicable
                  </button>
                </>
              ) : (
                !item.done && (
                  <button
                    disabled={busy}
                    onClick={() =>
                      save({ ...values, [item.key]: { status: "active" } })
                    }
                  >
                    Restore {item.key} reminder
                  </button>
                )
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
