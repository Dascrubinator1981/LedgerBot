# Interaction inventory

This inventories controls from source; it does not claim every control has passed every browser/device scenario. The current automated test evidence and remaining gaps are in TODAY_UPDATE_REPORT.md and REQUIREMENTS_AUDIT.md. Disabled integrations are not working tools. Physical device/assistive-technology review remains outstanding.

Regenerate with `node scripts/interaction-inventory.mjs`.

| Source | Control | Label/name | QA scope |
| --- | --- | --- | --- |
| src/app/budget-explorer.tsx:42 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-explorer.tsx:59 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-explorer.tsx:78 | button | Clear budget filters | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-explorer.tsx:86 | button | Select no categories | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-target-form.tsx:37 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/budget-target-form.tsx:62 | select | categoryId | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-target-form.tsx:78 | LabelEntry | New budget category name | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-target-form.tsx:87 | Input | Budget month | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-target-form.tsx:88 | Input | Planned target ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-target-form.tsx:90 | select | cadence | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-target-form.tsx:97 | Input | Budget period start date | Review feature-level E2E evidence; physical QA pending |
| src/app/budget-target-form.tsx:105 | button | Prepare budget target | Review feature-level E2E evidence; physical QA pending |
| src/app/category-select.tsx:81 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/category-select.tsx:104 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/category-select.tsx:107 | input | New category for | Review feature-level E2E evidence; physical QA pending |
| src/app/category-select.tsx:144 | button | Review new category | Review feature-level E2E evidence; physical QA pending |
| src/app/category-select.tsx:151 | button | Keep working without adding | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:51 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:82 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:118 | CategorySelect |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:126 | Input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:135 | button | Add another split | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:402 | button | Slide to confirm; accessible confirmation available below | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:478 | button | Use accessible confirmation | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:496 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:504 | button | Back to review | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:510 | button | Cancel review / keep page draft | Review feature-level E2E evidence; physical QA pending |
| src/app/dashboard-forecast.tsx:114 | button | Review changes ( ) | Review feature-level E2E evidence; physical QA pending |
| src/app/dashboard-forecast.tsx:245 | button | Configure Forecaster in Settings | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:26 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:36 | input | Include saved reviews and their before-and-after details | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:45 | button | Review export | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:56 | button | Confirm private download | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:63 | button | Cancel export | Review feature-level E2E evidence; physical QA pending |
| src/app/finance-views.tsx:50 | input | Chart month | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:27 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:49 | select | forecastHorizon | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:57 | Input | Warn me when a balance falls below ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:64 | input | nearBudget | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:87 | input | quickAction | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:101 | input | forecastAccount | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:112 | input | forecastChart | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:120 | input | forecastRecent | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:128 | input | forecastDaily | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:135 | button | Save forecast settings | Review feature-level E2E evidence; physical QA pending |
| src/app/label-entry.tsx:27 | button | Use | Review feature-level E2E evidence; physical QA pending |
| src/app/label-entry.tsx:31 | button | Keep my new name | Review feature-level E2E evidence; physical QA pending |
| src/app/label-entry.tsx:66 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:513 | button | Cancel editing this staged change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:524 | button | Edit change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:567 | button | Remove change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:585 | button | Review staged changes | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:593 | button | Save changes for later review | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:596 | button | Discard page changes | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:710 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:722 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:733 | select | expiry | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:745 | select | reminder | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:755 | button | Save for later | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:759 | button | Review and confirm now | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:762 | button | Save changes for later review | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:765 | button | Discard changes and continue | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:770 | button | Keep editing | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:52 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:87 | Input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:97 | input | This payment settles the selected occurrence in full | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:149 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:176 | input | scheduleId | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:183 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:188 | Input | Schedule name | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:189 | Input | Signed recurring amount ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:194 | Input | First due / expected date | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:201 | select | cadence | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:210 | Input | Estimated clearing delay (0–30 days) | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:218 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:227 | button | Cancel schedule edit | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:256 | button | Edit schedule | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:259 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:272 | button | Review archive | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:300 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:311 | select | transactionId | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:322 | button | Prepare payment match | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:339 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:353 | select | rule | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:362 | Input | Scheduled occurrence date | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:368 | Input | Estimated clearance date | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:375 | select | occurrenceStatus | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:382 | button | Prepare occurrence review | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:437 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:448 | AccountSelect | id | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:453 | Input | New account name | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:456 | button | Review account rename | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:459 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:484 | AccountSelect | id | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:489 | Input | Corrected opening balance ($, blank means unknown) | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:495 | select | openingBasis | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:504 | Input | Replacement snapshot date | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:512 | button | Review opening correction | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:515 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:527 | select | id | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:536 | Input | New category name | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:539 | button | Review category rename | Review feature-level E2E evidence; physical QA pending |
| src/app/quick-actions.tsx:39 | button | ← Back | Review feature-level E2E evidence; physical QA pending |
| src/app/quick-actions.tsx:85 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/quick-actions.tsx:99 | button | More → | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:29 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:49 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:54 | Input | Investigate through date | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:60 | Input | Balance to investigate ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:62 | button | Investigate without saving | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:53 | button | Refresh login list | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:77 | button | Review signing out this login | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:86 | button | Review signing out all other logins | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:103 | button | Confirm sign-out | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:115 | button | Keep logins signed in | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:63 | button | Open | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:68 | button | Snooze for 7 days | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:82 | button | Dismiss reminder | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:90 | button | : not applicable | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:104 | button | Restore reminder | Review feature-level E2E evidence; physical QA pending |
| src/app/time-zone-field.tsx:23 | input | timezone | Review feature-level E2E evidence; physical QA pending |
| src/app/time-zone-field.tsx:37 | button | Use this device’s time zone | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:43 | button | Help troubleshoot | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:75 | button | Stop recording | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:77 | button | Start fresh recording | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:81 | button | Download safe report | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:84 | button | Clear report | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:90 | button | Close troubleshooting | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:454 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:473 | input | email | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:483 | input | password | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:495 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:505 | button | Back to sign in | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:508 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:525 | button | Forgot your password? | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:663 | button | Sign out | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:706 | button | + Add transaction | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:716 | button | Sign out | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:737 | button | Open saved reviews | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:761 | button | Set up manually | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:767 | button | Skip setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:861 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:879 | Input | Account name | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:881 | select | type | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:895 | Input | Opening balance ($, positive owed for liabilities) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:901 | select | openingBasis | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:910 | Input | Opening as-of date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:918 | button | Prepare account for review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:933 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:945 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:946 | Input | Statement ending date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:952 | Input | Statement ending balance ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:958 | button | Compare and prepare reconciliation | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:991 | button | Add entry | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:998 | button | Edit selected | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1009 | button | Transfer / card payment | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1057 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1070 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1080 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1086 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1122 | input | selectedTransaction | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1196 | button | Edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1201 | button | Review delete | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1230 | button | Clear ledger filters | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1265 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1309 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1314 | Input | Date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1320 | LabelEntry | Description | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1326 | Input | Signed amount ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1332 | select | status | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1342 | select | flow | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1352 | input | includedInOpening | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1390 | button | Prepare transaction for review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1398 | button | Cancel edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1425 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1456 | AccountSelect | fromId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1462 | AccountSelect | toId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1468 | Input | Transfer amount ($, positive) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1473 | Input | Transfer description | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1478 | Input | Transfer date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1485 | select | status | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1495 | input | fromIncluded | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1512 | input | toIncluded | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1540 | button | Cancel pair edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1555 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1605 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1612 | LabelEntry | New category name | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1619 | button | Prepare category | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1681 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1795 | button | Resume saved review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1801 | button | Discard saved review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1838 | button | Review exact changes | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1858 | button | Discard | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1887 | button | Setup & Personalization | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1908 | button | Review restore deleted batch item | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1927 | button | Review undo deletion | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1942 | button | Check saved receipt | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2000 | input | Show in-app review reminders | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2059 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2077 | input | newPassword | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2087 | button | Change password and sign out all logins | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2100 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2118 | select | setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2128 | input | promotions | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2137 | button | Save preferences | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2140 | button | Resume account setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2143 | button | Resume bills & income | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2146 | button | Resume budget setup | Review feature-level E2E evidence; physical QA pending |
