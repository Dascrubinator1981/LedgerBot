# Your LedgerBot test pack

November 19 navigation update: Accounts → Create New Account opens account creation; click a named account tab to see its balance. Account tools and reconciliation is a disclosure below the account. Ledger defaults to the chosen account, offers All accounts and Expand/Full/Reduce controls. Budget → Create New Budget opens target entry; Current budget shows results; Categories opens standalone category creation. Pending changes sits beside/above the page; Review staged changes opens an inline changes table, and confirmed entries clear from that queue. Amount labels are now Amount ($) and Split N amount ($). All control values below are unchanged. If earlier confirmed records are missing, STOP and use the read-only diagnostic before recreating anything. The separately delivered editable one-step guides have these navigation directions built into their steps and add L/P52–54 for defaults, table sizing and persistence.


The downloadable pack also contains index.html. Double-click it to read the guides in a browser without running the app. Use Ctrl+P to print or Save as PDF. It contains instructions only, no login and no external requests. Your progress is recorded in your private findings file, not automatically in that page.

1. Start with LAPTOP_TEST_GUIDE.md, section L-START-A. Go one section at a time; pause whenever needed.
2. Save a private copy of OWNER_FINDINGS_TEMPLATE.md outside the GitHub project, naming it README-Laptop.md. Copy its section block for each completed section.
3. Later use IPHONE_TEST_GUIDE.md and another private findings file, README-iPhone.md. Phone testing starts with the access prerequisite: no HTTPS candidate is deployed yet. Localhost on your iPhone cannot reach your laptop.
4. Your proposed phone address testerip@example.test is suitable only for fictional local signup. It cannot receive verification/reset emails. Hosted mail testing needs a real inbox you control. Label reports iPhone tester; safe logs intentionally exclude email addresses.
5. Main fixture tests build on each other. Negative/experimental tests say when to discard work or use a separate sandbox user. Reconciliation goes last because it locks history.
6. Send one sanitized section at a time: section ID, steps tried, expected/actual, requested changes and an optional safe troubleshooting report. I can investigate while you continue independent sections.

These guides are a source-checked manual test plan, not a claim that every step has been executed on your physical devices. Use only invented financial records. A real login email does not make the app ready for real money.

The current source repository was last reported public. Keep personal findings, screenshots, exports and logs OUTSIDE it. No user-facing account deletion, JSON import, live bank/OCR/OpenAI integration or deployed beta has been promised by this pack.

## November 12 update

The recurring bill editor now retains inputs and editing context after a rejected preparation. Cancel schedule edit clears its unfinished-form warning. Editing a staged schedule retains its original schedule identity. New checks: laptop L-BILLS-B Steps 9–10 and phone P-BILLS-A Steps 7–8; the findings template now includes schedule-specific results. Main financial fixture totals are unchanged. Pull the latest review branch before testing these fixes. Hosted Supabase management access is still not configured here; a GitHub login/repository connection alone does not supply it.
