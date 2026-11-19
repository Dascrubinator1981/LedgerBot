# Application review — November 6, 2026

If you open the app today, you get an empty private financial workspace, a Forecast dashboard, a transaction-by-transaction Ledger, manual accounts, category budgets, an Inbox for saved reviews and Settings. Prepared financial changes remain separate from confirmed records. Nothing in this update publishes the app or connects real bank data.

## Corrections in this review

- Canceling a posted transaction or transfer edit clears its unfinished-form marker. Canceling an edit to a staged change restores the original staged item, its position and original form values; it does not approve the change. Saved edits retain their original values for later cancellation, with a compatibility fallback for older saved reviews.
- A failed transfer preparation retains its editor and entered values. Successful preparation clears only the relevant editor.
- An unfinished category name inside a dropdown is included in Save for later and restored when resumed. Preparing the transaction is blocked until that category is added or the inline addition is canceled. Adding a category selects it automatically in the originating dropdown; exact existing names reuse the existing category. Both new category and transaction still need the independent page confirmation.
- Dashboard's Add Transaction shortcut opens the transaction editor. Opening Ledger normally still starts at the register.
- Settings uses clearer wording for forecast warnings, exports and active logins. Time zone has common-city suggestions and a device-time-zone button; Save preferences remains necessary. Existing saved-review deadlines retain their original time zone.

## Interaction review scope

| Area                                 | Automated evidence / checks                                                                                                              | Limits                                                                            |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Sign-up, sign-in, sign-out, sessions | Empty start, separate users, session cancellation/revocation, invalidation, verified identity                                            | Hosted owner configuration and delivery not tested                                |
| Accounts and balances                | Unknown/zero, liabilities, opening correction, same-day/historical inclusion, reconciliation                                             | No bank connection                                                                |
| Ledger                               | Register filters/reset, row editing, exact splits, pending/cleared, paired transfers, deletion/restore, failed preparation, cancellation | Receipts and imported-bank matching absent                                        |
| Budget                               | Category creation/reuse, inline category restoration, anchored period targets, actual/pending totals, filters                            | Future months are not automatically populated                                     |
| Forecast                             | Cash/budget correlation, weekly/monthly charts, warnings, recent paid bills, filters, settings and shortcuts                             | Projections depend on user-entered schedules                                      |
| Reviews and Inbox                    | Prepare/edit/cancel/confirm, slide and keyboard alternative, deferred review/reload/resume, expiry/time zone rules, replay rejection     | Outbound email/SMS reminders absent                                               |
| Settings and export                  | Forecast preferences, time zone, session controls, export review/cancel/download scenarios, safe troubleshooting report                  | Full privacy/erasure workflow and external delivery incomplete                    |
| Navigation/accessibility             | Deep links, browser history, keyboard, zoom, mobile-width overflow checks and automated axe scenarios                                    | Windows Firefox, physical iPhone/Steam Deck and screen-reader review still needed |
| Security/recovery                    | Tenant isolation/RLS, approval binding, input validation, encryption/recovery, dependency and secret checks                              | Local evidence cannot substitute for independent security review                  |

The generated INTERACTION_INVENTORY.md inventories source controls. It is not a claim that every possible value, device or attack has been tested. REQUIREMENTS_AUDIT.md tracks the larger product contract; partial features remain partial.

## Executed verification

Tests use fabricated data only. TypeScript and ESLint passed; 147 unit tests across 23 files and 18 PostgreSQL/encryption tests across four files passed. The encrypted backup/restore drill passed. Both npm audit and npm audit --omit=dev reported zero vulnerabilities. The repository guard passed for 191 tracked files.

Local Chromium: 14 scenarios passed in the full run; the new Settings scenario initially failed because its test selector did not match the accessible export control. After fixing that selector, both the Settings scenario and the strengthened inline-category/reloaded-edit scenario passed. This gives 15 distinct passing local scenarios. All eight verified-identity/PostgreSQL browser scenarios passed. Automated accessibility/keyboard/zoom/mobile-width evidence is bounded to those scenarios.

The final production build passed. The compiled production-browser scenario passed (1/1), including nonce CSP hydration and fail-closed unconfigured finance. There are 24 distinct passing browser scenarios across local development (15), verified identity/PostgreSQL (8) and compiled production (1).

The isolated production container passed non-root/read-only packaging and fail-closed unconfigured-finance checks. Exact image: `sha256:9ff65cbf164be5445cc853574674db428cccea648badd88b8cbe7e1904ac5bb5`; scanner observed November 6, 2026 at 23:38:39 UTC, zero HIGH and zero CRITICAL vulnerabilities. This does not assert zero lower-severity findings or independent security certification. The cloud sandbox required a broader execution context for local listeners, Docker and the git-based secret guard; these checks then completed. No app was deployed. Remote GitHub Actions results are separate from this local evidence.

## What remains before a user beta

The manual application is a development candidate. Private HTTPS hosting, owner Supabase/auth configuration, email delivery, hosted recovery verification, current remote CI, independent security/accessibility review and physical-device testing remain release gates. Calendar, household/joint approvals, debt/savings tools, bank sync, receipt OCR, live OpenAI Pip, subscription cancellation, voice and paid billing are unfinished or disabled. There are no guarantees that all bugs have been eliminated.

## Getting this update onto Windows

Follow UPDATE_WINDOWS_COPY.md: stop the running app, pull the review branch, run npm ci, run npm run db:migrate, then restart npm run dev. Keep your local data and private environment files. These cloud changes do not hot-update an already-running Windows copy. Use invented financial records during testing.

## Repository visibility

During this review the GitHub repository API reported Dascrubinator1981/LedgerBot as public. Its visibility was not changed. The application has not been deployed, but source visibility must not be described as private. No personal workbook, customer data or runtime credentials were added. If private source is intended, repository visibility must be corrected in GitHub Settings before treating it as a private repository.
