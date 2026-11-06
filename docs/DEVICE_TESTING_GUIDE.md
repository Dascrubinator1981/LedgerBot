# LedgerBot device testing — Windows laptop, iPhone 17 Pro and Steam Deck

This guide is for the owner testing with completely invented records. It is not an invitation to connect real banks or enter personal financial information. Do not install anything until you want to test; development can continue without your devices.

## What I can test and what needs your help

Automated tests exercise real application flows, SQL permissions, exact cents, browser interactions and selected accessibility rules. Browser emulation cannot establish how your actual iPhone keyboard, Safari downloads, touch gestures, VoiceOver, Windows display scaling or Steam Deck controls feel. Those physical-device checks need you or another tester.

Windows local testing is available now. **An iPhone/Steam Deck test against the same private HTTPS beta address is pending: no beta site has been deployed.** Do not substitute your own bank website, a public development tunnel or a guessed address. A future private beta needs a separately approved deployment and verified configuration. The text `BETA_URL` below is a placeholder, not a working link.

## Follow-up usability changes

The updated review branch puts the automatic Forecaster on Dashboard and its display settings/recurring plan controls in Settings. Weekly/biweekly/quarterly budgets and page-wide deferred review are still pending. With an explicit Expense choice, positive total and split amounts are accepted and reviewed as outflows; automatic direction still uses signed amounts. Use a fictional opening snapshot dated yesterday for today's purchases. Update by stopping the local dev server, pulling the review branch, running `npm ci` and `npm run db:migrate`, then restarting `npm run dev`. Do not delete the local database to update.

## Part 1 — prepare the Windows laptop, one small step at a time

### A. Install the program that runs the app

1. Open your normal web browser.
2. Visit the official Node.js website, `https://nodejs.org/en/download`.
3. Select **Node.js 24.x**, Windows and the Windows installer (`.msi`). Use the architecture appropriate for your laptop (usually x64; ARM laptops need ARM64). Do not install an unrelated similarly named Store app.
4. Open the downloaded installer. Accept the normal installation defaults. Extra native-build tools are not needed for this project’s initial setup.
5. Close VS Code completely, then reopen it. This lets it find the newly installed program.
6. In VS Code select **Terminal → New Terminal**. In the terminal dropdown choose **Command Prompt**. Commands below are for that terminal; you do not need administrator mode.
7. Type `node --version`, then press Enter. It should print `v24...`. If it does not, stop and share the error message. Do not change Windows security policies to make it work.

### B. Put a copy of LedgerBot on your laptop

1. Install GitHub Desktop from its official site, `https://desktop.github.com/`.
2. Sign into your own GitHub account through its normal login window. Never send me your password, recovery code or token.
3. Select **File → Clone repository**.
4. Select `Dascrubinator1981/LedgerBot`. If needed, use the URL tab and `https://github.com/Dascrubinator1981/LedgerBot`.
5. Choose a local folder you can find again, then click **Clone**. Do not clone inside another existing project folder.
6. At the top, choose **Current branch → feat/manual-finance-foundation**. The app is on this review branch; do not use `main` unless we have confirmed the work has merged.
7. Click **Fetch origin**, then **Pull origin** if offered. This gets the latest pushed work.
8. Choose **Repository → Open in Visual Studio Code**. If VS Code is not offered, open VS Code, choose **File → Open Folder**, and choose the LedgerBot folder you just cloned.

### C. Start your private local copy

1. In VS Code open **Terminal → New Terminal**, using **Command Prompt**.
2. Check that the terminal’s folder is LedgerBot. In VS Code’s file list you should see `package.json`.
3. Type the following, pressing Enter after each line and waiting for it to finish:

```bat
npm ci
npm run db:migrate
npm run dev
```

4. The last command keeps running. Wait for the message saying the app is ready. Keep this terminal open.
5. In the laptop’s browser type `http://127.0.0.1:3000`.
6. If Windows says port 3000 is already in use, stop and send the message. Do not silently move to another port; the application’s request-security settings expect its configured origin.
7. To stop, click in the terminal and press **Ctrl+C**. Your local test records remain saved. Next time, reopen this folder and run `npm run dev`.

