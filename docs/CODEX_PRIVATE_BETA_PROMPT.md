# LedgerBot: implement the manual-finance private-beta candidate

Copy the task below into the LedgerBot development environment. This prompt describes **future implementation**, not work already completed or permission to publish. Execute in reviewable stages and report before any deployment or launch.

---

You are the lead software engineer for LedgerBot. Continue the existing implementation; do not restart it, replace it with mockups, or claim the remaining features already work.

## Read, inspect and establish the baseline

Read `AGENTS.md`, `CODEX_FIRST_TASK.md`, the complete `docs/LedgerBot_Codex_Master_Build_Prompt_v3.md` (sections 20–28 govern conflicts), `docs/ARCHITECTURE.md`, `docs/SECURITY.md`, `docs/FINANCIAL_ENGINE.md`, `docs/RELEASE_STATUS.md` and `docs/PRELAUNCH_AUDIT.md`. Inspect current code, migrations, tests, dependency pins, Git status, remote branches, open PRs and CI when access permits. Read the installed Next.js version's relevant documentation before framework changes. Confirm which commits have actually merged; local passing tests do not establish remote CI success.

Use the existing checkout; cloud tasks are already isolated. Do not create worktrees unless explicitly requested. Preserve all existing files and changes. Choose a feature branch based on the actual integration state and make tested, reviewable commits. Use the existing GitHub connection; do not request a token simply because GitHub CLI fails. Diagnose permissions and network policy first. Request only indispensable missing credentials via environment settings, never in chat. Continue independent implementation and local testing while external configuration is unavailable.

## Objective and boundaries

Deliver a secure, genuinely usable **manual-finance private-beta candidate** in tested stages. Begin with storage/authentication and financial correctness, then essential UX and operational readiness. Do not expand into premium integrations to compensate for missing fundamentals.

- Every new user starts with zero financial records, not manufactured zero balances. Unknown/unconfigured, confirmed zero and estimated values remain distinct. A demo, if added, is explicit, wholly fictional and isolated from customer accounts.
- Ledger is canonical actuals; Budget is an approved plan compared with actuals; Forecaster is an estimate with explicit assumptions; Pip may explain and draft, never approve or commit.
- Every financial mutation—including opening corrections, categories, schedules, budget amendments, reconciliation, deletion and restoration—passes independent authenticated human review. Spoken agreement to Pip is never approval. OS accessibility voice control may operate the trusted human interface.
- Use fabricated identities, institutions and values only. Do not request, open, import, copy or publish the owner's personal workbook, real customer records, receipts, credentials or bank account identifiers. Never include secrets or financial content in logs, analytics, screenshots shared publicly or model prompts.
- Keep bank sync, AI/voice, OCR, billing, real payments and MCP disabled. No paid service activation, real bank connection, real customer-data deletion, public deployment or publication of the application. Prepare configuration and deployment documentation only. Even a private staging deployment requires a separate owner go-ahead; local/test services may run for validation.
- Stop before publication and present a concrete report and reviewable changes. Do not call a development-environment snapshot an application launch.

## Stage 1 — secure database and identity foundation

Prefer managed Postgres/Supabase Auth with actual row-level security, building on the existing domain and proposal service. Justify any equally secure alternative before diverging; no custom authentication system solely to avoid configuration. Build a locally runnable disposable Postgres/test-auth path where supported, so tests do not depend on production credentials.

