# Deployment gates

No hosting workflow, public deployment, real bank connection or billing activation. CI validates only. Development server binds to loopback.

Before controlled staging: managed Postgres RLS, least privilege, TLS/canonical origin/Secure cookies, encrypted storage, auth recovery, retention/export/undo, recurrence matching, backup/recovery and independent security/accessibility review. SQLite is not suitable for ephemeral/serverless or multi-replica hosting. Separate fabricated-only dev/test databases from any production system.

Build success or publication of a cloud development environment does not authorize app deployment. Public launch, real banks/data and paid billing require explicit owner approval after release gates pass.
