"use client";
import { useEffect, useRef, useState } from "react";
import { Field } from "./components";
import { similarLabels } from "@/lib/label-suggestions";
export function LabelSuggestions({
  value,
  existing,
  onUse,
}: {
  value: string;
  existing: string[];
  onUse: (name: string) => void;
}) {
  const [dismissed, setDismissed] = useState("");
  const matches = similarLabels(value, existing);
  if (!matches.length || dismissed === value) return null;
  return (
    <aside className="notice" aria-label="Pip label suggestions">
      <strong>Pip suggestion</strong>
      <p>
        You entered “{value}”. You already use{" "}
        {matches.map((v) => `“${v}”`).join(", ")}. Reuse an existing label or
        keep your new name.
      </p>
      <div className="actions">
        {matches.map((name) => (
          <button key={name} type="button" onClick={() => onUse(name)}>
            Use {name}
          </button>
        ))}
        <button type="button" onClick={() => setDismissed(value)}>
          Keep my new name
        </button>
      </div>
      <small>
        Local label comparison, not live AI. No records are merged or changed
        automatically.
      </small>
    </aside>
  );
}
export function LabelEntry({
  label,
  name,
  value = "",
  existing,
  onUseExisting,
}: {
  label: string;
  name: string;
  value?: string;
  existing: string[];
  onUseExisting?: (name: string) => void;
}) {
  const [text, setText] = useState(value);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const form = input.current?.form;
    const reset = () => setText(value);
    form?.addEventListener("reset", reset);
    return () => form?.removeEventListener("reset", reset);
  }, [value]);
  return (
    <div>
      <Field label={label}>
        <input
          ref={input}
          name={name}
          required
          maxLength={100}
          autoComplete="off"
          defaultValue={value}
          onChange={(e) => setText(e.target.value)}
        />
      </Field>
      <LabelSuggestions
        value={text}
        existing={existing}
        onUse={(name) => {
          setText(name);
          if (input.current) input.current.value = name;
          onUseExisting?.(name);
        }}
      />
    </div>
  );
}
