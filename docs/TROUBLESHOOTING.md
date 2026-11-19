# Record a problem safely

This is a temporary diagnostic trace, not a memory dump, screen recording or complete financial audit log. It is off by default. It does not upload reports automatically or give support access to your account.

## On your Windows laptop

After updating the review branch and restarting LedgerBot:

1. Click **Help troubleshoot** near the top of the app.
2. Click **Start fresh recording**.
3. Click **Close troubleshooting**. The button now says Recording.
4. Try the action that failed. For the split-entry check, use a fictional account, today's date, Expense, total 185 and splits 80, 50 and 55.
5. Reopen **Help troubleshoot** before refreshing or signing out.
6. Read the steps. Open **Technical details** for the matching server request ID, response code and processing stage.
7. Click **Download safe report** if you want to share it. Your browser saves `LedgerBot-troubleshooting.json`, usually in Downloads. Uploading it to support is your choice.
8. Click **Clear report** to erase the in-app recording and turn recording off. Downloaded copies remain on your device until you delete them.

No new accounts, hosting, payment or API keys are required. Refreshing, closing the tab or changing sign-in clears the in-memory recorder; download before doing those things.

## What it captures

- A generic marker for an unexpected browser error or unhandled promise rejection; no raw message or stack.
- Button presses, internal navigation and edits to approved field names. Field values, full link URLs and DOM text are excluded.
- Financial API route codes, HTTP methods/statuses, safe outcome codes and elapsed request time.
- Server-generated random request ID and stage: checking access, running action or completed.
- An optional non-secret release commit ID when the operator configures `LEDGERBOT_RELEASE_ID`; otherwise release is unknown.
- The last 200 steps, held in browser memory only. Stopping recording keeps those steps available; clearing removes them.

The trusted server adds safe response headers through the financial API wrapper. It does not persist a parallel server diagnostic archive. A successful response is not proof of a financial commit; preparation, review, confirmation and refresh are separate actions. The canonical financial audit/receipt remains separate from this support trace.

## What it excludes

No amounts, descriptions, category names, financial account identifiers, email addresses, passwords, CSRF tokens, cookies, credentials, request/response bodies, raw exceptions, screenshots or keystrokes. No third-party analytics or remote support SDK is introduced. This is not every background request, authentication-provider exchange, database statement or operating-system failure. An aborted connection may have no server response ID. A connection failure after confirmation does not prove the write failed: check the saved receipt/records before retrying.

## Verification and launch follow-up

Tests exercise allowlisting, malicious metadata/body exclusion, memory bounds, default-off/stop/clear behavior, safe server headers, failed connections, unreadable replies and report download during the real synthetic split/reconciliation flow. Current executed results are recorded in [SPLIT_ENTRY_FEEDBACK_REPORT.md](SPLIT_ENTRY_FEEDBACK_REPORT.md).

Before hosted beta, configure the release ID and verify physical Windows Firefox/iPhone behavior. Centralized support collection, role-restricted operator access, retention/deletion, redaction reviews, rate limits, incident workflows and operational alerts remain a separate stage. Automatic upload is not enabled. Complete independent privacy/security review before any customer launch; a diagnostic tool is not security certification.
