# LEDGERBOT — CODEX / GITHUB MASTER BUILD CONTRACT, VERSION 3

**Date:** 2026-11-01. **Product status:** Engineering specification, not a completed or deployed application. **Working name:** LedgerBot, assistant mascot Pip. **One-line promise:** “The Ledger records reality. The Budget creates the plan. The Forecaster shows where it leads. Pip helps people make better choices.”

**READ FIRST:** This document combines our existing full engineering specification with the latest approved product decisions about financial planning, interactive forecasting, smart transaction detection, receipts, voice onboarding, and upgrade tiers. Sections **20–28 below take precedence** over any older wording if there is a conflict. The workbook is a confidential, imperfect QA reference, **never** a source of seed data for real users and **never** to be committed to GitHub. This is a comprehensive target, not an instruction to claim all vendor-integrated features work in one sitting. Build in verified milestones.

**First Codex execution:** Follow the separate `CODEX_FIRST_TASK.md`, read the full contract, implement only the described first milestone, run checks, and open a PR. No bank or AI vendor credentials are needed to get started. Future stages are explicitly permitted to remain disabled with a truthful UI until configured and tested.

---

# LEDGERBOT — MASTER CODEX / GITHUB BUILD PROMPT

**Product working name:** LedgerBot (existing Lovable prototype is called Pennywise Ledger; name is not final)
**Positioning:** “Your money. Your rules.”
**Product:** A secure, mobile-first personal finance web application with first-class manual bookkeeping, optional institution connections, forecasting, debt payoff strategies, savings planning, and trustworthy financial coaching.
**Status:** Build specification. Fresh customer accounts begin empty; the supplied workbook is a private test fixture only. Do not represent prototype integrations as live functionality.
**Source artifact:** `Budget_Projector_2_0_Repaired.xlsx` (personal workbook; handle privately, never commit real account data to a public repository).
**Prepared:** November 1, 2026.

## 0. Your instructions as the engineering agent

You are Codex, acting as an experienced staff engineer, product designer, financial domain-modeler, QA lead, and security-minded software architect. **Build the real application** in the connected GitHub repository. Do not stop after writing a plan, scaffolding a starter page, or generating screenshots. Implement actual database-backed workflows and use the tests in this document as completion gates. Be conservative, verify financial calculations, and do not invent bank/AI integrations or customer data.

1. Inspect the existing repository, framework, dependencies, tests, and GitHub Actions. If empty, initialize it; if nonempty, preserve working code and migrate deliberately. Do not silently discard features or real user data.
2. Read the **Data Audit** and **Start Here** sheets in the repaired workbook (if the owner supplies it through a private channel), plus the original transaction/header structure. The spreadsheet is imperfect and is a **private developer-owned test input and behavioral reference, NOT a production seed, customer default, or authoritative app design**.
3. Produce an implementation plan with explicit milestones, then execute it. Commit working increments, report files and commands changed, run builds/tests, and leave an honest list of remaining blockers.
4. Prioritize a **production-quality, fully functioning manual experience**. Put live bank sync, live AI, and paid billing behind feature flags, and call them complete only when configured, secured, and tested with the appropriate vendor sandbox or test mode. An unconfigured feature should display clear status and a usable fallback—not a fake button or simulated financial data.
5. Use real account-level ownership authorization, a real database, accessible responsive screens, transaction validation, meaningful empty states, and accurate calculations. Favor reliability over visual flourish, but deliver a polished design.
6. Never push a real account number, institution access token, credentials, PII, or the supplied personal budget workbook into a public repo, test fixture, PR description, log, analytics event, or AI prompt.
7. If credentials/vendor approvals are unavailable, implement behind a disabled feature flag, document required environment variables and tests, and move to the next unblocked feature. Do not claim the blocked feature is operational.
8. **Do not deploy publicly or activate payment collection without explicit owner approval.** Deliver a local runnable build and a controlled staging/deployment path first.
9. Keep names, labels, categories, due dates, frequencies, savings goal titles, financial institutions, and expense terminology configurable at the user level. Suggestions are welcome; mandatory proprietary taxonomies are not.
10. Finish the work with a user-facing walkthrough and a test report: what works, what is only wired for future implementation, what is unverified, and what requires paid vendor services.

## 1. Non-negotiable product principles

- **Zero-start customer experience.** Every newly registered customer starts with NO financial records: no accounts, balances, transactions, debt, savings, budgets, paychecks, bills, or personal life events. A displayed $0 is appropriate only for a known balance explicitly configured as zero. Missing records are labeled "Not set up yet" rather than implying a confirmed zero. Starter category name suggestions and general public holidays can be available without creating private financial data.
- **Manual, Connected, and Hybrid** are equally respected ways to manage finances. Every account chooses its management mode independently. No bank connection is required to access dashboards, debt planning, budget, saving goals, or calendar features.
- **One canonical financial ledger.** Assets, debts, statements, transfers, forecasts, and dashboard cards derive from shared account and transaction records; never manually maintain the same debt balance in two independent tables.
- **Trust and uncertainty are visible.** Distinguish statement balances, cleared balances, pending, scheduled, predicted, verified, stale, and demo. A 30-day projection is an estimate, not a bank assertion.
- **No phantom money.** Transfers between the user's accounts, credit-card payments, and savings goal allocations cannot inflate income, expenses, assets, or net worth.
- **Custom-first.** Support unlimited sensible user-defined display names and expense categories, with optional suggestions and safe defaults. Account IDs must be immutable behind the scenes so renaming doesn't break links.
- **Personal privacy.** Least privilege, encrypted tokens, consent, account-scoped access, export/delete, and safe AI use are part of the app—not a later cosmetic enhancement.
- **Accessible, humane design.** Warm original robot guide (“Pip,” placeholder identity), modern desktop/mobile navigation, dark/light theme, helpful copy, and no intrusive upsells or constant nagging.

## 1A. Critical tenant isolation: real users start empty; existing spreadsheet is TEST DATA ONLY

**This supersedes any previous demo, onboarding, or workbook-seeding assumption.** The provided Excel budget is a **test case to validate all features** and uncover bugs; it is not a model customer profile and must never be automatically copied into a new user's data.

- On signup, create only an authenticated user identity, personal settings/preferences, and an onboarding-progress record. **Create no actual accounts, financial balances, transactions, categories with financial totals, recurring items, debts, paydays, savings allocations, or events.** Default monetary summaries are unconfigured / empty, not backed by fictitious balances. Calendar can display general US holidays without any personal financial records.
- User-driven onboarding may **suggest** names such as Checking, Credit Card, Rent, Emergency Fund, or Paycheck, but must never silently persist the suggestion. User chooses names, types, amounts, dates, and optional connections. Every optional step can be skipped; the dashboard must still render and offer actionable setup buttons.
- Distinguish three states consistently throughout the UI and APIs: **unknown/not configured**, **known zero**, and **nonzero confirmed or estimated**. For example, before the user creates a checking account, show “Add an account to see your cash position”; after they create a checking account with an opening balance of $0, display the genuine $0 balance.
- The owner-provided workbook is **a private QA fixture** imported manually into a separate, access-controlled testing user or isolated test environment only. Preserve its audit issues so errors are exposed rather than hidden. Do not seed its transactions into production, public demos, new-user accounts, or repo source/test assets. Do not put personal rows, exact values, or identifying strings into published screenshots, AI requests, error reports, telemetry, or example code.
- Provide a separate **“Explore sample demo”** action with wholly invented, anonymized example records. Demo mode is visibly identified at every relevant screen, isolated from production user data, optionally resettable, and must never contaminate real accounts or production reports. Leaving demo mode should return an unconfigured real account unless that customer explicitly added their own records; demo data must not be silently promoted.
- Provide optional **Import my workbook** only through an authenticated user action, with preview, explicit mapping, validation, conflict notices, user confirmation, import provenance, rollback, and no automatic overwrite of account balances. Never import the owner-provided workbook into other users' profiles.
- Enforce tenant boundaries **in the database and every server action**, not merely by frontend filters. A fresh signup in another browser or tenant must not see a trace of the developer's data or another customer's data. Deleting/resetting demo data must not affect real financial records.

**Zero-start release gate:** Create a brand-new user and assert the database contains zero financial records for that user; the app shows empty-state prompts across Dashboard, Cash Flow, Calendar, Debts, Savings, and AI Coach. Then add one $0 manual account and one transaction and verify that only that user's balances and graphs update. Import the private workbook into a separate TEST account and exercise the entire feature suite; verify an additional fresh user remains entirely empty. Do not release if any of these tests fail.

## 2. Proposed technical architecture

Choose a documented, maintainable, tested stack. Recommended starting point:

