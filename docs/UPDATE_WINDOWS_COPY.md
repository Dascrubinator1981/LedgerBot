# Update your Windows test copy safely

These instructions preserve your existing local fictional accounts and entries. Updating is separate from publishing. Stay on `feat/manual-finance-foundation`; nothing has merged into main.

1. Save unfinished page changes for later review while the app is still running. Download any troubleshooting recording you want to keep before refreshing. Then go to VS Code and click inside the terminal where LedgerBot is running.
2. Press **Ctrl+C**. If Windows asks `Terminate batch job (Y/N)?`, type **Y**, then Enter. Leave VS Code open.
3. Open **GitHub Desktop**. Check **Current repository → LedgerBot** and **Current branch → feat/manual-finance-foundation**.
4. Click **Fetch origin**. If it changes to **Pull origin**, click that too. If it reports conflicting/local source changes, stop and share the message; do not discard files or reset the repository. Generated local financial files must not be committed.
5. Return to the VS Code terminal. Run each command separately and wait for it to finish:

```text
npm ci
npm run db:migrate
npm run dev
```

6. When the server says Ready, open or refresh `http://127.0.0.1:3000` **on that laptop**. Keep the terminal running. If Firefox shows an old screen, use Ctrl+Shift+R. Use **Save changes for later review** before refreshing an unfinished page. Confirm the saved review appears in Inbox. An unfinished inline category-name popup must first be staged.
7. Your local login and existing saved fictional records should still exist. **Do not delete the data folder, SQLite database, encryption key or `.env` files to update.** Do not run operator key rotation tools.

## Current update

See [the staged report](TODAY_UPDATE_REPORT.md) for current behavior. Financial form buttons now stage changes; click **Review staged changes** (or navigate away and choose review), inspect/edit the batch, then confirm. Staging alone never changes balances. Keep the database and its matching `.draft-key` file together when backing up local saved reviews.

## What to test in this update

- A failed Prepare action should explain why beside the form and keep your input. Missing required fields should identify themselves.
- With **Entry type → Expense / card purchase**, a positive `185` total and positive `80`, `50`, `55` splits should prepare as an expense of `-185` with three negative allocations. Automatic direction still requires signed values.
- New manual entries apply when cleared, including on the starting day. Tick **Already included in my starting balance** only for history that balance already covers. Future dates can stay **Pending / planned**; future entries cannot be **Cleared**. Older records retain their original treatment.
- With a fictional opening of $1,000 dated today, the cleared split purchase should leave $815. A $100 Groceries target should show $80 actuals and $20 remaining. Household/Automotive spending remains included in overall spending even without category targets.
- A statement of $1,000 should fail reconciliation after that purchase; the message should show $815 calculated. A statement of $815 through today should prepare for independent review. Do not confirm reconciliation until you are done correcting entries in that period: confirmation locks it.
- On Budget choose **+ Add a new category**, enter its name and target, then prepare once. Both should appear together in review and neither should exist until confirmed. Closing review keeps the staged change; use its Edit button to restore the entry fields.
- Dashboard now includes the automatic Forecaster. Settings → Forecast settings selects horizon, accounts and displayed details. Its table includes today plus the chosen number of following days. Settings → Manage forecast bills and income plans holds recurring schedule controls. These are plans, not extra posted expenses.
- Charts should be shorter. There should be no separate Forecaster item in the main sidebar; old direct URLs remain compatible for now.

Weekly/biweekly/quarterly targets, page-wide batch review and saved-review expiry are included in this candidate. Email/text reminders remain future work. Use only invented records. Phone/Steam Deck testing against a private HTTPS beta still requires a separately approved hosted deployment.

## If a button still seems unresponsive

After updating, use **Help troubleshoot → Start fresh recording**, close the dialog and try the action. Reopen it and choose **Download safe report** before refreshing. See [the step-by-step guide](TROUBLESHOOTING.md). Preparation now moves to the review queue with an explicit notice; your balances change only after confirmation. Future-dated entries now stay Pending / planned; cleared entries must use today or earlier.

## Register-first Ledger

After this update, Ledger shows account balances and Transactions first. Use Add entry, select a row and Edit selected, or choose Transfer / card payment. Entry forms are folded away until needed. Full walkthrough: [LEDGER_REGISTER_REPORT.md](LEDGER_REGISTER_REPORT.md).

## Easier manual entry

New manual entries apply to the balance when cleared, including on the starting day. Use Already included in my starting balance for history that your balance already covers. Pending / planned amounts appear on the dotted budget line. See [MANUAL_ENTRY_UPDATE_REPORT.md](MANUAL_ENTRY_UPDATE_REPORT.md). No database reset is needed.

## Latest interaction fixes

See [APP_REVIEW_REPORT.md](APP_REVIEW_REPORT.md) for the newest checks. Adding an inline category now selects it automatically, and an unfinished inline name survives Save for later. Cancel edit clears the unfinished marker; canceling an edit to a staged change restores that staged change. Settings has a Your time zone field with a Use this device’s time zone button; click Save preferences afterward.
