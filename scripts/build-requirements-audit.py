"""Build an auditable line inventory from checked-in specifications only.
Statuses are conservative engineering assessments, not automatic proof from keywords.
Uploaded private history/workbooks are deliberately not read or copied by this script.
"""
import json,re,hashlib,collections
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
SOURCES=['AGENTS.md','CODEX_FIRST_TASK.md','docs/LedgerBot_Codex_Master_Build_Prompt_v3.md','docs/UX_REVIEW_AND_NEXT_STAGES.md','docs/ORIGINAL_CHAT_REQUIREMENTS.md']
MANUAL=['src/lib/domain.ts','src/lib/finance.ts','src/lib/finance-planning.ts','tests/finance.test.ts','tests/correlation.test.ts','e2e/manual.spec.ts']
AUTH=['src/lib/auth.ts','src/lib/provider-auth.ts','src/lib/postgres.ts','migrations/postgres/001_core.sql','tests/postgres.test.ts','e2e-postgres/identity.spec.ts']
# Exact source line assessments where the complete sentence has a narrow verified scope.
VERIFIED={50:('Empty financial start',['tests/finance.test.ts','e2e/manual.spec.ts']),52:('Unknown and explicit zero remain distinct',['src/lib/domain.ts','tests/finance.test.ts']),104:('Paired internal transfers and card payments',['src/lib/finance.ts','tests/finance.test.ts','tests/correlation.test.ts']),108:('Integer monetary storage and arithmetic',['src/lib/domain.ts','tests/finance.test.ts']),110:('Explicit matched actuals reduce planned occurrences',['src/lib/domain.ts','tests/correlation.test.ts']),147:('Manual statement comparison and reviewed locks',['src/lib/reconciliation.ts','src/lib/finance.ts','tests/reconciliation.test.ts']),171:('Truthful disabled live-AI fallback',['src/app/workspace.tsx','docs/INTEGRATIONS.md']),353:('Independent drafting/approval/commit separation',['src/lib/finance.ts','src/app/components.tsx','tests/finance.test.ts']),356:('AI-origin approval rejected',['src/lib/finance.ts','tests/finance.test.ts']),375:('No automatic biometric authentication or unsupported claims',['src/app/components.tsx','docs/SECURITY.md']),404:('Ledger is canonical; allocations do not post twice',MANUAL),428:('Categorization does not debit the bank twice',MANUAL),455:('Human-only approval gateway',['src/lib/finance.ts','tests/finance.test.ts']),489:('Empty signup and resumable setup',['e2e/manual.spec.ts','e2e/experience.spec.ts']),490:('Known zero distinct from unknown',['tests/finance.test.ts','e2e/manual.spec.ts']),503:('Idempotent approval and receipt lookup',['src/lib/finance.ts','src/app/api/receipts/route.ts','e2e/manual.spec.ts'])}