- **Frontend:** Next.js App Router + React + TypeScript, Tailwind CSS, shadcn/ui primitives, a mature accessible component library, Recharts or equivalent for charts; responsive PWA-friendly layout.
- **Backend and storage:** PostgreSQL with Supabase Auth and row-level security (or an equivalent secure provider if the existing repository already has one), typed SQL migrations, Drizzle ORM or an equivalent maintained data layer. Financial calculations run in a deterministic shared domain layer, not ad hoc per chart.
- **Validation/testing:** Zod for all inputs, Vitest for pure financial math, React Testing Library for interactions, Playwright for full workflows, lint/typecheck/format and GitHub Actions CI.
- **Date/currency engine:** integer minor units for stored amounts; ISO currency code; explicit IANA user timezone; date-only civil dates for birthdays/due dates; timezone-aware timestamps for transaction posting/clearing. Use `date-fns`/Temporal or equivalent, not naive string comparisons across DST.
- **Bank connectivity:** provider-agnostic interfaces with Plaid as an initial candidate; support transactions plus liabilities/investments where the provider and institution actually permit them. Start with provider sandbox. Never collect or persist bank passwords; token exchanges and webhooks remain server side.
- **AI:** server-side OpenAI integration behind feature flag and user consent; zero secrets in browser builds; also provide a useful deterministic rules-based coach when no LLM is configured.
- **Subscriptions:** Stripe Checkout + Billing portal + signature-verified webhooks behind a feature flag; entitlements enforced server-side. Do not charge until the owner explicitly approves launch and test mode is validated.
- **Hosting:** a documented deployment target (e.g., Vercel with managed Postgres/Supabase), separate dev/staging/prod configuration, least-privilege environment values, migrations, seed/demo fixtures, backups, and monitoring.

**Architecture deliverables:** `README.md`, `docs/PRODUCT_REQUIREMENTS.md`, `docs/ARCHITECTURE.md`, `docs/DATA_MODEL.md`, `docs/FINANCIAL_ENGINE.md`, `docs/SECURITY.md`, `docs/INTEGRATIONS.md`, `docs/DEPLOYMENT.md`, `docs/TEST_PLAN.md`, migrations, API contract, environment example (no real secrets), and CI workflow.

## 3. Full first-login onboarding and ongoing inbox

A genuinely usable first-run flow with persistent progress and “Skip” on **every optional step**. No blocking questionnaire.

1. Welcome: show value proposition, privacy summary, original Pip robot, **Start my empty account**, **Explore isolated fictional demo**, and **Skip setup**. Starting real setup must never seed fabricated transactions or import the owner workbook.
2. Choose preferred workflow: Manual / Connect accounts (if live connector exists) / Hybrid. Clarify settings can be changed account-by-account later.
3. Accounts: add any number of checking, savings, cash, credit, loan, retirement, investment, property, and custom asset/liability accounts; display name, optional institution label, balance and **statement as-of date**, currency, whether assets/amounts owed, account mode, and sort preference.
4. Income: payroll name, amount (gross/net clearly distinguished), cadence weekly/biweekly/twice monthly/monthly/custom, anchor date, expected vs received, deposit account, optional clearing delay. Support multiple incomes and irregular receipts.
5. Bills: custom names/categories, fixed amount or variable estimate, due date/day, recurrence, source account, payment method if useful, expected bank clearing delay, auto-pay state, reminders, and actual paid/cleared dates.
6. Debts: associate each obligation with one canonical liability account; APR, minimum monthly amount, payment date, credit limit where applicable, promotions/intro APR expiry, fees if known; explicit “unknown” supported.
7. Savings: goals, user-defined purpose, target, deadline, optional linked account or virtual allocation, contribution schedule and progress.
8. Events: birthdays, anniversaries, anniversaries of financial milestones, custom dates, US holidays, optional region/local holidays; default reminder 14 days in advance, user-adjustable.
9. Budget: optional category targets and recurring discretionary amounts.
10. Review: show incomplete fields, explain their effect on forecast quality, Save and finish; no fabricated completeness.

**Incomplete onboarding inbox:** Create gentle, actionable messages (“Set the statement date on your checking account for accurate balances”), with category, priority, direct deep-link, created/updated timestamp, read/unread, dismiss, snooze until date, and deduplication. In-app notification center is required. Email and push should be opt-in later, with permission controls and rate limiting. Never repeatedly recreate dismissed prompts without a material change. Include calendar reminders 14 days ahead and optional later/same-day follow-ups.

## 4. Data model and invariants

Implement normalized owner-scoped records; provide a documented ERD. Suggested entities:

`profiles`, `user_preferences`, `accounts`, `account_balance_snapshots`, `institutions`, `connections`, `external_account_mappings`, `categories`, `transactions`, `transfer_groups`, `transaction_import_batches`, `transaction_matches`, `recurrence_rules`, `bill_occurrences`, `income_occurrences`, `monthly_budgets`, `savings_goals`, `savings_allocations`, `debt_terms_history`, `payoff_scenarios`, `life_events`, `notifications`, `notification_preferences`, `ai_conversations`, `ai_messages`, `ai_action_proposals`, `subscriptions`, `entitlements`, `integration_events`, and `audit_events`.

Every owner-scoped record includes `user_id` and stable UUID; enforce RLS and server-side ownership checks, including nested references. Store third-party credentials encrypted in secure server-only storage, not client storage or plain database fields.

**Canonical ledger rules:**

- An account's initial imported/current statement balance is a snapshot with an explicit date. Cleared transactions later than that date produce the live ledger balance; updates to snapshot date/value recompute. The absence of a date is an unresolved assumption, not a current confirmed balance.
- Use a consistent signed amount convention and account classification: a debit to checking decreases cash; a credit-card purchase increases the **positive amount owed** but decreases net worth. Loan principal and interest must have separate semantics if repayment splits are known.
- A transfer has linked legs, a shared transfer group ID, zero budget income/expense, and no net-worth change; deleting or editing follows an atomic consistency rule. Card payments are transfers across a cash account and liability account, **not new spending**, while the original card purchase is spending when incurred.
- `pending`, `cleared`, `reconciled`, `voided`, `scheduled`, and `imported_unverified` are distinct states; use only eligible states in balances and budgets. Don't count the same transaction in pending and cleared simultaneously.
- Bank balance snapshots and imported synced transactions must have anchored reconciliation semantics—never blindly add historical transactions to a present-day bank-reported balance.
- Idempotent sync/import upsert by provider and external ID; when unavailable, use a conservative matching algorithm with human review. Never silently delete “duplicates” that may be legitimate.
- Store `money_minor` in integer cents (or appropriate currency scale); UI presents decimal currency. No floating-point money drift in persistence.
- Per-goal savings allocations are **earmarks of existing assets**, not an extra asset. Overallocated goal balances should warn but not inflate net worth.
- Scheduled future bills and income are forecast events, not actual transactions until matched/posted; reconcile the occurrence with an actual item to remove it from the remaining forecast.
- Support multiple currencies without adding them into one number without explicit FX rates and as-of timestamps. MVP may restrict actual aggregation to USD while keeping the schema currency-aware.
- Soft delete, restore/undo for destructive operations, auditable history, safe CSV/JSON exports, privacy deletion, and migration-safe schema updates.

## 5. Dashboard — the financial command center

**Required top-level cards (real computed data):**

- Checking/cash available, total savings, total assets, total liabilities, net worth, and a separate “confirmed vs estimated” indicator.
- Expected income, remaining bills, upcoming larger expenditures, expected lowest cash balance over 7/14/30 days, next payday, and bill amounts due vs expected to clear.
- Monthly budget planned vs actual; expense category trends; last month, current month, quarter, year; time-trend chart with clear date axis and drill-down.
- Active credit debt, total minimum payment, weighted APR where valid, card utilization, current snowball/avalanche target, payoff progress, and estimated debt-free trajectory **only when enough terms exist**.
- Multiple savings accounts and goals, progress bars, target dates, recommended contribution, amount unallocated and amount earmarked.
- Birthday/anniversary/holiday reminders starting 14 days prior, clickable to calendar or detail.
- Upcoming bills list, unread inbox badge, low-balance alert, data freshness/reconciliation status, and direct shortcuts for Add Transaction, Transfer, Add Bill, Reconcile, Add Goal, Run Debt Plan, Calendar, and AI Coach.

**Forecast UX:** chart confirmed balance and projected path separately, dotted forecast line, confidence/coverage indicator, and inspectable list of cash inflows/outflows behind any date. Show forecast caveats when known paycheck amounts, bill estimates, dates, or statement balances are missing. Show bank snapshot timestamp on connected accounts and manual as-of date on manual ones.

**Hint ribbon:** deterministic actionable suggestions first; optionally augmented by the AI service. Ground tips in ledger evidence and user settings. Examples: “An account may drop below $100 before payday; compare the bill due on the 3rd with its clearing lag,” “Your highest-rate debt has an APR of X%; an avalanche strategy may reduce interest,” or “This credit card is above 30% reported utilization; the amount owed and limit are ….” Avoid guaranteed credit-score predictions, unsafe borrowing advice, invented account access, manipulative pressure, or product referrals disguised as advice. Provide “Why am I seeing this?” and dismiss.

## 6. Budget Calendar

Month/week agenda views and mobile-friendly daily list. Distinct event badges and accessible legend for:

