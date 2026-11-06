"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { Troubleshooting } from "@/lib/troubleshooting";
export function TroubleshootingPanel({
  recorder,
}: {
  recorder: Troubleshooting;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  const snapshot = useSyncExternalStore(
    recorder.subscribe,
    recorder.getSnapshot,
    recorder.getServerSnapshot,
  );
  useEffect(() => {
    if (!open) return;
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [open]);
  useEffect(() => {
    const recordError = () => recorder.record({ event: "unexpected-error" });
    window.addEventListener("error", recordError);
    window.addEventListener("unhandledrejection", recordError);
    return () => {
      window.removeEventListener("error", recordError);
      window.removeEventListener("unhandledrejection", recordError);
    };
  }, [recorder]);
  function download() {
    const url = URL.createObjectURL(
      new Blob([recorder.report()], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "LedgerBot-troubleshooting.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      <button
        type="button"
        aria-label="Help troubleshoot"
        onClick={() => setOpen(true)}
      >
        Help troubleshoot{snapshot.enabled ? " · Recording" : ""}
      </button>
      {open && (
        <dialog
          ref={ref}
          className="review"
          aria-label="Troubleshooting"
          onCancel={() => setOpen(false)}
        >
          <h2>See what happened</h2>
          <p>
            Turn this on, close this window, then try the action that is giving
            you trouble. Reopen this window to see your steps and the server
            responses.
          </p>
          <p>
            No amounts, descriptions, category names, passwords or account
            details are recorded. This keeps only the last 200 steps in this
            browser tab’s memory. It starts off; refreshing or signing out
            clears it. Nothing is sent to support automatically.
          </p>
          <p role="status">
            Recording is {snapshot.enabled ? "on" : "off"}.{" "}
            {snapshot.entries.length} steps recorded.
          </p>
          <div className="actions">
            {snapshot.enabled ? (
              <button onClick={() => recorder.stop()}>Stop recording</button>
            ) : (
              <button onClick={() => recorder.start()}>
                Start fresh recording
              </button>
            )}
            <button disabled={!snapshot.entries.length} onClick={download}>
              Download safe report
            </button>
            <button
              disabled={!snapshot.entries.length}
              onClick={() => recorder.clear()}
            >
              Clear report
            </button>
            <button onClick={() => setOpen(false)}>
              Close troubleshooting
            </button>
          </div>
          <p>
            “running-action” means the server reached the requested action.
            “completed” means it returned successfully; it does not by itself
            mean a financial change was confirmed. Request IDs link each
            response to the server request. Background refreshes and
            integrations using other request paths are not a complete account
            activity log.
          </p>
          <ol aria-label="Troubleshooting steps">
            {snapshot.entries.map((entry) => (
              <li key={entry.sequence}>
                <strong>
                  {
                    {
                      "unexpected-error":
                        "The browser encountered an unexpected error",
                      started: "Recording started",
                      button: "Button pressed",
                      navigation: "Page opened",
                      "field-edited": "Entry field edited",
                      "form-invalid": "Browser found an incomplete field",
                      request: "Request sent to server",
                      response: "Server responded",
                      "network-error": "Could not reach server",
                      "unreadable-response": "Could not read server response",
                    }[entry.event]
                  }
                </strong>
                {entry.page && ` — ${entry.page}`}
                {entry.outcome === "future-date" && " — Date is in the future"}
                {entry.outcome === "opening-date" &&
                  " — Check the starting balance date"}
                {entry.outcome === "ok" && " — Request succeeded"}
                <details>
                  <summary>Technical details</summary>
                  <code
                    style={{ overflowWrap: "anywhere", whiteSpace: "pre-wrap" }}
                  >
                    {JSON.stringify(entry)}
                  </code>
                </details>
              </li>
            ))}
          </ol>
        </dialog>
      )}
    </>
  );
}
