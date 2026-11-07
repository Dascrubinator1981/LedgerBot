# LedgerBot usability review — November 6, 2026

## Evidence and research limits

The owner exercised the application on Windows/Firefox and reported excessive scrolling, a large graph, separate category creation/reselection, a resetting slider, transaction preparation that appeared inactive and reconciliation that appeared inactive. Screenshots showed the future-date error at the top of the page, positive amounts with an explicit Expense choice, and a November 6 end-of-day opening snapshot. These are direct usability observations; they do not establish that every button or database mutation is broken.

Attempted public research from this cloud session on November 6:

| Source | Intended use | Observed access |
| --- | --- | --- |
| https://www.ynab.com/features | Budget/category workflow comparison | Proxy tunnel 403 Forbidden |
| https://www.monarchmoney.com/ | Dashboard and planning organization | Proxy tunnel 403 Forbidden |
| https://www.rocketmoney.com/ | Upcoming bills/subscription flow comparison | Proxy tunnel 403 Forbidden |
| https://www.trustpilot.com/review/ynab.com | Customer friction and review themes | Proxy tunnel 403 Forbidden |
| https://www.trustpilot.com/review/monarchmoney.com | Customer friction and review themes | Proxy tunnel 403 Forbidden |

No current ratings, review counts, customer quotes, live visual comparison or competitor usability findings are claimed. Access restrictions were preserved. These URLs are a research queue, not citations supporting observations about the competitors. Product pages describe vendor claims; customer reviews would need dates, platforms, sample sizes and recurring themes rather than isolated anecdotes.

## Implemented in this review slice

- Failed financial form submissions keep values and place an accessible, focused error beside the form action. Browser-native required-field errors also have a local error explanation. A failed or canceled review no longer clears the entry form before confirmation. A successful confirmed save clears the submitted form.
- Expense/Income/Refund selection normalizes the entered amount and split directions. Automatic mode retains explicit signed entry for compatibility. The exact cents still pass server validation and independent review; no rounding or fuzzy split match is used.
- Reconciliation failures show statement and calculated ledger values. The form explains reconciliation does not edit an opening snapshot and points to account correction controls. Snapshot/date rules remain enforced.
- Optional bill due-date/settlement controls are hidden until a bill is selected.
- Financial chart height is bounded at 240px instead of scaling indefinitely with desktop width; spacing is reduced while retaining control target sizes.
- Monthly target entry appears before exploration/graphs. A new category and target can be entered together, prepared as one proposal and saved in one database transaction. A failure saving the target rolls the category back too. Separate category shortcuts elsewhere retain their existing independently reviewed behavior.
- Dashboard has an automatic Forecaster driven by canonical approved state. Settings persist per-owner horizon, account filter, chart, recent paid bills and daily-detail choices. Display filters do not change actuals or budget targets. Recurring plan management is available in Settings; Forecaster is removed from primary navigation. Legacy direct Forecaster URLs remain compatible during transition.
- Additive migration: SQLite version 6 and PostgreSQL migration 008 add forecast display preferences. Do not reset any existing local database to upgrade.

## Verification commands

The final follow-up report records the executed results below once complete. Commands used:

```text
npm run typecheck
npm run lint
npm test
npm run local:services
npm run test:postgres
npm run test:recovery
npm run test:e2e
npm run test:e2e:postgres
npm run db:migrate
npm run db:migrate
npm run build
npm run test:e2e:production
npm audit --omit=dev
npm audit
```

Browser commands in this cloud session use `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`; a normal workstation can use the verified Playwright browser installer. Next dev suites and root production build were run serially because they share `.next`. Tests use fictional data only. Actual Windows Firefox/Safari hardware and hosted Supabase are not claimed validated. The owner reports the Free Oregon Supabase project and disabled public signup are created; app-role migrations, production runtime configuration, mail, restore and host validation are still outstanding. No hosted database was contacted for these tests.

## Recommended design direction

These are recommendations from the owner's observed flow, not findings attributed to unread competitor reviews:

1. Put the main task and current result in the first screenful; collapse explanations and secondary tools progressively.
2. Use familiar transaction language and positive amount entry with an explicit direction. Keep exact signed effects in review.
3. Show the chosen account, available balance, split total and remainder near the action. Place validation messages at the affected field/action, preserve the entry and explain the recovery action.
4. Keep Dashboard informative automatically. Put durable display preferences in Settings and financial plan edits behind explicit review.
5. Prefer one coherent draft and one review for a related task. Never turn navigation, a timeout or an AI response into financial approval.
6. Test the complete user journey with physical-device and assistive-technology users; automated accessibility scanning does not certify usability.

