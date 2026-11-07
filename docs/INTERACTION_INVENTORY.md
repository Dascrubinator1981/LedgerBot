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
| src/app/page-draft.tsx:498 | button | Cancel editing this staged change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:509 | button | Edit change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:543 | button | Remove change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:561 | button | Review staged changes | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:569 | button | Save changes for later review | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:572 | button | Discard page changes | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:686 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:698 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:709 | select | expiry | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:721 | select | reminder | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:731 | button | Save for later | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:735 | button | Review and confirm now | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:738 | button | Save changes for later review | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:741 | button | Discard changes and continue | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:746 | button | Keep editing | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:51 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:86 | Input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:96 | input | This payment settles the selected occurrence in full | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:146 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:161 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:166 | Input | Schedule name | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:167 | Input | Signed recurring amount ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:172 | Input | First due / expected date | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:179 | select | cadence | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:188 | Input | Estimated clearing delay (0–30 days) | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:196 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:205 | button | Cancel schedule edit | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:227 | button | Edit schedule | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:230 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:243 | button | Review archive | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:271 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:282 | select | transactionId | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:293 | button | Prepare payment match | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:310 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:324 | select | rule | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:333 | Input | Scheduled occurrence date | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:339 | Input | Estimated clearance date | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:346 | select | occurrenceStatus | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:353 | button | Prepare occurrence review | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:408 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:419 | AccountSelect | id | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:424 | Input | New account name | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:427 | button | Review account rename | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:430 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:455 | AccountSelect | id | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:460 | Input | Corrected opening balance ($, blank means unknown) | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:466 | select | openingBasis | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:475 | Input | Replacement snapshot date | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:483 | button | Review opening correction | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:486 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:498 | select | id | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:507 | Input | New category name | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:510 | button | Review category rename | Review feature-level E2E evidence; physical QA pending |
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
| src/app/workspace.tsx:452 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:471 | input | email | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:481 | input | password | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:493 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:503 | button | Back to sign in | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:506 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:523 | button | Forgot your password? | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:661 | button | Sign out | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:704 | button | + Add transaction | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:714 | button | Sign out | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:735 | button | Open saved reviews | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:759 | button | Set up manually | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:765 | button | Skip setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:859 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:877 | Input | Account name | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:879 | select | type | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:893 | Input | Opening balance ($, positive owed for liabilities) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:899 | select | openingBasis | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:908 | Input | Opening as-of date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:916 | button | Prepare account for review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:931 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:943 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:944 | Input | Statement ending date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:950 | Input | Statement ending balance ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:956 | button | Compare and prepare reconciliation | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:989 | button | Add entry | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:996 | button | Edit selected | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1007 | button | Transfer / card payment | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1055 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1068 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1078 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1084 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1120 | input | selectedTransaction | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1194 | button | Edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1199 | button | Review delete | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1228 | button | Clear ledger filters | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1263 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1307 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1312 | Input | Date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1318 | LabelEntry | Description | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1324 | Input | Signed amount ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1330 | select | status | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1340 | select | flow | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1350 | input | includedInOpening | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1388 | button | Prepare transaction for review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1396 | button | Cancel edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1423 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1454 | AccountSelect | fromId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1460 | AccountSelect | toId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1466 | Input | Transfer amount ($, positive) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1471 | Input | Transfer description | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1476 | Input | Transfer date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1483 | select | status | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1493 | input | fromIncluded | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1510 | input | toIncluded | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1538 | button | Cancel pair edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1553 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1603 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1610 | LabelEntry | New category name | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1617 | button | Prepare category | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1679 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1789 | button | Resume saved review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1795 | button | Discard saved review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1832 | button | Review exact changes | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1852 | button | Discard | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1881 | button | Setup & Personalization | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1902 | button | Review restore deleted batch item | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1921 | button | Review undo deletion | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1936 | button | Check saved receipt | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1990 | input | Show in-app review reminders | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2049 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2067 | input | newPassword | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2077 | button | Change password and sign out all logins | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2090 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2108 | select | setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2118 | input | promotions | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2127 | button | Save preferences | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2130 | button | Resume account setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2133 | button | Resume bills & income | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:2136 | button | Resume budget setup | Review feature-level E2E evidence; physical QA pending |
