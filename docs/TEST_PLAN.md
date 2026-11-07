# Test plan

- Vitest: real in-memory SQLite with two invented identities through real scrypt. Money signs, zero-start/unknown, budget independence, splits, transfers/rollback, pending, reconciliation, composite FKs and forged/stale/expired/AI/replayed approvals.
- Playwright: real Next routes and separate persistent fabricated-only `data/e2e.sqlite` on port 3100. Signup/empty state, skip, review/posting, reload, two-user isolation, CSRF denial, cancel/resume, mobile keyboard confirmation.
- Commands: `npm run db:migrate` twice (repeatability), `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run test:e2e`, `npm audit --omit=dev`.

Cloud browser download was denied by network policy. Use installed Chromium via `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium`; no TLS/signature verification bypass. CI installs Chromium normally. Tests create unique synthetic identities and never reset an existing database.

Remaining manual release checks: real screen readers/switch/eye-gaze, interrupted touch drags, zoom, cross-browser and real devices, staging backend negative tests, concurrency/stress, migration upgrades and recovery. Browser tests do not establish complete accessibility/security assurance. No real workbook/customer data/vendor service is used. Actual outcomes belong in RELEASE_STATUS.md.

Latest review coverage: see [APP_REVIEW_REPORT.md](APP_REVIEW_REPORT.md). The shared inline-category browser flow now saves an unfinished dropdown name, reloads and resumes it, checks automatic selection, saves an in-progress staged edit, reloads and cancels back to its original exact value, and cancels a posted edit without a navigation warning. The paired-transfer browser case rejects zero while preserving the editor, cancels cleanly and reopens the original pair. The Settings case checks the Dashboard Add Transaction shortcut, invalid warning percentage, exact warning amount, independent time-zone/preferences persistence and export review cancellation. Unit tests reject credential fields in nested original-edit snapshots.
