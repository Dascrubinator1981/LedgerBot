# LedgerBot iPhone test book — start here, even if never opened before

Use this with OWNER_FINDINGS_TEMPLATE.md. IDs start `P-` so phone results cannot be confused with laptop results. Record the app commit supplied with the candidate, iPhone model, iOS version (Settings → General → About), Safari, text size and portrait/landscape. Do not record passwords.

Device label: **iPhone tester**. Your requested username `testerip@example.test` works only where fictional local signup is allowed. It cannot receive verification or recovery emails. For a hosted verified-email candidate, use a real inbox you control; an email alias is optional only if your email provider supports it. You can still label reports iPhone tester. The safe logger does not record login email.

## P-ACCESS-A — Understand which app you are opening (current prerequisite)

- Step 1. Your laptop address `http://127.0.0.1:3000` means “this device.” Typing it on the iPhone tries to reach the iPhone, not your laptop. It will not work.
- Step 2. At the time of this guide, no private HTTPS beta address has been supplied or deployed. Mark phone app access **BLOCKED — private HTTPS candidate needed**. This is a setup prerequisite, not a failed Safari button. You can do the laptop book now.
- Step 3. Once we have an approved private HTTPS candidate, use its EXACT supplied address and candidate version. This guide calls it YOUR BETA ADDRESS; those words are a placeholder, not something to type. Do not guess a Vercel/Supabase address. The Supabase dashboard is not LedgerBot.
- Step 4. We must confirm whether that candidate uses the same database as the laptop environment. Usually local laptop SQLite and hosted PostgreSQL are SEPARATE: matching emails do not make them share money. Record which environment you test.
- Step 5. Do not open router ports, use public tunnels, disable firewalls, accept certificate warnings or enter credentials over a guessed HTTP Wi-Fi address. No Node.js, VS Code, GitHub app or native LedgerBot installation is needed on the phone.
- Step 6. A local Wi-Fi development setup is a separate possible engineering task, not configured by this guide. It is not a substitute for testing HTTPS cookies or real hosted email. Wait for an explicit tested access route rather than changing security settings yourself.

Continue below only after P-ACCESS-A is unblocked. All financial information remains invented, even if the login email is real.

## P-START-A — First Safari visit

- Step 1. Connect to your normal trusted network. Open Safari, tap the address bar, type the supplied HTTPS candidate address and tap Go.
- Step 2. Expect LedgerBot, no certificate warning, no Supabase admin page. If access is protected, use the instructions supplied with that candidate; never share access codes in the findings file.
- Step 3. In Safari, bookmark the correct address if desired. Do not assume Add to Home Screen/offline mode is supported; initially test Safari normally.
- Step 4. Record the visible page, candidate version and whether registration is open or invite-only. If invite-only, stop signup until a test account is provided; do not bypass it.
- Step 5. Tap each visible startup link/button once. Use Safari Back/Forward. Note clipped text, zooming when fields focus, controls hidden by the keyboard or a page that moves sideways.

## P-LOGIN-A — New iPhone user and verified email

- Step 1. Choose a fresh PHONE test identity. If local fictional signup is explicitly enabled, use `testerip@example.test`. If email verification is required, use a real inbox you control instead; fake .test mail will never arrive.
- Step 2. Try an empty form and an invalid email once. Expect useful feedback. Try a password shorter than 12 characters; expect rejection. Then enter a unique test-only password at least 12 characters long.
- Step 3. Create account if allowed. If verification is required, expect a pending message. Open Mail/Gmail privately, check Inbox/Spam and use newest verification link. Do not include the email/link in screenshots or a report.
- Step 4. Observe where the email link opens: Safari, an in-app browser or another browser. Record unexpected browser changes/redirect loops. It must return to the intended app, not a random page. Finish sign-in in Safari using the same app address.
- Step 5. Expect a fresh empty Forecast. No demo accounts, transactions or targets should appear.
- Step 6. Sign out, sign in again. Wrong password once must fail safely; correct password works. Your new workspace stays empty.
- Step 7. If the provider says registration is closed or recovery/email unconfigured, record BLOCKED and exact harmless message; do not repeatedly retry or create more accounts.

## P-NAV-A — Empty tour, menu and thumb reach

