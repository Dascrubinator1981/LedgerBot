BEGIN;
-- Display-only per-owner preferences inherit the existing forced users RLS.
ALTER TABLE ledgerbot.users ADD COLUMN IF NOT EXISTS forecast_preferences TEXT NOT NULL DEFAULT '{}';
INSERT INTO ledgerbot.schema_migrations(version) VALUES(8) ON CONFLICT DO NOTHING;
COMMIT;
