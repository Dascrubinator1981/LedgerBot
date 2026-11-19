BEGIN;
ALTER TABLE ledgerbot.users ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'Etc/UTC';
CREATE UNIQUE INDEX IF NOT EXISTS recurrences_id_owner ON ledgerbot.recurrences(id,user_id);
CREATE TABLE IF NOT EXISTS ledgerbot.occurrences(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),recurrence_id uuid NOT NULL,due_date text NOT NULL,data jsonb NOT NULL,
 UNIQUE(user_id,recurrence_id,due_date),FOREIGN KEY(recurrence_id,user_id) REFERENCES ledgerbot.recurrences(id,user_id),CHECK(data ?& ARRAY['id','recurrenceId','dueDate','expectedClearDate','amount','status']),CHECK(data->>'id'=id::text),CHECK(data->>'recurrenceId'=recurrence_id::text),CHECK(data->>'dueDate'=due_date),CHECK(data->>'status' IN ('unpaid','skipped')),CHECK((data->>'amount')::bigint BETWEEN -100000000000 AND 100000000000));
ALTER TABLE ledgerbot.occurrences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ledgerbot.occurrences FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS owner_only ON ledgerbot.occurrences;
CREATE POLICY owner_only ON ledgerbot.occurrences USING(user_id=ledgerbot.viewer()) WITH CHECK(user_id=ledgerbot.viewer());
GRANT SELECT,INSERT,UPDATE,DELETE ON ledgerbot.occurrences TO ledgerbot_server;
GRANT SELECT ON ledgerbot.occurrences TO ledgerbot_reader;
CREATE INDEX IF NOT EXISTS occurrences_owner_due ON ledgerbot.occurrences(user_id,due_date);
INSERT INTO ledgerbot.schema_migrations(version) VALUES(3) ON CONFLICT DO NOTHING;
COMMIT;