- Step 1. Find Dashboard, Accounts, Ledger, Budget, Inbox and Settings. Use the visible phone navigation, scrolling vertically if needed. Record any destination you cannot find.
- Step 2. Dashboard's Add Transaction should open the entry form. Normal Ledger navigation should start at the transaction register.
- Step 3. Debt Tools and Savings Plan should be clearly unavailable. No charge, bank connection or fabricated AI response should be offered as live.
- Step 4. Rotate portrait → landscape → portrait on each page. Content, cents and buttons should fit. No full-page horizontal scrolling should be needed.
- Step 5. Try browser Back, Forward and refresh on empty pages. The app should not unexpectedly sign you into someone else or insert records.
- Step 6. Note controls hard to reach one-handed, tiny tap targets, too much blank space and excessive scrolling. These are useful findings even when no crash occurs.

## P-LOG-A — Phone troubleshooting recording

- Step 1. Help troubleshoot → Start fresh recording → Close troubleshooting.
- Step 2. Switch pages and edit a disposable description, then tap outside the field. Reopen troubleshooting. Expect safe action events, not financial field values or email.
- Step 3. Download safe report. Safari may show a download prompt or Downloads button. Confirm the download; use Safari Downloads → magnifying glass/Files if available.
- Step 4. In Files, check iCloud Drive → Downloads or On My iPhone → Downloads; Safari download location depends on your settings. If unsure, use Files search for LedgerBot-troubleshooting. Do not assume no download merely because no desktop-style window appeared.
- Step 5. Transfer the JSON privately to your laptop using an account/service you control or a cable. Do not upload it to a public GitHub issue. Give your private report the label iPhone tester and section ID; logger does not embed the email address.
- Step 6. Test Stop recording, Clear report and Close. Recording is in-memory, last 200 steps; refresh/sign-out clears it. Download before those actions. Nothing automatically reaches me or support.

## P-ACCOUNTS-A — Phone's independent practice accounts

Use TODAY shown in this app/time zone. Keep the main-flow entries within the same calendar month. This user's records are independent of the laptop tester.

- Step 1. Accounts → add **Phone Checking**, checking, opening **1000.00**, TODAY, start of day/before today's entries.
- Step 2. Try the date picker. Select today and dismiss the picker. Check the date did not unexpectedly change because of regional format. Tap amount and enter decimals using the iPhone keyboard.
- Step 3. Prepare, inspect review. Tap Cancel/keep draft once: no confirmed account yet. Reopen.
- Step 4. Test partial slide/release, then drag outside track. Neither should save. Deliberately slide fully and release. Expect exactly one $1,000 account and saved receipt.
- Step 5. Create **Phone Savings**, savings, 0.00, same date/timing, using Use accessible confirmation then Confirm these exact changes. Expect confirmed zero.
- Step 6. Create **Phone Card**, credit, opening **50.00 owed**, same timing. Expect debt $50, not available cash.
- Step 7. Compare Dashboard/Accounts/Ledger, reload once. All three must persist once. Check keyboard never hides a required confirmation or amount.

## P-BUDGET-A — Category and amount together

- Step 1. Budget → Monthly PLAN → Budget category → + Add a new category. Name **Groceries**, current month, target **100.00**, Monthly, anchor first of current month.
- Step 2. Try scrolling while keyboard is open, then dismiss it using Done or tapping outside. Your text/amount must remain. Prepare, review, cancel once, reopen and confirm.
- Step 3. Repeat **Household**, **Automotive**, **Utilities**, each $100 monthly. Expect $400 plan and no actual spending; Checking remains $1,000.
- Step 4. Try each category checkbox, Select no categories, Clear filters, each account filter and All accounts. Controls must be tappable and not delete data.
- Step 5. Switch chart month away/back. Target belongs to selected month; future monthly plans are not automatically generated.
- Step 6. On a disposable separate category, inspect Weekly, Biweekly and Quarterly. Weekly counts actual 7-day allocation dates, biweekly actual 14-day dates. Discard the experiment instead of adding to the $400 main plan. For full period-count examples follow laptop L-BUDGET-B using a phone sandbox identity.

## P-LEDGER-A — The $185 split on a touch keyboard

- Step 1. Ledger → Add entry. Phone Checking, TODAY, **Phone Practice Market**, Expense / card purchase, **185.00**, Cleared, inclusion checkbox UNCHECKED. Explicit Expense accepts positive amounts and handles direction.
- Step 2. Split 1 Groceries **80.00**, split 2 Household **50.00**, Add another split, split 3 Automotive **55.00**. Leave bill link Ordinary transaction.
- Step 3. Check dropdowns do not cover the wrong field; try the iPhone Next/Done controls. Scroll to Prepare. Input must not vanish when the keyboard closes.
- Step 4. Prepare and review. Before confirming, expect no money change. Review must explain checking $1,000 → $815 and all three category splits.
- Step 5. Confirm once. Expect exactly one $185 entry, Checking **$815**, spending **$185**, Groceries $80, Household $50, Automotive $55. Graphs/Budget/Accounts must agree.
- Step 6. Refresh once. Expect same row and balances, not duplicate save. If response stalls, check receipt/records before retrying.

