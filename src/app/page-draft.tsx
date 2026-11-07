"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  type Operation,
  type SingleOperation,
  type Proposal,
  type FinanceState,
  type formSnapshotSchema,
} from "@/lib/domain";
import type { z } from "@/lib/schema";
import { originalDraftValues } from "@/lib/draft-fields";
import type { Section } from "@/lib/navigation";
type Snapshot = z.infer<typeof formSnapshotSchema>;
type Destination = Section | "SignOut";
type Item = { operation: SingleOperation; snapshot?: Snapshot };
type Api = (
  path: string,
  method?: string,
  payload?: unknown,
) => Promise<{
  operation: Operation;
  id: string;
  proposal: Proposal;
  token: string;
}>;
export function usePageDraft({
  tab,
  identity,
  busy,
  state,
  api,
  run,
  navigateNow,
  onReview,
  refresh,
  onRestore,
  onCancelEdit,
}: {
  tab: Section;
  identity: string;
  busy: boolean;
  state: FinanceState | null;
  api: Api;
  run: (action: () => Promise<void>) => Promise<void>;
  navigateNow: (tab: Destination) => void;
  onReview: (r: { proposal: Proposal; token: string }) => void;
  refresh: () => Promise<void>;
  onRestore: (snapshot: Snapshot) => void;
  onCancelEdit: () => void;
}) {
  const [items, setItems] = useState<Item[]>([]),
    [dirty, setDirty] = useState(false),
    [destination, setDestination] = useState<Destination | null>(null),
    [saving, setSaving] = useState(false),
    [restore, setRestore] = useState<Snapshot | null>(null),
    [sourceId, setSourceId] = useState<string | undefined>(),
    [remainingRestores, setRemainingRestores] = useState<Snapshot[]>([]);
  const [boundIdentity, setBoundIdentity] = useState(identity);
  const [editingChange, setEditingChange] = useState(false);
  const identityRef = useRef(identity);
  const owned = boundIdentity === identity;
  const dirtyForms = useRef(new Set<HTMLFormElement>()),
    resetForms = useRef(new Set<HTMLFormElement>());
  const editingRepair = useRef<{
    index: number;
    operation: SingleOperation;
    formKey?: string;
    originalSnapshot?: Snapshot;
  } | null>(null);
  const activeReview = useRef(false),
    preparedId = useRef<string | undefined>(undefined);
  useEffect(() => {
    identityRef.current = identity;
    queueMicrotask(() => {
      if (identityRef.current !== identity) return;
      setItems([]);
      setDirty(false);
      setDestination(null);
      setSaving(false);
      setRestore(null);
      setRemainingRestores([]);
      setSourceId(undefined);
      dirtyForms.current.clear();
      resetForms.current.clear();
      preparedId.current = undefined;
      editingRepair.current = null;
      setEditingChange(false);
      activeReview.current = false;
      setBoundIdentity(identity);
    });
  }, [identity]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty || items.length > 0) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty, items.length]);
  useEffect(() => {
    if (!restore) return;
    let frame = 0,
      attempts = 0;
    const applySnapshot = () => {
      const forms = Array.from(
        document.querySelectorAll<HTMLFormElement>(
          "#main-content form[data-financial]",
        ),
      );
      const key = (form: HTMLFormElement) =>
        form.dataset.draftForm ||
        form.querySelector("button:not([type=button])")?.textContent?.trim();
      const form = restore.formKey
        ? forms.find((form) => key(form) === restore.formKey)
        : forms[restore.formIndex];
      if (!form) {
        if (attempts++ < 50) frame = requestAnimationFrame(applySnapshot);
        return;
      }
      const disclosure = form.closest("details");
      if (disclosure) disclosure.open = true;
      let missing = false;
      for (const [name, value] of restore.values) {
        if (!name.startsWith("newCategoryMode:") || value !== "open") continue;
        if (!form.elements.namedItem(name)) {
          const select = form.elements.namedItem(
            name.slice("newCategoryMode:".length),
          );
          if (select instanceof HTMLSelectElement) {
            select.value = "+add";
            select.dispatchEvent(new Event("change", { bubbles: true }));
            missing = true;
          }
        }
      }

      for (const control of Array.from(form.elements))
        if (
          control instanceof HTMLInputElement &&
          (control.type === "checkbox" || control.type === "radio")
        )
          control.checked = restore.values.some(
            ([name, value]) => name === control.name && value === control.value,
          );
      for (const [name, value] of restore.values) {
        const control = form.elements.namedItem(name);
        if (!(
          control instanceof HTMLInputElement ||
          control instanceof HTMLSelectElement ||
          control instanceof HTMLTextAreaElement
        )) {
          missing = true;
          if (/^category-\d+$/.test(name))
            Array.from(form.querySelectorAll("button"))
              .find(
                (button) => button.textContent?.trim() === "Add another split",
              )
              ?.click();
          continue;
        }
        if (
          control instanceof HTMLInputElement &&
          (control.type === "checkbox" || control.type === "radio")
        )
          control.checked = true;
        else if (control.value !== value) {
          const prototype =
            control instanceof HTMLSelectElement
              ? HTMLSelectElement.prototype
              : control instanceof HTMLTextAreaElement
                ? HTMLTextAreaElement.prototype
                : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(
            control,
            value,
          );
          control.dispatchEvent(new Event("input", { bubbles: true }));
          control.dispatchEvent(new Event("change", { bubbles: true }));
        }
      }
      if (missing && attempts++ < 50) {
        frame = requestAnimationFrame(applySnapshot);
        return;
      }
      dirtyForms.current.add(form);
      setDirty(true);
      form.scrollIntoView({ block: "center" });
      const next = remainingRestores[0];
      if (next) {
        onRestore(next);
        setRemainingRestores((v) => v.slice(1));
        setRestore(next);
      } else setRestore(null);
    };
    frame = requestAnimationFrame(applySnapshot);
    return () => cancelAnimationFrame(frame);
  }, [restore, tab, remainingRestores, onRestore]);
  function snapshot(form: HTMLFormElement): Snapshot {
    const forms = Array.from(
      document.querySelectorAll<HTMLFormElement>(
        "#main-content form[data-financial]",
      ),
    );
    const formKey =
      form.dataset.draftForm ||
      form.querySelector("button:not([type=button])")?.textContent?.trim();
    return {
      section: tab,
      ...(form.dataset.editingId
        ? {
            editingId: form.dataset.editingId,
            editingKind: form.dataset.editingKind as "transaction" | "transfer",
          }
        : {}),
      formIndex: Math.max(0, forms.indexOf(form)),
      ...(editingRepair.current && editingRepair.current.formKey === formKey
        ? {
            replaces: {
              index: editingRepair.current.index,
              operation: editingRepair.current.operation,
              originalValues: editingRepair.current.originalSnapshot?.values,
            },
          }
        : {}),
      formKey:
        form.dataset.draftForm ||
        form.querySelector("button:not([type=button])")?.textContent?.trim(),
      values: Array.from(new FormData(form).entries())
        .filter(
          ([name, value]) =>
            typeof value === "string" &&
            !/password|token|secret|csrf|email/i.test(name),
        )
        .map(([name, value]) => [name, String(value)]),
    };
  }
  async function add(operation: Operation, form?: HTMLFormElement) {
    const expectedIdentity = identity;
    if (!owned) throw new Error("Sign-in changed. Reopen the form.");
    if (operation.kind === "draft")
      throw new Error("Use the saved review workflow");
    const captured = form ? snapshot(form) : undefined;
    const repair =
      form &&
      editingRepair.current &&
      captured?.formKey === editingRepair.current.formKey
        ? editingRepair.current
        : null;
    let ops = operation.kind === "batch" ? operation.operations : [operation];
    if (repair && ops.length === 1) {
      const next = ops[0],
        previous = repair.operation;
      if (next.kind === "category" && previous.kind === "category")
        ops = [{ ...next, id: previous.id }];
      if (
        next.kind === "budget" &&
        previous.kind === "budget" &&
        next.newCategory &&
        previous.newCategory
      )
        ops = [{ ...next, categoryId: previous.categoryId }];
    }
    const insertion = repair
      ? Math.min(repair.index, items.length)
      : items.length;
    const candidate = items.map((item) => item.operation);
    candidate.splice(insertion, 0, ...ops);
    const result = await api("draft-validation", "POST", {
      kind: "batch",
      operations: candidate,
    });
    if (identityRef.current !== expectedIdentity) return;
    if (result.operation.kind !== "batch")
      throw new Error("Invalid review response");
    const prepared = { ...captured };
    delete prepared.replaces;
    const nextItems = [...items];
    nextItems.splice(
      insertion,
      0,
      ...result.operation.operations
        .slice(insertion, insertion + ops.length)
        .map((op) => ({
          operation: op,
          snapshot: captured ? (prepared as Snapshot) : undefined,
        })),
    );
    setItems(nextItems);
    if (repair) {
      editingRepair.current = null;
      setEditingChange(false);
    }
    if (form) {
      resetForms.current.add(form);
      form.reset();
      dirtyForms.current.delete(form);
      setDirty(dirtyForms.current.size > 0);
    }
  }
  function cancelForm(form?: HTMLFormElement | null) {
    if (form) {
      dirtyForms.current.delete(form);
      form.reset();
    }
    for (const item of dirtyForms.current)
      if (!item.isConnected) dirtyForms.current.delete(item);
    setDirty(dirtyForms.current.size > 0);
  }
  function cancelEditingChange() {
    const repair = editingRepair.current;
    if (!repair) return;
    setRestore(null);
    setRemainingRestores([]);
    const form = Array.from(
      document.querySelectorAll<HTMLFormElement>(
        "#main-content form[data-financial]",
      ),
    ).find(
      (f) =>
        (f.dataset.draftForm ||
          f.querySelector("button:not([type=button])")?.textContent?.trim()) ===
        repair.formKey,
    );
    cancelForm(form);
    setItems((current) => {
      const next = [...current];
      next.splice(Math.min(repair.index, next.length), 0, {
        operation: repair.operation,
        snapshot: repair.originalSnapshot,
      });
      return next;
    });
    editingRepair.current = null;
    setEditingChange(false);
    onCancelEdit();
  }
  function navigate(next: Destination) {
    if (next === tab) return;
    if (dirty || items.length > 0) setDestination(next);
    else navigateNow(next);
  }
  function mark(event: FormEvent<HTMLElement>) {
    const form = (event.target as HTMLElement).closest<HTMLFormElement>(
      "form[data-financial]",
    );
    if (form) {
      dirtyForms.current.add(form);
      queueMicrotask(() => setDirty(true));
    }
  }
  async function openReview() {
    const expectedIdentity = identity;
    if (!owned) throw new Error("Sign-in changed. Reopen the form.");
    if (!items.length)
      throw new Error("Add completed changes to the page review first.");
    const operation =
      items.length === 1
        ? items[0].operation
        : { kind: "batch" as const, operations: items.map((i) => i.operation) };
    const p = await api(
      "proposals",
      "POST",
      sourceId ? { operation, sourceSavedReviewId: sourceId } : operation,
    );
    if (identityRef.current !== expectedIdentity) return;
    preparedId.current = p.id;
    const r = await api("review", "POST", { id: p.id });
    if (identityRef.current !== expectedIdentity) return;
    activeReview.current = true;
    onReview(r);
  }
  function discard() {
    for (const form of dirtyForms.current) form.reset();
    dirtyForms.current.clear();
    setDirty(false);
    setItems([]);
    setSourceId(undefined);
    editingRepair.current = null;
    setEditingChange(false);
  }
  function committed() {
    if (!activeReview.current) return;
    activeReview.current = false;
    preparedId.current = undefined;
    setSourceId(undefined);
    setItems([]);
    resetForms.current.clear();
    const next = destination;
    setDestination(null);
    return next;
  }
  function resume(p: Proposal) {
    if (p.expiresAt <= Date.now() || p.operation.kind !== "draft") return;
    if (dirty || items.length > 0) {
      setDestination("Inbox");
      return;
    }
    const section = p.operation.section as Section;
    setSourceId(p.id);
    setItems(
      p.operation.operations.map((operation, index) => ({
        operation,
        snapshot:
          p.operation.kind === "draft"
            ? p.operation.forms.find((f) => f.operationIndex === index)
            : undefined,
      })),
    );
    navigateNow(section);
    const unfinishedForms = p.operation.forms.filter(
      (f) => f.operationIndex === undefined,
    );
    setRemainingRestores(unfinishedForms.slice(1));
    const unfinished = p.operation.forms.find(
      (f) => f.operationIndex === undefined,
    );
    if (unfinished) {
      editingRepair.current = unfinished.replaces
        ? {
            ...unfinished.replaces,
            formKey: unfinished.formKey,
            originalSnapshot: {
              ...unfinished,
              replaces: undefined,
              values:
                unfinished.replaces.originalValues ||
                originalDraftValues(
                  unfinished.replaces.operation,
                  unfinished.values,
                ),
            },
          }
        : null;
      setEditingChange(!!unfinished.replaces);
      onRestore(unfinished);
    }
    setRestore(
      p.operation.forms.find((f) => f.operationIndex === undefined) || null,
    );
  }
  async function save(choice: string, reminderMinute: number) {
    const expectedIdentity = identity;
    if (preparedId.current) {
      await api("proposals", "DELETE", { id: preparedId.current });
      preparedId.current = undefined;
    }
    const forms = [
      ...items.flatMap((item, index) =>
        item.snapshot ? [{ ...item.snapshot, operationIndex: index }] : [],
      ),
      ...[...dirtyForms.current].filter((f) => f.isConnected).map(snapshot),
    ];
    await api("saved-reviews", "POST", {
      ...(sourceId ? { replaceId: sourceId } : {}),
      operation: {
        kind: "draft",
        section: tab,
        operations: items.map((i) => i.operation),
        forms,
      },
      choice,
      reminderMinute,
    });
    if (identityRef.current !== expectedIdentity) return;
    discard();
    setSaving(false);
    await refresh();
    if (destination) {
      const next = destination;
      setDestination(null);
      navigateNow(next);
    }
  }
  const panel =
    dirty || items.length > 0 ? (
      <section
        className="card page-draft"
        aria-label="Page changes"
        tabIndex={-1}
      >
        <h2>
          Page review · {items.length} prepared change
          {items.length === 1 ? "" : "s"}
        </h2>
        <p>
          Not applied to your finances. Finish your entries, then review the
          exact combined changes.
        </p>
        {dirty && (
          <p>
            There are unfinished form edits. Add them to review, save for later
            or discard them before leaving.
          </p>
        )}
        {editingChange && (
          <button type="button" disabled={busy} onClick={cancelEditingChange}>
            Cancel editing this staged change
          </button>
        )}
        {items.map((item, index) => (
          <div className="row" key={index}>
            <span>
              {index + 1}. {item.operation.kind}
            </span>
            <div className="actions">
              {(item.snapshot || item.operation.kind === "category") && (
                <button
                  type="button"
                  disabled={busy || dirty}
                  onClick={() => {
                    const form = item.snapshot || {
                      section: "Budget" as const,
                      formIndex: 0,
                      formKey: "Prepare category",
                      values: [
                        [
                          "name",
                          item.operation.kind === "category"
                            ? item.operation.name
                            : "",
                        ],
                      ] as [string, string][],
                    };
                    editingRepair.current = {
                      index,
                      operation: item.operation,
                      formKey: form.formKey,
                      originalSnapshot: form,
                    };
                    setEditingChange(true);
                    setRemainingRestores([]);
                    navigateNow(form.section as Section);
                    onRestore(form);
                    setRestore(form);
                    setItems(items.filter((_, i) => i !== index));
                  }}
                >
                  Edit change {index + 1}
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (
                    editingRepair.current &&
                    index < editingRepair.current.index
                  )
                    editingRepair.current.index--;
                  setItems(items.filter((_, i) => i !== index));
                }}
              >
                Remove change {index + 1}
              </button>
            </div>
          </div>
        ))}
        <div className="actions">
          <button
            type="button"
            data-support-action="review-page"
            disabled={busy || !items.length || dirty}
            onClick={() => void run(openReview)}
          >
            Review staged changes
          </button>
          <button type="button" disabled={busy} onClick={() => setSaving(true)}>
            Save changes for later review
          </button>
          <button type="button" disabled={busy} onClick={discard}>
            Discard page changes
          </button>
        </div>
      </section>
    ) : null;
  const dialog =
    destination || saving ? (
      <LeaveReview
        destination={destination}
        saving={saving}
        dirty={dirty}
        hasItems={!!items.length}
        onKeep={() => {
          setDestination(null);
          setSaving(false);
        }}
        onReview={() => void run(openReview)}
        onSave={(choice, minute) => void run(() => save(choice, minute))}
        onDiscard={() => {
          discard();
          if (destination) navigateNow(destination);
          setDestination(null);
          setSaving(false);
        }}
        onChooseSave={() => setSaving(true)}
        timezone={state?.settings.timezone || "Etc/UTC"}
        busy={busy}
      />
    ) : null;
  return {
    items: owned ? items : [],
    dirty: owned && dirty,
    panel: owned ? panel : null,
    dialog: owned ? dialog : null,
    add,
    cancelForm,
    cancelEditingChange,
    editingChange: owned && editingChange,
    navigate,
    mark,
    committed,
    resume,
    hasChanges: owned && (dirty || items.length > 0),
    cancelReview: async () => {
      activeReview.current = false;
      if (preparedId.current) {
        await api("proposals", "DELETE", { id: preparedId.current });
        preparedId.current = undefined;
        await refresh();
      }
    },
  };
}
function LeaveReview({
  destination,
  saving,
  dirty,
  hasItems,
  onKeep,
  onReview,
  onSave,
  onDiscard,
  onChooseSave,
  timezone,
  busy,
}: {
  destination: Destination | null;
  saving: boolean;
  dirty: boolean;
  hasItems: boolean;
  onKeep: () => void;
  onReview: () => void;
  onSave: (choice: string, minute: number) => void;
  onDiscard: () => void;
  onChooseSave: () => void;
  timezone: string;
  busy: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [custom, setCustom] = useState(false);
  useEffect(() => {
    const element = ref.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      className="review"
      aria-label="Unfinished page changes"
      onCancel={(e) => {
        e.preventDefault();
        if (!busy) onKeep();
      }}
    >
      <h2>
        {saving
          ? "Save changes for later review"
          : "You have unfinished changes"}
      </h2>
      <p>
        {destination
          ? `Before opening ${destination}, choose what to do.`
          : "These drafts do not update your finances."}
      </p>
      {!saving && (dirty || !hasItems) && (
        <p>
          Review is not ready yet. Choose Keep editing, then use the Prepare
          button below your entry. If a message appears, correct that field and
          try again. You can also save the unfinished entry for later.
        </p>
      )}
      {saving ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            onSave(
              custom ? String(f.get("expiry")) : "default",
              Number(f.get("reminder")),
            );
          }}
        >
          <label>
            Would you like to choose an expiration?
            <select
              value={custom ? "yes" : "no"}
              onChange={(e) => setCustom(e.target.value === "yes")}
            >
              <option value="no">No — 30 days</option>
              <option value="yes">Yes</option>
            </select>
          </label>
          {custom && (
            <label>
              Review timeframe
              <select name="expiry">
                <option value="today">End of today — review by midnight</option>
                <option value="week">1 week — 7 days</option>
                <option value="saturday">
                  End of week — Saturday midnight
                </option>
                <option value="default">30 days</option>
              </select>
            </label>
          )}
          <label>
            Evening reminder
            <select name="reminder" defaultValue="30">
              <option value="0">8:00 p.m.</option>
              <option value="30">8:30 p.m.</option>
              <option value="60">9:00 p.m.</option>
            </select>
          </label>
          <p>
            Timezone: {timezone}. End-of-day/week reminders ask you to review by
            midnight. Email/text delivery is not configured.
          </p>
          <button disabled={busy}>Save for later</button>
        </form>
      ) : (
        <div className="actions">
          <button disabled={busy || dirty || !hasItems} onClick={onReview}>
            Review and confirm now
          </button>
          <button disabled={busy} onClick={onChooseSave}>
            Save changes for later review
          </button>
          <button disabled={busy} onClick={onDiscard}>
            Discard changes and continue
          </button>
        </div>
      )}
      <button disabled={busy} onClick={onKeep}>
        Keep editing
      </button>
    </dialog>
  );
}
