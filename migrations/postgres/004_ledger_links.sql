BEGIN;
ALTER TABLE ledgerbot.transactions ADD COLUMN IF NOT EXISTS recurrence_ref uuid GENERATED ALWAYS AS ((data->'occurrence'->>'recurrenceId')::uuid) STORED;
ALTER TABLE ledgerbot.transactions ADD COLUMN IF NOT EXISTS entry_date date GENERATED ALWAYS AS (make_date(substring(data->>'date',1,4)::int,substring(data->>'date',6,2)::int,substring(data->>'date',9,2)::int)) STORED;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='transaction_schedule_owner' AND conrelid='ledgerbot.transactions'::regclass) THEN
  ALTER TABLE ledgerbot.transactions ADD CONSTRAINT transaction_schedule_owner FOREIGN KEY(recurrence_ref,user_id) REFERENCES ledgerbot.recurrences(id,user_id);
  ALTER TABLE ledgerbot.transactions ADD CONSTRAINT transaction_flow CHECK(NOT(data ? 'flow') OR (jsonb_typeof(data->'flow')='string' AND ((data->>'flow'='expense' AND money_minor<0) OR (data->>'flow' IN ('income','refund') AND money_minor>0))));
  ALTER TABLE ledgerbot.transactions ADD CONSTRAINT transaction_occurrence_shape CHECK(NOT(data ? 'occurrence') OR data->'occurrence'='null'::jsonb OR (jsonb_typeof(data->'occurrence')='object' AND (data->'occurrence') ?& ARRAY['recurrenceId','dueDate','settles'] AND jsonb_typeof(data->'occurrence'->'settles')='boolean'));
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS transactions_owner_occurrence ON ledgerbot.transactions(user_id,recurrence_ref);
INSERT INTO ledgerbot.schema_migrations(version) VALUES(4) ON CONFLICT DO NOTHING;
COMMIT;