## P-LEDGER-B — Touch editing and bad inputs (discard experiments)

- Step 1. Select the practice row then Edit selected; try the row Edit button too. Original fields and three splits should restore. Change description then Cancel edit. Navigate away: no false unfinished warning; original data unchanged.
- Step 2. Edit description to **Phone Practice Market — reviewed**, prepare/confirm. Amount remains $185 and Checking $815.
- Step 3. On a disposable new form try blank fields, amount 0, 12.345 and letters/pasted text. Expect clear feedback without losing other fields. Discard.
- Step 4. Try 185 total with 80 + 50 + 54. Prepare must reject mismatch. Correct 54 → 55; preparation can succeed. Do not approve a second copy; discard.
- Step 5. Try tomorrow Cleared: rejected. Tomorrow Pending / planned may prepare. Discard so main totals stay fixed.
- Step 6. Try entering a minus sign under Automatic direction. If keyboard makes this impossible, paste synthetic -12.34 to compare; report keyboard friction. With explicit Expense, ordinary positive entry should avoid needing a minus sign.
- Step 7. Search description, nonexistent word, account/status/month filters; clear all. Money stays unchanged. Check stacked mobile rows retain date, account, splits, amount, status and running balance.

## P-LEDGER-C — Refund, deposit and pending

- Step 1. Phone Checking, TODAY, Refund **5.00** to Groceries, description Phone refund, Cleared. Confirm. Checking **$820**, spending **$180**, Groceries **$75**.
- Step 2. Income **200.00**, Cleared, no category. Confirm. Checking **$1,020**, spending still $180.
- Step 3. Expense **10.00**, Groceries, Pending / planned, TODAY. Confirm. Checking cleared stays **$1,020**, cleared spending $180; pending $10 displayed separately with dotted/clearly labeled treatment.
- Step 4. Edit THAT row to Cleared, confirm. Checking **$1,010**, spending **$190**, Groceries **$85**. Same entry, no duplicate.

## P-TRANSFER-A — Card and savings

- Step 1. Phone Card, Cleared Expense **20.00**, Groceries, TODAY. Confirm. Card **$70 owed**, checking $1,010, spending **$210**, Groceries **$105**.
- Step 2. Transfer / card payment: Checking → Card **30.00**, Cleared, TODAY, inclusion options unchecked. Confirm. Checking **$980**, card **$40 owed**, spending stays $210.
- Step 3. Checking → Savings **25.00**, Cleared. Confirm. Checking **$955**, Savings **$25**, card $40 owed.
- Step 4. Edit pair, try zero and Prepare. Expect rejection with editor/input retained. Cancel pair edit; original values unchanged and no ghost navigation warning.
- Step 5. In a disposable new transfer try same source/destination, blank destination and negative amount. Expect understandable rejection. Discard attempts.

## P-DRAFTS-A — Save, app switching, resume and inline category

- Step 1. Enter disposable expense **Phone interrupted**, amount **3.21**, but do not prepare. Navigate Budget → Keep editing. Expect typed fields preserved.
- Step 2. Navigate again → Save changes for later review → No/30 days → Save for later. Expect no financial change to $955.
- Step 3. Lock phone, unlock, switch to Mail or another app, return to Safari. Open Inbox and resume. Expect correct description and $3.21, not another user's draft.
- Step 4. Choose + Add category on a split, type **Phone inline practice**, leave it unfinished. Save for later, refresh, resume. Expect unfinished name restored.
- Step 5. Complete category addition: new category should be selected automatically; original amount retained. Add matching split and Prepare transaction. Both changes need review. Cancel review once; then discard this batch to preserve main totals.
- Step 6. Prepare disposable $4 expense; Edit staged item, type $99 without preparing. Save, refresh, resume and Cancel editing this staged change. Re-edit: original amount must be $4. Discard afterward.
- Step 7. Save an incomplete draft and close Safari tab. Reopen app and resume from Inbox. Saved draft should persist; unsent form recovery is not guaranteed.
- Step 8. Try unfinished-change dialog Keep editing, Save for later and Discard and continue on separate disposable forms. Make sure no accidental touch approves money.

## P-DRAFTS-B — Inbox, expiry and reminders