- Bill due day, scheduled payment, actually paid day, estimated bank-clearing day, and actual cleared day. Allow those dates to differ.
- Expected payroll versus received payroll; multiple schedules and delayed deposits.
- Savings contribution targets, debt payment reminders, birthdays, anniversaries, user events, US national/federal holidays, and user-selected state/local holidays.
- Click any event for edit, mark paid, mark cleared, attach to a transaction, snooze/notify, or add a new item. Account assignments and labels must be user-defined.
- Correct month-end rules for bills due on 29/30/31, leap days, daylight-saving transitions, timezone changes, semi-monthly dates, custom recurrence skips, and “observed” holiday dates. Don't assume all employers or banks close for every holiday.
- For estimate of typical clearing lag, use recent observed history with sample size/confidence and easy manual override; never treat an estimate as a confirmed posting.

## 7. Cash Flow — complete checkbook ledger

All accounts in one account-switchable ledger with running balances, date, description, category, custom tags, memo, amount, direction, status, posted/cleared date, account, and linked source. Mobile row cards and desktop table; filters by period/account/category/status/amount, search, sort, export, and batch selection.

**CRUD requirements:** create/edit/delete (with undo), manual deposit/expense, card charge/refund, interest/fee, payment, and linked transfer. User can create and rename accounts and categories from transaction dialogs. Transactions instantly update balances, budgets, savings/net-worth views and forecasts. Users can set starting balances with as-of dates, and correct or backdate entries without breaking aggregates. Show clear per-account running balance; when imported transactions cannot be reconciled to a dated snapshot, label balance uncertain instead of inventing an answer.

**Bank reconciliation:** user selects account + statement ending date/amount, views eligible cleared items, marks reconciled, sees difference, and investigates mismatches. Never overwrite unmatched ledger entries silently. Import CSV/OFX/QFX when feasible with mapping preview, error rows, dedupe suggestions and undo; CSV and JSON exports mandatory. Uploaded files and provider connection credentials are private.

**Connected/hybrid:** account connection list, status, last successful sync, refresh, disconnect, repair, re-link; manual entries remain supported and may be matched to bank posts, not duplicated. Preserve manual account forever if user never connects anything.

## 8. Debt Plan — accurate and empowering

Per liability: name, balance, APR, fixed/variable rate if known, minimum payment, due day, credit limit where applicable, utilization, fees, provider sync freshness, and payment account. Let users edit and verify terms. Support promotional APR periods and multiple loans when feasible.

**Simulations:** snowball (smallest positive balance), avalanche (highest APR), minimum-only, custom priority and user-defined extra payment. Recompute a month-by-month balance/interest/payment/remaining graph with minimums applied to all debts and extra allocation to the current target. When a debt pays off, roll freed payment capacity to the next target. Support interest accrual, partial month approximations as clearly marked, zero APR, payment ceilings, a payment no larger than current balance + accrued interest, late fees/changes only if entered, and date-based due cadence. If missing APR/minimums or the payment fails to cover interest, provide a precise warning; do not invent debt-free dates.

**Outputs:** repayment order, next target, estimated completion date, total interest, comparison difference between methods, monthly payment budget, progress, utilization before/after payment, what-if slider (extra $0–$500+ configurable), and debt-free milestone. Users can choose their plan and create reminders, but do not transfer money or make payments without a separately approved integration/action.

**Credit education:** understand statement date vs due date, paying in full, on-time payments, card utilization and limits, credit-builder products' fees, hard inquiries and interest costs. No guarantee of score change. Never encourage paying interest unnecessarily merely for credit score.

## 9. Savings Planner

Unlimited user-defined goals including emergency fund, travel, birthdays, education, retirement, repairs, or anything else. Goal name, amount, target date, priority, optional assigned account, virtual earmarked allocation, recurring contribution, progress and monthly needed. Multiple goals can share an account without double counting cash; show allocated vs unallocated. Support deposits, withdrawals, adjusting a target, rollover, reallocation between goals, optional goals without deadlines, and saving for irregular annual expenses. Retirement account market changes are not recurring budget income. Dashboard and calendar reflect the same sources.

## 10. AI Coach and AI Chat

A real conversational UI for budget explanations, debt scenario comparison, subscription review, savings strategy, and proposed service actions. Chat history and optional retention controls are per-user. AI must cite the user's **actual** ledger facts or calculation outputs with dates, uncertainty and linked rows where possible. The AI is not authorized to move money autonomously.

**Capability design:** deterministic rules engine available to all customers. When an authorized server-side model is configured, use tools/functions to retrieve strictly user-scoped data aggregates; minimize input, sanitize merchant text against prompt injection, never expose connection tokens, and avoid sending raw identity details unnecessarily. Server validates every tool invocation. The AI may propose categorized changes, recurring edits, an adjusted budget, or a new savings goal; present exact proposed changes and require a separate explicit confirmation before persisting. Audit every accepted action and allow undo where safe.

**Honest fallback:** no key/credits => explain “Live AI not connected” while showing meaningful rules-based tips. No fake streaming or invented real-time coaching. Rate limit requests, control token costs per tier, detect sensitive data, provide opt-out and deletion. Include educational disclaimer and escalation to qualified help for tax/legal/investment matters, rather than asserting regulated professional advice.

## 11. Bank and account connection strategy

Implement an adapter contract with operations for: create consent/link session; exchange short-lived token; enumerate accounts; retrieve balances with timestamp; transactions initial fetch + incremental sync; liabilities/investment holdings where enabled; webhook verify/replay protection; disconnect/remove authorization; reauth; sync health; status and errors.

Integration must work with real providers only after secure configuration. Start with a sandbox and test at least one checking account, one credit card, one loan if supported, and failure/reconnection. Retirement and loan connectivity will vary significantly by institution/provider; never promise universal coverage. If unsupported, ask the customer to add a manual account or import a file. Respect consent scopes, retention windows and institution terms. Instrument sync with idempotency keys, cursors, transactions posted after pending transitions, provider reclassifications, backfills, retries, and alerting, without revealing financial records in logs.

**Account-specific flexibility:** manual one account, connected another, convert mode, merge carefully, pause sync, create a cash account with no institution, and keep custom account display names after connection.

## 12. Design system, interaction, robot mascot

Visual direction: modern, calming and encouraging—not dense or intimidating. Use deep navy/charcoal, electric teal, soft lilac, restrained amber for warnings, spacious data cards, high contrast, legible numerals, and light/dark appearance. Original robot Pip can appear in onboarding, empty states, hints and small confirmations; make it subtly expressive and optional (reduce motion / hide mascot). **Do not copy Toshl's monsters, illustrations, branding, or character designs.** Focus on a distinctive original identity.

Navigation: persistent desktop sidebar; small-screen bottom navigation with overflow drawer; globally available **+ Add Transaction** shortcut; breadcrumbs and direct deep-links; responsive accessible dialogs. Dashboard shortcut grid; keyboard shortcuts optional. Color is never the only status signal. WCAG AA-oriented contrast, keyboard focus, screen-reader labels, 200% zoom, reduced motion, proper locale formatting. Support loading skeletons and honest zero/empty/error states, not invented sample balances unless user explicitly chooses Demo Mode.

Required routes: `/welcome`, `/onboarding`, `/dashboard`, `/calendar`, `/cashflow`, `/accounts`, `/bills`, `/debts`, `/savings`, `/coach`, `/inbox`, `/settings`, `/settings/integrations`, `/settings/billing`, plus authentication and privacy/export/deletion flows. Redirect appropriately for signed-in vs demo users.

## 13. Pricing and monetization (architecture first; owner approval before charging)

Plan for these **proposed experiments**, not hard-coded promises or guaranteed economics:

- **Free:** manual account/ledger, basic budget/calendar, savings goals, core debt plan, data export, honest rules-based tips; generous limits to earn trust.
- **Plus (candidate ~$5–8/month):** connected account syncing within vendor cost constraints, advanced forecasts, extra history/trends and personalized alerts.
- **Pro (candidate ~$10–15/month):** premium usage-limited AI coaching, richer simulation/scenarios, deeper spending analysis and optional family collaboration later.

Prices and entitlements are placeholders until measured customer willingness, provider charges, AI usage, infrastructure/support costs, churn, and chargebacks. Make pricing configurable server-side. Implement a Stripe-ready interface and entitlement service, but use Stripe test mode and owner approval for any real charges. No financial data sold to advertisers; no misleading “free” tier that silently coerces bank links. Protect user privacy and give access to export even if they cancel. Build an admin overview for aggregate usage/cost analytics that never exposes individual transactions by default.

## 14. Authentication, privacy, compliance and operations

