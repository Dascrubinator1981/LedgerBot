# Manual entry, pending planning and readable financial records

## Current manual experience

A new manual purchase or deposit defaults to applying to the account balance when cleared, including on the starting-balance date. Entering it later does not require changing its actual date or waiting until tomorrow. Older history can also be recorded: select **Already included in my starting balance** when the balance already covers it. That entry remains in the ledger and its budget period, without another balance deduction.

Existing records retain their old date-based meaning. The user does not need to rewrite a starting balance merely to enter another purchase. A deliberate inclusion choice is tied to the current reviewed starting-balance checkpoint. Replacing that checkpoint re-evaluates old entries against the new balance/date; the approval preview must be checked. Outstanding pending plans remain reserved unless explicitly included in the new checkpoint. Unknown balances remain unknown. Statement-checked periods remain locked; explicit reversal/correction workflows still apply there.

Each transfer account has its own inclusion choice because their starting balances may cover different portions of history. Paired amounts still balance atomically, transfers do not become expenses, and credit payments do not double-count spending.

## Pending / planned

An independently approved pending entry is a real saved planning record, not cleared money movement. Future-dated entries can remain Pending / planned. A future date cannot be marked Cleared. Exact entered amounts stay exact; status does not claim bank verification.

Budget charts show solid cleared spending, a dotted amber cleared-plus-pending line, and a dashed purple plan pace. Category cards show pending amounts and remaining target after pending. Account projections include outstanding pending entries once; an entry explicitly already covered by the starting balance is not deducted again. The overall outlook also considers pending budget pressure and distinguishes it from actual cleared overspending. Bills remain excluded from the discretionary yellow near-limit calculation.

Marking a pending purchase Cleared edits that same transaction ID. Its amount moves from pending planning into cleared actuals without making another expense. Friendly-label edits retain the record identity and financial treatment. Every change still goes through independent human review. Pip cannot confirm it.

## Connected accounts — planned, not live

The user's purpose for a synced entry is often enrichment: readable merchant/company names, sensible categories, notes and receipt detail. Model two layers:

- **Source evidence:** Preserve provider identity, account/currency, original description/company text, amounts, dates, status and refresh/provenance. Keep the raw provider record separately from editable display fields.
- **User enrichment:** Store friendly display names, approved categorization/splits, receipt links and notes without overwriting original source evidence or creating another withdrawal.

When a bank record arrives, propose matching it to the user's existing pending placeholder. Use stable provider IDs and owner/account/currency/amount/date evidence; a similar name or equal amount alone does not prove a match. Repeated equal charges, uncertain dates, refunds and partial matches need explicit review. The original manual amount/date remain available as proposed evidence. If a final posted amount differs (tips, fees or exchange rates), show the difference before updating the one canonical record.

For a linked account, the verified posted bank record supplies the recorded financial facts after the supported review workflow; user-friendly text remains separate. A user can flag a bank discrepancy without silently rewriting source evidence. Do not silently post both a manual entry and a bank copy. Do not claim these provider-specific matching/sync workflows are implemented: bank integration remains disabled and no provider credentials are configured. Joint approval, when built, must apply according to household rules.

## Receipt names — planned, not live

Keep original receipt evidence/extracted text separate from user-confirmed item labels. For example, a confusing abbreviation can receive a friendly label without asserting OCR certainty. Preserve confidence and corrections rather than presenting a guess as a verified fact.

Receipt totals, discounts, tax, tips and refunds must reconcile exactly to the matched financial transaction using integer cents. Attaching a receipt or categorizing its items does not create another expense. Conflicting totals or uncertain matches require review. OCR, receipt uploads and live AI remain disabled until their private storage, consent, retention, extraction and matching flows are implemented and tested.

## Evidence and limits

Tests cover same-day legacy balances, older included/additional history, unknown balances, version-bound checkpoint changes, hostile anchors/tenant IDs, pending-to-cleared identity, transfer pairing, credit projections, pending risk, CSV safety and the shared browser flow on SQLite/PostgreSQL. Final executed results are in [MANUAL_ENTRY_UPDATE_REPORT.md](MANUAL_ENTRY_UPDATE_REPORT.md). This is not proof of every input/device combination or a launch approval.
