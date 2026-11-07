# LedgerBot laptop test book

Candidate: review branch `feat/manual-finance-foundation`, app fixes at `6c6043a` or a later version that includes them. This is a development candidate, not a released service. Guide prepared November 6, 2026 (owner's local date).

Use this beside OWNER_FINDINGS_TEMPLATE.md. Work one section at a time. Record PASS, ISSUE, BLOCKED, NOT TRIED or SUGGESTION. A blocked feature is not a pass. You do not need to diagnose code. Copy the step ID when reporting: for example, `L-LEDGER-C / Step 3`.

## Read this first

- Use invented money, merchants, accounts and dates only. This version is not cleared for real financial use. A real email for hosted authentication is fine; real finances are not needed.
- Do not put passwords, email verification/reset links, cookies, tokens, connection strings or environment files in a report, screenshot or GitHub issue. Reports can stay privately on your laptop. The repository was last reported public; do not put private findings there.
- Do not delete your database, account or project to start again. Create a new fictional user. Account erasure is not implemented.
- Financial flow: **fill form → Prepare → Review staged changes → inspect Before/After → confirm**. Prepare alone must not change money. Some nonfinancial Settings preferences save immediately or through their own Save button.
- If a save appears stuck, wait, check the receipt and Ledger, then refresh once. Do not repeatedly confirm. Stop if an entry duplicates, another user's data appears or a financial change happens without approval.
- Exact labels may differ on older laptop copies. If one is missing, record the version and stop that section instead of guessing.
- No checklist can enumerate every possible sequence. The final free-exploration sections are where to try your own habits and suggestions.

## L-START-A — Get the correct laptop copy running

- Step 1. Open VS Code and the LedgerBot folder. Save unfinished app work for later before updating. Download any troubleshooting recording you want to keep.
- Step 2. Click the terminal running LedgerBot; press Ctrl+C. If asked to terminate the batch job, type Y and press Enter. A second terminal may still be running the app; stop that one too.
- Step 3. Open GitHub Desktop. Select LedgerBot, then branch `feat/manual-finance-foundation`. Click Fetch origin, then Pull origin if offered. Do not discard local changes if warned; record the warning.
- Step 4. In VS Code choose Terminal → New Terminal. Choose **Command Prompt** from the terminal dropdown. Check the folder is LedgerBot and the file list includes package.json.
- Step 5. Run `node --version`. Expect v24.x. Run `git rev-parse --short HEAD`; write this version in your report. Expect `6c6043a` or a later review-branch commit, not necessarily exactly that value.
- Step 6. Type `npm ci`, press Enter and wait. Then `npm run db:migrate`, wait. Then `npm run dev`. Keep the last command running. If installation reports EPERM, stop other app terminals and close/reopen VS Code before retrying. Do not use audit fix --force.
- Step 7. Open Firefox at `http://127.0.0.1:3000`. Expect LedgerBot. If the port is occupied, record the message; do not switch to a random port.
- Step 8. Record Windows version, Firefox version (menu → Help → About Firefox), browser zoom and Windows display scaling. Start at 100% browser zoom (Ctrl+0).

Expected: the app opens without deleting any existing fictional records. Updating this copy does not publish it.

## L-LOGIN-A — New empty user

- Step 1. Sign out if needed. Use a NEW address such as `testerlaptop01@example.test` in **local development mode**. If you used it already, use laptop02. Write a device label in your report, not a password.
- Step 2. Try submitting an empty signup form. Expect useful required-field feedback.
- Step 3. Enter an incorrectly formed address, then try a password shorter than 12 characters. Expect rejection, no account created. Do not report the password.
- Step 4. Enter a correctly formed fictional address and a unique test-only password at least 12 characters long. Create my empty account. Save the password privately yourself.
- Step 5. Expect Forecast and a fresh-start message. Accounts, transactions, categories, budgets and schedules must contain no financial records. Unknown is allowed; invented demo balances are not.
- Step 6. Click Skip setup. Expect access to the workspace, not inserted sample finances. Return to Dashboard.
- Step 7. Sign out, choose Already registered? Sign in, enter the same credentials and sign in. Expect the same empty user.
- Step 8. If signup instead asks for email verification, you are on a configured identity provider. `.test` cannot receive that message: mark this section BLOCKED and use L-EMAIL-A with a real inbox you control. Do not repeatedly create inaccessible accounts.

## L-NAV-A — Empty-screen tour

- Step 1. Visit Dashboard, Accounts, Ledger, Budget, Inbox and Settings using every sidebar link. Write down confusing titles or missing instructions.
- Step 2. On empty Ledger, try Add entry and Transfer / card payment. With no accounts, saving must be blocked with an understandable reason.
- Step 3. On empty Budget, inspect filters, category controls and empty charts. They must not fabricate spending or an account balance.
- Step 4. On Dashboard, try Budget and Add Transaction quick actions. Add Transaction should open Ledger's entry form; opening Ledger normally should show the register first.
- Step 5. Debt Tools and Savings Plan should say unavailable/coming later. They must not pretend to work. Note whether disabled controls are clear.
- Step 6. Use browser Back and Forward. Try refreshing on each page. With no unsaved changes, navigation should be straightforward.
- Step 7. Click the brand/any other visible navigation links and record their actual destination. Unknown links should not lead to unrelated sites.

## L-LOG-A — Start a troubleshooting recording

- Step 1. Click Help troubleshoot. Read the explanation. Expect recording off initially.
- Step 2. Click Start fresh recording. Close troubleshooting.
- Step 3. Visit two sections and edit one harmless form field without submitting. Click outside the field. Recording captures limited action metadata, not every keystroke or field value.
- Step 4. Reopen Help troubleshoot. Check events are appearing. Device report label: **Laptop tester**. The logger intentionally does not contain the login email.
- Step 5. Click Download safe report. Find LedgerBot-troubleshooting.json in browser Downloads. Open with VS Code or Notepad; do not edit it. Check it does not show passwords, entered amounts, merchant names or email addresses.
- Step 6. Try the available stop/clear recording controls. Confirm the explanation matches their behavior. Start fresh again before investigating a real bug.
- Step 7. Download BEFORE refreshing, signing out or restarting. The in-memory recording does not survive those actions. Keep the file next to your private findings and identify which test section it belongs to.

## L-ACCOUNTS-A — Create the three main practice accounts

Use TODAY as shown by the app, in its selected time zone. Keep all main-flow transactions in that calendar month. If your testing spans a month boundary, record which month contains each entry; do not compare different months' totals as if identical.

- Step 1. Accounts → Add a manual account. Name **Practice Checking**, type checking, opening 1000.00, as-of TODAY, timing **start of day / before today's entries**.
- Step 2. Prepare account for review. Before confirmation, check the exact name, date, type and $1,000.00 amount. Cancel/keep the draft once. There must still be no confirmed account.
- Step 3. Open review again. Try a partial slider drag and release. Expect no save. Then deliberately slide all the way and release. Expect a saved receipt and exactly one account with $1,000.00.
- Step 4. Add **Practice Savings**, savings, 0.00, same date/timing. This time use Use accessible confirmation, then Confirm these exact changes. Expect exactly one $0.00 savings account.
- Step 5. Add **Practice Card**, credit, 50.00 opening owed, same date/timing. Confirm. Expect $50 owed; not $50 available cash.
- Step 6. Visit Dashboard and Ledger. Account amounts must match Accounts. Note any screen that makes card debt look like cash.
- Step 7. Reload. All three accounts persist once, without duplicating.

## L-BUDGET-A — Categories and monthly targets in one step

- Step 1. Open Budget. In Monthly PLAN choose Budget category → + Add a new category. Name **Groceries**. Set current Budget month, Planned target 100.00, frequency Monthly, period start the first of that month.
- Step 2. Prepare budget target. Review should include new category and target together. Cancel review once: neither should be confirmed yet. Review again and confirm.
- Step 3. Repeat for **Household**, **Automotive**, **Utilities**, each with a $100 monthly target for that same month.
- Step 4. Expect four $100 targets, $400 overall plan, $0 actual spending. Checking stays $1,000. Savings stays $0. Card stays $50 owed.
- Step 5. Click every category filter checkbox. Try Select no categories and Clear budget filters. A filtered empty view must be understandable and must not remove categories or change money.
- Step 6. Try each budget account filter, then All accounts. Note whether planned targets and filtered actuals are explained clearly.
- Step 7. Switch chart month away and back. Targets belong to the month entered; they must not silently appear in all months. Return to the main month.

## L-LEDGER-A — Main $185 split purchase

- Step 1. Ledger → Add entry. Choose Practice Checking, TODAY, description **Practice Market**, Entry type Expense / card purchase, total **185.00**, Status Cleared. With explicit Expense, enter positive numbers; the app sets outflow direction.
- Step 2. Split 1: Groceries 80.00. Split 2: Household 50.00. Add another split; Split 3: Automotive 55.00. Expect splits total $185.00.
- Step 3. Leave the bill link as Ordinary transaction. Leave Already included in my starting balance UNCHECKED.
- Step 4. Prepare transaction for review. Check balances have not changed yet. Review should show exactly one $185 expense with these allocations and checking $1,000 → $815.
- Step 5. Confirm once. Expect one row, checking $815, Groceries $80, Household $50, Automotive $55, cleared spending $185. Savings/card unchanged.
- Step 6. Check Dashboard, Budget and Ledger agree. Graph actual line should reflect $185, not $370 from counting splits twice. Note whether the display is readable at a glance.
- Step 7. Reload once. Expect the same single entry and $815. Do not confirm again if the screen merely takes time to refresh.

## L-LEDGER-B — Register, filters and edit cancellation

- Step 1. Inspect the transaction row: date, account, description, category amounts, total, status and running balance. Is it understandable without opening a form?
- Step 2. Select its row checkbox, click Edit selected. Expect original fields and all three splits populated.
- Step 3. Change description to **Do not save this**. Click Cancel edit. Expect original row unchanged. Navigate to Budget: no ghost unfinished-changes warning should appear from the canceled edit.
- Step 4. Return and use the row's Edit button. Change description to **Practice Market — reviewed**, prepare, inspect review and confirm. Expect same entry updated, still $185 total and checking $815.
- Step 5. Search part of the description; then a nonexistent word. Expect one result then none. Clear ledger filters restores the row.
- Step 6. Try every Filter account option, both Filter status choices, Filter month and combined filters. Reset them. Filtering must never change balances or records.
- Step 7. Select nothing and inspect Edit selected. It should be disabled or explain what is needed. Try sorting ONLY if a sort control exists; absent sorting is a suggestion, not a broken advertised button.

## L-LEDGER-C — Amount and validation checks (discard these attempts)

Do not approve anything here. Use Add entry, fill one otherwise valid expense, then change one value at a time. After each rejection, check that the rest of your form stays intact. End with Discard page changes; baseline checking remains $815.

- Step 1. Try blank account, date, description or amount one at a time. Expect specific feedback near the form.
- Step 2. Try amount 0, letters, 12.345 (three decimals), and an extremely large number. Expect rejection or clearly explained constraints; never silent rounding/overflow. Decimal 12.34 should be accepted for preparation; remove/discard it afterward.
- Step 3. Try total 185 with splits 80 + 50 + 54. Expect a split-total mismatch. Correct 54 to 55: preparation should work. Do not confirm; discard.
- Step 4. Try a chosen category with an empty split amount, a split amount without a category, and the same category twice. Record accepted/rejected behavior and clarity. Do not assume an optional uncategorized entry is invalid.
- Step 5. Try Expense with total and splits entered normally positive, then with negative signs. The reviewed direction must remain expense, never accidentally become income. Discard each attempt.
- Step 6. Try Automatic direction with -12.34; expect outflow. With +12.34 it is inflow according to the automatic rule. Read review carefully; discard.
- Step 7. Try tomorrow + Cleared. Expect rejection. Change Status to Pending / planned: it may prepare; no cleared cash changes. Discard rather than adding another main-flow record.
- Step 8. Click Prepare twice quickly on a disposable draft. Inspect staged items; report duplicate staging if it occurs. Do not confirm duplicates. Busy feedback should be visible.
- Step 9. Press Enter in ordinary fields and use Tab. Record what submits, what blocks, and whether input gets lost. No financial change may happen without the final confirmation.

## L-LEDGER-D — Refund, income and pending-to-cleared

- Step 1. Add Practice Checking, TODAY, **Practice refund**, Entry type Refund, amount 5.00, Cleared, Groceries split 5.00. Confirm. Checking becomes **$820**, total cleared spending **$180**, Groceries **$75**.
- Step 2. Add **Practice income**, Income / deposit, 200.00, Cleared, no category. Confirm. Checking becomes **$1,020**. Cleared spending stays **$180**; income must not count as negative shopping spend.
- Step 3. Add **Practice pending groceries**, Expense, 10.00, Pending / planned, Groceries 10.00. Confirm. Cleared checking stays **$1,020**, cleared spending $180. Pending $10 should appear separately in Budget/Forecast; it must not be labeled cleared.
- Step 4. Inspect dotted pending line and category remaining-after-pending. Can you distinguish it from actual spending and the plan without relying only on color?
- Step 5. Edit THAT row to Cleared and confirm. Checking becomes **$1,010**, cleared spending **$190**, Groceries **$85**. Pending $10 disappears. There must not be a second copy of the purchase.

## L-TRANSFERS-A — Card purchase, payment and savings transfer

- Step 1. Add a $20 Cleared Expense on Practice Card, TODAY, **Practice card shopping**, Groceries split 20. Confirm. Card becomes **$70 owed**. Checking stays $1,010. Spending becomes **$210**, Groceries **$105**.
- Step 2. Ledger → Transfer / card payment. From Practice Checking, To Practice Card, amount 30.00 positive, TODAY, Cleared, description **Practice card payment**. Leave historical-inclusion checkboxes unchecked. Prepare and confirm.
- Step 3. Expect checking **$980**, card **$40 owed**, spending still **$210**. Two linked ledger legs represent one transfer; this must not become another shopping expense.
- Step 4. Transfer 25.00 Checking → Savings, Cleared, description **Practice savings move**. Confirm. Checking **$955**, Savings **$25**, card **$40 owed**, spending $210.
- Step 5. Edit a transfer row. Expect paired transfer editor and original values. Enter zero; Prepare must reject and preserve the editing context. Cancel pair edit. Navigate away: no false unfinished warning. Original pair remains unchanged.
- Step 6. Try From and To both Checking in a new draft. Expect rejection. Try blank destination or negative transfer amount. Discard; no money changes.
- Step 7. Reopen the existing $25 pair, change only its description, review and confirm. Expect both legs consistent and balances unchanged. Never edit one leg as unrelated income/expense.

## L-DRAFTS-A — Page batch review and editing

Use disposable new entries; keep the main totals unchanged by discarding at the end.

- Step 1. Prepare a $1 expense and a $2 expense without confirming. Expect two staged items, no cleared change to $955.
- Step 2. Click Edit change 1. Change amount to $9, then Cancel editing this staged change. Expect the original $1 staged item restored in its original position.
- Step 3. Edit it again. Expect $1, not $9. Change it to $3 and Prepare. Expect two staged items, not three.
- Step 4. Remove change 2. Expect only the intended item removed. Review staged changes should show only the remaining $3 expense.
- Step 5. Cancel/keep the review. Nothing posts. Reopen, inspect Before/After and all available expansion/details controls.
- Step 6. Discard page changes. Expect checking $955 and no new disposable transactions.
- Step 7. Enter a new form without preparing. Click Budget. In the unfinished-changes dialog try Keep editing. Expect original inputs intact.
- Step 8. Navigate again and try Discard changes and continue. Expect destination opens and no financial save. Read prompts carefully before clicking; this discards only your practice draft.

## L-DRAFTS-B — Save for later, reload and resume

- Step 1. Start an expense description **Laptop saved draft**, amount 3.21, no splits; do not prepare. Navigate to Budget → Save changes for later review.
- Step 2. For expiration choose No — 30 days. Save for later. Expect destination opens and no money changes.
- Step 3. Reload, open Inbox → Saved for review → Resume saved review. Expect description AND amount restored. Amounts restored from this saved draft are intentional; a NEW unrelated entry should not use old money as autocomplete.
- Step 4. Add an optional split; choose + Add a new category; type **Laptop inline draft category** but do not stage the category. Save for later again, reload and resume. Expect the unfinished category name restored too.
- Step 5. Finish adding that category. Expect it selected automatically and staged for review; the expense inputs remain. Prepare expense with matching split. Both category and expense need final review. Do not approve: discard this batch to preserve main totals.
- Step 6. Prepare a separate $4 expense, Edit change 1, change amount to $99 without preparing. Save for later, reload, resume, cancel editing the staged change. Edit again: original staged amount should be $4, not $99. Discard afterward.
- Step 7. Save another disposable draft, then use Discard saved review from Inbox. Expect it leaves active saved queue; it must never post. History may remain.
- Step 8. Close/reopen an UNSAVED draft tab only if disposable. Record whether it survives. Unsent browser-close recovery is not guaranteed; use Save for later for durable work.

## L-DRAFTS-C — Expiry and reminder choices

- Step 1. On separate $1 disposable drafts, open Save for later and choose Yes. Inspect each Review timeframe: End of today, 1 week/every seven days, End of week/Saturday and 30 days. Record the displayed dates and time zone. Cancel first if only inspecting.
- Step 2. Save one of each if convenient, with distinct descriptions. Choose different evening reminder options. Inbox deadlines should match the selected calendar option, not all use the same date.
- Step 3. No should use 30 days. One week and Saturday end-of-week should differ when today is not Saturday. Do not change the computer clock to force a result.
- Step 4. At an actual reminder time, if you are awake and available, inspect badges, reminders and Inbox. Record actual local time. You need not stay up or wait 30 days to finish the guide.
- Step 5. End-of-day/week review deadline is midnight; actual expiry is 1 a.m. next morning. During that hour it may still resume. After expiry it should leave the active queue, remain history and never post. Mark time-dependent tests NOT TRIED until observed.
- Step 6. Settings → Show in-app review reminders off, reload, then on. The preference should persist. Email/text are NOT configured; no outbound message is expected.
- Step 7. Discard these disposable saved drafts once their tests are complete, unless keeping one for an actual deadline observation.

## L-BUDGET-B — Frequencies and naming (separate sandbox user)

Create a second local user, `testerlaptop-sandbox@example.test`, so these targets and experiments do not pollute the main totals. No real email needed locally. Return to the main user afterward.

- Step 1. Create a small sandbox account. Budget: create Weekly Test with $10 Weekly, selected month, anchor first of month. Count allocation dates at 7-day intervals through that month. Target should be count × $10, not always $40.
- Step 2. Create Two Week Test, $10 Biweekly. Count dates every 14 days from anchor, not twice monthly. Compare target.
- Step 3. Create Monthly Test, $10 Monthly. Expect $10 for its applicable monthly plan.
- Step 4. Create Quarter Test, $30 Quarterly with an anchor in the selected month. Inspect that month and one without an allocation date; do not expect automatic plans for future months. Record whether this is understandable.
- Step 5. Try target zero, negative, blank, too many decimals, invalid date and wrong month. Check useful feedback and no silent change to cash. Discard invalid experiments.
- Step 6. Try category Groceries versus Grocery. If a similarity suggestion appears, try Use existing, then test keeping an intentionally different new label. Suggestions should not silently merge categories. Suggestions are deterministic local hints, not live OpenAI advice.
- Step 7. Try a previously used description and inspect reuse suggestions. New amounts should remain your responsibility. Try long names, punctuation and apostrophes; display should stay readable. Browser password managers are separate from app autocomplete.
- Step 8. Test inline + Add category cancellation and Escape. Expect original selection and transaction amount retained. Try an exact existing name; it should reuse rather than create a duplicate. Record any unclear case.

## L-BILLS-A — A recurring bill and exact recorded payment

Return to the MAIN laptop user. Check baseline: Checking $955, Savings $25, card $40 owed, spending $210.

- Step 1. Settings → expand Manage forecast bills and income plans. Add account Checking, Schedule name **Practice utility**, Signed recurring amount **-40.00**, First due date TODAY, cadence Monthly, clearing delay 0. Prepare, review and confirm.
- Step 2. Dashboard should show upcoming/expected occurrence. Checking remains $955: a schedule must not create a cleared expense. Projected values may be marked estimates; recorded payment must be exact.
- Step 3. Ledger → expense **Practice utility payment**, Checking, TODAY, 40.00, Cleared, Utilities split 40.00. Choose Practice utility in optional bill link, occurrence TODAY, settles in full checked. Prepare and confirm.
- Step 4. Checking **$915**, Utilities actual **$40**, cleared spending **$250**. The current occurrence must not be projected again as another unpaid $40. Later monthly occurrences remain possible.
- Step 5. Dashboard → Bill payments in last 7 days should include this payment. Practice Market and ordinary grocery purchases must not appear there as bills.
- Step 6. Reopen bill-link dropdown on a disposable entry; select a bill then Ordinary transaction. Extra bill-only controls should hide appropriately and should not accidentally retain a live link. Discard.

## L-BILLS-B — Schedule lifecycle and partial payment (sandbox user)

- Step 1. In the sandbox user, create a -$20 monthly bill and a +$100 weekly income schedule. Neither changes cleared balances by itself. Inspect dates and signed amounts.
- Step 2. Try all schedule frequencies, clearing delays 0 and 30, then invalid -1 and 31 in disposable edits. Errors should preserve the form. Record any reset/input loss.
- Step 3. Edit schedule name/amount/date; cancel once, then prepare a valid edit, review and confirm. Expect future projections updated; actual history stays intact.
- Step 4. Try Review pause → cancel review, then confirm pause. New automatic future estimates should stop; explicitly tracked unpaid occurrences and recorded transactions stay until deliberately handled. Review resume and confirm; future estimates return.
- Step 5. Try Archive on a disposable schedule. Inspect review before confirming. Archived history must remain intelligible. Record which controls remain available afterward; do not assume an unarchive feature exists.
- Step 6. On the $20 bill enter a $5 linked Cleared expense, uncheck settles in full. Expect $5 actual, an outstanding/partial state, not a fully paid $20. Enter the remaining $15 linked to the SAME occurrence and settle; total actual must be $20 once, not $40.
- Step 7. Inspect available occurrence controls (expected amount/date, status, skip, cancel, reopen or unlink if shown). Exercise each on a separate disposable occurrence through review; record actual labels and results. None should create a second cash transaction merely by changing its planning status.
- Step 8. Try assigning the wrong account or a nonexistent cadence date through the visible controls. Expect rejection or a clear review, not a silent false bill match. Amount/name similarity alone must not auto-link bills.

## L-FORECAST-A — Automatic overview and cross-check

Return to MAIN user. Expected checkpoint below assumes all main records remain in the same selected month.

| Item                     | Expected                        |
| ------------------------ | ------------------------------- |
| Checking cleared         | $915.00                         |
| Savings cleared          | $25.00                          |
| Card owed                | $40.00                          |
| Groceries actual         | $105.00                         |
| Household actual         | $50.00                          |
| Automotive actual        | $55.00                          |
| Utilities actual         | $40.00                          |
| Overall cleared spending | $250.00                         |
| Monthly targets          | $400.00 combined                |
| Income                   | $200.00, excluded from spending |

- Step 1. Compare Accounts, Ledger, Budget and Forecast against the checkpoint. A category can be over its $100 target even while overall spending is below $400. Card payments/savings transfers must not inflate spending.
- Step 2. Inspect top risk summary, account details, monthly/weekly graphs and expected expenses/bills table. Record whether you can answer “what do I have, what is paid, what is next?” without excessive scrolling.
- Step 3. Click graph and View/filter budget link. Expect Budget for the intended month. Filter Groceries: $105; Household: $50; Automotive: $55; Utilities: $40. Clear filters: $250.
- Step 4. Review graph legends: actual, pending, planned/projected must be distinguishable. Hover the laptop chart and read any labels. Try keyboard focus too. Note missing axis units, dates or confusing overlapping lines.
- Step 5. Check this week's graph and end-of-week values. Weekly totals depend on real transaction dates and week boundaries; do not expect full-month $250 if some entries are outside that week.
- Step 6. Check all forecast details toggles/expanders that appear. Known values should be exact; uncertain future projections should be labeled. Unknown balances must not be quietly shown as confirmed zero.

## L-SETTINGS-A — Forecast preferences and warnings

- Step 1. Settings → Forecast settings. Try horizon 7, 30, 60 and 90, saving and visiting Dashboard each time. Dates and detail range should change appropriately. Return to 30.
- Step 2. Toggle chart, recent paid bills and daily details individually; save, inspect Dashboard, reload. Hidden data must not be deleted. Restore preferred defaults.
- Step 3. Select one account, then none/all. The filter changes displayed forecast, not ledger balances. A hidden troubled account must not disappear from overall risk assessment.
- Step 4. Set low-balance warning to 1000.00, save and inspect the $915 checking warning. Set back to 0.00. This preference must not change cash.
- Step 5. Try category warning threshold 85, then 90. Try invalid 0, 101 and letters. Expect clear rejection. Restore 85.
- Step 6. In sandbox, create an account with $10 and a Cleared $15 expense. Confirm an obvious overdraft warning and affected account indication. Add a future Pending expense and compare projected warning versus actual overdraft.
- Step 7. In sandbox compare nearing an ordinary expense category target against an equivalent bill category. Yellow discretionary warning should not be generated solely by a bill approaching its expected amount. Record explanation and observed colors/text, not just “looks wrong.”

## L-SETTINGS-B — Quick actions, time zone and setup

- Step 1. Toggle each quick action in Forecast settings; save and inspect Dashboard. Test Ledger/Add Transaction, Budget, Accounts, Inbox and Settings. Debt Tools/Savings Plan remain unavailable.
- Step 2. Enable all seven quick actions. Narrow the window. Try More and Back buttons, then hold and swipe/drag the strip. Only the tabs should move; the entire page must not slide sideways. A swipe must not accidentally activate a tab.
- Step 3. Reduce to your preferred actions; expect ordinary wrapping without compulsory sideways page scrolling.
- Step 4. Your time zone → Use this device's time zone, then Save preferences. Reload and compare the selected city/region to your device. This is explicit saving, not a background financial change.
- Step 5. Enter an invalid time-zone name in a disposable settings attempt. Expect rejection. Choose a valid zone and restore your local one. Existing saved-review deadlines keep the zone they were created with.
- Step 6. Change Setup status through Needs review, Skipped, Complete, Not applicable, saving each. These are preferences, not proof all records exist. Visit each Resume setup button and return.
- Step 7. On an incomplete sandbox user test checklist Open, Snooze seven days, Dismiss, Not applicable and Restore reminder. Reload after each. Restoring a suggestion must not create accounts or bills.
- Step 8. Toggle promotional preference, save and reload. No marketing delivery is configured. This must not disable security/setup reminders.

## L-DELETE-A — Delete and restore a bill payment

MAIN user, before reconciliation only.

- Step 1. Find Practice utility payment. Choose Delete; inspect review and cancel once. Nothing should change.
- Step 2. Prepare deletion again and confirm. Checking returns **$955**, cleared spending **$210**, Utilities actual $0. Paid-bill list loses the payment; the bill obligation should reopen.
- Step 3. Inbox → Review history. Find the deletion receipt. Use Review undo deletion OR Review restore deleted batch item, whichever is shown for this deletion. Inspect exact original record and confirm.
- Step 4. Expect payment restored ONCE, Checking **$915**, spending **$250**, Utilities $40. Repeat clicking must not restore duplicates. If restore is blocked, record the message instead of recreating a different payment.
- Step 5. Inspect other history receipts and links. IDs are technical receipts; note where simpler wording would help. Do not confuse canceled, saved, expired and approved states.

## L-EXPORT-A — Files and privacy

- Step 1. Sign out and back in shortly before exporting; export requires a recent sign-in (five minutes). Settings → Export your financial records.
- Step 2. JSON format → Review export → Cancel export. Expect no download and no record change.
- Step 3. Review again → Confirm private download. Browser Downloads should contain JSON. Open in VS Code; expect your synthetic financial records/preferences, not passwords or login tokens. Do not upload it publicly.
- Step 4. Repeat JSON with Include saved reviews checked. Compare whether saved-review details are included; cleared finances must not change. It is okay if discarded history is retained according to current export policy; report what is present.
- Step 5. Choose CSV, review and download. Open with Notepad first; then Excel if desired. Confirm dates, descriptions, amounts, splits/treatment fields are understandable. Spreadsheet formatting may display dates differently from file text.
- Step 6. In sandbox, use a description starting with = such as `=TEST ONLY`, export CSV and inspect as text. It should be protected as text, not treated as a spreadsheet formula. Do not enter real formulas or enable macros.
- Step 7. After more than five minutes signed in, try another export. If recent sign-in is requested, sign out/back in and retry. Do not weaken the restriction.
- Step 8. Confirm exports did not delete/change data. JSON import, automatic account erasure and an automatic backup-restore button are not available user features.

## L-SESSIONS-A — Same user, two browser sessions

Use the SAME local app address everywhere. Two ordinary tabs share one login; a private window or a different browser creates another login session. Passwords stay private.

- Step 1. Open two normal tabs as MAIN user. Prepare an unsaved/disposable change in one. In the other confirm a harmless description-only edit. Return to first; changed data should refresh or require a fresh review, never silently approve stale data.
- Step 2. Refresh both and compare confirmed records. An unsent form is not guaranteed to survive a reload; Save for later is the durable path.
- Step 3. In a Firefox private window or Edge, sign into the same MAIN user. Settings in the first window → Your active logins → Refresh login list. Expect current and other sign-ins; ordinary tabs should not be represented as separate logins.
- Step 4. Review signing out this login → Keep logins signed in. Other window should still work.
- Step 5. Prepare but do not approve a disposable proposal in the other window. In the first, review and confirm signing out that OTHER login. Other window must lose access and must not be able to approve its old proposal. First window stays signed in.
- Step 6. Sign into a fresh other window again. Test Review signing out all other logins, cancel once, then confirm. All other app logins should lose access. Do not expect this to change your password.
- Step 7. Sign out your current login. Back button and reload must not restore usable private records without authentication. Brief stale pixels during navigation should be reported, but never try to access another person's information.

## L-LOGIN-B — Wrong credentials and separate-user isolation

- Step 1. On sign-in, try a wrong test password once. Expect a safe error, no access. Avoid repeated guessing/rate-limit testing.
- Step 2. Try an unknown fictional address. Error should not expose private data. Sign in correctly.
- Step 3. In a separate private window create a DIFFERENT synthetic user. Expect empty accounts, Ledger, targets and schedules. It must never inherit the main user's money, drafts or exports.
- Step 4. Add a disposable account under that user. Return to MAIN; it must not appear. Do not share user passwords or reuse a household account as a substitute for unfinished couples permissions.

## L-EMAIL-A — Real email verification and password recovery (CONDITIONAL)

**Local development mode does not send mail and does not show provider password recovery/change-password controls. A real email alone does not enable them.** If these controls are absent, mark BLOCKED — configured provider/email environment needed. Do not install Supabase packages, change secrets or paste keys to get past this step. The automated local identity tests are separate from your actual inbox/provider test.

Only continue when an explicitly supplied, configured private HTTPS candidate supports verified email, or an engineer has provided a configured local identity test environment and explained its mailbox. Do not guess a hosting address.

- Step 1. Use a dedicated real inbox you control and a unique password; no financial data required. Do not use testerip@example.test or a fake address for mail tests.
- Step 2. If registration is allowed, create user. Check pending-verification message. Before verification, sign-in should not grant financial access. Check Inbox and Spam; note delay without posting the verification link.
- Step 3. Open the newest verification email only. It must lead back to the intended candidate, not an unrelated site. Never forward the link. Verify then sign in; expect empty records.
- Step 4. Sign out → Forgot your password? → enter that email → Send recovery email. Expect a neutral acknowledgment; record whether mail arrives and its delay.
- Step 5. Open newest reset link in the intended browser/device. Set a new unique password at least 12 characters. A bad/expired/used link should fail safely with a way to request a fresh one. Do not intentionally expose the URL in screenshots.
- Step 6. Sign out; old password should fail, new one should work. Your synthetic records must remain unchanged.
- Step 7. With another session open, test Settings → Account security → change password. Review the explanation that other logins are signed out. Expect old sessions revoked, no financial changes. Store new password privately.
- Step 8. Try requesting recovery for a nonexistent address once. A neutral response should not reveal who has an account. Real provider throttling/mail quotas may block repeated testing: record it and stop.
- Step 9. Record link/device problems, redirects, accidental duplicate accounts and confusing messages. Account deletion is not implemented; keep this a test identity until a safe erasure process is ready.

## L-RECONCILE-A — Investigate and reconcile LAST

Do only after main editing/deletion tests. Reconciliation locks covered records; it is deliberately not a casual undo button. Main checkpoint: Checking $915. If your main records differ, report/reconcile your actual explained total rather than forcing $915.

- Step 1. Accounts → reconciliation investigator, choose Checking, through TODAY, balance to investigate 916.00. Expect calculated $915, $1 difference and no automatic adjustment. Open available breakdown/explanations and inspect pending versus cleared.
- Step 2. Try invalid/missing date, no account and invalid amount on disposable investigations. Expect clear feedback; no records changed.
- Step 3. Compare and prepare reconciliation with statement ending balance 916.00. It should not falsely mark the account balanced. Record exact message.
- Step 4. Use 915.00 and correct through date. Inspect reconciliation review; cancel once. No lock should be applied yet.
- Step 5. Review again and confirm only when done editing the main account's covered period. Expect a reconciliation receipt/lock.
- Step 6. Try editing/deleting a covered entry, adding an entry inside the locked period or changing its opening balance to bypass the lock. Expect rejection, no silent historical changes. Use sandbox accounts for additional editing tests.

## L-BALANCE-A — Opening balance and history choices (sandbox only)

- Step 1. Create $100 checking with opening dated TODAY, start of day. Add $10 Cleared Expense TODAY, inclusion unchecked. Expect $90 immediately, no waiting until tomorrow.
- Step 2. Add $5 historical expense dated yesterday, inclusion unchecked. Review should explicitly show additional impact, producing $85 after approval. Backdated manual additions are allowed unless statement locks apply.
- Step 3. Add $7 historical expense with Already included in my starting balance checked. Cash stays $85, but spending history includes the expense in its transaction month. Review must explain why it does not subtract again.
- Step 4. Accounts → expand Edit starting balance, date, account or category name → Review opening correction (requires a sign-in within the last five minutes). Inspect before/after, timing/date and impact on existing entries. Cancel once, then approve an understood correction. Record exact numbers before/after instead of assuming old additional overrides survive a new opening checkpoint.
- Step 5. Create Unknown Balance account with opening blank. Expect unknown, not confirmed $0; projections should identify incomplete information. Create Zero Balance with explicit 0; it must be distinguishable from unknown.
- Step 6. Inspect all account-type choices (checking, savings, cash, credit, loan, asset, liability). Try a disposable valid example of each. Positive opening on a liability means amount owed. No bank credentials should be requested for manual accounts.

## L-ACCESS-A — Comfort, keyboard and layout

- Step 1. Repeat navigation in Firefox and Edge using the SAME address. Record browser-specific differences; each browser may need its own sign-in.
- Step 2. Press Tab/Shift+Tab through each page. Focus should be visible and in a sensible order. Try Enter/Space on buttons and checkboxes. Skip to content should work.
- Step 3. Open a review, move focus through it, cancel, reopen. Focus should stay sensible; background clicks must not approve. Complete the non-drag confirmation entirely with keyboard.
- Step 4. Use 125%, 150% and 200% browser zoom, then Ctrl+0 to reset. Shrink window. No full-page horizontal scrolling, inaccessible buttons, cut-off cents or overlapping dialogs should be needed for ordinary use.
- Step 5. Try Windows text/display scaling you normally use. Record your setting. Try chart hover tips, category hints and page tips. Rotating page tips are not complete; note missing opportunities as suggestions, not proven completed behavior.
- Step 6. Optional Narrator: Windows+Ctrl+Enter toggles it on many Windows installations. If comfortable, read fields and dialogs; turn it off afterward. Do not treat unfamiliar screen-reader gestures as a confirmed app defect without noting context.
- Step 7. Write what feels too technical, too large, too small, too many clicks, hard to find or unpleasant. Include the exact screen/label and your preferred wording/order.

## L-FAILURE-A — Interruptions and your own habits (sandbox only)

- Step 1. Save a draft, close browser, reopen app and resume. Approved records and saved draft should persist separately. Unsent forms may not.
- Step 2. Temporarily disconnect Wi-Fi with a disposable form, try Prepare once. Record feedback. Reconnect; inspect Ledger/receipt before any retry. Localhost can remain available while Wi-Fi is off: record that rather than claiming an offline web-service pass.
- Step 3. Navigate during a slow operation. Look for a clear busy state and retained input. Never assume a display error means the save failed; check records once.
- Step 4. Try selecting text, copying descriptions, paste with surrounding spaces, mouse wheel over number fields and browser autofill. Unexpected amount changes are important findings.
- Step 5. Take your normal path: budget first, account first, interruptions, several splits, changing your mind. Keep each experiment isolated and record click order. Do not test hostile scripts, actual bank access, load attacks or real customer accounts.
- Step 6. Finish with your top five usability improvements and any ambiguous money rules. Mark calendar, couples approvals, banks, OCR, live AI, debt/savings tools, subscription cancellation, paid billing, offline/PWA and customer erasure as NOT AVAILABLE unless a later candidate explicitly enables them.

## L-ACCOUNTS-B — Renaming without changing money (sandbox)

- Step 1. Accounts → Edit starting balance, date, account or category name. Account to rename → select sandbox account. Enter New account name; Review account rename; cancel once, then review/confirm. Check selectors, Ledger and Forecast use the new name; balance and transaction count stay unchanged.
- Step 2. Category to rename → select sandbox category. Enter New category name; Review category rename, inspect and confirm. Existing splits and targets should retain their association and exact amounts; this must not create another expense.
- Step 3. Try empty names and an exact duplicate name on disposable renames. Expect safe handling/clear errors, not silent reassignment to another account/category. Discard experiments.
- Step 4. Budget → Your categories → New category name → Prepare category. This standalone path should create a label without a target, only after review. Try it as well as the inline category paths.

## L-BILLS-C — Match an existing payment and explicitly track unpaid dates (sandbox)

- Step 1. Create a sandbox $100 checking account and a -$20 monthly bill due today. Add an ordinary Cleared $20 expense WITHOUT a bill link. Cash is $80. Bill should not be automatically marked paid from matching amount alone.
- Step 2. Settings → Manage forecast bills and income plans → Match an existing payment. Choose that Existing payment, the correct Recurring bill, due date and settles in full. Prepare payment match; inspect and confirm. Cash stays $80, transaction count stays one; bill coverage changes.
- Step 3. Edit that ledger transaction, change the optional bill link to Ordinary transaction, prepare/review/confirm. Cash stays $80 and obligation reopens. Do not create another expense just to unlink it.
- Step 4. In Review an unpaid or skipped occurrence choose Occurrence schedule, Scheduled occurrence date TODAY, Estimated clearance date tomorrow, status Known unpaid / expected. Prepare occurrence review; inspect and confirm. Expect tracked expected bill, no cleared cash withdrawal.
- Step 5. Submit the SAME occurrence as Deliberately skipped. Review/confirm. Cash stays $80 and projected treatment changes. Then submit it Known unpaid / expected again to reopen the planning state. Nothing here marks money cleared.
- Step 6. Try blank schedule, a non-cadence due date and an invalid clearance date in disposable attempts. Expect clear feedback. Scheduling dates are estimates; recorded payment amount remains exact.
- Step 7. Try partial, pending and income links on appropriate sandbox records. Review direction/account/date carefully; invalid matches must not change cash or duplicate records. A pending linked payment must not appear in last-seven-days CLEARED bills.

## L-INBOX-A — Receipts, links and stale proposals (sandbox)

- Step 1. Inbox → Pending reviews. On an available proposal use Link to this draft. Copy/open that app link in another signed-in tab. It should identify that proposal, not a different user's records. If no pending proposal exists after page staging, record NOT TRIED rather than guessing a technical API.
- Step 2. Use Review exact changes, cancel, then inspect Discard on a disposable pending proposal. Discard must not apply financial records. Distinguish this from discarding a saved-for-later review.
- Step 3. Review history → Check saved receipt on an approved record. Expect matching saved receipt, not another financial save. Try more than one history entry.
- Step 4. Save a disposable financial draft for later. In another tab confirm a different harmless change, then resume the saved draft. Expect current-data comparison/fresh review, not automatic application of outdated balances. If stale review is rejected, message must explain how to continue.
- Step 5. Reopen an already approved review link. It must not commit the same operation again. Do not repeatedly click confirmation to test attacks; one safe retry is enough.

## L-BUDGET-C — Change plan, not reality (sandbox)

- Step 1. Create a $100 target and a $20 Cleared expense in its category. Confirm. Change the target to $10 for the SAME month/category, prepare/review/confirm. Expect an updated target, $20 actual, over-budget status and unchanged account cash; no duplicate target should inflate the total.
- Step 2. Change target back to $100. Only plan/status changes. Try a $5 Uncategorized expense: overall spending must include it even with no category target.
- Step 3. Try category-only and account-only filters, then both together. Inspect Matching entries and any account-scope explanation below the charts. Clear filters restores full view. Filters never rewrite targets or transactions.
- Step 4. Create categories Grocery Food, Grocery House and Grocery Clothes. If a shared-prefix suggestion appears, inspect it. It is a suggestion only; no automatic category restructuring or financial change.

## Finish a section, not a marathon

After every section, fill its private findings entry and download a fresh troubleshooting report if needed. Stop freely when on-call work interrupts. Save for later before leaving financial forms. There is no deadline to finish every section in one sitting.
