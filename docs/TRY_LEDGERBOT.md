# Try LedgerBot yourself

This runs the development app privately on your own computer. It does not publish a website. Use invented information only: this version is not ready for real financial records or bank connections.

## Install and open it

1. Install **Node.js 24.x** from the official Node.js website. This repository requires version 24.
2. On Windows or Mac, GitHub Desktop is a convenient way to clone the private `Dascrubinator1981/LedgerBot` repository. Sign into GitHub through its normal interface. Never send a password or token in chat.
3. In GitHub Desktop, select **Current branch → feat/manual-finance-foundation**, then fetch/pull the latest changes. The work is on this branch; `main` does not contain the application yet.
4. Open a terminal in the LedgerBot folder. GitHub Desktop's Repository menu offers a terminal/shell option (wording varies by system).
5. Run these commands one at a time:

```sh
node --version
npm ci
npm run db:migrate
npm run dev
```

The first command should print `v24...`. Wait for each command to finish; the last command keeps running while you use the app. No Docker or paid provider account is required for this SQLite development path. Its signup is deliberately simpler than the separately tested verified-email PostgreSQL path.

Open your browser and type `http://127.0.0.1:3000`. This address works only on the computer running the terminal. If port 3000 is already in use, stop and report the message instead of switching ports: the security configuration expects that exact origin. Keep the terminal open. Press **Ctrl+C** there when finished; your local records remain saved for next time.

If Windows PowerShell says script execution is disabled, use **Command Prompt** for these commands rather than weakening your system's execution policy.

## A small fictional walkthrough

1. Register with an invented address such as `practice@example.test` and a new test-only password of at least 12 characters. Your workspace should start empty.
2. Create an account called **Practice checking**, with **$1,000** opening balance **as of yesterday**. Prepare it, inspect the review, choose **Use accessible confirmation**, and explicitly confirm.
3. In Budget, add a **Groceries** category and a **$100** target for the current month. Review and confirm each change.
4. In Ledger, enter a **-$15** cleared purchase dated today, allocated to Groceries. Review and confirm. Checking should show **$985**; the budget should show **$15 spent** against **$100**.
5. Go to Dashboard and click the budget graph. Budget should open for the same month. Hide Groceries, then clear filters. The purchase should disappear/reappear in the selected view; the checking balance must remain **$985**. Changing a filter must never change a financial record.
6. Try preparing another entry, then cancel its review. It should remain a draft, with no balance change. In Inbox you can revisit or discard it.
7. For an unreconciled test purchase, review and confirm deletion. Then use **Inbox → Review history → Review undo deletion** and approve restoration. It should return exactly once.
8. In Settings, review and confirm a CSV or JSON export. Export requires signing in within the last five minutes; if asked, sign out and sign in again first. Exporting does not delete records.

You do not need to run automated tests to help with usability. Tell us where you expected to click, what was confusing, what you expected to happen, and what actually happened. Include the page and exact error message. Share only fictional data and never passwords, cookies or tokens.

## Understanding GitHub emails

“Validate manual foundation” is one workflow with two jobs. `postgres-and-verified-identity` checks the local verified-identity/database path; `validate` checks installation, migrations, lint, types, unit tests, build, browser workflows and dependency audits. A passing job does not cancel a failure in the other job. These emails report checks, not a deployment.

Open the run from the email, select the red `validate` job, and expand the **first failed step**. Share its step name and non-sensitive error lines. The development dependency audit has known unresolved findings, but that cannot establish which step failed in any particular remote run. Do not disable security checks or run `npm audit fix --force` to silence it.

The workflow now runs its compiled-production browser test before development browser tests, because both use `.next` and development can replace build output. That fixes an identified ordering problem; the exact cause of your earlier email still requires its log. Remote CI results remain unverified until accessible.
