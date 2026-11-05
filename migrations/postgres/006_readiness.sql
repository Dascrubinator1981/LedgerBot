BEGIN;
-- Application may inspect schema version metadata but cannot alter migrations.
GRANT SELECT ON ledgerbot.schema_migrations TO ledgerbot_server;
INSERT INTO ledgerbot.schema_migrations(version) VALUES(6) ON CONFLICT DO NOTHING;
COMMIT;
