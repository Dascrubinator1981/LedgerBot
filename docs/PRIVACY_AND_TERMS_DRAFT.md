# Privacy and terms — draft for owner and legal review

This is a development draft, not a published policy, legal advice or a compliance claim. The operator, jurisdiction, contact details, lawful bases, applicable rights, retention periods, processors and dispute terms must be decided before accepting real users. Do not present this draft as accepted contractual terms.

LedgerBot's current local implementation stores an identity reference, account names and opening snapshots, manually entered transactions, category allocations, budget targets, schedules and occurrence links, reconciliation history, review proposals, approval receipts, session metadata and preferences. No bank sync, live AI, OCR, voice, advertising, billing or payment processing is enabled. New users receive no financial records automatically. Only fictional values may be used during this milestone.

Financial records are used to calculate balances, compare approved budget plans and estimate future cash. Forecasts depend on user assumptions and incomplete coverage; they are not a guarantee, payment instruction, bank balance verification or regulated advice. Users must independently verify statements and obligations. Actual financial changes require the independent review interface. Pip has no financial commit authority.

In a future hosted setup, hosting/database, identity, mail and backup providers would process necessary data under reviewed agreements and regional choices. Actual providers, subprocessors, transfer safeguards, access controls, costs and retention must be disclosed before launch. No customer data is sent to an AI service in this implementation.

Exports require an authenticated, recently signed-in human session. JSON includes financial records and optional resumable proposals, not credentials or encryption keys. CSV contains ledger fields with formula-safe text. Downloaded exports are private; users control where they store them. An export is not an automatic import or full system backup.

Retention is **not yet an implemented lifecycle**. Financial deletion removes canonical entries through review; encrypted proposal before-snapshots permit reviewed restoration and therefore retain deleted content. Reconciliation and approval audit trails have integrity value but still need an explicit retention/erasure policy. Sessions/challenges expire, but automated database cleanup, draft retention, account closure, export-before-close and backup-expiry propagation are unfinished.

Before real users, design and test account deletion against disposable identities: verify identity and separate consent, offer export, revoke sessions/challenges, handle dependent records and audit retention lawfully, remove provider identity and any uploaded objects, apply retention rules to backups, then provide an honest completion status. Never claim immediate erasure while recoverable snapshots or backups remain. No real-user deletion endpoint is enabled under this task.

Owner/legal review must also define age eligibility, acceptable use, support, security reporting, availability/disclaimer limits, limitation of liability, cancellation, policy change notice, account suspension and dispute resolution. Accessibility and independent security testing remain release gates. No financial outcomes or absolute security guarantees should be promised.
