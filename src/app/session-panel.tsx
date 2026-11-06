"use client";
import { useState } from "react";
type Item = {
  id: string;
  current: boolean;
  createdAt: number | null;
  expiresAt: number;
};
export function SessionPanel({
  load,
  revoke,
  busy,
}: {
  load: () => Promise<{ sessions: Item[]; truncated: boolean }>;
  revoke: (input: { others: true } | { id: string }) => Promise<unknown>;
  busy: boolean;
}) {
  const [data, setData] = useState<{
      sessions: Item[];
      truncated: boolean;
    } | null>(null),
    [confirm, setConfirm] = useState<{ others: true } | { id: string } | null>(
      null,
    ),
    [error, setError] = useState(""),
    [working, setWorking] = useState(false);
  async function action(work: () => Promise<void>) {
    if (working) return;
    setWorking(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to manage sign-ins");
    } finally {
      setWorking(false);
    }
  }
  return (
    <section className="card">
      <h2>Signed-in sessions</h2>
      <p>
        Review LedgerBot app access. Tabs in the same browser share one sign-in.
        Revocation blocks app access and outstanding approvals; it does not
        delete financial records. Device names and locations are not collected
        here.
      </p>
      <p>
        If you suspect a stolen password, change it too. Revoking a sign-in does
        not prevent someone who knows the password from signing in again.
      </p>
      <button
        disabled={busy || working}
        onClick={() => void action(async () => setData(await load()))}
      >
        Refresh signed-in sessions
      </button>
      {error && <p role="alert">{error}</p>}
      {data && (
        <>
          <p>
            {data.truncated
              ? "Showing the latest 50 sign-ins plus your current one. Revoke all others also covers older active sign-ins."
              : "Active app sign-ins"}
          </p>
          {data.sessions.map((item) => (
            <div className="card" key={item.id}>
              <p>
                {item.current ? "Current sign-in" : "Other sign-in"} · Started{" "}
                {item.createdAt
                  ? new Date(item.createdAt).toLocaleString()
                  : "before tracking began"}{" "}
                · Expires {new Date(item.expiresAt).toLocaleString()}
              </p>
              {!item.current && (
                <button
                  disabled={busy || working}
                  onClick={() => setConfirm({ id: item.id })}
                >
                  Review revoking this sign-in
                </button>
              )}
            </div>
          ))}
          <button
            disabled={busy || working}
            onClick={() => setConfirm({ others: true })}
          >
            Review revoking all other sign-ins
          </button>
        </>
      )}
      {confirm && (
        <div className="notice">
          <p>
            This requires a sign-in from the last five minutes.{" "}
            {"others" in confirm
              ? "All other app sign-ins will lose access."
              : "This other app sign-in will lose access."}{" "}
            Your current sign-in stays active.
          </p>
          <button
            disabled={busy || working}
            onClick={() =>
              void action(async () => {
                await revoke(confirm);
                setConfirm(null);
                setData(await load());
              })
            }
          >
            Confirm sign-in revocation
          </button>
          <button disabled={busy || working} onClick={() => setConfirm(null)}>
            Keep sign-ins unchanged
          </button>
        </div>
      )}
    </section>
  );
}
