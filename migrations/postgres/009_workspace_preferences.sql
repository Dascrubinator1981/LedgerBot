BEGIN;
-- Owner-scoped layout preferences use the existing forced users RLS.
ALTER TABLE ledgerbot.users ADD COLUMN IF NOT EXISTS workspace_preferences TEXT NOT NULL DEFAULT '{}';
INSERT INTO ledgerbot.schema_migrations(version) VALUES(9) ON CONFLICT DO NOTHING;
COMMIT;