- Step 1. Save distinct disposable drafts with Yes → Today, 1 week, Saturday/end of week and 30 days. Inspect displayed dates/time zone. No → default 30 days.
- Step 2. Inspect reminder time choices 8, 8:30 and 9 p.m. Save one if you want to observe an actual reminder later. Do not change phone clock to force expiry.
- Step 3. Review deadline is midnight; actual end-of-day/week expiry is 1 a.m. next morning. Record time-dependent behavior only if naturally observed; mark otherwise NOT TRIED.
- Step 4. Toggle Settings in-app reminders, refresh and inspect persistence. Email/text reminders are not configured; no message expected.
- Step 5. Discard a saved draft from Inbox. Check history and receipt buttons for confirmed records. Nothing in saved/pending queues may post automatically.

## P-BILLS-A — Recurring utility and paid-bill list

- Step 1. Settings → Manage forecast bills and income plans. Add Phone Checking, **Phone utility**, signed amount **-40.00**, TODAY, Monthly, clearing delay 0. Prepare/review/confirm.
- Step 2. Dashboard should show expected bill; current checking stays $955. Planned bills do not create cleared payments.
- Step 3. Ledger expense **Phone utility payment**, Checking, TODAY, 40.00, Cleared, Utilities split 40.00. Link Phone utility/TODAY, settles in full checked. Review/confirm.
- Step 4. Checking **$915**, spending **$250**, Utilities **$40**. Current occurrence must not be projected twice.
- Step 5. Last seven days' paid bills should contain this payment, not ordinary market shopping. Check on narrow portrait screen and landscape.
- Step 6. For pause/resume/archive, partial payments, matching an existing entry, occurrence changes and schedule invalid inputs use a separate phone sandbox user and laptop L-BILLS-B. Tap the same named controls. Record any touch-only failures separately. These experiments would change projections, so keep them off the main checkpoint.

## P-FORECAST-A — Overview and touch graphs

- Step 1. Compare account amounts: Checking **$915**, Savings **$25**, Card **$40 owed**. Budget: Groceries **$105**, Household **$50**, Automotive **$55**, Utilities **$40**, total actual **$250**, plan **$400**. Income $200 excluded from spending.
- Step 2. Tap chart and View/filter budget. Expect correct Budget/month. Check each category and clear filters. No hover should be required to discover essential money information on a phone.
- Step 3. Inspect monthly and weekly charts, expected expenses table, top risk summary and recent bills. Weekly numbers depend on real dates/week boundaries, not always full-month $250.
- Step 4. Pinch/normal page zoom if available. Check dates, cents, legend and low-balance/overbudget text. Color must not be the only clue.
- Step 5. Record too-small labels, graph consuming screen, sideways page motion, rows hard to scan and navigation buried below content.

## P-SETTINGS-A — Display preferences and quick actions

- Step 1. Try horizon 7/30/60/90, saving and checking Dashboard each time. Return 30.
- Step 2. Toggle chart, recent bills and daily details, save, refresh. Hide/show must not delete data.
- Step 3. Filter displayed accounts individually and all. Money stays unchanged; overall risk should not ignore hidden risky accounts.
- Step 4. Set low-balance warning 1000.00, inspect warning for checking $915; restore 0. Set category warning 85/90; invalid 0/101 should reject. Restore preferred values.
- Step 5. Enable all seven quick actions. Try More, Back, then HOLD briefly and swipe left/right. Only tab strip moves, not whole page. Swiping must not activate a tab. Try short tap afterward.
- Step 6. Reduce actions to preferred set. Check wrapping and thumb reach in portrait/landscape. Debt/Savings actions stay disabled.
- Step 7. Your time zone → Use this device's time zone → Save preferences. Compare to iPhone settings; reload. Existing saved-review deadlines keep original zone.
- Step 8. Try setup status/Resume buttons, checklist snooze/dismiss/restore and promotional preference on a disposable/incomplete phone sandbox user. Use laptop L-SETTINGS-B for each named branch. None creates finances on its own.

## P-EXPORT-A — Safari files

- Step 1. Sign out/back in shortly before export (recent login required within five minutes). Settings → JSON → Review export → Cancel. No download expected.
- Step 2. Review/Confirm private download. Accept Safari's download prompt if shown. Find JSON using Safari Downloads/Files, as in P-LOG-A.
- Step 3. Repeat JSON with saved-review details enabled, then CSV. Open private synthetic files on laptop to inspect exact records; account totals must not change.
- Step 4. Record filename, download prompt, location confusion, iCloud availability and whether a second tap duplicates downloads. Never publish export contents.
- Step 5. If recent login requested, sign in again and retry. JSON import and user-facing restore-from-file are not enabled.

