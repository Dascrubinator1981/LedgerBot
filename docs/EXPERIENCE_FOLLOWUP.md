# Experience follow-up — agreed scope and first slice

Latest follow-up: [inline category creation](INLINE_CATEGORY_REPORT.md) now implements part of the reusable-selector work. The graph checkpoint and original next-slice list below remain historical context.

These decisions come from the owner's follow-up conversation and supplement the original product documents. They do not authorize deployment, paid activation or bank/payment actions.

## Budget graph drill-down — implemented in this slice

The Dashboard graph and its text link open Budget with the same month. Native links support keyboard activation and opening a separate tab. Month links survive reload. Budget offers category checkboxes (including uncategorized), account selection, clear filters, and a list of matching ledger allocations. A split purchase contributes only its selected portions. Income and transfers remain excluded from spending; refunds reduce it and pending activity stays separate.

Filters are read-only and currently reset on reload. No saved-view feature is claimed. Filtered totals are labelled as selected-view totals. Account filtering explicitly retains the full category targets, since account-specific targets do not exist. A view with no target does not claim to be on plan. No financial records, proposals or revisions are changed by filters. The same browser assertions run against SQLite and verified-auth PostgreSQL.

## Accepted next slices — not implemented here

1. Reusable searchable selectors with “+ Add” actions for existing/custom categories, accounts, bills and ledger entry details. Preserve unfinished forms while creating a related record; independently review financial changes.
2. Upcoming bills and subscription tracking. Use a known exact amount whenever available. An unconfirmed amount may show a supported estimate explicitly prefixed `est.`; without a reasonable basis, show “Amount not confirmed.” Confirmed and estimated totals must remain visibly separate. Replacing an estimate must not create another obligation or ledger entry. Subscription tracking is distinct from activating LedgerBot's own paid billing.
3. Financial calendar with due and projected-clear dates, restrained account colors plus text/symbols, agenda alternative, explicitly selected holiday region, and optional private important dates. Future reminders can prepare budget proposals; calendar events never post transactions or silently clear bills.
4. Page-specific tips: show one relevant tip per appearance, advancing through that page's list before repeating; remember each user's place across visits and sessions. Do not rotate while reading, interrupt entry/review, or repeat irrelevant completed setup guidance. Include dismiss and disable controls, independent of safety warnings and promotions. Hover help must also work by keyboard/touch.
5. Pip available from every page, supportive and lightly witty without shame. OpenAI remains disabled until its constrained, source-grounded integration is configured and tested. Deterministic financial tools supply calculations; current external claims need sources and dates; uncertainty must be disclosed. No zero-hallucination or bulletproof-security promise. Pip cannot approve financial changes.
6. Authorized subscription cancellation with provider-specific support, explicit user action, truthful requested/submitted/confirmed states and an effective date. No automatic refunds or erasure of obligations. Patent/provider-contract clearance is unperformed and remains a release prerequisite for the chosen workflow; no competitor-specific legal conclusion is implied.

Existing launch gates in STAGED_IMPLEMENTATION_REPORT.md remain in force. Nothing in this follow-up enables external services or treats suggestions as implemented functionality.

## Checkpoint report

If you opened the app today, clicking the Dashboard budget graph would take you to the same month's detailed Budget view. You could show only Groceries, Fuel or any other categories you have created, include/exclude uncategorized spending, choose an account, and inspect the matching entries. Clearing filters restores the full view. Changing the month updates its link and survives reload. Filters themselves are not saved views yet.

The final checks passed:

- `npm run typecheck` and `npm run lint`.
- `npm test`: **89 passed across 10 files**. Three new tests cover selected split portions, refunds/pending separation, uncategorized/empty filters, immutable source data and account filtering without invented account targets.
- `npm run test:postgres`: **10 passed** against the real local non-bypass database roles and crypto implementation.
- `npm run build`: passed on the final source.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e:production`: **1 passed**, including nonce CSP hydration and fail-closed production behavior.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: **7 passed** on the final run.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e:postgres`: **3 passed** on the final run. The shared correlation workflow proves opening/filtering/reloading does not alter the owner's stored financial snapshot.
- `npm run check:secrets` and `git diff --check`: passed. The pattern guard is limited, not independent security assurance.

An initial browser assertion incorrectly expected hiding the bill category to hide a separate uncategorized expense. The app correctly retained the $5 expense; the test now verifies that amount, then hides uncategorized too and verifies an empty view. Older Budget copy saying uncategorized spending was excluded was corrected to distinguish category rows from the overall chart.

No database migration, dependency upgrade, external integration or publication was required. Previous real-user launch blockers remain unresolved; this checkpoint does not change the NO-GO decision. The next planned slice is reusable “+ Add” selectors with preserved form work, followed by upcoming bills/subscriptions and the financial calendar. The agreed amount-certainty and tip-cycle behavior above remains required for those later slices.
