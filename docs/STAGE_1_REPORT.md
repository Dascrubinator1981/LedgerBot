# Stage 1 — database and identity checkpoint

If you opened the PostgreSQL development app today, you would see the familiar LedgerBot workspace, with an important difference: registration requires a verification email before you can enter. A recovery email lets you choose a new password; a successful change revokes the other app sessions. New users still see an empty workspace, not demonstration balances.

Manual accounts and ledger entries still use the same exact-money engine and independent review screen. They save to PostgreSQL in this mode. A second user cannot read the first user's records, even when an identifier is forged. Pending drafts are encrypted in the database; cancel/approve and receipt writes remain atomic. You can retrieve a saved receipt after reloading instead of posting the financial change again.

The older SQLite development mode remains available so previous workflows can be checked against the new one. It is explicitly a development fallback: production financial and auth routes fail closed unless PostgreSQL/verified auth is selected. There is no silent fallback from a misconfigured PostgreSQL provider.

## How this was checked

- Real local PostgreSQL 17.7, Supabase Auth 2.177.0, and a local-only mail capture server; all identities and values fictional. Verification and recovery emails never leave this local test setup.
- Actual non-superuser/non-RLS-bypass app role; FORCE RLS on owner tables, reader role without direct financial writes, composite foreign keys, exact monetary checks, stable budget IDs and deferred transfer/allocation consistency constraints.
- Each request uses a serializable database transaction with a transaction-local verified subject. Financial savepoints preserve the common engine's atomic behavior without leaving tenant identity on a pooled connection.
- PostgreSQL migrations are versioned and rerunnable. Supabase project credentials and an encryption key are server-only; none is in Git or the client bundle. Existing SQLite records/password hashes were not imported, rewritten or removed.
- Automated cases cover old card/payment/category behavior, actual policy/foreign-key denials, encrypted drafts, same-key retries, competing approval/discard, verified signup, database-backed reload, second-user isolation, email recovery and session revocation. The original SQLite browser suite is retained.

## Local use

Requires Docker, Node 24 and npm. From the checkout:

```sh
npm ci
npm run local:services
npm run test:postgres
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:e2e:postgres
npm run dev:postgres
```

Use the installed browser override only when that binary exists; otherwise install Playwright's supported browser with normal TLS/artifact verification. Local ports: app 3000, PostgreSQL 55432, provider proxy 55321 and mail capture 58025. Mail capture is for fabricated local tests only. The services bind to loopback. No public preview/deployment is created.

Generated test credentials and keys live only in ignored `data/local-services/` files with mode 0600. Keep those files to retain access to local encrypted drafts; do not rotate/remove them blindly. The setup reuses containers/data and never resets existing databases. If changing the stateless auth/proxy configuration, explicitly recreate those two development containers; do not remove the PostgreSQL container or its data. Hosted migrations require a separate administrator; normal app credentials must have neither ownership, superuser nor RLS bypass privileges.

For hosted use, provision a separately approved Supabase/Postgres project, enforce email confirmation, configure valid redirect URLs and SMTP, apply the migrations using an administrator, and supply the server-only example variables securely. Normal connection roles and provider-managed credentials must be mapped and tested in that actual project; local success is not evidence of hosted readiness. Require verified TLS for non-loopback PostgreSQL. Browser/AI principals must not receive the server writer connection or the draft key. The DB subject comes only from server-verified identity, never from a route payload.

## What is still to come

Checkpoint results: 59 unit/SQLite/crypto tests passed; the separate PostgreSQL run passed 10 checks (8 actual database cases plus the same 2 crypto cases, not 10 additional unique tests); 5 original SQLite browser flows and 2 verified PostgreSQL browser flows passed. Typecheck, lint and production compilation passed. A test attempt that overlapped compilation was interrupted and rerun serially; it is not counted as a passing run. The new CI job installs and exercises these local database/identity services; remote CI execution is still unverified.

No hosted project is configured or deployed. MFA/passkeys, key rotation tooling, production provider/image security review, rate-limit/abuse tuning, encrypted backups/recovery, data lifecycle, managed-project RLS verification and independent accessibility/security assessment remain release gates. The app server is a trusted boundary: its writer role sets a transaction-local verified subject; neither the DB password nor this capability may be exposed to browsers or Pip. Provider password updates and DB session revocation span two systems; concurrent serialization is retried and an unconfirmed revocation returns an explicit failure, not a false success. Production failure/recovery testing for that degraded case is still required.

Next is Stage 2: explicit bill occurrences and matched payments, correct future projections, account/transfer corrections, and a consistent shared budget/graph view. The requested last-seven-days paid-bill section will use confirmed **bill** payments only, not merchant text guesses or ordinary expenses. No changes in this checkpoint authorize real data, banking, paid billing or publication.
