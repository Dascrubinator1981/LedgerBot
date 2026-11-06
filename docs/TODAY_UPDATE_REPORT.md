# LedgerBot staged update — November 6, 2026

This is a private development candidate, not a published application or a beta approval. Use invented financial information only.

For the latest interaction and cancellation fixes and their current verification, see [APP_REVIEW_REPORT.md](APP_REVIEW_REPORT.md). The counts below are an older staged checkpoint.

For the latest relaxed manual-entry rules, dotted pending-budget line and bank/receipt enrichment design, see [MANUAL_ENTRY_UPDATE_REPORT.md](MANUAL_ENTRY_UPDATE_REPORT.md).

For the latest register-first Ledger and test-account troubleshooting walkthrough, see [LEDGER_REGISTER_REPORT.md](LEDGER_REGISTER_REPORT.md).

Opt-in troubleshooting and later split-entry feedback, with their separately executed checks, are recorded in [SPLIT_ENTRY_FEEDBACK_REPORT.md](SPLIT_ENTRY_FEEDBACK_REPORT.md). The artifact scan below identifies the earlier staged image; it is not a scan of subsequent commits.

## What you would see today

The Dashboard now opens as Forecast. Account balances and budget details sit beside smaller monthly and weekly charts, with upcoming expenses/bills below. Risk messages identify overdrafts, budget pressure and incomplete information. Bills do not trigger the discretionary-spending yellow warning. Filters cannot hide an account from the overall risk assessment. Projections remain projections based on entered information, not promises about future cash.

New accounts can use a start-of-day balance, so a cleared purchase today changes today's balance immediately. Existing end-of-day snapshots retain their original meaning until you explicitly review a correction. Earlier opening dates are allowed. A fictional $1,000 starting balance and a cleared $185 purchase produce $815; pending spending remains separate.

Amounts do not use historical autocomplete. Similar category/description names offer local reuse suggestions without automatic merges or external AI access. Budget targets support weekly, biweekly, monthly and quarterly anchored amounts, calculated from actual dates for the selected monthly plan. This does not automatically create every future month's plan.

Financial forms queue changes for a page review. You can edit staged items, then independently approve an atomic batch. Pip cannot approve it. Leaving a page offers review, saving for later, keeping the page open or discarding the draft. Inbox holds saved reviews, including incomplete named form fields. Resuming requires a fresh review; consumed or expired sources cannot post again. Changes do not affect balances before approval.

Saved reviews offer today, seven days, Saturday or the default 30 days. Today/Saturday say midnight and stop accepting approval at 1am the next morning in the saved timezone. Local evening reminders and Inbox notices are implemented; email/text delivery is not configured. Expired drafts leave the active queue but remain encrypted history, not permanently erased records.

Mobile quick actions wrap by default. Extra custom actions use More/Back or a held swipe that moves the tab strip without moving the whole page. Debt Tools and Savings Plan clearly remain unavailable.

## Verification

TypeScript and ESLint passed. The normal suite passed 128 tests across 20 files. Local Chromium passed all 12 browser scenarios; verified identity/PostgreSQL Chromium passed all 7. These include cross-section accounting, split expenses, reconciliation, saved-page resume, approval cancellation/editing, isolation and recovery. The production build and its compiled-browser security/hydration scenario also passed. PostgreSQL/crypto passed 18 tests across four files; the encrypted backup/restore drill passed. Both full and production-only npm audits reported zero vulnerabilities. The repository secret guard passed across all 175 selected files. The isolated container runtime and high/critical vulnerability gate passed. Exact image: `sha256:3707e7aebab682bf42b940e061d7f4e9a8ac82e18fe55fdea7d784b95db96e17`, observed November 6, 2026 at 19:43 UTC; zero HIGH and zero CRITICAL findings. This is bounded local evidence, not an independent security certification or a claim that lower findings are absent.

The interaction inventory lists controls for review; it is not proof of every possible input or device combination. The requirement audit includes source lines, current decisions, status and evidence. Broad requirements are deliberately marked partial where only a manual slice exists.

## Still unfinished or blocked

Hosted HTTPS, managed database connection, real email delivery, hosted backup/restore rehearsal and independent security/accessibility review remain release gates. GitHub access alone does not supply those services. No deployment, paid billing or bank action was performed.

Calendar/holidays/important dates, complete debt/savings tools, subscription cancellation, bank matching/sync, live OpenAI coaching, voice/OCR and premium integrations remain future work. Physical Windows Firefox, iPhone and Steam Deck testing is still needed. No security can honestly be called bulletproof, and no AI can guarantee absolute truth.

An unfinished inline category-name popup is not yet included in saved-form restoration; finish staging that category before saving the page. Other complex interruption combinations still need broader usability testing. Hosted retention/account erasure and outbound reminder preferences need completion before customer beta.

## Original chat and workbook

The supplied chat informed a privacy-safe requirements extract. Private account/access claims in old conversations are not verified capabilities. The unfinished workbook was inspected structurally as a conceptual reference, not used as a financial calculation oracle. No personal ledger records were imported into code, fixtures, logs or Git. Assistant-created temporary downloaded copies were removed; original uploaded attachments remain available in the conversation.

## Reproduce the executed checks

Use Node 24 and the existing local synthetic service configuration. Run root build/browser suites serially. No customer database is needed or permitted for these tests.

```sh
npm run typecheck
npm run lint
npm test
npm run test:postgres
npm run test:recovery
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e:postgres
npm run build
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e:production
npm audit
npm audit --omit=dev
npm run check:secrets
npm run test:container
```

The Chromium executable setting is specific to this Linux cloud machine. For your Windows laptop, use the [safe update guide](UPDATE_WINDOWS_COPY.md) and [device testing guide](DEVICE_TESTING_GUIDE.md). Cloud subprocess restrictions initially blocked Next.js configuration parsing and the Git-based secret guard; both passed when rerun with the required process access. No audit rules, assertions or TLS verification were disabled.
