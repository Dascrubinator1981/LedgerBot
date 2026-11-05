# LedgerBot

Private local development milestone. **Fabricated data only; not production-ready.** Ledger holds actuals, Budget holds intentions, Forecaster estimates cash ahead, and Pip is a disabled future integration. No deployment or paid billing is configured.

## Current staged work

See [the staged report](docs/STAGED_IMPLEMENTATION_REPORT.md) for current functionality, exact validation and remaining launch gates. The four-stage prompt now has tested implementation checkpoints; it is not fully satisfied and the application remains **NO-GO for real-user beta or public launch**.

For the PostgreSQL/verified-email workflow, Docker is required:

```sh
npm ci
npm run local:services
npm run dev:postgres
```

Local verification/recovery mail is captured by the test mail service. `docs/STAGE_1_REPORT.md` describes the test services and ports. No hosted credentials are configured. Test with invented values only.

## Run the SQLite development fallback locally

Requires Node **24.x**, npm, and writable local storage. No vendor credentials are needed.

```sh
git clone https://github.com/Dascrubinator1981/LedgerBot.git
cd LedgerBot
git checkout feat/manual-finance-foundation
npm ci
cp .env.example .env.local
npm run db:migrate
npm run dev
```

Open the address printed by Next.js on your own computer. Use `127.0.0.1` on port 3000, not `localhost`, because the CSRF origin is explicitly pinned. When changing the host/port, set `LEDGERBOT_APP_ORIGIN` to that exact origin. The cloud onboarding UI does not provide localhost previews.

The migration script reads exported environment variables, not Next's `.env.local`; its default database path matches `.env.example`. For a custom path, run `LEDGERBOT_DATABASE_PATH=/your/test/path.sqlite npm run db:migrate` and set the same path for Next. The local database and all `.env.local` files are ignored by Git. No automatic reset, sample accounts, or financial seed exists.

## Try it

1. Register an invented email and a password of at least 12 characters. New users have zero financial records. Skip setup; resume through **Settings → Setup & Personalization**.
2. Prepare a fictional checking account with `$100` and an opening date before any transactions. Review the exact proposal, choose **Use accessible confirmation**, then deliberately confirm. Nothing posts before the final action. Blank balance means unknown; `0` means known zero.
3. In Budget, prepare and approve a custom category. In Ledger, prepare a `-15` expense on a date after the opening snapshot, allocate it to that category, and approve. Cleared balance becomes `$85`. Edits and deletes also require review.
4. A credit account with `$50` owed plus a `-20` purchase becomes `$70` owed. A `$30` transfer from checking to the card reduces checking and owed together, without recording more spending.
5. Set monthly budget targets; compare approved cleared allocations without altering balances. In Forecaster, approve recurring bills/income and inspect estimated daily cash and incomplete-coverage warnings.
6. Reconcile against an invented statement. Mismatches block approval; successful reconciliation locks that period against edits, deletes and backdated insertion.
7. A separate browser profile and second invented user starts empty and cannot see the first user's records.

Slide confirmation requires dragging from the thumb to the far end and releasing. Cancel does nothing. The two-stage keyboard/tap alternative needs no dragging. OS voice control can activate the trusted UI; Pip has no approval tool.

## Validate

```sh
npm run db:migrate
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install --with-deps chromium
npm run test:e2e
npm audit --omit=dev
npm audit
```

With installed Chromium: `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`. Browser tests use port 3100 and a separate fabricated-only `data/e2e.sqlite`; never point tests at customer data. Tests use unique synthetic identities and do not delete existing databases. CI creates its own fresh database.

The full dependency audit currently fails with 8 moderate development-tool findings in the lint dependency chain; the production-only audit reports zero. This is recorded as an unresolved release gate, and CI now checks both. Do not run `npm audit fix --force` or suppress the findings to manufacture a passing result; see the re-audit for compatibility evidence.

Build compiles but never publishes. Production mode sets Secure cookies and requires HTTPS; use `npm run dev` for local HTTP interaction. No hosting workflow is included.

## Readiness

The next staged implementation prompt is [CODEX_PRIVATE_BETA_PROMPT.md](docs/CODEX_PRIVATE_BETA_PROMPT.md). Read the [prelaunch re-audit](docs/PRELAUNCH_AUDIT.md) for reproduced issues, corrections, expanded tests and the current **NO-GO** decision for real-user hosting/public launch. Implementation checkpoints are documented in the staged report. No hosted migration or deployment has occurred.

See [architecture](docs/ARCHITECTURE.md), [data model](docs/DATA_MODEL.md), [financial conventions](docs/FINANCIAL_ENGINE.md), [security](docs/SECURITY.md), [test plan](docs/TEST_PLAN.md), and [release status](docs/RELEASE_STATUS.md).

The complete product and staged contract remain partially implemented. PostgreSQL RLS, verified email recovery, encrypted drafts, occurrence matching, naming, reviewed restore, exports, graphs, navigation and a local recovery drill are now present. Hosted configuration, independent security/device testing, retention/erasure, key rotation, bounded backend pagination and the remaining dependency gate are unfinished. No real financial information is committed; no vendor integration or publication has been enabled.