- Real email/social authentication, protected session management, account deletion, password reset, optional MFA, email verification, throttling, CSRF/XSS/injection protections and secure cookies.
- Postgres RLS, service role only on server, explicit owner/tenant filtering in all queries, negative access tests, safe storage and rotation of secrets; production encryption in transit/at rest and encrypt high-risk connector credentials separately.
- Never log full transaction descriptions, account numbers, access tokens, AI raw context, income amounts, or personal dates in analytics. Scrub errors; use sensitive-field masks.
- Privacy policy, terms, consent records for bank and AI, vendor disclosures, self-serve data export/deletion, backup/restore policy, retention plan, breach/incident response, change audit, and least-privileged admin support.
- Read-only bank data integration initially; bill reminders and suggestions must not impersonate payment initiation. If money movement is ever added, treat it as a separate security/compliance project requiring independent design and approvals.
- Financial coaching is educational, not individualized legal, tax, credit-score guarantee or regulated investment advice. Obtain counsel before broad consumer launch.
- CI: lint, typecheck, unit tests, Playwright smoke, dependency security auditing, migration check, no secrets in repo. Rate limit auth/AI/integration webhooks and protect against replay.

## 15. Workbook import audit — privacy-safe repository copy

The uploaded contract was read in full. Private workbook-specific institution labels, exact rates, counts, and identifying aliases have been removed from this repository copy. The workbook itself is neither present nor needed for this milestone. Do not request or import it for this task; use fabricated tests only.

An eventual importer must handle conflicting account/debt balances, malformed APR fields, nonfunctional copied payoff sheets, absent balance as-of dates, duplicate-looking rows, missing transaction types, ambiguous account aliases, incomplete bill schedules, possible double-counted card payments, and user-reviewed identity mapping. Never silently correct, merge, or delete uncertain records.

Upload -> inspect -> map -> preview conflicts -> independent human approval -> atomic import -> auditable counts and rollback. Imported data stays unverified until reconciled. Protect private files, prevent formula injection on export, and never seed new users from an owner workbook.

## 16. Edge cases and test fixtures — mandatory

Write unit and integration tests covering at least:

1. Checking starts at $100. Credit card owes $50. A $20 card purchase increases card owed to $70 and reduces net worth by $20, without reducing checking.
2. Paying $30 of the card from checking decreases checking from $100 to $70 and reduces the card owed from $70 to $40. The payment is **not** a second expense; net worth stays unchanged by the transfer.
3. Moving $25 from checking to savings creates two linked legs, cash total/net worth unchanged, no budget income/expense. Deleting one side atomically reverses both.
4. A checking snapshot of $100 on October 1, followed by a cleared $25 debit on October 2, yields $75. Changing snapshot to a new $90 on October 2 must not count the October 2 transaction twice.
5. A bill due on the 3rd and expected to clear on the 5th affects forecast cash on the 5th; marking it actually cleared on the 6th changes the actual and forecast history correctly.
6. A negative forecast triggers an alert, but does not assert overdraft occurred. Missing paycheck amount makes confidence incomplete.
7. Card utilization uses amount owed / credit limit only where a valid positive limit exists; missing limit does not produce 0%.
8. Snowball and avalanche produce correct ordering on different balances/rates; final small payments are capped; no false payoff date if payments fail to cover interest.
9. Savings allocated across multiple goals never creates extra net worth; withdrawals and reallocations update goal progress but not double-count assets.
10. Different IANA timezones, DST transitions, end-of-month due dates, leap-year annual events, and observed holidays behave predictably.
11. User renames an account or category; all transactions, bills, goals and graph aggregations retain their links.
12. Manual-only signup can complete onboarding, create accounts, add a ledger entry, reconcile, create a budget, create a debt plan, and receive reminders—without bank permission or AI key.
13. Hybrid mode combines a sandbox-connected checking account with a manual cash account; a synced duplicate of an existing manual transaction is flagged for reconciliation, not counted twice.
14. Imported synthetic file with disputed balances displays a review report; nothing is silently corrected and data can be rolled back.
15. Another signed-in user cannot read, alter or enumerate financial data for the first user, including direct API and AI tool calls.
16. Deleting a transaction updates running balances, net worth, monthly spending, forecasts and reports consistently; restore/undo works.
17. Notifications can be dismissed/snoozed and do not reappear every refresh. The 14-day countdown is based on the user's timezone.
18. AI requests cannot exfiltrate other users' data, bypass user confirmation, generate arbitrary SQL, or perform payments. The app behaves honestly with AI disabled.
19. Bank webhooks are verified, idempotent, retry-safe, and do not create duplicate records; disconnect actually revokes access where supported and stops sync.
20. Stripe test-mode webhook activation, subscription downgrade, cancellation and interrupted checkout apply correct entitlements and preserve data export.

21. A new signup contains **zero** financial records before onboarding; every financial screen renders honest unconfigured empty states. No owner workbook transactions appear.
22. A user explicitly creates a $0 account; the dashboard now shows a real $0 account balance, which is semantically distinct from an account that does not exist.
23. An isolated fictional demo populates only a demo context, has an obvious banner, and resets without changing a real user’s zero-start dataset.
24. Owner workbook import into a private test account produces auditable warnings and data-isolation proof; two newly created customers still have no financial data and cannot access test-account records.

Use randomized property-based tests for ledger invariants if possible. Add E2E tests demonstrating BOTH (a) a completely empty first-run and (b) a complete manual first-run from empty database through dashboard, bills, a debt plan, a savings goal, and account reconciliation.

## 17. Milestone order and measurable acceptance criteria

### Milestone A — secure foundation + workbook audit

Initialize the repo and auth/database; data migrations and owner-scoped rules; preserve transaction history import architecture; document financial conventions; set up test/CI; build private **synthetic** demo fixtures and zero-start signup tests. Deliver `pnpm install`, migrations, `pnpm dev`, typecheck, lint and initial tests passing. **Do not advance with known broken TypeScript.**

### Milestone B — genuinely usable manual MVP

Working onboarding (skippable), accounts, transaction ledger, reconciliation, custom categories, recurring bills/paydays, Dashboard with trustworthy 30-day forecast, budget/calendar, important dates/inbox, debt strategies, savings, settings and export/import. Desktop/mobile design and original Pip robot. **All controls used in the core flows must persist, update derived figures and survive reload and re-login.** Demo mode never impersonates a real user.

### Milestone C — advanced intelligence and visuals

Historical charts, cash-low warnings, debt payoff simulations, forecast confidence, category insights, rule-based hint ribbon, AI chat UI with evidence-backed recommendations and confirmed actions, secure model integration once key exists. Test all cost and permission boundaries.

### Milestone D — integrations and billing

Provider sandbox banking integration, connection consent/reconciliation, liabilities/investments where actually supported; secure sync architecture and tested webhooks; Stripe test-mode subscriptions and server-side entitlements. Require owner approval before enabling production keys or subscriptions.

### Milestone E — launch readiness

Security review, accessibility QA, backups, documentation and recovery testing, user data deletion/export, failure modes, analytics without PII, deployment checklist, privacy and legal review, staged beta and performance/cost budgets. No unreviewed production deployment.

## 18. Definition of done (do not self-certify without evidence)

The requested app is **not done** merely because routes exist, a preview looks attractive, or a rules engine is scaffolded. To report completion, produce:

- A working repository with meaningful commits, migration files and a private staging guide.
- A screen-by-screen demo of all core manual flows with real persistence, plus screen captures of the clean empty first-login experience.
- `README` launch commands and a `docs/RELEASE_STATUS.md` table marking each feature **Working**, **Sandbox Only**, **Requires Credentials**, or **Not Yet Implemented**.
- Typecheck/lint/unit/E2E test results with commands and test counts. No build-breaking errors.
- Security checks for account isolation, webhook signatures and secret handling.
- Clear evidence that statements, debt balances, transfers, income/expenses, savings allocations and forecasts do not double-count.
- A documented private QA import checklist and user-confirmed treatment of workbook discrepancies, with proof that any workbook is never a new-user seed.
- Exact integration/hosting/AI/Stripe costs or pending quote/assumption, not invented prices.
- Open issues with severity and recommended sequence for remaining work.
- An explicit request for owner permission **before publishing the app, charging real users, or connecting real bank credentials**.

**Start now with the first milestone and continue through available milestones without asking for routine confirmations. If vendor approval is genuinely needed, stop only that gated feature, make other features work, and report the blocking step clearly.**

---

## 19. PIP VOICE-FIRST FINANCIAL ASSISTANT — APPROVED PRODUCT DESIGN (November 1, 2026)

This section is mandatory and supersedes any assumption that voice may write financial records directly. Build the feature with the same security and data isolation standards as the rest of LedgerBot. Keep it disabled behind a clearly labeled integration gate until actual voice-provider credentials exist; never simulate a real microphone/backend connection.

### 19.1 Customer experience and entitlements

