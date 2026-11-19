# Shared households — agreed roadmap, not implemented

Each partner has a separate login. An invitation must be accepted before access is granted. Shared household records and private personal accounts need explicit ownership, membership and database authorization; the current per-user model does not yet support shared access. Approved shared changes should update both partners' views, with attribution and optional notifications.

## Approval choices

- Either partner can confirm.
- Both partners must independently confirm the identical proposal version/digest.
- Selected actions or an agreed amount threshold require both; ordinary actions require one.

Before submission, show the applicable rule. Pending partner approval must not alter actual balances or official plans. Editing invalidates earlier approvals. Either partner may reject/request edits. Pip cannot approve. Disabling/changing joint approval must itself require both partners, with an independently designed account-recovery/dispute process. Removal, ownership transfer, exports, lost access and separation require explicit privacy and recovery rules before implementation; do not create an emergency bypass silently.

## Suggested defaults for an Approval Rules page

| Change                                                 | Suggested confirmation                |
| ------------------------------------------------------ | ------------------------------------- |
| Routine transaction within the agreed budget           | Either partner                        |
| Categorize/split without changing the total            | Either partner                        |
| Link a bill payment to an existing transaction         | Either partner                        |
| Shared budget target                                   | Both                                  |
| Transaction amount, date or account                    | Both                                  |
| Delete/restore shared records                          | Both                                  |
| Starting balance correction or statement balance check | Both                                  |
| Add/remove a shared account                            | Both                                  |
| Shared bills, subscriptions or recurring plans         | Both                                  |
| Shared savings/debt plans                              | Both                                  |
| Approval rules or household membership                 | Both                                  |
| Save an unfinished private draft                       | Author; no financial commit           |
| Display preferences, filters or tips                   | Individual; no financial confirmation |
| Private-account financial records                      | Account owner                         |

Financial rule defaults and amount thresholds should be configurable, subject to the current approval policy. Private drafts are author-only unless explicitly shared for review. Household permissions must apply to Pip, exports, saved reviews, caches, real-time updates and every database/API path. LedgerBot confirmations control records in the app; they do not prevent spending outside it.

## Plain-language follow-up

Review Settings, forms, errors and confirmations for everyday language. Prefer Starting balance, What your forecast includes, Warn me when my balance falls below, Sign out this device, Review these changes by, and Check your balance against a bank statement. Keep material financial consequences visible; put technical implementation detail behind More details. The current troubleshooting feature follows this pattern, but the complete Settings rewrite remains future work.
