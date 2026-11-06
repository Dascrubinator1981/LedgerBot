# Manual entry and pending-budget update — November 6, 2026

## If you open the app today

You can add the $185 purchase to the same day as an older-style $1,000 starting balance. The entry defaults to affecting the balance when cleared. No opening-date correction or entry timestamp is required. If that starting balance already includes a historical entry, choose **Already included in my starting balance** instead. Its expense remains in the relevant budget period while the cash balance stays unchanged.

Choose **Pending / planned** for an uncleared or future planned entry. It appears in the ledger and as a dotted amber budget line, while cleared spending/balances remain separate. A $185 pending purchase leaves a $1,000 cleared balance and projects $815. Marking the same entry Cleared produces $815 and $185 actual spending once, not two expenses. Per-category pending amounts and the overall outlook update from the same records.

The checkbox is a necessary statement of what the user's balance already includes; the app cannot infer that fact from when someone types a historical purchase. The human review shows the exact balance effect before approval. Existing records are not silently reclassified. Reviewed statement locks, tenant isolation, exact cents, stale/replay protections and independent confirmation remain enforced.

The user's latest bank/receipt clarification is captured in [MANUAL_AND_CONNECTED_RECORDS.md](MANUAL_AND_CONNECTED_RECORDS.md): retain original source text and financial evidence, add friendly labels/categorization separately, and match to one transaction rather than posting another expense. These connected/OCR workflows are a future stage, not a live integration.

## Implementation

Optional transaction balance-inclusion fields are tied server-side to the current account checkpoint. An opening correction gets a fresh checkpoint identity so old per-entry choices cannot accidentally revive if the same balance/date is entered again. All balance consumers—current totals, running rows, reconciliation investigation, pure review preview and cash projections—use the shared treatment. Credit charts preserve that identity through their signed projection representation.

Historical included entries still count toward spending in their actual budget period. Pending transfers remain transfers, and per-leg inclusion is independent. Pending-to-cleared edits retain transaction IDs. CSV exports include the treatment and whether an entry affects the current balance when cleared; JSON exports retain the optional checkpoint fields. Internal checkpoint strings are hidden from the review UI and excluded from diagnostic reports.

No SQL migration or dependency addition is required; these are optional fields in existing JSON records. Older application versions do not understand the new per-entry balance rules: do not downgrade against data created with these choices without a reviewed compatibility/migration plan. Preserve all local data and keys. Refresh the browser after pulling/restarting so it uses the updated financial rules. Do not reset the database or recreate accounts.

## Validation

Latest executed checks: TypeScript and ESLint passed; 144 normal tests across 22 files passed; all 14 local Chromium scenarios and all 8 verified-identity/PostgreSQL Chromium scenarios passed; PostgreSQL/crypto tests passed 18/18 across 4 files; production build and its compiled-browser CSP/fail-closed scenario passed (1/1); both npm audits reported zero vulnerabilities. The staged secret/data guard passed across all 187 tracked files. The final production artifact `sha256:63eb4b4c9f68e6b2421e230d040b0a443cb49038af78cbb890daf90069123f2f` passed non-root/read-only packaging/runtime checks and had zero HIGH and zero CRITICAL findings, observed November 6, 2026 at 3:19 p.m. America/Denver. Lower findings are not claimed absent; this does not replace independent security review. Early checks caught a TypeScript narrowing issue in the new transfer normalizer and an overly broad category-card locator (the chart also names that category); both were corrected. The older same-day test now verifies the explicit-choice requirement for legacy API callers rather than the removed UI date barrier. Existing financial/security assertions remain active.

The focused browser regression creates the exact old closing-balance setup, saves a same-day three-way pending split, checks the dotted budget line/category amounts, edits that same record to Cleared with a readable name, verifies one $185 expense/$815 balance, then adds already-included older history without changing that balance. All fixtures are fictional. Added regressions also cover pending commitments after a checkpoint replacement, transfer clearing, and older API callers clearing a purchase without the new UI fields. These paths preserve one deduction and the original record identity.

## Still unfinished

Bank synchronization/matching, original provider-text storage, receipt OCR/item labels, automatic import proposals and joint-household approval remain future work. Physical Windows Firefox/iPhone/Steam Deck and independent privacy/security/accessibility review are not established by Linux Chromium tests. Hosted services and launch gates remain outstanding. Nothing is merged, deployed or billed.