def assess(path,line,text,section):
 if text.startswith('#') or text=='---' or text.startswith('```'):return ('Context','Section heading or formatting; not a completion claim',[])
 if path.endswith('Master_Build_Prompt_v3.md'):
  if line in VERIFIED:return ('Implemented; local evidence',VERIFIED[line][0],VERIFIED[line][1])
  if line==102:return ('Superseded in part','Latest user decision adds explicit start-of-day balances; legacy end-of-day snapshots remain unchanged until reviewed conversion.',['src/lib/domain.ts','tests/finance.test.ts'])
  if section.startswith(('6.','9.')) or any(x in section for x in ['23. RECEIPT','26. DEBT']):return ('Not implemented','Calendar/receipt/debt/savings work remains a later vertical slice; manual balances are not these features.',['docs/INTEGRATIONS.md'])
  if section.startswith(('8.','10.','11.')) or any(x in section for x in ['19.1','19.3','19.4','19.5','25. CONVERSATIONAL']):return ('Partial / not implemented','Only manual accounting, deterministic hints and approval infrastructure exist; connected/LLM/voice/debt features need implementation and vendor validation.',['docs/INTEGRATIONS.md','src/app/workspace.tsx'])
  if section.startswith(('13.','14.','17.','18.')) or line in [390,481,483,507]:return ('Partial / release blocked','Local development evidence exists; hosted recovery, privacy/erasure, independent security/legal/device QA, live integrations and remote CI are not certified.',['docs/SECURITY.md','deploy/README.md','.github/workflows/ci.yml'])
  if line in [54,55,68,70,84,85,86,109,121,122,123,136,149,175,177,179,193,194,195,227,228,229,233,234,235,236,240,241,243,244,246,491,492,494,497,498]:return ('Not implemented','Specified full-product feature is absent or disabled, not completed by a placeholder.', ['docs/INTEGRATIONS.md'])
  if section.startswith('16.'):
   n=re.match(r'(\d+)\.',text);number=int(n.group(1)) if n else 0
   if number in [1,2,3,4,5,6,11,15,16,21,22]:return ('Implemented; local evidence','Synthetic manual accounting/isolation case; physical/vendor paths remain separately gated.',MANUAL+['tests/postgres.test.ts'])
   return ('Partial / not implemented','No completion claim for the whole test scenario; see feature-specific release gaps.',['docs/TEST_PLAN.md'])
  if section.startswith('19.6') or section.startswith(('A.','B.','C.','D.')) or 349<=line<=390:return ('Partial','Approval controls exist, but passkeys, hosted staging and all assistive hardware checks are not complete.',['src/lib/finance.ts','src/app/components.tsx','tests/finance.test.ts','docs/SECURITY.md'])
  return ('Partial','Manual subset has code/tests; this multi-clause statement is not fully satisfied across the complete product.',MANUAL if any(k in section for k in ['4.','7.','20.','21.']) else ['docs/RELEASE_STATUS.md','docs/INTEGRATIONS.md'])
 if path.endswith('ORIGINAL_CHAT_REQUIREMENTS.md'):
  return ('Partial / future feature' if section not in ['Budget Calendar','Debt and Savings'] else 'Not implemented','Privacy-safe extraction of original product intent; the master specification and current user decisions remain authoritative.',['docs/TODAY_UPDATE_REPORT.md','docs/INTEGRATIONS.md'])
 if path=='CODEX_FIRST_TASK.md':return ('Partial','Initial manual slice exists; newer staged changes are being validated and public beta/integration claims remain gated.',MANUAL+AUTH)
 if path=='AGENTS.md':return ('Policy / bounded verification','Governing constraint observed in implementation; local tests/secret scanning cannot prove every attack or accessibility case absent.',['docs/SECURITY.md','.github/workflows/ci.yml'])
 return ('Historical checkpoint / follow-up','Earlier report is retained as dated evidence; consult TODAY_UPDATE_REPORT.md for the current staged implementation and remaining work.',['docs/TODAY_UPDATE_REPORT.md'])

rows=[];digests={}
for source in SOURCES:
 raw=(ROOT/source).read_text();digests[source]=hashlib.sha256(raw.encode()).hexdigest();section='Preamble'
 for number,line in enumerate(raw.splitlines(),1):
  text=line.strip()
  if not text:continue
  if text.startswith('#'):section=text.lstrip('# ').strip()
  status,note,evidence=assess(source,number,text,section)
  evidence=[p for p in evidence if (ROOT/p).exists()]
  rows.append(dict(id=f'{source}:{number}',source=source,line=number,section=section,text=text,status=status,assessment=note,evidence=evidence))
