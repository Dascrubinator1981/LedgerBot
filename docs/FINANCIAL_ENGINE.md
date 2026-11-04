# Financial conventions

- USD only. Safe integer cents, each input bounded to ±100 billion cents. Decimal strings parsed as whole/fractional digits, never floating point dollars. No real financial fixtures.
- Signs express net-worth movement: deposits/refunds positive, expenses/card purchases negative. Liability UI displays positive owed, computed by negating the signed net position. Negative owed means a credit.
- Opening snapshots are **end of the as-of date**. Only cleared entries on later dates affect balances. Actuals on/before opening or in the future are rejected. Blank opening stays unknown; explicit zero is known. Aggregate net worth is unknown if any balance is unknown or no accounts exist.
- Pending entries are separate. Editing pending → cleared replaces the same entry. Transfers use equal opposite legs and no budget allocations; card payment is a transfer, not new spending.
- Splits share the transaction sign and sum exactly to it. Empty splits remain uncategorized. Budget actuals are negative sum of approved cleared non-transfer category allocations in that month. Targets never alter cash. Savings earmarks are deferred.
- Reconciliation compares dated statement balance against cleared actuals. Mismatch blocks approval. Success annotates selected cleared entries, stores a reconciliation record and blocks edits/deletes/new entries inside that period. No silent adjustment.
- Ledger table displays per-account **end-of-day** cleared balances, including filtered-out entries. Full intraday running balances, opening corrections and currency conversion are deferred.
- Civil dates 2000–2100, UTC used only as a calendar carrier. Monthly recurrence clamps from the original anchor independently (Jan 31 → Feb end → Mar 31). Weekly/biweekly add civil days.
- Forecast aggregates checking/savings/cash balances as of today, future schedule dates plus clearing delays, and pending entries (tomorrow if overdue). Always preliminary; schedules never mark anything cleared. Views: 7/30/60/90 days. No holiday/timezone preference or discretionary-budget extrapolation.
- **Release limitation:** explicit matching of actual entries and recurring occurrences, and schedule editing/deletion, are unimplemented. Overlapping expectations can overstate inflows/outflows. UI warns about incomplete estimates; do not rely on this as a complete planning engine for real finances.

Tests verify cents, split mismatch, card signs/payment, transfer rollback, pending, budget independence, snapshot anchor, reconciliation and due-vs-clear estimates. Large-volume overflow stress tests, multi-currency and property-based testing are future work.