This local mode uses SQLite and simple development signup. Docker and paid services are not needed. It does not test hosted email verification or provider recovery. Those have separate local automated tests and require a configured private beta for your device walkthrough.

### D. If something goes wrong

- `node is not recognized`: reopen VS Code after installing Node 24; if it persists, share the message.
- PowerShell says `npm.ps1` cannot run: switch to **Command Prompt** rather than loosening execution policy.
- A red security audit email: it concerns GitHub’s automated job, not an instruction to change your laptop. Do not run `npm audit fix --force`.
- A terminal error: copy the command and the final non-sensitive error lines. Do not copy `.env` files, cookies or keys.
- A blank page: note the address, whether the terminal is still running, and the visible message. Do not delete your database to troubleshoot it.

## Part 2 — prepare for an actual iPhone/Steam Deck beta

**Wait here until a private HTTPS beta address is supplied after review. No action is required now.** The address `127.0.0.1` on an iPhone means the iPhone itself; it does not reach the laptop. The current server listens on the laptop only.

We must first verify hosted identity, HTTPS, secure cookies, email verification/recovery, database permissions, backups and the release checklist. Do not disable security controls, forward home-router ports, open the development server to public Wi-Fi, accept certificate warnings or install a random tunnel to skip this step.

When the private beta is approved, record its candidate version and exact supplied URL at the top of your test notes. Create a **separate fictional test identity for each device** at first. A later cross-device test intentionally uses the same fictional identity to check persistence. Do not reuse a password from any real account.

For hosted email verification, use a designated test mailbox or alias that you control and can receive mail in. Public email cannot arrive at an invented `example.test` address. Only the financial records and profile details should be fictional; never share the verification link or mailbox credentials. The local SQLite mode does not send verification mail.

## Part 3 — the same small financial walkthrough on each device

Run this on a fresh fictional account. If you reuse one containing earlier records, the totals below will not match. Set your user timezone in Settings to **America/Denver**. “Today” and “yesterday” below refer to that selected civil timezone. Finish these before reconciling, since reconciliation intentionally locks earlier dates.

### Test 01 — empty start and known zero

1. In local Windows mode, create the fictional account. The hosted closed-beta candidate instead uses an approved pre-created test identity: follow its sign-in/recovery activation instructions. Public registration is closed there; do not expect a Create Account button. Provider mail/verification must still reach a designated test mailbox you control.
2. Expect an empty workspace, not demonstration spending or an invented $0 balance.
3. Create **Practice checking**, opening **$1,000**, as of **yesterday**. Review, then deliberately confirm using the accessible confirmation option.
4. Create a second account **Practice empty pocket** with an explicit **$0** opening snapshot. Expect a known zero there.
5. An account with a blank opening amount must remain unknown. Run that blank-opening check in a separate fictional user so the main walkthrough keeps known totals; aggregate net worth and forecasts can otherwise be unknown too.

### Test 02 — one purchase updates the whole app

1. In Budget create **Groceries** and a **$100** target for this month; review each.
2. In Ledger add a **-$15** cleared purchase dated today, allocated to Groceries.
3. Before final confirmation, checking must still be **$1,000**.
4. After confirmation, checking must be **$985** and budget spending **$15**.
5. Reload. Both values must remain correct.

### Test 03 — add a category without losing your entry

1. Start a **-$5** cleared purchase dated today. Fill its description and account.
2. In its split category list choose **＋ Add a new category…**. Create **Household**.
3. Cancel the category review once. Expect your original entry to remain filled and no category or purchase posted. The draft may remain in Inbox.
4. Open the add panel again, review and approve the category. Expect it in the list, while checking is still **$985**.
5. Select Household, allocate **-$5**, and review/approve the purchase separately.
6. Checking should now be **$980** and overall budget spending **$20**. Household spending must not disappear just because it has no target.

### Test 04 — splits, refunds and filter totals

1. Add a **-$10** cleared purchase: **-$6 Groceries**, **-$4 Household**. Checking becomes **$970**; total spending becomes **$30**.
2. Add an explicit **refund** of **+$2**, allocated to Groceries. Checking becomes **$972**; total spending becomes **$28**.
3. Click the Dashboard graph. The same month should open in Budget.
4. Show only Groceries. It should show **$19** spending. Household alone should show **$9**. Clear filters: **$28** overall.
5. Filtering must never alter the checking balance or stored entries.
6. Change the chart month and reload. The selected month should stay; saved category/account filters are not implemented yet and reset.

