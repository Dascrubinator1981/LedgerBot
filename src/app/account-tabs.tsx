"use client";
import { useId, useRef, useState } from "react";
import type { Account } from "@/lib/domain";
import {
  orderedAccounts,
  type WorkspacePreferences,
} from "@/lib/workspace-preferences";
export function AccountLayoutSettings({
  accounts,
  preferences,
  busy,
  save,
}: {
  accounts: Account[];
  preferences: WorkspacePreferences;
  busy: boolean;
  save: (p: WorkspacePreferences) => void;
}) {
  const defaultSelectId = useId();
  const drag = useRef<string | null>(null);
  const ordered = orderedAccounts(accounts, preferences);
  const defaultId = preferences.defaultAccountId || ordered[0]?.id || "";
  function move(id: string, index: number) {
    if (id === defaultId) return;
    const ids = ordered.map((a) => a.id).filter((v) => v !== id);
    ids.splice(Math.max(1, index), 0, id);
    save({
      ...preferences,
      defaultAccountId: defaultId || null,
      accountOrder: ids,
    });
  }
  return (
    <section className="layout-editor" aria-label="Account layout settings">
      <h3>Account layout</h3>
      <label htmlFor={defaultSelectId}>Default account</label>
      <select
        id={defaultSelectId}
        value={defaultId}
        disabled={busy || !accounts.length}
        onChange={(e) =>
          save({
            ...preferences,
            defaultAccountId: e.target.value,
            accountOrder: ordered.map((a) => a.id),
          })
        }
      >
        {!accounts.length && <option value="">Add your first account</option>}
        {ordered.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <p className="muted">
        Your default stays first in Accounts and Ledger. Drag the other rows, or
        use Move up / Move down. This changes layout only.
      </p>
      <ol className="account-order">
        {ordered.map((a, i) => (
          <li
            key={a.id}
            draggable={!busy && i > 0}
            onDragStart={(e) => {
              drag.current = a.id;
              e.dataTransfer.setData("text/plain", a.id);
            }}
            onDragEnd={() => {
              drag.current = null;
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (drag.current) move(drag.current, i);
              drag.current = null;
            }}
          >
            <span>
              {a.name}
              {i === 0 ? " · default" : ""}
            </span>
            <div className="actions">
              <button
                type="button"
                disabled={busy || i < 2}
                aria-label={`Move ${a.name} up`}
                onClick={() => move(a.id, i - 1)}
              >
                Move up
              </button>
              <button
                type="button"
                disabled={busy || i === 0 || i === ordered.length - 1}
                aria-label={`Move ${a.name} down`}
                onClick={() => move(a.id, i + 1)}
              >
                Move down
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function AccountTabs({
  scope,
  accounts,
  preferences,
  selected,
  onSelect,
  busy,
  save,
  allowAll = false,
  onCreate,
}: {
  scope: "accounts" | "ledger";
  accounts: Account[];
  preferences: WorkspacePreferences;
  selected: string;
  onSelect: (id: string) => void;
  busy: boolean;
  save: (p: WorkspacePreferences) => void;
  allowAll?: boolean;
  onCreate?: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const ordered = orderedAccounts(accounts, preferences);
  const tabs = [
    ...ordered.map((a) => ({ id: a.id, label: a.name })),
    ...(allowAll && accounts.length ? [{ id: "", label: "All accounts" }] : []),
    ...(onCreate ? [{ id: "__new", label: "Create New Account" }] : []),
  ];
  return (
    <div className="account-tabs-bar">
      <nav
        aria-label={`${scope === "accounts" ? "Accounts" : "Ledger"} account tabs`}
      >
        <div
          role="tablist"
          aria-label="Choose account"
          className="workspace-tabs"
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${scope}-tab-${t.id || "all"}`}
              aria-controls={`${scope}-account-panel`}
              aria-selected={selected === t.id}
              onClick={() => (t.id === "__new" ? onCreate?.() : onSelect(t.id))}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          aria-expanded={editing}
          onClick={() => setEditing((v) => !v)}
        >
          {editing ? "Done editing layout" : "Edit page layout"}
        </button>
      </nav>
      {editing && (
        <AccountLayoutSettings
          accounts={accounts}
          preferences={preferences}
          busy={busy}
          save={save}
        />
      )}
    </div>
  );
}
