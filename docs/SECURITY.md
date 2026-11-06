# Security posture — beta candidate, not an independent certification

No real customer financial information, live bank access, paid activation or public deployment is authorized by this development checkpoint. The initial candidate is a closed manual-finance test with fictional records. See BETA_READINESS_REPORT.md for current evidence and release gates; older stage reports are historical snapshots.

## Identity and request boundaries

Hosted configuration uses official Supabase SSR authentication, server-side verified identity/email, HttpOnly provider cookies and a separate random opaque app session stored as a verifier. App sessions last eight hours and require a new sign-in for sensitive five-minute step-up actions. Logout, password change and app-session revocation invalidate appropriate session/challenge access. Settings can list/revoke other app sign-ins without exposing stored verifiers, cookies or tokens. Revocation is not a password reset or global provider logout.

Financial writes require exact canonical origin, JSON, a bounded 64-KiB body, CSRF and an authenticated owner. Production rejects SQLite fallback and insecure/missing HTTPS identity/database/versioned-key configuration. Remote PostgreSQL TLS verification is enforced. Production public signup is closed in both UI and application route; Supabase's independent Auth signup setting must also be disabled before staging. Approved beta identities use the tested sign-in/PKCE recovery path. Provider rate limits, CAPTCHA/abuse policy, SMTP delivery and edge controls still need actual hosted configuration and validation.

## Authorization and financial integrity

Requests run under serializable PostgreSQL transactions with transaction-local identity derived from the verified provider, not caller-supplied owner IDs. Composite ownership FKs, exact integer/generated money checks and FORCE RLS supplement route/service checks. Application connections reject superuser/RLS-bypass roles. Browser/AI/integration principals have no direct financial-table write interface. The trusted server writer credential remains a powerful boundary; RLS does not protect against its compromise.

Every financial mutation uses the independent proposal/review/confirmation path. The backend recomputes stored proposal digests and checks owner, current revision, exact before snapshot, live human session, single-use challenge, expiry and idempotency. Atomic writes cover transfer pairs, allocations, status, receipt and audit. Same-key receipt recovery does not repost; stale/replayed/mutated/foreign approvals fail. Session revocation and its challenge invalidation are atomic and produce append-only owner-scoped security events without financial payloads.

Pip remains disabled. A future adapter may prepare typed drafts only and must never receive human cookies, CSRF, review challenges or unrestricted database/HTTP tools. Software cannot prove human intent against a compromised browser or stolen live human credentials. No biometric, zero-hallucination or bulletproof-security claim is made.

## Encryption, exports and recovery

PostgreSQL proposal payloads and before/after snapshots use AES-256-GCM with random nonces and authenticated owner/proposal/version/key-ID context. V2 key-ring envelopes support read-old/write-new rotation while v1 recovery remains explicit. Maintenance rotation requires a separate unrestricted operator connection, defaults to dry-run, uses bounded read batches/one serializable transaction, and rolls back every update if any draft fails. See KEY_ROTATION.md. Normal application roles cannot invoke an all-owner rotation.

Keys belong in an external secret manager, separate from the database and image. Hosted escrow, all-writer configuration coordination, retained-backup key recovery and hosted restoration remain required. SQLite is a development-only plaintext fallback. A consistent encrypted PostgreSQL backup has been restored and its exact cents/RLS/write denial tested using synthetic databases; this does not prove hosted identity continuity or regional disaster recovery.

Exports require a recently authenticated human session. JSON excludes credentials/keys; CSV protects untrusted text against spreadsheet formulas. Reviewed financial deletion retains a recoverable before-snapshot and therefore is not data erasure. Account closure, draft/audit/security retention, a published recovery window and backup-expiry propagation require completed policy/lifecycle work before real financial records are accepted. No real-customer erasure endpoint is activated.

## Runtime, supply chain and operations

Nonce-based script CSP, no unsafe inline/eval production scripts, dynamic non-cacheable HTML, frame restrictions and content-type/referrer/permissions headers are in place. React element style attributes remain allowed. Provider callback URLs are suppressed from framework request logging; external ingress/APM still must be configured to omit bodies, cookies, tokens and query strings. No external analytics/error-monitoring service is active.

The minimized official Node 24 container runs as a non-root user with read-only filesystem, no-new-privileges and dropped capabilities during rehearsal. Its build context excludes local data, `.env` files and test artifacts. Unused runtime package managers and development lint packages are absent. Liveness is separate from readiness; an unconfigured container deliberately returns 503 for finance/readiness. Readiness is a dependency check, not proof all user flows work.

The minimatch advisory is resolved through a narrowly scoped official 11.0.1 override on the parser edge, with unchanged lint-rule fingerprints and real parser/React/TypeScript/a11y regression cases. The parent still declares a 10.x semver range, so this remains an explicitly documented project-validated override. No advisories were suppressed. See DEPENDENCY_SECURITY.md. Audit/database freshness, container OS findings and compatible tool upgrades need continuing review; a green audit is not a penetration test.

## Remaining release gates

Hosted project/roles/email/HTTPS/edge configuration; tested hosted restore and key recovery; real retention/closure policy and lifecycle; bounded history/pagination and broader load validation; independent security/privacy/legal assessment; physical iPhone/Windows/assistive-technology testing; and explicit owner review of the candidate/provider/cost before deployment. Full MFA/passkeys and deeper abuse/session/provider controls remain partial or absent. No compliance certification is implied.
