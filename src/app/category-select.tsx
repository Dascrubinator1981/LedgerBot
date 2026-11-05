"use client";
import { useEffect, useId, useRef, useState } from "react";
import type { Category } from "@/lib/domain";
export function CategorySelect({
  categories,
  name,
  label,
  value = "",
  required = false,
  busy = false,
  onCreate,
}: {
  categories: Category[];
  name: string;
  label: string;
  value?: string;
  required?: boolean;
  busy?: boolean;
  onCreate?: (name: string) => void;
}) {
  const id = useId(),
    select = useRef<HTMLSelectElement>(null),
    previous = useRef(value);
  const [adding, setAdding] = useState(false),
    [draftName, setDraftName] = useState("");
  function reviewCategory() {
    if (busy || !draftName.trim()) return;
    onCreate?.(draftName.trim());
    setAdding(false);
    select.current?.focus();
  }
  useEffect(() => {
    const form = select.current?.form;
    const reset = () => {
      previous.current = value;
      setAdding(false);
      setDraftName("");
    };
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [value]);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        ref={select}
        name={name}
        defaultValue={value}
        required={required}
        onChange={(event) => {
          if (event.target.value === "+add") {
            event.target.value = previous.current;
            setAdding(true);
          } else previous.current = event.target.value;
        }}
      >
        {onCreate && <option value="+add">＋ Add a new category…</option>}
        <option value="">{required ? "Choose category" : "Unassigned"}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {adding && (
        <div className="card">
          <label htmlFor={`${id}-new`}>
            New category for {label}
            <input
              id={`${id}-new`}
              maxLength={100}
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  reviewCategory();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  setAdding(false);
                  select.current?.focus();
                }
              }}
            />
          </label>
          <p>
            Your entry stays here while you review the category separately.
            After approval, select it from the list. Nothing is added until you
            confirm.
          </p>
          <div className="actions">
            <button
              type="button"
              disabled={busy || !draftName.trim()}
              onClick={reviewCategory}
            >
              Review new category
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setAdding(false);
                select.current?.focus();
              }}
            >
              Keep working without adding
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
