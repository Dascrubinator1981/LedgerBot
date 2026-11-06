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
| src/app/page-draft.tsx:422 | button | Edit change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:454 | button | Remove change | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:472 | button | Review staged changes | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:479 | button | Save changes for later review | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:482 | button | Discard page changes | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:586 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:598 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:609 | select | expiry | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:621 | select | reminder | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:631 | button | Save for later | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:635 | button | Review and confirm now | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:638 | button | Save changes for later review | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:641 | button | Discard changes and continue | Review feature-level E2E evidence; physical QA pending |
| src/app/page-draft.tsx:646 | button | Keep editing | Review feature-level E2E evidence; physical QA pending |
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
| src/app/workspace.tsx:374 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:393 | input | email | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:403 | input | password | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:415 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:425 | button | Back to sign in | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:428 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:445 | button | Forgot your password? | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:555 | button | Sign out | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:581 | button | + Add transaction | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:584 | button | Sign out | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:605 | button | Open saved reviews | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:629 | button | Set up manually | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:635 | button | Skip setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:725 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:743 | Input | Account name | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:745 | select | type | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:759 | Input | Opening balance ($, positive owed for liabilities) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:765 | select | openingBasis | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:774 | Input | Opening as-of date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:782 | button | Prepare account for review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:797 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:809 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:810 | Input | Statement ending date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:816 | Input | Statement ending balance ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:822 | button | Compare and prepare reconciliation | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:861 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:901 | AccountSelect | accountId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:906 | Input | Date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:912 | LabelEntry | Description | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:918 | Input | Signed amount ($) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:924 | select | status | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:934 | select | flow | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:957 | button | Prepare transaction for review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:964 | button | Cancel edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:977 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1003 | AccountSelect | fromId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1009 | AccountSelect | toId | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1015 | Input | Transfer amount ($, positive) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1020 | Input | Transfer description | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1025 | Input | Transfer date | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1032 | select | status | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1049 | button | Cancel pair edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1053 | button |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1065 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1078 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1088 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1094 | input |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1168 | button | Edit | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1181 | button | Review delete | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1254 | form |  | Financial draft/review form; approval/auth/failure tests required |
| src/app/workspace.tsx:1261 | LabelEntry | New category name | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1268 | button | Prepare category | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1319 | select |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1429 | button | Resume saved review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1435 | button | Discard saved review | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1472 | button | Review exact changes | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1492 | button | Discard | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1521 | button | Setup & Personalization | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1542 | button | Review restore deleted batch item | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1561 | button | Review undo deletion | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1576 | button | Check saved receipt | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1630 | input | Show in-app review reminders | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1689 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1707 | input | newPassword | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1717 | button | Change password and revoke sessions | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1730 | form |  | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1746 | Input | Timezone (IANA name) | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1752 | select | setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1762 | input | promotions | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1771 | button | Save preferences | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1774 | button | Resume account setup | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1777 | button | Resume bills & income | Review feature-level E2E evidence; physical QA pending |
| src/app/workspace.tsx:1780 | button | Resume budget setup | Review feature-level E2E evidence; physical QA pending |
