BEGIN;
ALTER TABLE ledgerbot.users ADD COLUMN IF NOT EXISTS security_changed_at bigint NOT NULL DEFAULT 0;
DO $$ BEGIN
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='account_payload_required' AND conrelid='ledgerbot.accounts'::regclass) THEN
  ALTER TABLE ledgerbot.accounts ADD CONSTRAINT account_payload_required CHECK(jsonb_typeof(data)='object' AND data ?& ARRAY['id','name','type','opening','asOf','currency'] AND jsonb_typeof(data->'opening') IN ('number','null') AND data->>'type' IN ('checking','savings','cash','credit','loan','asset','liability') AND data->>'asOf' ~ '^\d{4}-\d{2}-\d{2}$');
  ALTER TABLE ledgerbot.accounts ALTER COLUMN as_of SET NOT NULL;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='transaction_payload_required' AND conrelid='ledgerbot.transactions'::regclass) THEN
  ALTER TABLE ledgerbot.transactions ADD CONSTRAINT transaction_payload_required CHECK(jsonb_typeof(data)='object' AND data ?& ARRAY['id','accountId','date','description','amount','status','splits','transferId','reconciledAt'] AND jsonb_typeof(data->'amount')='number' AND jsonb_typeof(data->'splits')='array' AND length(data->>'description') BETWEEN 1 AND 100 AND data->>'date' ~ '^\d{4}-\d{2}-\d{2}$');
  ALTER TABLE ledgerbot.transactions ALTER COLUMN money_minor SET NOT NULL;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='budget_payload_required' AND conrelid='ledgerbot.budgets'::regclass) THEN
  ALTER TABLE ledgerbot.budgets ADD CONSTRAINT budget_payload_required CHECK(data ?& ARRAY['id','categoryId','month','target'] AND data->>'month'=month AND jsonb_typeof(data->'target')='number');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='category_payload_required' AND conrelid='ledgerbot.categories'::regclass) THEN
  ALTER TABLE ledgerbot.categories ADD CONSTRAINT category_payload_required CHECK(data ?& ARRAY['id','name'] AND jsonb_typeof(data->'name')='string');
 END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='recurrence_payload_required' AND conrelid='ledgerbot.recurrences'::regclass) THEN
  ALTER TABLE ledgerbot.recurrences ADD CONSTRAINT recurrence_payload_required CHECK(data ?& ARRAY['id','accountId','name','amount','start','cadence','clearingDays'] AND jsonb_typeof(data->'amount')='number' AND (data->>'amount')::bigint<>0 AND (data->>'clearingDays')::integer BETWEEN 0 AND 30);
 END IF;
END $$;
CREATE INDEX IF NOT EXISTS accounts_owner ON ledgerbot.accounts(user_id);
CREATE INDEX IF NOT EXISTS categories_owner ON ledgerbot.categories(user_id);
CREATE INDEX IF NOT EXISTS budgets_owner_month ON ledgerbot.budgets(user_id,month);
CREATE INDEX IF NOT EXISTS recurrences_owner ON ledgerbot.recurrences(user_id);
INSERT INTO ledgerbot.schema_migrations(version) VALUES(2) ON CONFLICT DO NOTHING;
COMMIT;
