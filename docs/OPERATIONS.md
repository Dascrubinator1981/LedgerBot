# Operations and recovery — local evidence, hosted configuration pending

No deployment is configured or authorized. These instructions prepare an operator to review a future candidate; they do not provision a service.

## Configuration boundaries

| Environment | Data and identity                                                                           | Readiness                                                       |
| ----------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Development | Ignored SQLite for local-only development, or local PostgreSQL/GoTrue/mail capture          | SQLite is deliberately not production-ready                     |
| Test        | Unique fictional identities and disposable databases                                        | CI/local synthetic services; never point tests at customer data |
| Staging     | Separate managed database, Auth project, key and HTTPS origin                               | Not provisioned; requires separate owner authorization          |
| Production  | Separate managed project, non-owner non-superuser app login, external secrets, verified TLS | Not provisioned; launch gates outstanding                       |

Use Node 24 and `npm ci`. For local verified identity run `npm run local:services`, then `npm run dev:postgres`; runtime values are generated into ignored mode-0600 files. Do not paste these files into chat or logs. The scripts reuse their own local services non-destructively. Run browser suites serially; Next development and production builds share `.next`.

For a future hosted installation, apply the sorted `migrations/postgres/*.sql` using a separate migration administrator. Application requests use only a non-superuser, non-owner login in `ledgerbot_server`; never expose it to a browser, AI tool or vendor. The trusted server sets the transaction-local subject after provider verification. `ledgerbot_reader` has read-only finance access under RLS; no public browser SQL endpoint is supplied. RLS does not protect against a compromised trusted server that holds its writer credential.

Provide server-only `LEDGERBOT_BACKEND=postgres`, `LEDGERBOT_POSTGRES_URL`, `LEDGERBOT_SUPABASE_URL`, `LEDGERBOT_SUPABASE_ANON_KEY`, `LEDGERBOT_DRAFT_KEY` and exact `LEDGERBOT_APP_ORIGIN`. An anon provider key is not a privileged service key; it still stays in server configuration here. Configure provider email confirmation, exact callback allowlists, HTTPS mail links, SMTP deliverability and abuse protections. Never use development mail capture for customers.

Terminate HTTPS at a trusted proxy, preserve canonical host/origin, strip untrusted forwarding headers, and set request-size/time limits. Production cookies are Secure and HttpOnly regardless of a false development override; readiness also refuses an insecure production origin or explicit insecure-cookie setting. Do not cache HTML, authentication or financial APIs. Do not record request bodies, query strings, cookies, exported files or provider responses in proxy/APM logs. Configure HSTS at the HTTPS edge only after validating its domain policy. No client analytics or external error-reporting vendor is active. Production configuration now rejects non-HTTPS app/provider origins, insecure cookie settings, absent database/provider credentials and missing versioned encryption.

## Health and failures

`GET /api/health` checks process liveness only. `GET /api/health?ready=1` returns 200 only with verified-backend configuration, a valid draft-key shape, reachable provider health, the expected migration versions, and a non-superuser/non-bypass database connection. It returns generic 503 without secrets, database errors or financial values otherwise. Readiness is a dependency check, not proof that signup, email delivery, approval or recovery works.

Database connection and query timeouts are bounded. Writes use serializable transactions; conflicting actions can require a new review. Do not automatically replay a financial mutation with a new idempotency key. Query the owner-authenticated receipt for an uncertain approval. Do not display a failed refresh as a failed financial save when a receipt was returned.

## Backup and restore

`npm run test:recovery` creates two uniquely named disposable synthetic databases on the local test service. It applies every migration twice, writes a fictional balance/expense, takes a consistent PostgreSQL custom-format dump, encrypts it with AES-256-GCM and a new in-memory test key, writes an ignored mode-0600 archive, re-reads/decrypts/restores it into the second database, and checks exact cents, schema versions, reader RLS and write denial. It rejects a changed ciphertext and wrong key. Only those generated databases are dropped. The ephemeral test key is intentionally not retained, so the archive is not a usable long-term backup. Dumps in this bounded test are capped at 16 MiB.

**Hosted backups are not configured or tested.** Before beta, select provider point-in-time recovery and encrypted off-site export arrangements, then test a restore into an isolated project with separate authorization. Cover application tables, provider identity, roles/policies, migrations, encryption-key recovery and any future uploaded objects. The local drill covers application database restoration and existing group roles, not provider identity continuity, cross-region disaster recovery or a production-scale streaming backup.

Store production encryption/backup keys in an external secret manager with restricted access, version history and separate recovery authority. Versioned key-ring reads/writes and a transactional operator rotation tool are now implemented and tested on disposable synthetic PostgreSQL databases. See [KEY_ROTATION.md](KEY_ROTATION.md) for dry-run, maintenance-window, backup/key retention and rollback requirements. Hosted escrow, representative maintenance-duration measurements and a hosted recovery rehearsal are still not configured or verified. Never discard old keys while a retained backup still needs them.

## Migration, rollback and incident response

Migrations are additive and rerunnable. Preserve a backup and record the app commit plus migration versions before change. Run upgrade tests on a restored synthetic copy and check new constraints against existing data. Roll back application code only to a version compatible with the expanded schema. Do not automatically run destructive down-migrations; a data rollback needs operator review, a verified restore and a plan for writes since the backup.

On suspected unauthorized access: restrict the affected service, stop commits if integrity is uncertain, revoke affected sessions, preserve privacy-safe audit metadata and protect the evidence. Do not paste financial payloads into tickets. Identify affected principals/versions/intervals, assess disclosure obligations with the owner/counsel, fix the boundary, rehearse recovery, and independently validate before reopening. Document what is known and unknown. No monitoring vendor, on-call rotation, breach notification service or compliance certification is implied.

## Costs and external prerequisites

Hosting, managed PostgreSQL/Auth, transactional email, backup retention, monitoring and domain registration remain unselected. Costs depend on region, usage, retention, email volume and provider tier; no current price has been verified in this environment and no paid account has been activated. Obtain dated quotes from chosen providers before committing a budget. AI, banks, OCR, voice and billing remain disabled and are outside this manual-finance candidate.

## Closed beta registration and session controls

Production candidates disable the application's public signup UI and reject direct signup requests. Configure Supabase Auth itself to disable public signup as well; its public Auth endpoints are outside the application route guard. Use a separate beta project with only approved pre-created test identities. For activation, use the app's tested Forgot Password/PKCE recovery flow with a designated mailbox and fresh password change; do not assume provider invite links with a different token format are supported by this callback.

Settings lists active app sign-ins using public domain-separated handles, not stored session verifiers or tokens. A fresh five-minute human sign-in is required to revoke another session. Revocation expires its app access and invalidates its approval challenges atomically, recording an append-only owner-scoped security event. It is not global provider logout or a password reset. Change a compromised password too. Expired metadata/closure retention still needs owner/legal policy and an approved cleanup lifecycle before real customer use.

The Docker candidate binds only to loopback during local rehearsal, runs as an unprivileged user with a read-only filesystem and dropped capabilities, and excludes local data/credential files. See deploy/README.md for the proposed hosting boundary. This local package is not a hosted beta or approval to deploy one.
