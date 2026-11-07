# Split-entry feedback follow-up — November 6, 2026

The owner's screenshot contains a $185 expense with $80/$50/$55 splits and tomorrow's date. Those splits balance exactly. The visible rejection is the existing future-date rule; Pending does not bypass it. A prior screenshot showed unfinished edits and zero prepared changes, so the leave-page review button was disabled. Neither screenshot proves the result of a valid today-dated submission.

## Change

- The transaction form shows today's date in the workspace timezone and explains Pending in ordinary language.
- The server's future-date rejection names the permitted date/timezone and explains how a future bill differs from an existing pending payment. Validation still runs on the trusted server; no date or approval checks were relaxed.
- Successful financial form preparation displays an explicit success notice and moves keyboard focus/view to Page changes. Preparing does not post an expense or change a balance.
- The leave-page dialog explains how to resolve an unprepared entry instead of displaying only a disabled review button.

## Regression

The browser scenario uses fictional records only. It creates a $1,000 opening, three categories and a $100 grocery target. Tomorrow's $185 purchase is rejected for both Cleared and Pending, preserves form input and leaves the transaction table empty. Leaving shows the explanation. Correcting to today and Cleared removes the old error, focuses the queue and displays success. Independent approval then produces one -$185 expense, splits -$80/-$50/-$55, balance $815, grocery spending $80 and remaining target $20. Reconciliation and automatic Forecast are checked afterward.

The valid-today failure reported on the Windows machine has not been reproduced locally. This change fixes unclear feedback and confirms the documented flow, rather than asserting an unknown Windows failure is solved. Windows Firefox remains a physical-device verification step.

## Opt-in troubleshooting added

[The troubleshooting guide](TROUBLESHOOTING.md) explains the new session-only diagnostic dialog. It pairs button/navigation/field-edit codes with safe server status, stage and request ID. It captures generic browser-error markers, network failures and unreadable replies without raw exception text, request/response bodies, credentials or financial values. Recording starts off, has a 200-step limit, and clears on refresh/sign-out. The user explicitly downloads a sanitized report; nothing uploads automatically. It is not a memory dump or complete account audit log.

The enhanced fictional split flow also injects a failed connection and malformed server reply, checks that input survives and records remain empty, then independently confirms the valid purchase. It downloads and parses the support report, checks privacy exclusions and safe server IDs, and clears the recorder. An initial diagnostic assertion was incorrectly placed after page refresh; it was moved before refresh because erasure on refresh is intended.

The first static check caught diagnostic timing inside a React component; timing was moved into the dedicated transport helper without disabling lint rules. Current normal tests include five new recorder/transport/header privacy tests. A later PostgreSQL test encountered two legitimate status messages when the evening review reminder became due alongside a save receipt; receipt assertions now select the Change saved message specifically. The saved-review test still verifies one transaction and completed-source status.

## Final executed validation

- TypeScript and ESLint: passed, with existing lint rules retained.
- Normal suite: 133 tests across 21 files passed.
- Local Chromium: all 12 scenarios passed, including injected connection/JSON failures, diagnostic export and exact accounting.
- Verified identity/PostgreSQL Chromium: all 7 scenarios passed on the final run, including completed saved-review source, single posting, isolation and recovery.
- Production build and compiled-production CSP/hydration/fail-closed browser scenario: passed (1 scenario).
- Full and production-only npm audits: zero vulnerabilities.
- Repository secret guard: passed for all 182 selected files. Pattern scanning does not prove absence of every possible secret.
- Container packaging and non-root/read-only runtime checks passed. The exact image `sha256:723cad5f1ef0a5491408975f2786922831c8670ad5c57c8178ae79e59b2a21cd` had zero HIGH and zero CRITICAL findings, observed November 6, 2026 at 1:44 p.m. America/Denver. This does not claim lower findings are absent or replace an independent review.

Browser validation used Linux Chromium. It does not establish physical Windows Firefox, iPhone or Steam Deck behavior. Hosted services, independent privacy/security/accessibility review and operational release gates are still unfinished. Centralized support uploads and long-term logs are not enabled. No deployment, real financial data or paid service was used.
