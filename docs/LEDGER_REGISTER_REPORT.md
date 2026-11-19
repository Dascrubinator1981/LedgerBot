# Ledger register update — November 6, 2026

## What opening Ledger now looks like

Ledger opens on account balances and the line-by-line Transactions register. The Add entry, Edit selected and Transfer / card payment shortcuts sit above it. Large entry forms start folded away; choosing an action opens and focuses the appropriate editor. The global Add transaction shortcut also opens the entry editor.

Each row identifies the date, affected account, description, categories/split amounts, signed amount, pending/cleared status and that account's cleared running balance. Transfers name the other account and remain explicitly marked as transfers, not spending. Select a row and choose Edit selected, or use its own Edit button. Paired transfers open the paired editor. Reconciled entries remain protected.

Account cards show cleared balances, pending counts and the starting-balance date/timing. Filters affect the view, not the underlying balances. Clear ledger filters restores the full register. Unknown balances remain unknown. Starting balances are shown as account context, not fabricated transaction rows.

On narrow screens, rows stack vertically with field labels. Table/row/cell roles are retained, text wraps and selection controls have explicit sizing. The focused mobile test caught inherited desktop nowrap styling and an oversized radio input; these were fixed rather than hiding page overflow.

## Financial and draft behavior

This is a presentation/action-flow update. Canonical accounting, exact cents, transfer linking, tenant checks and independent human confirmation are unchanged. Prepared changes are not inserted into the posted register. Editing a different posted row is blocked while an unfinished form needs attention. Restoring an interrupted page draft opens its collapsed editor before restoring fields.

The new browser scenario checks the default register-first order, folded editor, a $1,000 fictional starting account, prepared-but-unposted $185 expense, confirmed $815 running balance, selected-row editing to $190/$810, filters leaving balances intact, mobile page width, WCAG-tagged automated checks and the global Add shortcut. Existing transfer coverage now opens a posted transfer pair for editing and confirms it without duplicating its financial effect. Existing split, saved-review and diagnostic tests use the new shortcut flow.

## Troubleshooting your test account

No separate service, account setting, database setup or API key is required. First update your Windows copy and restart the app; GitHub changes do not automatically update your laptop. See [UPDATE_WINDOWS_COPY.md](UPDATE_WINDOWS_COPY.md).

1. Sign into the fictional test account.
2. Click **Help troubleshoot** at the top.
3. Click **Start fresh recording**, then **Close troubleshooting**.
4. Try the action that failed. For a split purchase, open Ledger → Add entry, select your fictional account, use today's date, choose Expense and enter 185 with 80/50/55 splits.
5. Reopen **Help troubleshoot**. The steps show browser actions and safe server results; Technical details includes request IDs.
6. Click **Download safe report** before refreshing/signing out. Look for `LedgerBot-troubleshooting.json` in Downloads (or your browser's chosen download folder).
7. Share that file here only if you choose. It does not upload automatically.
8. Click **Clear report** when finished. Downloaded files remain until you delete them.

Recording is off by default, limited to the latest 200 steps in browser memory, and cleared by refresh/sign-out. It excludes financial field values, descriptions, account details, credentials and request/response bodies. More detail is in [TROUBLESHOOTING.md](TROUBLESHOOTING.md). An absent Help troubleshoot button generally means the local copy still needs updating.

## Validation and limits

Final executed results: TypeScript and ESLint passed; normal tests passed 133/133 across 21 files; local Chromium passed 13/13 scenarios; verified-identity/PostgreSQL Chromium passed 7/7; production build and its CSP/hydration/fail-closed browser scenario passed (1/1). The source secret guard passed across 183 tracked files. A former description-cell assertion needed disambiguation because the new selection control also names the transaction; the assertion now explicitly checks the account/description cell. Financial and isolation assertions remain intact. Automated mobile WCAG-tagged checks reported no violations in the new register scenario. No new dependency audit or container scan was run for this UI-only milestone; prior artifact results belong to the exact images identified in earlier dated reports. Linux Chromium tests do not establish physical Windows Firefox/iPhone/Steam Deck behavior. No schema/dependency change, data reset, deployment, merge or paid activation is part of this update. Household/joint approvals remain planned. Hosted configuration and independent reviews remain launch gates.
