"use client";
import { useState } from "react";
export function ExportPanel({
  download,
  busy,
}: {
  download: (format: "json" | "csv", drafts: boolean) => void;
  busy: boolean;
}) {
  const [stage, setStage] = useState(1),
    [format, setFormat] = useState<"json" | "csv">("json"),
    [drafts, setDrafts] = useState(false);
  return (
    <section className="card">
      <h2>Export your financial records</h2>
      {stage === 1 ? (
        <>
          <p>
            Download your own records. JSON includes accounts, ledger, budgets,
            schedules, tracked occurrences and preferences. CSV is a ledger
            export. Passwords, sessions, provider tokens and encryption keys are
            never exported.
          </p>
          <label>
            Export format
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "json" | "csv")}
            >
              <option value="json">JSON — financial records</option>
              <option value="csv">CSV — ledger entries</option>
            </select>
          </label>
          {format === "json" && (
            <label className="checkbox">
              <input
                type="checkbox"
                checked={drafts}
                onChange={(e) => setDrafts(e.target.checked)}
              />
              Include saved reviews and their before-and-after details
            </label>
          )}
          <div className="actions">
            <button onClick={() => setStage(2)}>Review export</button>
          </div>
        </>
      ) : (
        <>
          <p>
            This download contains private financial information. It requires a
            sign-in from the last five minutes. Keep the downloaded file
            private; CSV text is protected against spreadsheet formulas.
          </p>
          <div className="actions">
            <button
              className="primary"
              disabled={busy}
              onClick={() => download(format, drafts)}
            >
              Confirm private download
            </button>
            <button disabled={busy} onClick={() => setStage(1)}>
              Cancel export
            </button>
          </div>
        </>
      )}
    </section>
  );
}
