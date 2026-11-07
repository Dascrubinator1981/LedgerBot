"use client";
import { useEffect, useId, useRef, useState } from "react";
import { LabelSuggestions } from "./label-entry";
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
  onCreate?: (name: string, form?: HTMLFormElement) => void;
}) {
  const id = useId(),
    select = useRef<HTMLSelectElement>(null),
    previous = useRef(value),
    pendingName = useRef<string | null>(null);
  const [adding, setAdding] = useState(false),
    [draftName, setDraftName] = useState("");
  function reviewCategory() {
    if (busy || !draftName.trim()) return;
    const existing = categories.find(
      (c) =>
        c.name.trim().toLocaleLowerCase() ===
        draftName.trim().toLocaleLowerCase(),
    );
    if (existing) {
      choose(existing.id);
      return;
    }
    pendingName.current = draftName.trim();
    onCreate?.(draftName.trim(), select.current?.form || undefined);
  }
  function choose(id: string) {
    previous.current = id;
    pendingName.current = null;
    if (select.current) {
      select.current.value = id;
      select.current.setCustomValidity("");
      select.current.dispatchEvent(new Event("change", { bubbles: true }));
      select.current.focus();
    }
    setAdding(false);
  }
  useEffect(() => {
    const desired = pendingName.current;
    const category = desired && categories.find((c) => c.name === desired);
    if (category) queueMicrotask(() => choose(category.id));
  }, [categories]);
  useEffect(() => {
    const element = select.current;
    element?.setCustomValidity(
      adding
        ? "Finish adding this category, or choose Keep working without adding."
        : "",
    );
    return () => element?.setCustomValidity("");
  }, [adding]);
  useEffect(() => {
    const form = select.current?.form;
    const reset = () => {
      previous.current = value;
      pendingName.current = null;
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
          <input type="hidden" name={`newCategoryMode:${name}`} value="open" />
          <label htmlFor={`${id}-new`}>
            New category for {label}
            <input
              id={`${id}-new`}
              name={`newCategoryName:${name}`}
              maxLength={100}
              value={draftName}
              onChange={(event) => {
                pendingName.current = null;
                setDraftName(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  reviewCategory();
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  pendingName.current = null;
                  setAdding(false);
                  select.current?.focus();
                }
              }}
            />
          </label>
          <LabelSuggestions
            value={draftName}
            existing={categories.map((c) => c.name)}
            onUse={(name) => {
              const chosen = categories.find((c) => c.name === name)!;
              choose(chosen.id);
            }}
          />
          <p>
            Your entry stays here. The category joins your page review and is
            selected automatically. Nothing is saved to your finances until you
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
                pendingName.current = null;
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