- Provide two equally visible first-run options: **Talk with Pip (free guided onboarding)** and **Set up manually**. Bank-linked onboarding remains a third path where supported. Users can mix voice, typing, and bank sync without losing progress; zero-start defaults remain empty until the user approves actual records.
- Voice onboarding is included in the free tier. Do not charge a customer for avoiding typing or for an accessible input method. Never require the user to say passwords, SSNs, complete card numbers, bank credentials, or one-time codes aloud.
- Everyday voice-driven transactions, recurring financial coaching, complex what-if conversations, continuous hands-free assistant use, and higher usage limits may be paid-tier benefits. Retain usable free-tier typed input and budget calculations. Pricing, quota, and upgrade rules are **proposals**, not commitments. Free user data, export, safety, and read-only access must not be withheld behind a paywall. Offer transparent voice time-usage information, never surprise charges, and backend-enforced quotas/abuse protection.
- Pip can speak naturally about account names, financial categories, and dates. Spoken output must avoid saying sensitive balances or information aloud when the user has enabled privacy mode / headphones-only mode, and must never read sensitive codes or credential material.
- User initiates microphone permission/session; clear indicators show Listening / Pip speaking / Paused / Mic off. Offer mute, pause, stop, manual text alternative, and a privacy summary; no background listening. Ask consent for any transcription retention. Do not store raw voice/audio by default beyond necessary transient handling; document vendor retention boundaries.

### 19.2 Conversation -> structured draft -> visual verification -> deliberate action

**Hard rule: No AI model, AI conversation utterance, spoken "yes" to Pip, model tool call, transcription, bank webhook, or background automation may directly create, edit, delete, reconcile, or commit financial records or protected settings. Each mutation requires an explicit, user-initiated approval in a separate trusted review/confirmation interface; this interface MUST work with assistive technology (including OS voice control) and must not require dragging or physical touch.** This rule includes voice onboarding, edits to bills and paydays, balances/APR/rates, savings/debt goals, bulk bank imports and deletion. Information-only questions and non-persistent what-if simulations need no commit approval.

- Voice and AI actions may only create a server-side `change_proposal` or `draft_change_set`, with source, proposed operations, original version(s), validation results, and expiration. All forms of input are validated on the server against typed schemas and user ownership.
- Organize proposals into intelligible, reviewable batches by domain: accounts; paydays; bills; transactions; debts; savings; events. Mark uncertainty and any unrecognized date/amount/currency, and ask clarifying questions instead of guessing. Show before/after values, affected account, impact to cash/net worth/forecast, and any transfers requiring two linked legs. User may edit each field or remove individual operations before approval.
- A persistent Review Changes drawer/inbox lets the user inspect uncommitted items at any time; counts are visible, with drafts awaiting verification and their originating audio/transcript optional. Drafts may be discarded or corrected without touching the canonical ledger.
- **Slide-to-Confirm:** show a labelled track, e.g. "Slide to save 3 reviewed changes". On pointer/touch devices, begin only from the thumb; require a genuine continuous drag from near 0 to >=95% of available track, then explicit release at the far end while the preview/version remains unchanged. Cancel/reset on pointer cancel, interrupted drag, back navigation, route change, expired proposal, or failed validation. Do not commit on mere slider `onChange`, voice, drag crossing threshold before release, page load, or software-generated click. Provide an equivalent, visible, single-pointer no-drag control plus keyboard, switch, screen-reader, eye-gaze, and OS voice-control operability. Separate initiation and final confirmation; require clear review and deliberate activation. A swipe is an intention gesture, never an authentication factor; high-risk operations require step-up authentication.
- Once the human completes the explicit gesture, send an authenticated, CSRF-protected `approve_change_proposal` request with single-use server-generated proposal token and idempotency key. Server checks ownership, immutable proposal, version freshness, permissions, and payload; commits atomically inside a transaction; stores a minimal audit trail; returns final balances. Retries cannot duplicate records or transfer legs. Never trust the front-end gesture alone or allow the assistant to call the approval endpoint.
- Provide success receipt, Undo where safe (via new approved reverse proposal for financial records), failure recovery, and no accidental double approvals. Do not silently auto-commit after delays or closing a screen.
- For synced institutions: importing raw read-only statements/transactions into a **separate staging/reconciliation table** is allowed, but canonical user ledger updates and transaction classification decisions remain pending until the user reviews and explicitly approves. Support selective and batch approval, with clear counts and duplicates/changed statements surfaced. If a future automatic posting preference is proposed, it is a separate opt-in design decision requiring owner approval; do not implement it now.

### 19.3 Detecting an unreliable voice environment and a graceful pause

- During an explicitly active voice session, monitor microphone noise/clipping/speech activity and actual interaction failure signals (repeated uncertain or malformed amounts, corrections, non-speech VAD triggers, interruptions, dropouts) using a tested client-side heuristic. OpenAI's Realtime VAD supports server/semantic turn detection and tunable thresholds, but is **not itself a guaranteed noisy-room classifier**. Do not invent confidence scores where the provider doesn't return them; label heuristic scores as heuristics.
- If the conversation becomes unreliable, Pip may gently speak: "Hey, it's pretty noisy, and I might be missing some of your numbers. Want to try somewhere quieter, switch to typing, or save our progress for later?". Include a dismiss control; do not shame the user, misrepresent the cause, or repeatedly interrupt them. This announcement is informational, not a commit or financial update.
- Pause/mute the microphone by user choice and save **only previously approved** financial changes. Unapproved proposals may remain encrypted as resumable drafts if the user chooses to save the draft; do not save them to the canonical ledger. Resume via Settings -> Setup & Personalization or dashboard/Pip Inbox reminder; respect "Don't show again"/snooze independently per suggestion.
- Offer subtitles/transcripts in a readable on-screen form, accessibility controls, manual fallback, and support for voice interruption. Microphone input is never required for essential features.

### 19.4 Required implementation / pricing boundaries

- Use authenticated Realtime sessions with ephemeral credentials minted by a secure server endpoint, with browser WebRTC when appropriate; the OpenAI API key must never reach the client. Separate the voice layer from the financial engine and server-side tool authorization; financial computations remain deterministic. Server-side model outputs are untrusted data until validated.
- Explicit separate services: `PipVoiceSession`, `FinancialIntentParser`, `DraftChangeStore`, `ProposalValidator`, `ReviewDiff`, `HumanApprovalGateway`, `FinanceCommitService`, `SpeechQualityAdvisor`, and `EntitlementMeter`. Implement typed schemas and ownership checks.
- Count and cap voice usage on the backend, log only privacy-safe operational metrics, and benchmark vendor per-minute / token / session costs for both free onboarding and paid everyday voice before choosing pricing. Voice session costs must be paid by LedgerBot; a customer's ChatGPT subscription is not a substitute for an OpenAI API contract.
- Onboarding completion is about user-approved data, not whether Pip believes a conversation finished. Incomplete steps may be skipped or marked not applicable and reviewed later.

### 19.5 Voice-and-approval release tests (mandatory)

1. New user starts with zero records; says a checking name, estimated $1,800 opening balance, and biweekly income. Pip shows editable structured drafts, no canonical account, bill, transaction or income exists until a deliberate trusted-UI confirmation is completed.
2. User says "yes, save it", "confirm", "approve everything", or asks the assistant to invoke a tool; no persisted financial mutations occur. Pip directs them to review and use the trusted confirmation UI, which may be activated through accessible controls.
3. Approver adjusts a misunderstood amount from $18,000 to $1,800, confirms, and all derived forecasts/net worth use the corrected value. No incorrect record was ever posted.
4. Touch slider passes 95% but pointer is released before the end, cancelled or interrupted; no commit. A valid full drag-and-release approves once. Double requests/double touch never duplicate records.
5. Keyboard-only and screen-reader users can approve through an equivalently deliberate, accessible manual action. No essential action requires speech, touch, or a mouse exclusively.
6. User has already reviewed a proposal, then another device edits the same account; the server rejects stale approval and requires a new review.
7. In noisy surroundings with repeated recognition errors, Pip offers a spoken pause / text fallback, microphone can be stopped, previously approved values persist, unapproved information remains a draft (if user opted to keep it).
8. User manually enters a transaction verbally, including a category split, while phone is locked / app in background; no posting occurs unless they return to the app and approve in the trusted UI.
9. Synced transactions arrive from a bank webhook; raw import lands in staging, canonical ledger is unchanged; user reviews 12 imports (including a flagged duplicate), removes one, explicitly confirms in the trusted UI, and only 11 accepted records are committed exactly once.
10. One user cannot approve, retrieve, infer, or overwrite another user's drafts or ledger records, even with forged proposal IDs, stale tokens, replays, prompt injection, or spoken requests.
11. Free-tier voice onboarding is usable end-to-end; free manual onboarding is equally functional; premium voice-coaching locks are truthful and do not prevent reading/exporting existing data.
12. No recording persists without opt-in; logout, revoked mic permission, network failure, and completed session close microphone/voice access and do not auto-commit changes.

**Voice design acceptance criterion:** a customer may conduct the entire onboarding as a friendly two-way conversation, BUT every changed account, ledger record, recurring schedule, debt, savings or event must remain a proposed draft until they deliberately approve its clearly displayed contents through a deliberate, accessible, independent confirmation UI. OS-level voice navigation may activate this UI, but a voice command to the Pip AI must NEVER approve. The server must reject agent-originated and unverified attempts to bypass confirmation.



## 19.6 SECURE, ACCESSIBLE APPROVAL — FINALIZED PRODUCT DECISION

**Status:** Product requirement adopted. Not yet implemented, security-assessed, or deployed. Implement with an independent approval gateway and an accessibility audit before any real financial use.