## Agreed next stages — not implemented here

### Period-based budget planning

Weekly, biweekly (every 14 days), monthly and quarterly need explicit anchor dates, period boundaries and a defined relationship with monthly graphs. Count actual occurrences or compare the actual selected period; do not silently estimate four weeks per month or divide an exact quarterly amount into rounded months. Add date-boundary, leap-year, five-week-month and exact-cent tests before introducing these controls. The current shortcut remains an exact monthly target.

### Page-wide editable draft batches

Offer Review now, Save changes for later review, Keep editing and Discard when navigating away from edited financial forms. Review needs exact before/after for every line, an Edit action that restores the form, and a deliberate final confirmation. Commit the entire reviewed batch atomically with owner/session/digest/version/revision/expiry/idempotency checks. A fresh change from another tab/device must invalidate conflicting reviews. A later-review save must not apply any financial change. Warn on browser close without silently submitting.

Persist saved draft batches encrypted and owner-scoped. Inbox → Saved for review should support resume/edit/review/discard across sessions/devices. Saved draft lifespan and short approval challenge lifetime remain independent. Current proposal support alone does not complete this feature.

### Saved-review expiration and reminders

User-approved behavior, recorded separately from implementation:

- Ask whether to choose expiration. No means 30 days; Yes offers End of today, 1 week (seven days), End of week (Saturday), or 30 days.
- For End of today and End of week: prompt “Please review by midnight”; actual automatic expiration is 1 a.m. the following morning in the user's timezone. Do not claim midnight is the exact automatic expiry. Saturday's automatic expiry is Sunday at 1 a.m. No grace-period label is needed.
- End-of-day reminders default to 8:30 p.m. local time, adjustable within 8–9 p.m. A draft saved after reminder time gets an immediate in-app notice. Define how after-midnight selections refer to the current civil day before implementation.
- For daylight-saving transitions, define/test ambiguous or skipped local times explicitly. A persisted deadline must not move when a profile timezone later changes without an explicit reschedule.
- Inbox badge and in-app reminders first; email/text only when implemented/configured and opted into. Avoid financial details in notification bodies. Email/SMS delivery, recurring schedules, permanent cleanup and recovery policy are not implemented by this document.
- Expired drafts never post automatically. Define recovery/retention before deleting drafts.

### Competitor research completion

When approved public browsing access is available, inspect YNAB, Monarch and Rocket Money product/help flows and multiple independent review sources. Record current source/date and distinguish feature claims from user experience reports. Compare time to first useful result, split entry, inline category creation, budget cadence, upcoming bills, cancellation limits, error recovery, mobile readability and pricing clarity. Then test specific design changes against LedgerBot tasks rather than copying competitors' branding or claims.

## Final local verification results

- Normal suite: **109 tests across 16 files passed**.
- PostgreSQL/crypto suite: **18 tests across 4 files passed**.
- Browser suites: **10 SQLite, 6 PostgreSQL/verified identity and 1 compiled-production security test passed**. The owner scenario verifies the $185 split, $815 cash/forecast opening, $80 Groceries actuals/$20 remaining, local validation feedback, successful reconciliation, saved preferences and rejection of foreign account IDs.
- TypeScript, ESLint, optimized production build and both repeated SQLite migration runs passed. PostgreSQL recovery reapplied migrations twice and restored synthetic data with RLS/write-denial checks.
- Full and production-only npm audit: **zero reported vulnerabilities**.
- The initial new forecast test expected seven rows for a seven-day horizon; the existing engine includes today plus seven following dates. Corrected the expectation to eight, retaining all monetary and authorization assertions. This was a test expectation correction, not a financial calculation change.
- Remote GitHub Actions results, physical Windows Firefox/iPhone/Steam Deck behavior and hosted email/recovery remain unverified. No merge, deployment, paid service or real-data import occurred.
- Final production artifact `sha256:4325d1b049c456eb4e98c32dbee239e2e258f2fe97488d381268e566c4d554bb` passed non-root/read-only/fail-closed runtime checks and the pinned official scanner with its current verified vulnerability database: **zero HIGH and CRITICAL findings**. Lower severities are not claimed absent. Reports remain ignored local artifacts in `data/container-qa`; no image archive or generated key is committed.
- After the final Settings navigation adjustment, the owner scenario passed again in Chromium, including the Dashboard “Configure Forecaster in Settings” button. The bounded repository secret/data guard passed; pattern scanning is not independent certification.
