# Inline category creation checkpoint

If you opened LedgerBot today, the category list in each Ledger split and in Budget would start with “＋ Add a new category…”. You can prepare a category on the same page without abandoning the purchase or target you were entering. Its own review screen opens; creating a category does not post the unfinished purchase or budget target.

Cancel review and your unfinished entry stays in place; the proposal remains available in Inbox, with no canonical category or transaction posted. Approve the category and it becomes available in the list. Select it explicitly, finish the original entry and review that entry separately. The previously selected category is preserved when opening or closing the add panel. Enter in the new-name field prepares category review rather than accidentally submitting the surrounding financial form. Escape closes the panel. Ordinary form reset clears the inline name and selection bookkeeping for the next entry.

This uses the existing owner-scoped proposal, challenge and approval service. There is no direct category-write endpoint, automatic approval or change to financial calculations. Category names and unfinished form values are not newly stored in browser persistent storage. Preserving the open form does not imply recovery after closing the browser or signing out.

The reusable `CategorySelect` component is shared by Ledger split fields and Budget. Names still pass backend validation and the independent financial review gateway. A newly approved category is not silently assigned by matching its name; the user selects its stable ID from the refreshed list.

The expanded automated accessibility check found two existing bill-link checkboxes with undersized touch targets. Checkbox controls are now 24 pixels square and their labels have a minimum 44-pixel height. The tested open Ledger panel passes those axe checks after the fix. This is selected Chromium coverage, not an independent WCAG certification or physical-device assessment.

## Remaining scope

This is the first part of reusable entry shortcuts. Inline account and bill creation, richer search, remembered descriptions/amounts and automatic selection using a verified creation result are not implemented here. Upcoming bills/subscriptions, calendar and persistent page-tip cycling remain later slices. Exact known amounts must take precedence over explicitly labelled estimates, as recorded in EXPERIENCE_FOLLOWUP.md.

No bank connection, live AI, paid billing, provider cancellation, public deployment or real customer information was used. Existing launch blockers, including the development dependency audit, remain unchanged. No claim of complete accessibility or production readiness is made.

## Final validation

- `npm run typecheck`, `npm run lint`, `npm test`: passed; **89 tests across 10 files**, no skips.
- `npm run build`: passed on the final source.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e:production`: **1 passed**.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: **8 passed**.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e:postgres`: **4 passed** with real local verified identity and PostgreSQL.
- Shared new browser assertions cover new-category keyboard review, cancellation with no canonical posting, preserved account/date/description/amount/split values, approving only the category, preserved prior selection when closing the panel, a single $12.34 purchase producing an $87.66 balance from a fictional $100 snapshot, and preserving a $123.45 target without posting that target during category approval.
- The new open-Ledger axe check initially failed on the existing bill-link touch targets; the controls were enlarged and the final runs passed without disabling the rule.
- `npm run check:secrets`: passed for all 112 tracked/staged files; this limited pattern guard is not independent secret-scanning assurance. `git diff --check` passed.

No dependency or schema changed. The PostgreSQL browser tests exercise persisted reviews and records, rather than substituting a mocked backend. Remote CI is not verified here; the previously confirmed minimatch development-tool audit finding remains a release gate. The pushed branch remains `feat/manual-finance-foundation`; GitHub API access was previously denied, so a new PR is not claimed. This checkpoint does not deploy or merge the application.