### A. Separate intention, authentication, and financial commit

- **Three distinct concepts:** Pip interprets and drafts; the authenticated user explicitly intends to approve the exact on-screen change; the backend verifies authorization and commits. Face ID, Touch ID, passkey, or device unlock authenticates a person but does NOT by itself prove intent to save a particular change. Merely looking at an unlocked phone cannot initiate approval.
- **Standard UX:** show exact before/after details, source account, date, amount, payee, budget impact and any assumptions. Default to a slide-to-confirm control for touch users, with a meaningful start and end state, explicit release, cancellation on interruption, and no background or auto-commit.
- **Equivalent accessible UX:** on the same review screen offer an obviously labeled **'Use accessible confirmation'** action that needs no dragging. This must support single-pointer/tap, keyboard, switch control, eye tracking and screen readers; users may activate that trusted UI via their device's OS-level voice control. Require a deliberate two-step flow (Review changes -> Continue to confirmation -> Confirm these exact changes), with clear focus and an easy Cancel/Back. Do not rely solely on long-press (not universally accessible). Follow WCAG 2.2 AA, especially 2.5.7 Dragging Movements and 3.3.8 Accessible Authentication.
- **Pip AI cannot invoke or respond as the approver.** Spoken 'yes'/'save it' inside the Pip conversation only creates or updates a proposal. OS voice-control activation of a focused, trusted confirmation UI is allowed as an accessibility input mechanism, not as an assistant tool call. Distinguish these input channels in architecture and tests. Don't use a user-chosen static spoken passphrase or voice biometrics as sole authentication.
- **Optional step-up:** for sensitive changes, after user explicitly initiates confirmation, offer platform passkey/WebAuthn with user verification (where accessible), potentially using Face ID/Touch ID/Windows Hello or device PIN. Include a functional alternate method where local biometrics or gestures are inaccessible. Authentication begins only after the user actively chooses to confirm, never automatically on Pip's voice, a notification, gaze, or view load. Browser/provider UX varies by platform: verify accessibility on supported devices.
- **Email/SMS codes:** may be used for notification/recovery or a carefully risk-assessed fallback, but are NOT the preferred high-assurance method and must never be dictated to Pip's AI. If a device's voice control is used to enter a fallback code, the code must enter a dedicated protected field, not model transcription/chat; redact from logs/AI context. Prefer secure autofill or provider-supported authentication where accessible. Do not claim SMS/email alone is phishing-resistant.
- **Risk-based policy:** ordinary categorization and new manual transactions may use explicit trusted-UI approval in a valid session; changing an opening balance, account ownership, a large batch, deleting records, exporting sensitive data, or changing security credentials may trigger step-up according to a documented risk matrix. If money movement is ever supported, require independent bank/provider authorization and review; never treat a LedgerBot approval as permission to move funds.

### B. Backend integrity and recoverability

- Each proposal has immutable `proposal_id`, `owner_user_id`, `version`, exact typed operations, canonical JSON digest/hash, created/expiry times, statuses (`draft`, `awaiting_review`, `ready`, `approved`, `rejected`, `expired`), originating channel and risk level. Any edit, stale bank refresh, or competing account update invalidates the old approval challenge and requires a new review.
- The confirmation UI retrieves the approved proposal directly from the server, not by trusting chat text. At approval time, server enforces login, owner/tenant isolation, current session, role, proposal digest/version, fresh challenge, CSRF/session protection, idempotency and any required step-up. Use database transactions for atomic posting of full transfer pairs, no half-posted records, and single-use approval. Reject replay, expired challenge, foreign-owner IDs, changed amounts and AI-side tool calls; audit successful and rejected attempts without logging account secrets.
- Where passkey/WebAuthn is used, issue a fresh short-lived authentication challenge associated server-side with the exact proposal ID + version + digest and the verified session; after successful user verification, authorize only that proposal. WebAuthn proves authentication for a challenge; UI review and server-side binding are still necessary for change intent.
- If the user cannot confirm now, **Save for Later** stores an encrypted pending proposal (not a posted ledger update) in Pip's Pending Reviews. Resume later with the entire before/after view; show changes that have become stale and require re-review. Expire sensitive approvals, but preserve user-approved resumable drafts according to a clear retention policy. Permit discard and export/delete controls.
- Bank-synced entries remain in a separate read-only staging queue until reviewed and approved for the canonical ledger, per the existing no-auto-commit requirement. Previewing simulations never writes financial records.

### C. UI states and copy for implementation

- Review card: **'Pip prepared 3 changes — Nothing saved yet'**. Actions: Edit, Remove item, Save for later, Discard, Slide to confirm, Use accessible confirmation.
- Accessible path screen 1: **'Review these exact changes'**, clearly reads a summary with screen readers; **'Continue to secure confirmation'**.
- Accessible path screen 2: **'Confirm 3 reviewed changes'**, requires a new user-initiated activation; optionally triggers accessible passkey/step-up if the action requires it. Back/Cancel must work and must not save.
- Completion receipt: **'3 changes saved'**, show transaction IDs/time and projected dashboard impact. An approval that fails or loses connection remains uncommitted unless the backend confirms receipt; retries use the same idempotency key.
- Do not autoplay Face ID or any authenticator on opening the review screen; do not use ordinary gaze/presence detection as acceptance. Do not advertise the presence of Face ID on unsupported devices.

### D. Mandatory release tests (add to existing Section 19.5)

1. AI user says 'yes'/'save'/'confirm' repeatedly and Pip calls every tool it can access: **zero commits**.
2. Looking at unlocked phone, accidental tap, incidental face recognition, screen read-out, push notification, audio playback, or opening a draft: **zero commits**.
3. Valid slide to end plus release posts exactly once; aborted/cancelled drag, moved thumb without release, interrupted view, and changed proposal post nothing.
4. Single-pointer user who cannot drag can still review and confirm using a no-drag alternative; keyboard, screen reader, switch, eye-gaze and OS voice-control paths have equivalent access to the same reviewed content and outcome.
5. Using OS speech control to select the trusted 'Confirm' UI can count as intentional approval, but saying the same words to Pip inside the AI voice session must never call the approval endpoint.
6. A passkey/Face ID device authentication succeeds only when the correct proposal is waiting, the user deliberately initiated it, and the server verifies proposal digest/version/fresh challenge; changed amount or replayed challenge fails.
7. Cross-user, logged-out, expired session, stale version, missing step-up, forged approvals and duplicated requests are rejected with no partial postings.
8. A user pauses or cannot confirm; a draft remains in Pending Reviews with no balance change; on resume the user can re-review, edit and confirm, with appropriate invalidation of stale approvals.
9. Fallback code is never captured in Pip conversation/transcripts/model requests/logs; unsupported biometric devices still have a usable alternative.
10. Accessibility QA includes screen readers and motor-access interaction on real devices; target WCAG 2.2 AA, including a drag-free pointer alternative.

**Security release gate:** Do not mark secure accessible approval 'done' until negative-case tests and accessibility checks pass against the deployed staging backend. Designing this workflow does not make it implemented or independently audited.


---

## 20. PRODUCT NORTH STAR AND SYSTEM OF RECORD (NEW — OVERRIDES LOOSELY WORDED PRIOR DESCRIPTIONS)

The app is NOT a generic expense logger with a chatbot on top. It is a customizable financial **planning and decision-support** system, guided by a conversational companion. Product pillars:

1. **Ledger = reality.** Authoritative accounting of what happened: account-opening snapshots, transactions, pending/cleared/posted states, paired transfers, credit card charges/payments, reconciliation history. It answers "What actually happened?" Never silently change posted history because AI predicts a different result.
2. **Budget = the PLAN.** User's intentions: category allocations and limits, bill plans, pay cycle allocations, priorities, tradeoffs, goals, rollovers, reallocation proposals, envelope/sinking fund options. Comparison to actuals is feedback, not the budget's sole purpose. Flexible user-defined category names and budget periods. It answers "What am I trying to do, and how do I get there?"
3. **Forecaster = road ahead.** Daily cash position from ledger + approved future assumptions (income, bills, planned expenses, savings contributions, debt payments), confidence/coverage explanation, expected clearance timing, scenario ranges. It answers "If I stay on this path, what likely happens next?"
4. **Pip = companion.** Asks clarifying questions, notices uncertainty/opportunities, explains *why*, proposes multiple choices and lets customer deliberately approve exact drafts. Pip does not generate authoritative monetary math; typed deterministic engines do.

**Data flow rule:** One posted $120 bank transaction is one actual $120 transaction, even if a receipt splits it into $82 groceries + $30 household + $8 allocated tax. Category allocations, budgets and forecasts are *views/analyses* of ledger data. They must not post another $120 debit. Expense categories cannot mutate account balance; savings goal allocations cannot independently create assets. A proposed reduction in spending is NOT yet saved money and does NOT change cash on hand.

## 21. FINANCIAL PLANNING ENGINE + FORECASTER — FIRST-CLASS DIFFERENTIATOR

Implement a deterministic planning engine with typed inputs, output, assumptions, provenance and stable tests. Required capabilities:

- Separate **cleared**, **posted**, **pending**, **scheduled**, **predicted**, **statement snapshot**, **unknown**, and **user-estimated**. Derive user-visible account balances with explicit "as of" timestamps and reconciliation/correction events, and do not assume connected balances are real time.
- Date-driven daily balances for 7/30/60/90 days, extendable to custom horizons. Include next paydays, due dates vs probable *clear* dates, automatic payment lead times, weekends/holidays, user-created dates, credit card statement payment timing, variable expenses and planned goal contributions. Store local dates and user IANA time zone; handle DST/time-zone boundaries and leap years.
- Separate **current account balance**, **available cash**, **planned spendable money after reserved bills**, **net worth**, and **forecast low-water mark**. Provide user-selected minimum cushion and warnings before a projected overdraft. Savings balances remain assets but can be earmarked/otherwise excluded from discretionary spendable cash.
- Explicit assumptions for inflows, amounts, recurrence, income uncertainty (net take-home vs gross), expected check clearing, merchant payment processing lag, category future spend, and irregular bills. Distinguish recurring obligations from trend-based estimates to avoid counting future groceries twice.
- Forecast coverage meter: missing pay schedules/bills/unknown APRs/stale sync/uncategorized pending items/limited history; show "Preliminary/Incomplete" instead of fabricated certainty. Allow users to adjust assumptions and immediately recalculate, with clear attribution for each chart point and warning.
- **Financial Sandbox:** branched what-if scenarios that never post ledger entries. Support extra debt payment, job/paycheck shift, altered bill due date, rent move, car purchase, emergency expense, increased savings transfer, and changed category budget. Show side-by-side comparisons against baseline, impact on low balance and goals, and user-approved 'Apply to plan' operations via proposal approval only. A what-if simulation cannot initiate an external payment.
- **Budgeting Buddy:** derive practical plan alternatives from current budgets + forecast, not generic nags. Examples: extra utility bill reduces goal contributions; show 2–3 choices and their expected impact; reduce dining spend only as a *proposed* adjustment, not as instant cash; spread shortfalls across remaining months; maintain emergency cushion before extra debt payments. No shaming or guaranteed outcomes.
- Recalculate engine outputs after approved changes, sync reconciliation events, or schedules. Avoid requiring a paid LLM request for every transaction or page view. Use deterministic rules for basic hints, AI optionally for natural-language explanation and scenario composition.

**Tests:** biweekly payroll crossing month boundaries; pay delayed by a holiday; due date vs cleared date; pending->posted; card charge vs payment; manual adjustment; incomplete forecast; no recurring pay known; multiple savings accounts; category budgets with varying start dates; timezone changes; negative balances; scenario isolation; rapid edits with stable canonical recomputation; avoid wrong sign on liabilities.

## 22. PIP SMART TRANSACTION DETECTIVE — CUSTOMER-REVIEWED CATEGORIZATION

- In the Cash Flow ledger, dashboard, Inbox, and optionally during an **active opt-in voice session**, Pip may ask: "I noticed a Walmart charge for $86.42. Was that groceries, household items, or both?" Merchant labels are not item-level proof.
- Connected transaction arrives into an **import staging queue**, not into the committed ledger under the current approval policy. Suggest likely categories using merchant metadata + confirmed user history; never assume all purchases from a mixed merchant are groceries. Manual users get same categorization flow.
- Provide split editor for multiple user-defined categories and cents-precise amounts, split percentages optional; unassigned portion must be shown and confirm blocked until sums equal original total exactly. Zero and refunds/reversals supported. Distinct inclusive/exclusive tax allocations with user-visible rounding rule; store in integer minor units or exact decimal, never floating point dollars.
- After repeated USER-CONFIRMED decisions, offer a user-approved merchant suggestion/rule e.g. "Suggest Groceries first for Walmart?" Do not silently create auto-post rules or auto-commit, and preserve freedom to change category names. Explain why a suggestion was made, with a way to ignore, override or opt out of transaction hints.
- Batch review: group staged imports into a review session, display exact deltas, flagged duplicates and unmatched items, allow skip/approve subset and produce one immutable approval digest and audit receipt. A hundred notifications is not acceptable.
- A categorization update changes budget actuals and possibly the *assumptions* feeding forecasts; it must never subtract the bank amount a second time.
- Notification channels independently configurable: silent Inbox, in-app card, prompt when opening ledger, voice prompts only while mic and voice session enabled. Never unsolicited spoken financial details from a locked/shared device. Rate-limit hints and suppress repeated questions or dismissals.

## 23. RECEIPT DETECTIVE — ITEM-LEVEL, CENT-PRECISE, USER-APPROVED

- User can upload/photo/crop a receipt (phone and web); perform malware/MIME/size validation, protect private images in owner-scoped storage, delete/export user data, don't store payment-card details unnecessarily. OCR/vision extraction may use vendor AI but is probabilistic.
- Extract merchant, time/date, currency, subtotal, line items, unit price, quantity, coupons, promotions, returns, total, taxes, tips and fees *when discernible*. Preserve original image as linked evidence if the user opts in, never disclose to other tenants. Display extraction confidence **per field**, highlight ambiguous abbreviations and arithmetic discrepancies.
- Deduplicate and propose to match with existing manual or connected transaction using merchant/date/amount/account/currency; pending->posted amount may change; no silent assignment; user may override match. If no ledger transaction exists, create a **draft** new transaction, not a posted duplicate.
- Categorize receipt items with editable custom categories and line splits, including category splits within one line if necessary. Distribute discounts/taxes/fees deterministically according to an explicitly selected allocation method and largest-remainder adjustment (or clear unapportioned category) so every cent is accounted for. Do not quietly invent an item or an amount. Tip handling, refunds and split tender require separate checks.
- Two distinct reconciliation checks: **receipt arithmetic** line items + adjustments = receipt printed total, and **receipt-to-ledger** approved allocations = matched ledger debit. Differences show a blocking discrepancy card or a user-approved explicit exception/reason (e.g. tip, cash back, partial split tender). Do not fake that mismatches reconcile.
- The scanned receipt is **not** another withdrawal when matched to a ledger transaction. On approval, update metadata/category allocations and optional receipt association only. Pip can explain improvements to planned category budgets after categorization, but may not auto-rewrite the plan.
- Optional intelligent grocery price trend analysis only when enough accurately identified, normalized user-approved item histories exist; no ungrounded "price increase" claims.
- Subscription option: basic manual split and some scans in Free; higher volume and deeper analysis in a paid plan only after costs verified. Never paywall access to a user's already saved receipts/data or correct errors.

## 24. PIP INBOX, SETUP COMPLETION, AND FAIR DISCOVERY/UPGRADE ENGINE

- First login has a clean, unconfigured dashboard and skippable voice/manual onboarding. Skipped sections remain permanently reachable via **Settings > Setup & Personalization**, with status Complete / Skipped / Not applicable / Needs review. No fake $0 balances.
- Pip can offer at most one relevant in-app reminder upon app launch, e.g. "If you add your recurring bills, I can show cash shortfalls in Forecaster." Benefits must be grounded in real feature capabilities and user settings. Reminder control: Maybe later/snooze, Don't show this suggestion again, and Not applicable. Dismissing one item does not disable important safety alerts or other setup help. All reminders can be re-enabled in Settings.
- **Pip's Suggestions** and **Pending Reviews** are persistent user-accessible locations, with independent categories: setup completeness, financial facts/alerts, feature discovery, optional paid upgrades. Paid promotions must be clearly labelled, infrequent, dismissible, opt-out globally and NEVER take precedence over urgent financial alerts.
- Suggestion generation should use deterministic triggers and user consent/preferences with provenance; LLM may word copy but should not invent benefits or certainty. Respect user-created terminology and avoid shame. Provide user-visible rationale and action preview.
- Saved/resumable **voice conversation drafts** are not financial writes. User can end session, preserve structured proposed actions securely, return later, edit, and individually approve or discard. Retain no audio by default, transcripts optional by clear consent; support deletion and retention window controls.
- Trial/subscription options are **proposals requiring owner approval**. Basic ledger, budget planning, accessibility, accurate manual reconciliation, split allocations and free voice onboarding must remain functional without subscription. Potential tiers: Free, Plus (bank sync/deeper forecast/convenience), optional Debt Freedom Booster / advanced Pip coaching / receipt volume. Test economics; no surprise renewals, no lock-in, no cancellation fees, transparent downgrade/export, separate promotional opt-in. A 30- to 90-day trial is a proposal, not a pre-set live entitlement.

## 25. CONVERSATIONAL VOICE + TRUSTED APPROVAL — HARD ARCHITECTURAL BOUNDARY

