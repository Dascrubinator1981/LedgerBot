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
| src/app/category-select.tsx:46 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/category-select.tsx:71 | input | New category for | Review feature-level E2E evidence; physical QA pending |
| src/app/category-select.tsx:105 | button | Review new category | Review feature-level E2E evidence; physical QA pending |
| src/app/category-select.tsx:112 | button | Keep working without adding | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:51 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:82 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:118 | CategorySelect |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:126 | Input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:135 | button | Add another split | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:385 | button | Slide to confirm; accessible confirmation available below | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:461 | button | Use accessible confirmation | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:479 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:487 | button | Back to review | Review feature-level E2E evidence; physical QA pending |
| src/app/components.tsx:493 | button | Cancel review / keep page draft | Review feature-level E2E evidence; physical QA pending |
| src/app/dashboard-forecast.tsx:114 | button | Review changes ( ) | Review feature-level E2E evidence; physical QA pending |
| src/app/dashboard-forecast.tsx:245 | button | Configure Forecaster in Settings | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:26 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:36 | input | Include financial proposals and before/after snapshots | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:45 | button | Review export | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:56 | button | Confirm private download | Review feature-level E2E evidence; physical QA pending |
| src/app/export-panel.tsx:63 | button | Cancel export | Review feature-level E2E evidence; physical QA pending |
| src/app/finance-views.tsx:45 | input | Chart month | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:27 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:49 | select | forecastHorizon | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:57 | Input | Low balance warning cushion ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:64 | input | nearBudget | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:87 | input | quickAction | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:101 | input | forecastAccount | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:112 | input | forecastChart | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:120 | input | forecastRecent | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:128 | input | forecastDaily | Review feature-level E2E evidence; physical QA pending |
| src/app/forecaster-settings.tsx:135 | button | Save Forecaster display | Review feature-level E2E evidence; physical QA pending |
| src/app/label-entry.tsx:27 | button | Use | Review feature-level E2E evidence; physical QA pending |
| src/app/label-entry.tsx:31 | button | Keep my new name | Review feature-level E2E evidence; physical QA pending |
| src/app/label-entry.tsx:66 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:426 | button | Edit change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:458 | button | Remove change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:476 | button | Review staged changes | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:484 | button | Save changes for later review | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:487 | button | Discard page changes | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:598 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:610 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:621 | select | expiry | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:633 | select | reminder | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:643 | button | Save for later | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:647 | button | Review and confirm now | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:650 | button | Save changes for later review | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:653 | button | Discard changes and continue | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:658 | button | Keep editing | Review feature-level E2E evidence; physical QA pending |
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
| src/app/planning-forms.tsx:454 | AccountSelect | id | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:459 | Input | Corrected opening balance ($, blank means unknown) | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:465 | select | openingBasis | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:474 | Input | Replacement snapshot date | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:482 | button | Review opening correction | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:485 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/planning-forms.tsx:497 | select | id | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:506 | Input | New category name | Review feature-level E2E evidence; physical QA pending |
| src/app/planning-forms.tsx:509 | button | Review category rename | Review feature-level E2E evidence; physical QA pending |
| src/app/quick-actions.tsx:39 | button | ← Back | Review feature-level E2E evidence; physical QA pending |
| src/app/quick-actions.tsx:85 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/quick-actions.tsx:99 | button | More → | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:29 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:49 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:54 | Input | Investigate through date | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:60 | Input | Balance to investigate ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/reconciliation-investigator.tsx:62 | button | Investigate without saving | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:52 | button | Refresh signed-in sessions | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:76 | button | Review revoking this sign-in | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:85 | button | Review revoking all other sign-ins | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:102 | button | Confirm sign-in revocation | Review feature-level E2E evidence; physical QA pending |
| src/app/session-panel.tsx:114 | button | Keep sign-ins unchanged | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:63 | button | Open | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:68 | button | Snooze for 7 days | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:82 | button | Dismiss reminder | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:90 | button | : not applicable | Review feature-level E2E evidence; physical QA pending |
| src/app/setup-reminders.tsx:104 | button | Restore reminder | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:43 | button | Help troubleshoot | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:75 | button | Stop recording | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:77 | button | Start fresh recording | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:81 | button | Download safe report | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:84 | button | Clear report | Review feature-level E2E evidence; physical QA pending |
| src/app/troubleshooting-panel.tsx:90 | button | Close troubleshooting | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:405 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:424 | input | email | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:434 | input | password | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:446 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:456 | button | Back to sign in | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:459 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:476 | button | Forgot your password? | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:604 | button | Sign out | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:647 | button | + Add transaction | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:650 | button | Sign out | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:671 | button | Open saved reviews | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:695 | button | Set up manually | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:701 | button | Skip setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:791 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:809 | Input | Account name | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:811 | select | type | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:825 | Input | Opening balance ($, positive owed for liabilities) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:831 | select | openingBasis | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:840 | Input | Opening as-of date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:848 | button | Prepare account for review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:863 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:875 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:876 | Input | Statement ending date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:882 | Input | Statement ending balance ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:888 | button | Compare and prepare reconciliation | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:932 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:972 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:977 | Input | Date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:983 | LabelEntry | Description | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:989 | Input | Signed amount ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:995 | select | status | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1005 | select | flow | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1028 | button | Prepare transaction for review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1036 | button | Cancel edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1049 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1075 | AccountSelect | fromId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1081 | AccountSelect | toId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1087 | Input | Transfer amount ($, positive) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1092 | Input | Transfer description | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1097 | Input | Transfer date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1104 | select | status | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1121 | button | Cancel pair edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1125 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1137 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1150 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1160 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1166 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1240 | button | Edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1253 | button | Review delete | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1326 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1333 | LabelEntry | New category name | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1340 | button | Prepare category | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1391 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1501 | button | Resume saved review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1507 | button | Discard saved review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1544 | button | Review exact changes | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1564 | button | Discard | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1593 | button | Setup & Personalization | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1614 | button | Review restore deleted batch item | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1633 | button | Review undo deletion | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1648 | button | Check saved receipt | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1702 | input | Show in-app review reminders | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1761 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1779 | input | newPassword | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1789 | button | Change password and revoke sessions | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1802 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1818 | Input | Timezone (IANA name) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1824 | select | setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1834 | input | promotions | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1843 | button | Save preferences | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1846 | button | Resume account setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1849 | button | Resume bills & income | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1852 | button | Resume budget setup | Review feature-level E2E evidence; physical QA pending |
