# Stage 3 checkpoint — easier to navigate and keep current

If you opened the app today, each main section would have a shareable URL. Reloading Settings brings you back to Settings; browser Back and Forward work. Pending drafts have links you can revisit, but opening a link never approves anything. Accounts, plans, exports and charts are feature components alongside the existing review component; the main workspace still needs further decomposition.

Opening a second tab no longer leaves its balances indefinitely frozen. Successful changes send a payload-free invalidation message; each tab asks the authenticated server for current data. Focus and visibility changes also refresh. An expired or signed-out session clears the private workspace. Background refresh does not reset an unfinished form. Failed refreshes report that displayed values may be stale. The existing verified-receipt behavior remains intact when a save succeeds but its following refresh fails.

Settings now has separate account, budget and forecast reminders. You can dismiss each one, snooze it for seven days, mark it not applicable or restore it. Preferences persist per user and are independent of promotions. They cannot suppress financial coverage warnings. Snoozing uses elapsed time, not a claim about bill due dates.

## Evidence

- Typecheck and lint passed. Unit/service suite: **82 passed** after adding navigation and snooze-boundary tests.
- All six established browser finance workflows passed with semantic navigation links.
- New experience browser test passed after fixing an incorrect test locator: deep-link reload, persisted dismissal, keyboard navigation and confirmation, narrow viewport at CSS 200% zoom, reduced-motion preference, two-tab account update, and logout clearing the second tab.
- Automated axe WCAG A/AA rules reported no violations in the tested Settings and account-review states. These are selected states, not a whole-application accessibility certification. Real screen-reader, switch, eye-gaze and physical touch-device checks remain unrun.

Stage 3 is partial against the complete product contract: no optional passkey step-up, full calendar/mobile navigation design, or durable recovery of an unsent form after closing the browser. Persisted proposals can be resumed and approved receipts queried; no plaintext financial form drafts were added to browser storage. The two-stage non-drag confirmation and interrupted-drag rejection remain covered by existing tests. No live vendor integration was enabled.

The next checkpoint prepares operational safeguards, including readiness, strict script CSP and the synthetic encrypted recovery drill. Hosting, independent audits and release approval remain separate gates.