### Test 05 — a card payment is not another expense

1. Create **Practice card** with **$50 owed** as of yesterday.
2. Record a **-$20** cleared card purchase allocated to Groceries. Card owed becomes **$70**; overall spending becomes **$48**; checking remains **$972**.
3. Record a **$30 transfer/payment** from checking to the card. Do not enter it as another expense.
4. After review/confirmation, checking becomes **$942**, card owed **$40**, and spending remains **$48**.

### Test 06 — pending is not cleared

1. Enter a **-$10 pending** checking expense allocated to Groceries.
2. Checking should remain **$942** and cleared spending **$48**. Pending spending should show separately.
3. Edit that same entry to cleared after review. Checking becomes **$932** and cleared spending **$58**. There must not be a second entry.

### Test 07 — paid bills, matching, delete and restore

1. Create Utilities and a **$100 monthly target**. Create a recurring **$100 bill** on checking, due today with zero calendar-day delay. This is a planning assumption until a payment is recorded; it is not a bank payment.
2. Record a **-$100 cleared** checking payment, allocate it to Utilities, and explicitly link it to this bill occurrence as settled in full.
3. Checking becomes **$832**, overall spending **$158**. The recent-paid-bills list should contain the linked **$100** payment. Other ordinary purchases must not appear as bills just because of their description or amount.
4. The matched current bill must not be projected a second time. Later recurring occurrences may still appear as estimates.
5. Review and delete that payment: checking returns to **$932**, spending **$58**, and the paid item disappears; its tracked obligation reopens.
6. In Inbox review undo deletion and confirm: checking returns to **$832**, spending **$158**, and the original payment returns exactly once.

### Test 08 — a lower target does not create money

1. Groceries spending is now **$49**, Household **$9**, Utilities **$100**.
2. Change Groceries’ target from **$100 to $40**, through review. With Utilities’ $100 target, the overall plan is **$140** against **$158** spent, so it should show over budget.
3. Checking must remain **$832**. Changing a category or target must not debit/credit an account.

### Test 09 — cancellation, reload and export

1. Prepare another purchase, then cancel review. No balance change is permitted.
2. Review Inbox and distinguish the saved draft from approved records.
3. Export CSV and JSON from Settings. A sign-in from the last five minutes is required. Sign out and back in if requested; do not lower the security setting.
4. Save the files privately and open them on the device. Expect financial records, never passwords or provider tokens. Export does not delete anything. Optional draft snapshots contain private test details.
5. Do not expect JSON import; that is not implemented.

### Test 10 — reconciliation, last

1. Investigate checking through today with a statement of **$833**. Expect a **$1** difference and no automatic adjustment.
2. Compare **$832** instead, then review and confirm reconciliation.
3. Try editing/deleting an entry inside the reconciled period. Expect rejection, not overwritten history.
4. Use a fresh account if repeating earlier editing tests; do not undo protection to make a test pass.

## Part 4 — Windows usability checks

Use Edge and, if installed, Chrome. Record browser version.

1. Navigate with Tab and Shift+Tab. Focus should be visible. Activate links/buttons with Enter or Space as appropriate.
2. Complete the two-stage accessible confirmation without dragging. One accidental click must not post a change.
3. Try 200% browser zoom using Ctrl+Plus. Text should remain readable and controls reachable; tables may scroll inside their containers.
4. Try a narrow window and your usual Windows display scaling. Note overlaps, cut-off amounts or horizontal page scrolling.
5. Use Windows Narrator if comfortable (Windows+Ctrl+Enter toggles it on supported installations). Check field names, errors and the review dialog. Turn it off the same way afterward.
6. Open a second tab with the same fictional login. An approved entry should update the other tab after refresh/invalidation. Sign-out should clear its private workspace.

## Part 5 — iPhone 17 Pro checks, after the private HTTPS link exists