- Offer optional **Talk with Pip** free onboarding and **Set up manually** at entry, with seamless switching. Pip asks natural questions; converts speech to structured *drafts* with explicit unknown fields; asks clarifying questions and shows a visual typed review prior to every financial change.
- A clean real-time voice approach can use OpenAI Realtime API with server-minted ephemeral credentials/WebRTC; normal API keys remain only in server secrets. Implement provider adapters and a text-only fallback; handle reconnect, microphone permission, consent, low-quality/noisy speech feedback and explicit pause/resume. Never pretend a heuristic can reliably identify environmental noise with certainty.
- **Absolute core rule:** Pip and any other AI cannot call the mutation/approval endpoint or change balances, categories, budgets, dates, income schedules, goals, permissions, or billing. They can create proposal drafts and request scenarios. Successful durable financial changes require an authenticated independent human approval ceremony with the **exact immutable proposal ID, version, data digest and intended operations** validated server-side.
- Default touch interaction: review all before/after fields, then slide-to-confirm with actual endpoint release; cancellation/abort must do nothing. Accessible equal-strength option: review+continue then deliberate confirmation via tap/keyboard/switch/screen reader/eye tracking/OS voice control, no required dragging. OS-level voice *control of the trusted UI* may act as a human interface. Spoken agreement to Pip in conversation is NOT an approval. Face ID/passkeys (where supported) only as optional step-up initiated after conscious approval action; screen gaze alone never approves. SMS/email OTP cannot be dictated to Pip and are not sole high assurance for sensitive operations. No facial recognition on page load.
- Keep staged vendor events and receipts separate from posted records. Approval is single-use, idempotent, access-controlled, revocable before commit, auditable, and stale-aware. Changing any proposed amount, account, category split or date invalidates the prior approval challenge. Preserve proposed data for later review; no "lost work".
- **Accessibility remains a core FREE entitlement**; test WCAG 2.2 AA, touch alternatives, zoom, keyboard, labels and screen reader, and user tests for motor disabilities. Strong authentication does not replace transaction intent.

## 26. DEBT FREEDOM SIMULATOR + SAVINGS — PRECISION AND HONESTY

- Credit card liability sync, when enabled and supported, may provide APRs, credit limits, minimum payments and due dates but coverage is inconsistent. Distinguish imported values, latest refresh timestamp, user-confirmed values, and guesses. Missing APR/term/statement rules means estimated payoff only, not "exact to the penny" guaranteed payoff.
- Debt models must calculate in cents with explicit contractual assumptions; support card daily-average-balance interest where terms permit, promo APR expiry, tiered APR balances, grace periods, fees, loans with amortization, per-debt minimum floors, additional payment allocation, snowball/avalanche/custom comparison, payoff dates, total interest and sensitivity to date of payments. Show clear caveats where terms are unknown. Include validation against known amortization fixtures and fuzz tests for rounding.
- **Debt Freedom Booster** is an optional advanced comparison and adaptive coaching entitlement, never a gate on baseline manual debt tracking or an honest basic payoff calculation. No guaranteed score boosts or misleading credit optimization claims.
- Savings goal planned contributions are *not* additional cash assets. Differentiate reserved/allocated balances, actual deposits, transfers into savings, and proposed target changes. Coordinate savings contributions and extra debt payments with next-90-day cash safety and user-defined priorities.

## 27. RECOMMENDED BUILD AND RELEASE ORDER — DO NOT SPRINT TO FAKE COMPLETION

The complete app is a multi-phase product. A single Codex task must not declare all integrations live. Each phase should end with executable tests, screenshots or manual QA evidence, a concise changelog, security notes, and a reviewable GitHub pull request. Prefer vertical slices over thousands of lines of disconnected scaffold.

**Phase 0 — Repo + decisions + architecture:** Inspect current repo, document baseline, choose a cohesive stack, create architecture decisions, threat model, data model, `AGENTS.md` / runbook, CI typecheck/lint/unit tests, .env.example (no real secrets). First PR should be reviewable and independently runnable.

**Phase 1 — Truly usable manual finance MVP:** Auth and tenant authorization with a real database; clean signup with NO transactions; custom accounts/balances/dates; manual transaction CRUD, linked transfers, pending vs cleared, split categories, reconciliation; user-visible Dashboard + empty states; foundational Budget as a user-defined plan; basic Forecaster with 7/30/60/90-day views and actual vs estimated; recurring income/bills; skippable setup, Inbox, seeded synthetic opt-in demo. Standard and accessible approval path on every write. This phase must work **without API keys for AI, bank sync, or billing**. No actual user financial data in repo.

**Phase 2 — Intelligence:** forecast confidence, plan comparison and Financial Sandbox, Budgeting Buddy rules and explanations, debt/savings calculators, calendar, reminders, user approval audit trail, robust test coverage.

**Phase 3 — Pip and media:** secure text AI, optional realtime voice onboarding, review/resume, noisy audio fallback, Pip suggestions, receipt scan + matched-item allocations and review; vendors behind flags until configured.

**Phase 4 — Bank integration and paid entitlements:** consented provider integration, staging/review/approval of imports, liability data fallback/manual override, duplicate matching, subscription/trial infrastructure with Stripe TEST mode, meter AI/scans, pricing experiments. No real charges or public deployment without owner approval.

**Phase 5 — Beta hardening + optional ChatGPT integration:** privacy/security audit, production telemetry without sensitive content, backups, recoveries, breach/incident plans, accessibility tests, mobile QA, consent/privacy pages, deletion/export, QA with synthetic fixture. Optional authenticated MCP/ChatGPT plugin can follow secure core.

**Hard stop flags:** if DB RLS, tenant isolation, approval gateway, reconciliation, or CI tests fail, do not advance feature as complete. Document blockers instead of substituting mocked results. Staging only; publication/billing require the owner’s explicit go-ahead.

## 28. DEFINITION-OF-DONE SCENARIOS — LATEST PRODUCT BEHAVIORS

Create automated unit, integration, API authorization, and Playwright E2E tests for all high-risk flows. The following are specifically mandatory:

1. New account has zero **records**, not manufactured zero **balances**, no imported test users, no history; setup can be skipped and resumed in Settings.
2. A genuine manually entered $0 account displays $0 as a known quantity; unknown account balance is never labeled $0.
3. A connected $120 Walmart debit is imported as one **staged** transaction, approved once, then a receipt is matched and splits categories; cash remains -$120, while budget actuals reflect user-approved splits totaling $120.
4. Receipt $120 with $119.99 allocated is blocked, receipt with $120.01 allocated blocked, $120 exactly accepted; taxes, multi-category splits, negative refunds and fractional discount rounding sum in integer cents.
5. Duplicate uploads, imported + manual records, pending->posted replacements, duplicate receipt attachment and idempotent approval retries never double count. Mismatch in final posted restaurant tip asks for review.
6. User specifies $500 discretionary expense, baseline low-water mark $200, scenario proposed: monthly cash changes in sandbox chart only, bank/ledger unaffected; applying a proposed budget amendment requires review and human approval.
7. User approves annual planned spending changes; both budget target and forecast assumptions update after commit; changing category allocation of a historical expense never changes cleared account balance.
8. User says verbally 'please save my transaction' or 'I approve' repeatedly: zero committed transactions; OS-level accessible confirmation through trusted review UI works; abort slide doesn't commit; mutated digest/replay/expired proposal is rejected.
9. Voice session interrupted or noisy: draft preserved, user returns to Pending Reviews, no unauthorized commits, and no accidental recording retention.
10. Debt snowball vs avalanche results include interest and cash limits; no false "exact total cost" statement when APR or term unknown; promo APR and daily-payment-date changes affect estimates.
11. Pip detects missing payroll and says the 30-day forecast is preliminary, not risk-free; if actual verified bills exceed inflows, shows expected shortage and options.
12. User can create completely custom categories, account nicknames, goals and bill schedules, and renaming doesn't break foreign keys or transaction history.
13. Test two accounts/tenants with forged identifiers, staging queues, receipts, prompts, secrets and approval requests: cross-tenant access returns denial. Row-level DB constraints and route handlers both enforce isolation.
14. All incomplete onboarding recommendations survive refresh yet respect per-item dismiss/Not applicable, and promotional suggestions have a separate global off switch from critical alerts.
15. Retrying post after a network interruption returns one confirmed operation or a pending/unknown result that can be safely queried; never silently applies twice.
16. Standard and assistive controls tested on narrow/wide screens and keyboard/screen-reader, including non-drag confirmation at same security assurance as slide.
17. Working non-demo users can use manual features with bank/AI/receipt/Stripe integrations disabled. Missing vendor credentials never result in false success or invented user data.

**Readiness report required from Codex:** Matrix for each feature with status (implemented/working, partial, disabled by environment, not started), commands executed, test counts and failures, known uncertainties, security caveats, steps for developer to review locally, and list of external vendor registrations or keys needed later. **Do not call the product production-ready until a real security and privacy review has passed.**

### Reference documentation (not substitutes for tests)
- Codex Cloud: https://learn.chatgpt.com/docs/cloud
- OpenAI Realtime browser sessions: https://developers.openai.com/api/docs/guides/voice-webrtc
- OpenAI structured outputs: https://developers.openai.com/api/docs/guides/structured-outputs
- Plaid Liabilities: https://plaid.com/docs/liabilities/
- Plaid pending/posted handling: https://plaid.com/docs/transactions/transactions-data/
