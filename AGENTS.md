# AGENTS.md — LedgerBot coding agent rules

This file governs any coding agent in this repo, including Codex.

- Read `docs/LedgerBot_Codex_Master_Build_Prompt_v3.md` for the complete product contract. Sections 20–28 are the newest agreed product decisions and supersede older sections on conflicts.
- Read `docs/UX_REVIEW_AND_NEXT_STAGES.md` for the November 6 user-tested follow-up decisions, including Dashboard Forecaster and proposed saved-review behavior. It distinguishes implemented work from future stages; do not claim planned reminders or deferred approvals are live.
- Consult `docs/TODAY_UPDATE_REPORT.md` and `docs/REQUIREMENTS_AUDIT.md` for current implemented behavior and remaining gates; older reports are dated checkpoints.
- Build and validate vertical slices, not UI mockups with fake buttons. A feature is complete only when the user flow, persistent database, backend authorization, happy path and negative tests function.
- This repository must contain **no real user financial data**, original/personal workbook, secrets, account IDs, access tokens, private receipts or raw recordings. Use wholly fabricated fixtures and synthetic demo opt-in only.
- All new users start with no financial records. Unknown/unconfigured is different from a confirmed zero. Never preload or silently use demo data for a new account.
- Ledger is canonical actuals; Budget is a PLAN plus actuals comparison; Forecaster is an estimated projection with documented assumptions; Pip drafts explanations and proposals. No double posting from categories, savings goals, receipts, card payments or linked transfers.
- Use integer minor currency units or an exact decimal library. Validate inputs, balance transfers atomically, use tenant-scoped access/RLS, require explicit approval workflow for every ledger and financial-plan update.
- **Pip cannot commit any financial change**, even if the user verbally says yes. An independent trusted UI and backend-gated single-use approval tied to proposal ID/version/hash is required. Slide-to-confirm default; WCAG 2.2 AA non-drag alternative. Biometrics only after user initiates an explicit approval step.
- Vendor integrations are feature-flagged and truthful: OpenAI, bank sync, OCR, Stripe, voice, and ChatGPT MCP must not pretend to be live if not actually configured/tested. Never put API keys in client bundles.
- Prefer TypeScript strict mode, shared schemas, concise modules, tests for money and authorization, accessible mobile-first design, GitHub Actions. Keep changes reviewable in pull requests, with exact executed commands and honest limitations.
- No public deployment, paid billing activation, deletion of user data, or direct banking/payment actions without explicit owner permission.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