1. Add versioned, repeatable migrations and typed, normalized owner-scoped tables with stable IDs, foreign keys, exact integer money constraints, USD-only aggregation unless properly implemented otherwise, and indexes justified by queries. Explicitly handle SQL `bigint`/JSON/TypeScript boundaries; do not silently coerce unsafe integers or use floating point dollars.
2. Implement verified signup/email confirmation, login/logout, password reset, protected session renewal/revocation, appropriate throttling/abuse controls and a documented risk-based step-up policy. Use generic auth failures and safe structured operational errors. Session presence is not proof of approval intent.
3. Enforce ownership at both routes and database policy/function boundaries, including nested references, transfers, splits, proposals, challenges, receipts, recurrences and exports. Derive identity from verified authentication, never caller-supplied owner IDs or an `origin: human` flag. Exercise real database roles and RLS; application filtering or superuser tests alone are insufficient.
4. Revoke direct financial-table writes from browser/AI/integration principals. Only the narrowly authorized approval/commit path may post canonical records. Secure any privileged SQL function with least privilege, a fixed search path, validated identity and proposal-bound authorization. Avoid routine service-role/RLS bypass. Human credentials/challenges must never reach Pip tools or vendor callbacks.
5. Keep proposal operations immutable/versioned and recompute their canonical digest before issuing review challenges and before committing. Bind owner, live session, proposal ID/version/digest, affected record versions, expiry and idempotency. Atomically commit transfer pairs, allocations, approved status, receipt and audit. Serialize competing approval/discard/reconciliation correctly across independent workers/connections. Recover a lost response through an authenticated receipt/status query without reposting.
6. Encrypt sensitive resumable drafts and their before/after snapshots with documented key management outside the database; distinguish application encryption from provider disk encryption. Plan rotation, retention, deletion and backups. Do not store raw keys in code or bundle them into clients.
7. Preserve local development data non-destructively. Design any SQLite-to-Postgres conversion as an explicit dry-run/export/mapping/migration operation with validation and recovery. Do not silently seed managed accounts or copy local password hashes into a new auth system. Use synthetic fixtures for migration tests.

Deliver this stage independently runnable with migrations, actual RLS/authorization tests, auth flows and documented configuration. If a hosted service is unavailable, report exactly what was tested locally and what is externally blocked; do not label hosted authentication configured.

## Stage 2 — complete reliable manual finance

1. Complete account/category naming and correction workflows with stable references. Make opening snapshot semantics explicit, including same-day behavior, unknown balances and correction/rebase effects on history. Preserve the single canonical balance model.
2. Complete actual/pending transaction and paired-transfer lifecycle: create/edit, pending-to-cleared transitions, refunds, signed cent-exact splits, atomic pair changes, reviewed deletion and safe restore/undo. Never count a card payment as spending or let a category amendment debit an account again. Use explicit provenance and idempotency without treating two legitimate identical purchases as duplicates.
3. Preserve reconciliation history and prevent edits/backdating inside reconciled periods. Provide a real discrepancy investigation and explicit approved correction workflow; never silently overwrite a statement or change balances to force agreement.
4. Add recurrence create/edit/pause/delete and explicit **occurrence-to-actual matching**. Separate due, expected-clear and actually-cleared dates. Paid/received, pending, unpaid, overdue, skipped and estimated states must not be confused. Handle pending replacements, partial/variable amounts and early/late actual payments without counting the same obligation twice. No automatic financial posting or clearing based on the calendar.
5. Finish deterministic 7/30/60/90-day projections with IANA user timezone/civil dates, monthly anchor rules, leap years, DST boundaries, configurable clearing assumptions and appropriately documented holiday policy. Include current-day/overdue obligations through explicit occurrence state. Display coverage/provenance and shortage warnings; do not manufacture certainty when schedules or opening balances are absent.
6. Keep monthly targets and budget actuals separate. Show uncategorized spending and incomplete comparisons. Define which approved planned discretionary spending affects projections so it cannot duplicate bills, card payments or recorded/pending activity. A lower target does not create cash.
7. Add authenticated CSV/JSON export with safe formula handling, documented fields and owner authorization; safe approved restoration and a privacy/retention/delete design. Implement deletion only against disposable synthetic users in testing. Real customer deletion is outside authorization.

Deliver full persisted browser workflows and deterministic finance tests before declaring this stage complete.

## Stage 3 — essential beta experience

- Responsive, accessible navigation and meaningful deep links for Dashboard, Accounts, Ledger, Budget, Forecaster, Inbox, review and Settings. Decompose the large workspace into coherent feature components. Keep monetary calculations shared and server-validated.
- Skippable/resumable setup with per-item dismiss/snooze/not-applicable controls. Financial safety/setup alerts and optional promotions have independent preferences. Avoid repeated nags.
- Human review shows exact before/after values, affected balances/plan impacts, assumptions and origin. Touch requires a genuine continuous thumb drag ending inside the track and release; interrupt/cancel/expiry/staleness must do nothing. Provide equally deliberate two-stage tap/keyboard/switch/screen-reader/OS voice-control confirmation without dragging. Optional passkeys start only after explicit human initiation and bind to the exact proposal.
- Preserve draft work and verified receipts across failed refreshes, lost responses, logout/relogin and reload, without falsely reporting success or failure. Query uncertain outcomes safely using persisted idempotency/receipt identity.
- Explicit known-zero/unknown/error/loading states; useful empty dashboards; clear pending versus cleared and forecast versus actual values. No controls that simulate an unimplemented action.
- Test contrast, keyboard/focus, 200% zoom, reduced motion, narrow/wide views and a drag-free path. Automated axe/browser tests complement, but do not replace, real screen-reader and motor-access QA; report unrun device checks.

