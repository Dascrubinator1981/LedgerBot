> Follow-up usability work is documented in [UX_REVIEW_AND_NEXT_STAGES.md](UX_REVIEW_AND_NEXT_STAGES.md). The evidence below describes the earlier November 5 checkpoint; consult the follow-up report for new tests, migration 008 and current scope.

# LedgerBot manual beta readiness — November 5, 2026

## If you opened the app today

On a configured development instance, you can create an empty account and build your own accounts, categories, budgets, bills and ledger. There are no preloaded financial records. You review proposed financial changes in a separate confirmation screen before they take effect. Pip cannot approve or post them.

Ledger actuals feed budget comparisons and charts. Transfers and card payments do not become spending twice. Bills can be matched to payments, and Forecast shows bills paid in the last seven civil days. Corrections, deletion, restoration, reconciliation and export are functional. Unknown opening balances remain unknown rather than silently becoming zero. The device guide includes exact fictional numbers to check these relationships yourself.

Settings now lets you inspect active sign-ins and revoke another sign-in or all other sign-ins. A revoked sign-in cannot approve an outstanding financial proposal. The current sign-in stays active. Fresh authentication is required for this security action; changing a compromised password is still necessary.

There is **no hosted beta website yet**. An unconfigured production build refuses financial access. Production registration is closed; the independent identity provider must also have public signup disabled before a closed beta.

## What changed in this milestone

- Fixed the reported minimatch dependency issue without downgrading Next.js or removing lint rules. Both full and production-only npm audits report zero vulnerabilities. The narrow parser dependency override is outside its declared major range; actual required matching API, parser behavior and unchanged TypeScript/React/accessibility lint rules are tested. See `DEPENDENCY_SECURITY.md`.
- Added authenticated versioned draft encryption and a bounded transactional key rotation operator tool. Dry-run, missing-key failure, rollback and replacement-key recovery are tested with PostgreSQL. This does not mean hosted keys have been escrowed or rotated.
- Added owner-scoped session revocation, immutable owner-scoped security events and negative tests for revoked approvals, foreign users, stale authentication and database failure.
- Added fail-closed production configuration checks, closed application signup and a recovery navigation correction.
- Added a standalone production container and a repeatable runtime/security scan, also required by CI. The first Debian candidate failed the image vulnerability gate and was replaced with a matching Alpine builder/runtime and removal of unused global package managers. No vulnerability suppression was added.
- Added the detailed Windows, iPhone and optional Steam Deck walkthrough, operator deployment checklist and novice account-creation guide.

## Validation evidence

Executed locally against fictional fixtures only:

| Check | Result |
| --- | --- |
| Normal automated tests | 105 tests across 15 files |
| PostgreSQL and crypto integration tests | 18 tests across 4 files |
| Browser workflows | 9 SQLite, 5 PostgreSQL/verified identity, 1 compiled-production boundary test |
| TypeScript and ESLint | Passed |
| Production build | Passed |
| SQLite migration run twice | Passed |
| PostgreSQL migration/recovery drill | Passed, including forced row isolation |
| Full npm audit and production-only npm audit | Zero reported vulnerabilities |
| Production container runtime boundary | Passed: non-root, read-only, closed signup, unconfigured finance denied |
| Current container vulnerability gate | Zero HIGH and CRITICAL findings; lower severities are not claimed absent |

The final image tested was `sha256:515f3ddf61c20cbfa7803b0fc9309634015aec1fe2203156d4154b8ebfa3096a`. Its ignored local machine-readable report is `data/container-qa/latest-summary.json`; generated image archives and scanner outputs are not committed. CI independently rebuilds and scans its candidate with a current database. Vulnerability findings can change over time.

One parser integration test exceeded its original five-second limit during concurrent builds/scans. Its targeted timeout is now thirty seconds; all assertions remain. Final checks run without that heavy concurrency. This report does not claim a remote GitHub Actions success until the pushed workflow has actually completed.

Browser automation uses Chromium and accessibility checks. It does not establish physical iPhone Safari, VoiceOver, Windows Narrator or Steam Deck behavior. Those checks remain on the device checklist. Local official identity services are tested; no hosted Supabase/mail service has been configured or validated.

## What is still needed before a closed fictional-data beta

1. Owner account and reviewed provider, region, cost and private hosting proposal. Supabase and hosting are assumed not created. Follow `BETA_ACCOUNTS_FOR_OWNER.md`; no credentials in chat.
2. Separate hosted database and least-privilege app role, all seven migrations, HTTPS runtime configuration, closed provider signup and approved tester identities. Verify sign-in/recovery mail end to end using controlled test mailboxes.
3. Hosted backup and restore drill, securely stored encryption key recovery and operator procedures; a local recovery test cannot establish hosted recovery.
4. Hosted two-user isolation and stale/revoked confirmation checks, rate limits, logs that exclude private payloads, mobile and accessibility checks.
5. Review the exact candidate and remaining risks, then obtain explicit owner deployment approval. No deployment, public publication, bank access or paid billing has been activated.

Before **real financial data or public launch**, finish independent security/privacy review, retention and account-erasure policy/workflows, hosted recovery evidence, realistic capacity/pagination checks, device usability review and applicable legal review. No implementation is described as bulletproof.

## Later stages

Bank and card sync, automatic merchant-to-bill learning, researched OpenAI coaching, subscription cancellation services, premium billing, advanced calendar holidays/important dates and further navigation/form convenience improvements still require implementation and validation. They are not silently treated as working integrations. Known amounts stay exact; an unconfirmed forecast amount must visibly say `est`.

The next deployable target is a small closed manual-finance beta using fictional records. November is a goal, not a verified launch commitment. The detailed operator proposal is `../deploy/README.md`; physical testing instructions are `DEVICE_TESTING_GUIDE.md`.
