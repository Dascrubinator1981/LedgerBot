# Workspace update — November 19, 2026

This is an unpublished development candidate using synthetic test records. The owner's missing laptop records have NOT been recovered or located. The owner confirmed the same login, folder and localhost address. We must not treat a newly empty view as proof that records were deleted, or recreate them while investigating.

## If you opened this version

Accounts and Ledger have sticky named account tabs. The first account becomes the default; Accounts → Edit page layout and Settings → Account layout let you choose another default and reorder the others with dragging or Move up/down. These preferences persist per user. Accounts starts at Create New Account only when none exist. Each saved account has its own tab and balance card. Account tools and reconciliation remain available below it.

Ledger starts with the selected account's transactions and balance. Its table scrolls within a bounded area, supports keyboard access, and offers Expand ledger, Full ledger view, Exit full view and Reduce ledger. All accounts remains available. Add entry defaults to the selected account. Expense, Income or external Payment/credit set direction; transfers between tracked accounts still use the paired transfer action to avoid double counting. New categories can be added inline and staged with the transaction.

Budget separates Current budget, Create New Budget and Categories. An empty month starts with creation; a configured month starts with the plan. Exact weekly, biweekly, monthly and quarterly targets and their existing calculations are retained. After approval, the saved target's month is shown. Following a chart month link or switching to an empty month keeps the comparison view available so its month selector never disappears.

Prepared entries appear in Pending changes beside the page on wide screens and above it on narrow screens. Reviewing opens an inline changes table, with expandable exact before/after details and only balances/totals that change. Approval still requires the independent slider or accessible two-step workflow. Confirmed items clear from the prepared queue; cancellation keeps the draft. No AI can approve a change.

## Missing-data investigation

File-backed tests establish that an approved account and its default preference survive closing/reopening the database and signing in after nine simulated days. Session expiry does not erase records. A storage marker now prevents silently creating an empty replacement when a known local database file is absent. This is a future safeguard, not recovery of previous data; it does not detect every possible database replacement or disk failure.

Settings → Your saved data shows the authenticated email and a short data reference, filename and local/OneDrive hint. No password, database contents or connection strings are shown. Local SQLite and hosted PostgreSQL remain different environments.

`scripts/local-data-check.mjs` opens an existing SQLite file read-only and reports counts for the supplied practice login. It omits the email and all financial records and writes only a separate summary text file. It does not load private .env files, migrate, repair or create the application database. Its synthetic check verified unchanged database bytes, omitted email and no database creation at a missing path. A summary from the owner's actual laptop is still needed; follow [the read-only check](LOCAL_DATA_RECOVERY_CHECK.md). Do not delete the data folder or copy individual live SQLite/WAL files as a guessed repair.

## Test evidence and limits

Executed checks:

- `npm run typecheck` and `npm run lint`: passed.
- `npm run db:migrate`: applied twice at SQLite schema 7 on an isolated temporary database. This caught a Node 24 strip-only syntax incompatibility in an imported error constructor; replacing its parameter property with an explicit assignment fixed the command. The regular suite was rerun afterward.
- `npm run build` and `npm run test:e2e:production`: passed; the compiled nonce-CSP/hydration and unconfigured-production fail-closed scenario passed.
- `npm run build`: passed; `npm run test:e2e:production`: one compiled Chromium nonce-CSP/hydration/fail-closed scenario passed.
- `npm run db:migrate`: applied twice successfully to a temporary synthetic SQLite database, additive version 7. PostgreSQL additive migration 009 was exercised by the database/recovery/browser suites.
- `npm test`: 149 passed in 24 files.
- `npm run test:postgres`: 18 passed in four files; `npm run test:recovery`: passed, including migrations applied twice, encrypted round-trip/tamper/wrong-key checks, restored exact cents and RLS/write denial.
- Local Chromium: 15 scenarios passed in the last full sweep; its one failure was an ambiguous “Add category” selector matching both a button and the pending summary. The selector was scoped to the pending region; its targeted rerun passed. Thus all 16 local scenarios have passing final-source evidence, with this rerun qualification rather than a claim of a single clean 16/16 run.
- `npm run test:e2e:postgres`: all eight verified-identity Chromium scenarios passed.
- `npm audit` and `npm audit --omit=dev`: zero vulnerabilities reported.
- Read-only diagnostic: unchanged synthetic fixture bytes, expected per-login counts, no email in report, no database created at an absent path.
- Four exported Word guides: no document-protection setting; editable result fields and control amounts checked. These fresh downloads are outside Git; old filled owner files remain untouched.
- `npm run check:secrets`: passed across 208 staged/tracked source and documentation files; no database, original workbook, filled guide or secret payload included. This bounded pattern guard is not independent security certification.
- Final isolated container runtime and high/critical vulnerability gate: passed. Artifact `sha256:fe4c601d5cb0e2c9e3cc1915b5e1ed39c99805c59d1a18c2221c69bb2b9342fd`, observed 2026-11-19T18:30:48.958Z, zero HIGH and zero CRITICAL findings. Lower-severity absence is not claimed.

Earlier failing browser attempts exposed the keyboard focus issue, label ambiguity, empty-month navigation problem and outdated navigation assumptions. Fixes were followed by the runs above. These are bounded scenarios, not exhaustive coverage of every device, input or button combination.

Firefox's official Playwright download was blocked by the environment's outbound proxy (HTTP 403). Chromium can test pointer release and scaled layout, but it cannot establish that Windows Firefox's reported slider issue is fixed. Physical iPhone and Windows testing and an independent accessibility/security review remain outstanding. No private HTTPS beta has been deployed; the phone guide retains that prerequisite.

No customer records, original workbook, filled owner findings, secrets or database files are included in the repository. No deployment, billing activation or real-bank action was performed.