## Stage 4 — operational and release preparation

Prepare separate dev/test/staging/production configurations, documented HTTPS/origin/cookie handling, server-only secrets, restrictive nonce-based CSP, least-privilege deployment, privacy-safe error monitoring, health/readiness checks, migration/rollback procedures, backups and a **tested restore** using fabricated data. Configure CI for lint, strict typecheck, meaningful unit/property/integration/API/RLS tests, production build, browser E2E, dependency/secret checks and migrations. Resolve the documented moderate minimatch lint-tool findings using a supported, compatible package chain; preserve React, accessibility and TypeScript rule coverage. Do not force-downgrade ESLint, override incompatible major APIs or hide advisories. Keep deployment jobs disabled or manually gated; no provider provisioning or paid resources without authorization.

Document retention, privacy policy/terms drafts, vendor disclosures, export/deletion lifecycle, incident/recovery procedures and a release checklist. Policies are drafts pending owner/legal review; do not invent compliance certification. Verify log/event scrubbing and permission boundaries. Record remaining paid service registrations and estimated costs with sources/assumptions; do not activate billing or promise unverified prices.

Prefer measured, practical efficiency: bounded pagination, minimal owner-scoped DTOs, indexed queries, exact domain recomputation and schedule-window iteration. Do not load every historic proposal into every validation or recompute the full ledger for each unrelated keystroke. Cache only with correct tenant keys and invalidation; never share private results between users. Benchmark representative synthetic workloads and document limits before optimizing further.

## Mandatory validation and launch gates

Run repository install, migrations twice on a disposable test database, lint, typecheck, all relevant tests, production build and complete browser flows. Record exact commands, test counts and failures. Tests must include:

- Empty signup and explicit known-zero account; two verified users and anonymous/expired sessions.
- Foreign IDs and nested records rejected through routes **and actual Postgres roles/RLS**, including attempts to bypass the approval service with direct database/RPC writes.
- Card charge/payment, transfer edits/deletes/restores, pending-to-cleared, split/refund exactness, category/target changes without balance drift, unknown/negative balances, overflow and cent-exact display.
- Mutated stored/request proposal data, forged principal, expired challenge, stale version, replay, repeated same-key receipt recovery, changed key, lost-response/reload, cross-session reuse, concurrent approve/discard and injected failure with no partial pair/status/receipt.
- Reconciliation drift and backdating, stable IDs, recurrence matching without duplicate projection, current-day/overdue and early/late payments, month-end/leap/DST/timezone dates, incomplete coverage and forecast provenance.
- Full browser walkthrough: signup → setup skip/resume → reviewed account → split expense/card purchase → paired payment → budget plan/actuals → recurring schedule matched to actual → reconciliation → reviewed undo/export → second isolated user.
- Mobile and desktop confirmation, cancelled/interrupted/out-of-track drag, keyboard alternative, failed refresh with verified receipt preserved, and clearly disabled vendors. Pip utterances/tools never approve.
- Synthetic backup restoration, migration upgrade and permission tests, privacy-safe logs, no client secrets and no real customer material in repository/artifacts.

Investigate failures and fix supported implementation issues. Never weaken assertions, disable verification, substitute mocks for required database tests, erase financial data, overwrite lockfiles casually, or call skipped/unrun tests passed. Security/financial/RLS/approval failures block progress to release.

## Required handoff — report before publication

Provide a feature matrix (working/partial/disabled/blocked/not started), changed-file/architecture summary, exact executed commands and counts, discovered issues and fixes, security/privacy/accessibility caveats, measured performance findings, developer setup and fabricated QA walkthrough, local versus hosted evidence, CI results if verifiable, and the PR URL. Create reviewable PRs when access permits; if blocked, push the authorized review branch, explain the exact blocker and provide a compare link without claiming a PR exists.

End with a **GO/NO-GO recommendation for private beta and for public launch separately**, outstanding severity-ranked blockers and the concrete next action. Successful tests are necessary but not independent security certification. Do not publish, deploy, connect real banks, activate payments/subscriptions or use real customer information. Wait for separate explicit owner approval of the concrete release candidate.
