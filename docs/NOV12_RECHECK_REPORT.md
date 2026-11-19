# November 12 recheck and restaging

The restored cloud checkout initially contained an older work branch. Validation uses the actual review candidate `01b5ece` plus the fixes described here. It does not downgrade records or deploy the app.

## Changes found

Recurring-schedule edits cleared the editor before validation returned. A rejected amount/delay could lose editing context, and Cancel schedule edit could leave a false unfinished-page warning. The editor now clears only after successful staging; cancellation clears the form's dirty marker without changing approved financial records.

Reopening an edited staged schedule also needs the original schedule identity. The form retains that ID through draft restore so preparation updates the intended record instead of creating another schedule. A browser regression checks failed preparation, canceled navigation, staged editing, one resulting schedule and zero cash transactions. Older saved-form names still route to the recurrence editor. An older incomplete edit without a recoverable target is blocked with instructions to discard it and choose Edit schedule again, rather than infer a target or create a duplicate.

The user-facing fields and main fictional money checkpoints have not changed. Laptop L-BILLS-B Steps 9–10, iPhone P-BILLS-A Steps 7–8, and the findings template now explicitly cover these paths. Existing section IDs remain stable. A reproducible `scripts/build-owner-test-pack.py` builds an offline HTML/ZIP pack, validates section IDs and step numbering, and verifies the archive contents.

## Hosted Supabase versus isolated testing

The available GitHub connection can fetch the repository. GitHub reports no repository deployment environments or deployments; Actions secret metadata returns Resource not accessible by integration. This does not prove that no secret exists. Runtime readiness reports no configured Supabase secrets/variables and no Supabase management connector is available. Signing into Supabase with GitHub or associating a repository does not delegate project management to this connection.

The PostgreSQL/Auth/mail services used for tests are isolated synthetic services, not the owner's hosted Supabase project. No hosted keep-alive was installed, hosted activity/reset/unpause is not verified, and no billing was activated. Do not claim these local tests prevent a Free project from pausing. Dependable pause avoidance requires checking the current provider plan/settings; any paid change needs owner authorization. Do not put service-role keys, database passwords or personal financial data in GitHub or chat.

## Verification

TypeScript and ESLint passed. All 147 normal tests (23 files), 18 PostgreSQL/encryption tests (four files), and the encrypted backup/restore drill passed. Full and production-only npm audits reported zero vulnerabilities. The repository guard passed across 197 tracked files. The final unchanged-source local Chromium run passed all 15 scenarios, including the strengthened schedule and troubleshooting paths. All eight verified-identity/PostgreSQL browser scenarios passed. The optimized production build passed, followed by its compiled-production browser scenario (1/1): 24 distinct passing browser scenarios overall. Remote GitHub Actions results are separate and are not claimed passed here. Intermediate runs exposed the schedule identity defect above. Source edits during development-server tests also cleared the in-memory troubleshooting recorder; final recording checks must run without hot reload. A recording ending after refresh/reload is documented behavior, not evidence of complete persistent activity logging.

The final isolated production artifact passed non-root/read-only packaging and fail-closed unconfigured-finance checks. Image `sha256:4eb4f635aaf3f1de21c66df5001ec3bbf781e9af2363b5404449bbedf1a77e9d` had zero HIGH and zero CRITICAL findings, observed November 12, 2026 at 18:34:16 UTC with the pinned official scanner. This does not claim lower-severity findings absent or replace independent review. An earlier intermediate artifact was also scanned; only the final artifact above represents the completed runtime source changes.

## What is still not established

Hosted Supabase project health/activity, a deployed private HTTPS beta, real-inbox delivery, physical iPhone/Windows Firefox behavior, independent security/accessibility review and the larger disabled integration/household/calendar/debt/savings features remain unverified or unfinished. No application deployment or merge is authorized by restaging this review candidate. Earlier reports describe their own artifacts and checks, not this new restage.
