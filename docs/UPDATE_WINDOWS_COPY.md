# Update your Windows test copy safely

These instructions preserve your existing local fictional accounts and entries. Updating is separate from publishing. Stay on `feat/manual-finance-foundation`; nothing has merged into main.

1. Go to VS Code. Click inside the terminal where LedgerBot is running.
2. Press **Ctrl+C**. If Windows asks `Terminate batch job (Y/N)?`, type **Y**, then Enter. Leave VS Code open.
3. Open **GitHub Desktop**. Check **Current repository → LedgerBot** and **Current branch → feat/manual-finance-foundation**.
4. Click **Fetch origin**. If it changes to **Pull origin**, click that too. If it reports conflicting/local source changes, stop and share the message; do not discard files or reset the repository. Generated local financial files must not be committed.
5. Return to the VS Code terminal. Run each command separately and wait for it to finish:

```text
npm ci
npm run db:migrate
npm run dev
```

6. When the server says Ready, open or refresh `http://127.0.0.1:3000` **on that laptop**. Keep the terminal running. If Firefox shows an old screen, use Ctrl+Shift+R. Saving an incomplete form before refreshing is not yet supported as a page-wide draft; finish or note its fictional values first.
7. Your local login and existing saved fictional records should still exist. **Do not delete the data folder, SQLite database, encryption key or `.env` files to update.** Do not run operator key rotation tools.

## What to test in this update

- A failed Prepare action should explain why beside the form and keep your input. Missing required fields should identify themselves.
- With **Entry type → Expense / card purchase**, a positive `185` total and positive `80`, `50`, `55` splits should prepare as an expense of `-185` with three negative allocations. Automatic direction still requires signed values.
- Transaction date must be today or earlier and **after** the account's opening snapshot date. The opening snapshot is end-of-day. The separate reviewed opening correction—not reconciliation—changes that starting date/balance.
- With a fictional opening of $1,000 dated yesterday, the cleared split purchase should leave $815. A $100 Groceries target should show $80 actuals and $20 remaining. Household/Automotive spending remains included in overall spending even without category targets.
- A statement of $1,000 should fail reconciliation after that purchase; the message should show $815 calculated. A statement of $815 through today should prepare for independent review. Do not confirm reconciliation until you are done correcting entries in that period: confirmation locks it.
- On Budget choose **+ Add a new category**, enter its name and target, then prepare once. Both should appear together in review and neither should exist until confirmed. Canceling review should preserve the entry fields.
- Dashboard now includes the automatic Forecaster. Settings → Forecaster display selects horizon, accounts and displayed details. Its table includes today plus the chosen number of following days. Settings → Manage forecast bills and income plans holds recurring schedule controls. These are plans, not extra posted expenses.
- Charts should be shorter. There should be no separate Forecaster item in the main sidebar; old direct URLs remain compatible for now.

Weekly/biweekly/quarterly budget planning, page-wide batch review, saved-for-later expiry and email/text reminders remain future work. Use only invented records. Phone/Steam Deck testing against a private HTTPS beta still requires a separately approved hosted deployment.