1. Open the supplied `BETA_URL` in **Safari**. Confirm HTTPS and no certificate warning.
2. Use portrait first, then landscape. Try the walkthrough above with a fresh fictional user.
3. Check that the keyboard does not cover the active amount, category panel or confirmation controls. Scroll while typing and use Safari’s normal Done/keyboard-dismiss control.
4. Tap **＋ Add** and cancel once. Confirm the original text/amount remains. Check select lists, date picking and decimal/minus entry without relying on a laptop keyboard.
5. Try the confirmation slider on an isolated test proposal: partial drag/release, drag out of the track, and cancellation must not post. Then test a full deliberate drag/release. Also complete the non-drag two-stage option.
6. Lock/unlock the phone or switch apps during a draft, then return. No change should auto-commit. Record what draft work survives; browser-close recovery of unsent forms is not promised.
7. Use Safari’s page zoom/larger text controls. Check that amounts remain legible.
8. If comfortable, enable **Settings → Accessibility → VoiceOver**. Use its gestures to read fields and complete the non-drag path. Turn it off afterward. VoiceOver familiarity may require separate practice; do not treat unfamiliar gestures as an app failure without noting that context.
9. Test CSV/JSON download, then locate the file using Safari’s Downloads and the Files app. Exact download location depends on your Safari settings; record what happened rather than assuming the file failed.
10. Open the same fictional identity on the laptop and verify the approved records agree. Reopen Safari after sign-out and ensure private data does not reappear without authentication.

Do not test a live bank connection, Face ID/passkey approval, installed PWA/offline mode or subscriptions/cancellation unless that specific candidate explicitly enables them. A Chrome-sized mobile simulation does not count as this Safari/device test.

## Part 6 — Steam Deck, optional secondary coverage

The Deck is valuable for Linux/handheld usability, but Windows and physical iPhone coverage take priority.

1. Save any game and use the Steam menu’s **Power → Switch to Desktop** option (wording can vary with SteamOS version).
2. Open the installed browser. Do not alter SteamOS’s read-only filesystem, enable developer mode or install Node just for this test.
3. After private beta approval, enter the supplied HTTPS `BETA_URL`.
4. Use the trackpad/touchscreen and SteamOS’s on-screen keyboard (commonly Steam+X). If that shortcut differs on your setup, use the system keyboard control.
5. Check navigation, category creation, scrolling, number entry and the accessible confirmation path. This is a browser app, not a native controller-supported game; gamepad-only navigation is not currently promised.
6. Try the landscape screen and enlarged browser zoom. Watch for cut-off dialogs or action buttons.
7. Export a fictional CSV and find it using the browser’s downloads. Sign out when finished, especially on a shared device.
8. Use the desktop shortcut to return to Gaming Mode when finished. No system security changes should be necessary.

## Part 7 — safety and failure checks, fictional records only

- Create a second test user in a separate browser profile/private window. It must start empty and never display the first user’s records, exports or approval receipts.
- If you interrupt connectivity, do not repeatedly submit the same financial change. Restore connectivity and check the saved receipt/history first. A lost display refresh must not be described as proof a save failed.
- If a real-data screen, another user’s records, an automatic unapproved change, or a duplicate payment appears, stop that test and report it. Do not explore another user’s data.
- Report any mismatch before reconciling. Do not change amounts merely to make the expected result appear.

## Part 8 — send a useful test report

Copy this into a message or private issue:

```text
Candidate version / commit:
Device and OS version:
Browser and version:
Local Windows or private beta URL:
Test number:
What I clicked / typed (fictional values only):
What I expected:
What actually happened:
Exact non-sensitive error text:
Does it repeat after reload? Yes / No / Not tried
Impact: blocked / confusing / cosmetic
Screenshot attached? (reviewed to exclude personal details)
```

Do not include credentials, verification links, cookies, tokens, `.env` files or actual financial records. A screenshot of a display problem is useful only after checking it contains fabricated data. You do not need to diagnose or fix the code.

## What is not ready to test yet

Hosted beta access, physical-device assurance, full subscription tracking/cancellation, the financial calendar, live OpenAI Pip, bank sync, receipt OCR, billing activation, offline/PWA behavior and customer account erasure have not been established by this guide. Follow the candidate’s release report for newly enabled features. Do not mark an unavailable test as passed.