## P-DELETE-A — Delete, restore, then reconcile last

- Step 1. Delete Phone utility payment through review; cancel once. No change. Review again and confirm: checking returns **$955**, spending **$210** and bill reopens.
- Step 2. Inbox history → relevant restore/undo-deletion action → review → confirm. Expect one original payment, checking **$915**, spending **$250**. No duplicates.
- Step 3. Only after all main editing tests, investigate/reconcile Checking through today. Statement $916 should show $1 difference; $915 should compare correctly. Never approve a false balance merely to progress.
- Step 4. Cancel correct reconciliation once; then approve when ready to lock the period. Try editing/deleting a covered transaction; expect rejection. Do later edit experiments on sandbox accounts.

## P-SECURITY-A — Sessions, recovery and isolation

- Step 1. Sign out; Safari Back and refresh must not grant private access without signing in. Check shared-device exposure.
- Step 2. If the LAPTOP browser is opened at the SAME hosted candidate address, sign in there as the PHONE identity. It should see the same confirmed phone records. The laptop's localhost database is unrelated; it will not automatically synchronize with hosting.
- Step 3. Hosted laptop Settings → active logins → refresh. Cancel signing out other login once, then confirm revoking phone's login. Phone should lose access, including any old approval. Sign back in as needed.
- Step 4. Create a DIFFERENT synthetic/verified sandbox identity as supported. It must start empty and never inherit Phone Checking, drafts or exports. Couples sharing/joint permissions are not implemented.
- Step 5. If Forgot password exists and email delivery is configured, use the real-inbox phone identity. Request recovery once, open newest mail on phone and record browser/redirect behavior. `.test` cannot perform this test.
- Step 6. Set new unique password; old fails, new works, confirmed synthetic records remain. Used/expired links should fail safely. Do not paste link into report. Follow laptop L-EMAIL-A for full provider verification, unknown-address and change-password branches.
- Step 7. If recovery/change-password absent in local mode, mark BLOCKED, not a button failure. Do not use real financial records while waiting for release gates.

## P-COMFORT-A — Real phone details automation cannot judge

- Step 1. Try iOS larger text/page zoom and your normal display settings. Restore afterward if desired. Watch dialogs, keyboard, dates, chart labels and cents.
- Step 2. Tap each field while keyboard is visible; scroll to bottom and back. Active field and Prepare/Cancel controls should remain reachable. Try copy/paste and text replacement on synthetic text.
- Step 3. Rotate while editing a disposable form and while review is open. No accidental submission, lost prepared items or off-screen approval controls.
- Step 4. Lock/unlock and switch apps before prepare, during a saved draft, and while review is open. No automatic approval. Unsent unsaved form persistence is not promised.
- Step 5. Temporarily switch Wi-Fi/cellular with a disposable operation, submit ONCE, then check receipt/records when connection returns. Do not repeatedly confirm a possibly successful save.
- Step 6. Optional VoiceOver only if comfortable. Settings → Accessibility → VoiceOver changes gestures: single tap selects, double tap activates, three fingers scroll. Know how to turn it off before beginning. Check field names/errors and the non-drag confirmation path. Record unfamiliarity separately from app behavior.
- Step 7. Try Safari Private Browsing as another session and close it afterward. Saved financial records belong to the server/account, not permanent phone browser storage. New private session must authenticate again.
- Step 8. No Face ID/passkey confirmation, offline/PWA guarantee, receipt camera/OCR, bank linking, subscriptions/cancellation, live Pip chat or paid feature should be treated as available. Record desired future behavior as a suggestion.

## P-EXTRA-A — Exhaust the shared controls systematically

- Step 1. Use the laptop book as a shared functional checklist: all `L-` sections apply to the SAME app controls on iPhone when available. Record phone results with matching `P-MIRROR / L-section / step` IDs. Do not skip a control merely because its desktop counterpart passed.
- Step 2. Use a separate phone sandbox account for L-BUDGET-B/C, L-BILLS-B/C, L-ACCOUNTS-B, L-INBOX-A, L-BALANCE-A and L-FAILURE-A. Do not overwrite the main phone fixture to test unusual balances/schedules.
- Step 3. Fill the findings template after each section, even if all passed. Label phone logs by section and privately transfer them to the laptop.
- Step 4. Stop whenever on-call work interrupts. Save financial drafts for later; downloading logs before closing avoids losing useful evidence.
