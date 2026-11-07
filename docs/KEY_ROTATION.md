# Draft-key rotation and recovery

This is operator maintenance, not a user-facing financial action or a Pip tool. No real customer database is authorized for mutation in this development task. The implemented tests use a newly created disposable synthetic database and drop only that generated database. Hosted key escrow and a hosted recovery rehearsal remain external release gates.

## What changed

Old v1 drafts remain readable using `LEDGERBOT_DRAFT_KEY`. A v2 envelope contains a non-secret key ID, encrypted payload, nonce and authentication tag. The owner, proposal ID, envelope version and key ID are authenticated together. Changing the key ID, even to an alias for identical bytes, fails authentication. Financial proposal hashes/review checks continue to protect the decrypted operation.

New configuration uses a server-only `LEDGERBOT_DRAFT_KEYS` JSON object mapping key IDs to 32-byte hexadecimal keys, plus `LEDGERBOT_DRAFT_ACTIVE_KEY_ID`. IDs may contain letters, digits, dots, underscores or hyphens, up to 64 characters. At most 16 keys may be configured. Only the active key is used for new v2 writes; retained named keys can read their older v2 envelopes. Keep the legacy single key separately until all v1 data and retained backups have a recovery path. Missing/malformed key configuration fails closed.

The local services script now generates a named `initial` key-ring entry from its existing ignored development key, retaining legacy recovery. It does not reset stored drafts or financial records. Test fixtures remain isolated from customer information.

## Rehearse before any hosted use

1. Inventory the running application version, all key IDs and schema versions. Do not print key bytes or decrypted drafts in tickets or logs.
2. Verify a consistent encrypted database backup and the separately protected recovery material for every key referenced by that backup. Agree who can recover each. The key must not live solely in the database being backed up.
3. Restore a synthetic backup into an isolated database. Run the rotation and restore tests there first. The existing synthetic drill does not prove provider identity/SMTP/region continuity.
4. Generate the new random 32-byte key in the chosen external secret manager. Give it a new non-secret ID. Do not send it through chat or put it in source, a client bundle or build arguments.
5. Add it to the server key ring while retaining every required older key. Change the active ID only after that ID is configured. Roll this configuration to **every writer** and verify new writes use the new ID; an old worker must not create an old-key envelope after the migration.
6. Put the application into a reviewed maintenance window that prevents financial commits/new drafts. The current app has no automatic global maintenance switch; enforce this at the approved ingress/orchestrator and verify it. Do not proceed by assumption.
7. Supply a separate operator connection through secure `LEDGERBOT_ROTATION_DATABASE_URL`. The utility requires an unrestricted migration/maintenance role (superuser or RLS bypass); an ordinary app role is rejected to prevent falsely claiming that an RLS-filtered subset was rotated. Never give this connection to the running application, browser or AI.
8. From the operator checkout, run `npm run drafts:rotate`. **Default is dry-run.** It authenticates/decrypts every stored proposal in one consistent read snapshot and prints counts only. Unknown arguments, missing recovery keys or corrupt drafts stop it. Resolve failures without modifying the originals.
9. Review the dry-run result and recovery plan. Applying is explicit: `npm run drafts:rotate -- --apply`. It uses bounded read batches, row locks and one serializable transaction. It re-encrypts only envelopes not already using the active v2 key. On any error, every update rolls back. It does not change decrypted proposal contents, owner revisions, financial records or approval status.
10. Keep the maintenance window until the command completes and the post-checks pass. Locks/transaction duration scale with the number of drafts; a bounded batch is not a promise of short maintenance time. Benchmark on a restored representative copy first. The command never automatically retries an interrupted apply.
11. Run dry-run again: `wouldChange` must be zero. Verify representative proposal review/receipt recovery and restore a new backup. Counts alone do not prove all workers are using the new configuration.
12. Reopen access only after operator review. Keep old keys for retained backups and recovery/legal retention requirements. Do not retire an old key merely because the current live table has been rotated. Record the non-secret key IDs, candidate commit, times and observed results.

## Failure and rollback

A failed database transaction rolls back all envelope updates. A lost connection after commit has an uncertain outcome: inspect with a fresh dry-run rather than changing keys or repeating financial actions. Keys are not deleted by the tool. While both generations remain available, a controlled reverse migration to the previous active named key is possible after the same backup/dry-run/maintenance process. An older app that cannot read v2 envelopes is not a safe code rollback. Do not remove the new key and deploy old code as a shortcut.

The local CLI keeps certificate verification enabled for remote database connections and does not log plaintext, connection strings or raw errors. It has a 30-second per-query timeout; choose an appropriate operator maintenance plan for larger hosted data rather than weakening correctness checks. The synthetic tests prove dry-run, idempotency, recovery after removing the legacy key, all-or-nothing failure, minimum UUID coverage and refusal of ordinary app roles. They are not an independent cryptographic audit.
