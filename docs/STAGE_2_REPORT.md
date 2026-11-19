# Stage 2 checkpoint — connected manual finance

If you opened the app today, you could name your own accounts and categories, enter spending or income, split it, review it, and see the resulting balance and budget chart. Forecasts now include a separate “bills paid in the last 7 days” table. It shows explicitly linked cleared bill payments, never ordinary expenses inferred from their names. All new accounts remain empty until you add your own fictional records.

The same shared functions calculate Dashboard and Budget progress, review impacts, and Forecaster estimates. Overall spending includes uncategorized and unbudgeted spending; income cannot disguise an overspent expense budget. Refunds are explicit. Targets do not move money. Charts distinguish monthly limits from a simple straight-line pacing guide, not a prediction of when your bills fall.

You can create, edit, pause and archive recurring schedules, link an existing payment without posting it twice, record partial payments, and explicitly track unpaid or skipped occurrences. Pending payments cover their portion of a forecast but do not become cleared actuals. A completed variable bill can explicitly settle its occurrence. Known overdue obligations persist; untracked historic obligations are not invented. Transfers can be edited as pairs, cleared together, deleted and restored through review. Reviewed restore retains the original IDs and refuses duplicate restoration or reconciled-period changes. Names keep stable IDs. Opening corrections require a fresh session and cannot rewrite reconciled accounts.

Authenticated, fresh-session JSON and formula-safe CSV exports are available in Settings. JSON is a portable financial snapshot, not an authentication backup or automatic import format. Provider passwords, cookies and keys are excluded. PostgreSQL draft snapshots remain encrypted.

## Validation at this checkpoint

- `npm run typecheck`, `npm run lint`, `npm test`: strict checks and 80 unit/service tests passed after correcting one extracted helper's `let` to `const`.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: 6 browser flows passed.
- `npm run test:postgres`: 10 database/crypto tests passed with migrations 001–004.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e:postgres`: 3 passed, including the identical paid-bill/chart/delete/restore/export workflow used for SQLite, with real local verified identity and PostgreSQL.

Tests verify the old ledger/card/reconciliation behavior as well as new correlations. A same-merchant ordinary expense stays out of the paid-bill list; deletion reopens a tracked obligation and approved restoration closes it without double debit. The seven-day window includes today and the preceding six civil dates in the user's IANA timezone.

## Still partial

This is a substantial Stage 2 checkpoint, not a claim that every product requirement is complete. Reconciliation still blocks a mismatch and locks history; it does not yet provide a guided discrepancy investigator or reopen/reconcile correction workflow. Discretionary budget extrapolation is intentionally absent from cash forecasts rather than duplicating scheduled bills. Holiday clearing rules are not implemented: clearing delay means calendar days. No automatic matching, payments or calendar-based clearing occurs. No automatic SQLite-to-provider migration, customer deletion, multi-currency, debt or savings planning is implemented. The hosted backend and independent security/device audits remain release gates.

Next comes navigation, refresh consistency and accessible setup controls, followed by operational recovery tests. No application has been deployed.