# Latest conversation decisions are separate from document instructions and historical claims.
decisions=[
 ('START','Allow same-day entries from a starting balance; permit an earlier opening date; preserve old snapshots through reviewed conversion.','Implemented; local evidence',['src/lib/domain.ts','src/lib/finance.ts','tests/finance.test.ts']),
 ('MONEY','Do not auto-fill historical amounts; preserve only deliberate editing/resume inputs.','Implemented; local evidence',['src/app/components.tsx','src/app/page-draft.tsx']),
 ('LABELS','Suggest similar categories/descriptions, offer reuse or keep-new, and suggest cleaner names without automatic merges.','Implemented; local evidence',['src/lib/label-suggestions.ts','src/app/label-entry.tsx','tests/label-suggestions.test.ts']),
 ('FORECAST','Dashboard is Forecast: account/budget details left, half-height monthly/weekly graphs right, upcoming weekly expense/bill table.','Implemented; local evidence',['src/app/dashboard-forecast.tsx','src/lib/forecast-dashboard.ts','src/app/forecast-period-chart.tsx']),
 ('RISK','Green/yellow/red textual risk, yellow excludes bills; current overdrafts identify the affected account; unknown is never false green.','Implemented; local evidence',['src/lib/forecast-dashboard.ts','src/app/dashboard-forecast.tsx']),
 ('TABS','Wrap quick actions by default; custom overflow More/Back shifts only the strip; optional hold/swipe must not activate a tab.','Implemented; local evidence',['src/app/quick-actions.tsx','src/app/globals.css']),
 ('PERIOD','Weekly, biweekly, monthly and quarterly targets use exact anchored dates, not estimated weeks/month.','Implemented; local evidence',['src/lib/budget-period.ts','tests/budget-period.test.ts']),
 ('BATCH','Edit/submit multiple page line items, review once on leaving, edit/remove before an atomic independent confirmation.','Implemented; local evidence',['src/app/page-draft.tsx','src/lib/finance.ts','tests/finance.test.ts']),
 ('SAVE','Save incomplete/queued changes privately for later review in Inbox without affecting actuals; resume and refresh approval. Inline unfinished category popups still need restoration support.','Partial; tested named forms and queued changes',['src/lib/saved-reviews.ts','src/lib/proposal-storage.ts','tests/saved-reviews.test.ts']),
 ('EXPIRY','Optional deadline: today, seven days, Saturday or default 30 days. Midnight review wording; day/week automatic cutoff at 1am local.','Implemented; local evidence',['src/lib/review-expiration.ts','tests/saved-reviews.test.ts']),
 ('NOTIFY','Evening in-app reminders, Inbox badges, user preferences; email/text delivery only when configured and validated.','Partial; external delivery blocked',['src/app/page-draft.tsx','src/app/workspace.tsx','docs/INTEGRATIONS.md']),
 ('RESEARCH','Competitor designs and independent customer reviews/ratings; no invented findings.','Blocked by current network access',['docs/UX_REVIEW_AND_NEXT_STAGES.md','docs/ORIGINAL_CHAT_REQUIREMENTS.md']),
 ('HISTORY','Original Budget App history informs vision; private Lovable/account-access claims are not verified instructions.','Reviewed; private details excluded',['docs/TODAY_UPDATE_REPORT.md']),
 ('WORKBOOK','Raw unfinished personal workbook is a conceptual QA reference; inspect privately and substitute fictional fixtures.','Private structural inspection only',['docs/TODAY_UPDATE_REPORT.md']),
 ('CALENDAR','Account-color calendar with due/cleared bills, paydays, holidays, birthdays/anniversaries and two-week reminders.','Not implemented',['docs/INTEGRATIONS.md']),
 ('SUBSCRIPTIONS','Upcoming subscriptions, renewal/trial/price details and user-authorized cancellation assistance; legal/provider feasibility must be checked.','Not implemented; provider/legal work pending',['docs/INTEGRATIONS.md']),
 ('TIPS','One relevant page-specific tip per appearance, rotating without repeatedly showing the same tip; desktop hover help.','Partial / future feature',['src/app/setup-reminders.tsx']),
 ('BILLMATCH','Suggest whether a synced merchant/amount corresponds to a known bill; only user-approved rules, no automatic posting.','Not implemented; bank staging required',['src/lib/finance-planning.ts','docs/INTEGRATIONS.md']),
 ('PIPCOACH','Witty/supportive OpenAI companion across pages, verifiable sourced coaching, no invented certainty, no authority to commit.','Partial boundary only; live service not implemented',['src/lib/finance.ts','src/app/label-entry.tsx','docs/INTEGRATIONS.md']),
 ('EXACT','Use exact confirmed amounts; label unconfirmed estimates visibly; forecasts remain projections rather than bank assertions.','Partial across full product',['src/lib/domain.ts','src/app/dashboard-forecast.tsx']),
 ('RESTOREEXPORT','Reviewed deletion/restore and fresh-human CSV/JSON export, preserving ledger-budget-forecast correlation.','Implemented; local evidence',['src/lib/finance.ts','src/lib/exports.ts','tests/exports.test.ts','tests/correlation.test.ts']),
 ('RECENTBILLS','Show paid bills from the last seven civil days, excluding ordinary expenses.','Implemented; local evidence',['src/lib/insights.ts','tests/correlation.test.ts']),
 ('HOSTING','No publication, paid activation or real bank/customer import without separate reviewed authorization; support novice Windows/iPhone/Deck testing.','Partial; hosted and hardware gates outstanding',['deploy/README.md','docs/DEVICE_TESTING_GUIDE.md']),
 ('MANUALFLEX','Allow same-day/backdated manual entries with reviewed apply/already-included balance treatment; preserve existing records and statement locks.','Implemented; local evidence',['src/lib/domain.ts','src/lib/finance.ts','tests/manual-entry.test.ts','docs/MANUAL_ENTRY_UPDATE_REPORT.md']),
 ('PENDINGPLAN','Approved pending/planned records appear as dotted budget spending and cash projections; clearing updates one record without a second expense.','Implemented; local evidence',['src/lib/insights.ts','src/app/finance-views.tsx','e2e/helpers/manual-entry-flow.ts']),
 ('READABLESOURCE','Human edits clean up bank/receipt labels while preserving raw source evidence and matching to one canonical transaction.','Planned connected/receipt layer; manual label edits work',['docs/MANUAL_AND_CONNECTED_RECORDS.md','tests/manual-entry.test.ts']),
 ('LEDGERREGISTER','Open Ledger on line-by-line posted transactions and per-account balances; compact Add/Edit/Transfer actions, categories, running balances and vertical mobile rows.','Implemented; local evidence',['src/app/workspace.tsx','src/lib/insights.ts','e2e/manual.spec.ts','docs/LEDGER_REGISTER_REPORT.md']),
 ('SUPPORT','Opt-in diagnostic dialog pairs browser actions with safe financial-server responses and a downloadable report; no private values or automatic uploads.','Implemented locally; hosted operations remain future work',['src/lib/troubleshooting.ts','src/lib/support-response.ts','src/app/troubleshooting-panel.tsx','tests/troubleshooting.test.ts','docs/TROUBLESHOOTING.md']),
 ('HOUSEHOLD','Separate partner logins, accepted invitations, explicitly shared/private accounts, live approved updates and attribution.','Planned; not implemented',['docs/HOUSEHOLD_APPROVAL_PLAN.md']),
 ('JOINTAPPROVAL','Approval Rules list with either/both partners, configurable action/amount thresholds, same-version approvals and no AI confirmation.','Planned; not implemented',['docs/HOUSEHOLD_APPROVAL_PLAN.md']),
 ('PLAINSETTINGS','Replace programmer jargon with everyday wording across settings, forms, errors and confirmation; technical detail behind More details.','Partial; complete Settings pass pending',['docs/HOUSEHOLD_APPROVAL_PLAN.md','src/app/troubleshooting-panel.tsx','docs/SPLIT_ENTRY_FEEDBACK_REPORT.md']),
 ('EXHAUSTIVE','Audit each requirement and test meaningful UI/input/auth/failure paths; never claim all possible failures are proven absent.','In progress',['docs/REQUIREMENTS_AUDIT.md','docs/TEST_PLAN.md']),
]
for ident,text,status,evidence in decisions:rows.append(dict(id='conversation:'+ident,source='Latest user conversation',line=None,section='User requests (latest precedence)',text=text,status=status,assessment='User request, not a command extracted from an attachment.',evidence=evidence))
result={'as_of':'2026-11-06','scope':'Every nonblank line of the listed repository instruction/follow-up documents plus explicit latest conversation decisions. A line containing several requirements remains partial unless all are supported. Private transcript/account data and workbook cells are not copied.','source_sha256':digests,'status_counts':dict(collections.Counter(r['status'] for r in rows)),'requirements':rows}
(ROOT/'docs/REQUIREMENTS_AUDIT.json').write_text(json.dumps(result,indent=2)+'\n')
escape=lambda s:s.replace('|','\\|').replace('\n',' ')
md=['# Requirement-by-requirement audit — November 6, 2026','',result['scope'],'','This is a conservative coverage audit, not certification that the entire application is complete. “Implemented; local evidence” points to existing relevant code/tests; final executed counts and new-stage outcomes are in TODAY_UPDATE_REPORT.md. A complete row can still have separate hosted/physical release gates. Older assistant claims and the raw unfinished workbook are not authoritative requirements. Latest explicit user decisions supersede older conflicting wording.','', 'The JSON companion contains full source lines, SHA-256 source fingerprints and evidence paths; the table below abbreviates text for scanning. Run `python3 scripts/build-requirements-audit.py` after changing a source document. This does not run tests or infer success.','', '| Source line / decision | Requirement (abbreviated) | Status | Assessment / evidence |','| --- | --- | --- | --- |']
for r in rows:
 if r['status']=='Context':continue
 text=r['text'];short=text[:175]+('…' if len(text)>175 else '')
 evidence=', '.join(f'`{p}`' for p in r['evidence'])
 md.append('| '+escape(r['id'])+' | '+escape(short)+' | '+r['status']+' | '+escape(r['assessment'])+' '+evidence+' |')
(ROOT/'docs/REQUIREMENTS_AUDIT.md').write_text('\n'.join(md)+'\n')
print(f'Inventoried {len(rows)} source lines/decisions; no private uploaded content copied.')
