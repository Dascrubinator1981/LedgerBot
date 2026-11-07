# Integration boundaries

No vendor SDKs/keys, fake successes, microphones, bank connections, OCR, paid subscriptions or payment endpoints. Settings labels these disabled. No data is sent to a model.

Future adapters must use narrow typed draft/staging interfaces, isolated from the human review gateway. `operationSchema` defines supported proposals. No model may receive database connections, arbitrary HTTP tools, human session cookies or challenges.

| Adapter        | Future requirements                                                         | Status                                |
| -------------- | --------------------------------------------------------------------------- | ------------------------------------- |
| Pip chat/voice | Server keys, consent, retention, ephemeral sessions, rate/cost limits       | Disabled; deterministic guidance only |
| Bank           | Sandbox, encrypted tokens, verified webhooks, staging/dedupe/reconciliation | Not started                           |
| OCR            | Private storage, file checks, exact matching/splits, field confidence       | Not started; manual splits work       |
| Billing        | Test-mode webhooks/entitlements, explicit launch approval                   | Not started                           |
| MCP            | Scoped read/draft principal, no approvals                                   | Not started                           |
| Passkey        | Deliberately initiated proposal-bound WebAuthn                              | Not started                           |

No vendor credentials are needed for this milestone. Register and test sandbox providers only in later tasks; no production keys or fees now.
