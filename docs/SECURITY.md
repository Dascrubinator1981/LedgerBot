> Current staged implementation: see [STAGED_IMPLEMENTATION_REPORT.md](STAGED_IMPLEMENTATION_REPORT.md), [Stage 1](STAGE_1_REPORT.md), [Stage 2](STAGE_2_REPORT.md), [Stage 3](STAGE_3_REPORT.md), and [operations](OPERATIONS.md). The original milestone/audit below is historical; later reports supersede its feature-status statements.

# Security and threat model

**Fabricated-data local development only. No production-readiness claim.** No personal workbook, real bank identifiers, tokens, vendor keys or customer records belong in Git. Private workbook-specific audit details were redacted from the repository contract.

Passwords: salted scrypt and timing-safe verification, 12–128 characters. Sessions: random 256-bit opaque tokens stored hashed, HttpOnly/SameSite Strict cookies, eight-hour expiry, Secure in production. Logout revokes session and challenges. No credential-bearing localStorage or client write authority.

All mutations require exact configured canonical origin, JSON and session CSRF token. Body stream cap 64 KiB. Per-email persisted throttling limits attempts, but targeted lockout/distributed abuse remain concerns. SQL values are bound. Error responses suppress SQL/path details. React escapes text. CSP restricts external resources but permits inline scripts/styles for initial Next hydration; nonce-based CSP is deferred.

Every query is owner-scoped; composite FKs reject cross-owner nested references. Writes revalidate under an atomic transaction. SQLite has **no native RLS**, and a compromised application process can read the whole database file. Move to managed Postgres RLS before real multi-user hosting.

Approval checks immutable proposal ID/version/server-serialized digest, exact before snapshot, owner revision, current human session, random session-bound challenge, expiry, and idempotency. Server posts its stored operation rather than client-supplied amounts. Exact same-key retries return the receipt; changed key/replayed/stale/expired/foreign/mutated approvals fail. No partial transfer survives rollback. Audit logs contain IDs/events/time, not descriptions or amounts.

Human/AI principal is server-issued, not a request assertion. There is **no active AI adapter**. Future AI adapters may only create typed drafts/scenarios, cannot receive human cookies/CSRF/challenges or unrestricted browser/HTTP tools. Software cannot prove human intent against a compromised browser/XSS/stolen session. No biometric assurance is claimed. Both gesture and accessible UI use the same backend verification.

The re-audit added digest recomputation against stored proposal contents at review and commit, transactional discard/challenge invalidation, and a second live-session check inside the commit transaction. Unexpected HTTP exceptions are now hidden by default; only explicitly public application errors are returned. These controls have regression/failure-injection tests, but hosted database-role and multi-worker concurrency verification remain open. See PRELAUNCH_AUDIT.md.

| Risk                                   | Current local policy                                  | Before real use                         |
| -------------------------------------- | ----------------------------------------------------- | --------------------------------------- |
| Ordinary transaction/category/budget   | Session + explicit independent review + challenge     | Independent review and abuse tests      |
| Opening account/reconciliation         | Same explicit approval, no automation                 | Risk-based step-up and fuller audit     |
| Delete entry/pair                      | Before preview + approval; reconciled records blocked | Undo/restore, retention policy, step-up |
| Ownership/security/export/bank/payment | No endpoints                                          | Separate consent/threat model/step-up   |

Outstanding: email verification/reset, MFA/passkeys, device/session management, global/source rate limits, RLS, encrypted draft storage, backup/restore, export/deletion/retention, nonce CSP, TLS operations and independent security/privacy review. Filesystem isolation is not encryption. Native dialog and browser checks do not establish WCAG 2.2 AA; real screen-reader/switch/eye-gaze testing remains required. Public deployment, real banks and billing need separate owner approval.
