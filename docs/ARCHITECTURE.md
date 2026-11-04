# Architecture · ADR 001

Baseline: README-only private LedgerBot checkout, separate from the old GitHub Pages repository. Latest master sections 20–28 govern conflicts. Original uploaded contract read in full; repository copy removes private workbook audit details.

Next.js App Router, React, strict TypeScript, Zod, responsive CSS, Vitest and Playwright. Native semantic forms/dialogs provide the initial accessible UI; Tailwind is not required for this slice. Domain functions are deterministic and independent of SQL, React and vendors.

Node 24 built-in SQLite permits a runnable local foundation without remote credentials or Docker. **SQLite has no RLS.** The server is the sole database principal; every repository query/mutation is owner-scoped, and composite foreign keys block cross-owner references. This does not protect against a compromised application process. Managed Postgres RLS is a production gate.

Browser → JSON routes → session/origin/CSRF checks → finance service → owner-scoped database. There are no direct financial CRUD endpoints. All forms create immutable proposals; an independent review issues a session-bound short-lived challenge; confirmation validates and commits atomically with an idempotent receipt.

`domain.ts`: signs, cents, date/balance/budget/forecast rules. `auth.ts`: scrypt and opaque sessions. `http.ts`: canonical origin and CSRF. `finance.ts`: ownership, proposals, challenges, posting, reconciliation, audit. Future Pip/bank/OCR adapters may prepare typed drafts/staging only, never receive human sessions or approval tokens.

Global per-user revision intentionally makes competing proposals stale. Recreate stale drafts from current records; editable proposal versions are deferred. The UI currently uses sections in one workspace; dedicated routes, calendar and full mobile bottom navigation remain incomplete.

Schema version 1 is defined in `src/lib/db.ts`, invoked by `scripts/migrate.mjs`; startup applies its idempotent DDL. Future incompatible changes must introduce new versioned migrations, not rewrite version 1. No reset or seed is automatic.

Next: production-capable authentication and RLS/encryption/privacy/export/undo; recurring-occurrence matching and schedule CRUD; forecasting improvements; independent accessibility/security review. Vendor sandboxes follow foundational gates, with separate permission for public launch, banks and paid billing.
