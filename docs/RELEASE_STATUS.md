# Initial manual foundation · readiness report

**Follow-up re-audit:** see [PRELAUNCH_AUDIT.md](PRELAUNCH_AUDIT.md) for current results (57 unit/integration tests and 5 browser flows), fixes and launch blockers. The original milestone results below are historical baseline evidence. [CODEX_PRIVATE_BETA_PROMPT.md](CODEX_PRIVATE_BETA_PROMPT.md) specifies the next staged task; it has not been executed in full.

**Local development milestone; fabricated values only. Not production-ready. Phase 1 is not complete.** No application deployment, payment collection, real bank connection or customer-data import was performed.

## Feature matrix

| Feature                                           | Status                                            | Evidence / limitation                                                                                                                                                                                        |
| ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Next/React/strict TypeScript and responsive forms | Implemented locally                               | Build, typecheck and lint; sections in one workspace rather than full route/navigation specification                                                                                                         |
| Signup/login/session/logout                       | Working locally; production partial               | Scrypt, opaque hashed sessions, CSRF/origin checks; email verification/reset, MFA and full abuse protection absent                                                                                           |
| Empty new users, unknown vs known zero            | Working                                           | Integration and browser tests; no seed or automatic demo                                                                                                                                                     |
| Tenant authorization                              | Working within local app boundary                 | Owner-scoped queries, composite FKs, forged-ID tests; SQLite has no RLS and cannot defend against a compromised app process                                                                                  |
| Manual accounts/opening snapshot/custom types     | Working creation                                  | Custom name, nullable opening value, end-of-day date and USD; rename/correction workflows deferred                                                                                                           |
| Manual transactions/edit/delete/pending/cleared   | Working within documented limits                  | Persistent SQLite, reviewed mutations; reconciled entries immutable; no soft undo and no full intraday running balance                                                                                       |
| Card purchases/payments/paired transfers          | Working                                           | Exact cents, payment excluded from spending, atomic pair operations and rollback tests                                                                                                                       |
| Categories and exact splits                       | Working creation/classification                   | Signed cent sums required; categorization cannot double-debit; category rename deferred                                                                                                                      |
| Reconciliation                                    | Working basic workflow                            | Statement mismatch blocked, date-bound locks; full discrepancy investigation UI and correction history deferred                                                                                              |
| Review gateway                                    | Working local ceremony; release assurance partial | Immutable proposal/digest/version, current owner revision, human principal, session challenge, CSRF, expiry, idempotency, receipt and minimal audit                                                          |
| Slide and accessible confirmation                 | Working in Chromium                               | Deliberate release, aborted drag and keyboard/tap path tested; independent WCAG/device audit and staging gate remain open                                                                                    |
| Encrypted drafts, passkey step-up                 | Not implemented                                   | Local filesystem is not encryption; no biometric claim                                                                                                                                                       |
| Budget PLAN vs actuals                            | Working minimal                                   | Owner/category/month targets; cleared category allocations, no balance mutation                                                                                                                              |
| 7/30/60/90-day Forecaster                         | Partial                                           | Dated cash actuals, pending and approved recurring estimates, coverage warnings; no schedule/actual occurrence matching or schedule CRUD; estimates may overlap and must not be relied on for real decisions |
| Setup/Inbox/preferences                           | Working minimal                                   | Skip/resume status, persistent pending reviews, discard/resume, separate promotion flag; per-item snooze and reminder engine not implemented                                                                 |
| Isolated opt-in demo                              | Not implemented                                   | No demo data is seeded; only isolated fabricated test databases                                                                                                                                              |
| Export/privacy deletion/restore                   | Not implemented                                   | No customer-data lifecycle completeness claim                                                                                                                                                                |
| Calendar/debt/savings/sandbox                     | Not started                                       | No fake controls or computed claims                                                                                                                                                                          |
| AI/voice/OCR/banks/billing/MCP                    | Disabled; not started                             | Truthful Settings status; no keys or vendor calls needed                                                                                                                                                     |
| CI workflow                                       | Implemented, remote outcome unverified            | Installs, migrations, lint/typecheck/unit/build/browser/audit; local success does not establish GitHub Actions success                                                                                       |

## Commands and observed results

- `npm install ...` and final `npm ci`: successful installation from the committed lockfile.
- `npm run db:migrate` twice: both successful, schema version 1, local empty development database. Integration tests also execute the real schema against isolated in-memory SQLite databases. No Postgres/RLS migration was run or claimed.
- `npm run lint`: passed after resolving the initial lint findings.
- `npm run typecheck`: passed.
- `npm test`: **35 passed, 1 test file**, no skips.
- `npm run build`: passed, optimized Next production build. No deployment.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e`: **3 passed**, real Chromium and Next backend. Two-user flow; mobile cancel/resume/keyboard known-zero flow; valid/aborted/out-of-track slide flow.
- `npm audit --omit=dev`: **0 reported vulnerabilities** in production dependencies. This is not a security audit.
- `git diff --check`: passed.

Initial browser runs exposed canonical-origin configuration and explicit label/locator issues; they were corrected. Initial browser download was rejected by domain policy; the existing system Chromium was used, without disabling verification or bypassing network policy. Test identities and values are wholly fabricated. Database/browser artifacts remain ignored by Git.

## Review and next task

Run the README commands and walk through empty signup → reviewed account → expense → card purchase/payment → target → recurring estimate → reconciliation → second empty user. Cancel review and verify the ledger remains unchanged. A saved financial change invalidates older concurrent proposals; recreate stale proposals from current state.

Recommended next slice: managed Postgres with real RLS and migrations, mature auth lifecycle, encrypted drafts, explicit recurring-occurrence matching/schedule CRUD, safe undo/export and privacy lifecycle. Then independent accessibility/security QA. Bank/AI/OCR/billing registration is not required until later approved sandbox milestones.

GitHub API access is blocked by this environment's current network policy (`api.github.com` Forbidden). The needed domain was saved to the environment configuration draft, preserving package-manager presets. That save does not apply/publish runtime changes. Until it is applied and API authorization is verified, automatic PR creation is blocked; a pushed feature branch can still be reviewed through GitHub's compare page. Do not confuse the branch/CI workflow with a created PR or a published application.
