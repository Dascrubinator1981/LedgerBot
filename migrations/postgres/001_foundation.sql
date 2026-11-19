-- Applied by a migration administrator, never by the normal app connection.
BEGIN;
CREATE SCHEMA IF NOT EXISTS ledgerbot;
CREATE TABLE IF NOT EXISTS ledgerbot.schema_migrations(version integer PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now());
CREATE OR REPLACE FUNCTION ledgerbot.viewer() RETURNS uuid LANGUAGE sql STABLE SET search_path=pg_catalog AS $$ SELECT nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
CREATE TABLE IF NOT EXISTS ledgerbot.users(id uuid PRIMARY KEY,email text NOT NULL UNIQUE,password text,revision bigint NOT NULL DEFAULT 0,setup text NOT NULL DEFAULT 'needs-review',promotions integer NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS ledgerbot.sessions(hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),expires bigint NOT NULL,csrf text NOT NULL,principal text NOT NULL CHECK(principal IN ('human','ai')),created_at bigint NOT NULL DEFAULT (extract(epoch FROM clock_timestamp())*1000)::bigint,UNIQUE(hash,user_id));
CREATE TABLE IF NOT EXISTS ledgerbot.accounts(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),data jsonb NOT NULL,
 UNIQUE(id,user_id),CHECK(data->>'id'=id::text),CHECK(data->>'currency'='USD'),CHECK(length(data->>'name') BETWEEN 1 AND 100),
 opening_minor bigint GENERATED ALWAYS AS ((data->>'opening')::bigint) STORED,as_of date GENERATED ALWAYS AS (make_date(substring(data->>'asOf',1,4)::int,substring(data->>'asOf',6,2)::int,substring(data->>'asOf',9,2)::int)) STORED,
 CHECK(opening_minor BETWEEN -100000000000 AND 100000000000));
CREATE TABLE IF NOT EXISTS ledgerbot.categories(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),data jsonb NOT NULL,UNIQUE(id,user_id),CHECK(data->>'id'=id::text),CHECK(length(data->>'name') BETWEEN 1 AND 100));
CREATE TABLE IF NOT EXISTS ledgerbot.transfers(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),UNIQUE(id,user_id));
CREATE TABLE IF NOT EXISTS ledgerbot.transactions(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),account_id uuid NOT NULL,transfer_id uuid,data jsonb NOT NULL,
 UNIQUE(id,user_id),FOREIGN KEY(account_id,user_id) REFERENCES ledgerbot.accounts(id,user_id),FOREIGN KEY(transfer_id,user_id) REFERENCES ledgerbot.transfers(id,user_id),
 money_minor bigint GENERATED ALWAYS AS ((data->>'amount')::bigint) STORED,
 CHECK(money_minor BETWEEN -100000000000 AND 100000000000 AND money_minor<>0),CHECK(data->>'id'=id::text),CHECK(data->>'accountId'=account_id::text),CHECK(data->>'status' IN ('pending','cleared')),CHECK((data->>'transferId') IS NOT DISTINCT FROM transfer_id::text));
CREATE TABLE IF NOT EXISTS ledgerbot.allocations(transaction_id uuid NOT NULL,user_id uuid NOT NULL,category_id uuid NOT NULL,amount bigint NOT NULL CHECK(amount BETWEEN -100000000000 AND 100000000000),
 FOREIGN KEY(transaction_id,user_id) REFERENCES ledgerbot.transactions(id,user_id) ON DELETE CASCADE,FOREIGN KEY(category_id,user_id) REFERENCES ledgerbot.categories(id,user_id),UNIQUE(transaction_id,category_id));
CREATE TABLE IF NOT EXISTS ledgerbot.budgets(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),category_id uuid NOT NULL,month text NOT NULL,data jsonb NOT NULL,
 UNIQUE(user_id,category_id,month),FOREIGN KEY(category_id,user_id) REFERENCES ledgerbot.categories(id,user_id),CHECK(data->>'id'=id::text),CHECK(data->>'categoryId'=category_id::text),CHECK(month ~ '^\d{4}-(0[1-9]|1[0-2])$'),CHECK((data->>'target')::bigint BETWEEN 0 AND 100000000000));
CREATE TABLE IF NOT EXISTS ledgerbot.recurrences(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),account_id uuid NOT NULL,data jsonb NOT NULL,
 FOREIGN KEY(account_id,user_id) REFERENCES ledgerbot.accounts(id,user_id),CHECK(data->>'id'=id::text),CHECK(data->>'accountId'=account_id::text),CHECK((data->>'amount')::bigint BETWEEN -100000000000 AND 100000000000),CHECK(data->>'cadence' IN ('weekly','biweekly','monthly')));
CREATE TABLE IF NOT EXISTS ledgerbot.reconciliations(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),account_id uuid NOT NULL,data jsonb NOT NULL,FOREIGN KEY(account_id,user_id) REFERENCES ledgerbot.accounts(id,user_id));
CREATE TABLE IF NOT EXISTS ledgerbot.proposals(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),data text NOT NULL,UNIQUE(id,user_id));
CREATE TABLE IF NOT EXISTS ledgerbot.challenges(hash text PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),session_hash text NOT NULL,proposal_id uuid NOT NULL,digest text NOT NULL,version integer NOT NULL,expires bigint NOT NULL,used integer NOT NULL DEFAULT 0,
 FOREIGN KEY(proposal_id,user_id) REFERENCES ledgerbot.proposals(id,user_id),FOREIGN KEY(session_hash,user_id) REFERENCES ledgerbot.sessions(hash,user_id));
CREATE TABLE IF NOT EXISTS ledgerbot.receipts(proposal_id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),idempotency_key text NOT NULL,data jsonb NOT NULL,UNIQUE(user_id,idempotency_key),FOREIGN KEY(proposal_id,user_id) REFERENCES ledgerbot.proposals(id,user_id));
CREATE TABLE IF NOT EXISTS ledgerbot.audit(id uuid PRIMARY KEY,user_id uuid NOT NULL REFERENCES ledgerbot.users(id),proposal_id uuid NOT NULL,event text NOT NULL,created bigint NOT NULL);
-- Constraint triggers verify final state, so a transaction may temporarily contain only one leg.
CREATE OR REPLACE FUNCTION ledgerbot.check_pair() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,ledgerbot AS $$
DECLARE pair uuid; owner uuid; n integer; total numeric;
BEGIN
 pair:=coalesce(NEW.transfer_id,OLD.transfer_id);owner:=coalesce(NEW.user_id,OLD.user_id);
 IF pair IS NULL THEN RETURN NULL;END IF;
 SELECT count(*),coalesce(sum(money_minor),0) INTO n,total FROM ledgerbot.transactions WHERE transfer_id=pair AND user_id=owner;
 IF EXISTS(SELECT 1 FROM ledgerbot.transfers WHERE id=pair AND user_id=owner) AND (n<>2 OR total<>0) THEN RAISE EXCEPTION 'Invalid transfer pair';END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS transaction_pair ON ledgerbot.transactions;
CREATE CONSTRAINT TRIGGER transaction_pair AFTER INSERT OR UPDATE OR DELETE ON ledgerbot.transactions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledgerbot.check_pair();
CREATE OR REPLACE FUNCTION ledgerbot.check_group() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,ledgerbot AS $$
BEGIN
 IF EXISTS(SELECT 1 FROM ledgerbot.transfers WHERE id=NEW.id AND user_id=NEW.user_id)
 AND (SELECT count(*)<>2 OR coalesce(sum(money_minor),0)<>0 FROM ledgerbot.transactions WHERE transfer_id=NEW.id AND user_id=NEW.user_id) THEN RAISE EXCEPTION 'Invalid transfer pair';END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS transfer_pair ON ledgerbot.transfers;
CREATE CONSTRAINT TRIGGER transfer_pair AFTER INSERT OR UPDATE ON ledgerbot.transfers DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledgerbot.check_group();
CREATE OR REPLACE FUNCTION ledgerbot.check_allocations() RETURNS trigger LANGUAGE plpgsql SET search_path=pg_catalog,ledgerbot AS $$
DECLARE tid uuid; owner uuid; entry ledgerbot.transactions%ROWTYPE; n integer; total numeric;
BEGIN
 IF TG_TABLE_NAME='transactions' THEN tid:=coalesce(NEW.id,OLD.id);ELSE tid:=coalesce(NEW.transaction_id,OLD.transaction_id);END IF;
 owner:=coalesce(NEW.user_id,OLD.user_id);
 SELECT * INTO entry FROM ledgerbot.transactions WHERE id=tid AND user_id=owner;IF NOT FOUND THEN RETURN NULL;END IF;
 SELECT count(*),coalesce(sum(amount),0) INTO n,total FROM ledgerbot.allocations WHERE transaction_id=tid AND user_id=owner;
 IF n<>jsonb_array_length(entry.data->'splits') OR (n>0 AND (total<>entry.money_minor OR entry.transfer_id IS NOT NULL)) THEN RAISE EXCEPTION 'Invalid category allocation sum';END IF;
 IF EXISTS(SELECT 1 FROM jsonb_array_elements(entry.data->'splits') s LEFT JOIN ledgerbot.allocations a ON a.transaction_id=tid AND a.user_id=owner AND a.category_id=(s->>'categoryId')::uuid WHERE a.amount IS DISTINCT FROM (s->>'amount')::bigint) THEN RAISE EXCEPTION 'Invalid category allocation';END IF;
 RETURN NULL;
END $$;
DROP TRIGGER IF EXISTS transaction_allocations ON ledgerbot.transactions;
CREATE CONSTRAINT TRIGGER transaction_allocations AFTER INSERT OR UPDATE ON ledgerbot.transactions DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledgerbot.check_allocations();
DROP TRIGGER IF EXISTS allocation_balance ON ledgerbot.allocations;
CREATE CONSTRAINT TRIGGER allocation_balance AFTER INSERT OR UPDATE OR DELETE ON ledgerbot.allocations DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION ledgerbot.check_allocations();
DO $$ DECLARE t text;BEGIN
 FOREACH t IN ARRAY ARRAY['users','sessions','accounts','categories','transfers','transactions','allocations','budgets','recurrences','reconciliations','proposals','challenges','receipts','audit'] LOOP
 EXECUTE format('ALTER TABLE ledgerbot.%I ENABLE ROW LEVEL SECURITY',t);
 EXECUTE format('ALTER TABLE ledgerbot.%I FORCE ROW LEVEL SECURITY',t);
 EXECUTE format('DROP POLICY IF EXISTS owner_only ON ledgerbot.%I',t);
 EXECUTE format('CREATE POLICY owner_only ON ledgerbot.%I USING (%I=ledgerbot.viewer()) WITH CHECK (%I=ledgerbot.viewer())',t,CASE WHEN t='users' THEN 'id' ELSE 'user_id' END,CASE WHEN t='users' THEN 'id' ELSE 'user_id' END);
 END LOOP;
END $$;
CREATE INDEX IF NOT EXISTS transactions_owner_account ON ledgerbot.transactions(user_id,account_id);
CREATE INDEX IF NOT EXISTS transactions_owner_transfer ON ledgerbot.transactions(user_id,transfer_id);
CREATE INDEX IF NOT EXISTS proposals_owner ON ledgerbot.proposals(user_id);
CREATE INDEX IF NOT EXISTS reconciliations_owner_account ON ledgerbot.reconciliations(user_id,account_id);
CREATE INDEX IF NOT EXISTS sessions_owner ON ledgerbot.sessions(user_id);
REVOKE ALL ON SCHEMA ledgerbot FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA ledgerbot FROM PUBLIC;
-- Roles are group roles; deployment assigns a non-owner, non-superuser login to the server group.
DO $$ BEGIN IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='ledgerbot_server') THEN CREATE ROLE ledgerbot_server NOLOGIN NOSUPERUSER NOBYPASSRLS;END IF;
 IF NOT EXISTS(SELECT FROM pg_roles WHERE rolname='ledgerbot_reader') THEN CREATE ROLE ledgerbot_reader NOLOGIN NOSUPERUSER NOBYPASSRLS;END IF;END $$;
GRANT USAGE ON SCHEMA ledgerbot TO ledgerbot_server,ledgerbot_reader;
GRANT EXECUTE ON FUNCTION ledgerbot.viewer() TO ledgerbot_server,ledgerbot_reader;
GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA ledgerbot TO ledgerbot_server;
REVOKE ALL ON ledgerbot.schema_migrations FROM ledgerbot_server;
GRANT SELECT ON ledgerbot.accounts,ledgerbot.categories,ledgerbot.transactions,ledgerbot.allocations,ledgerbot.budgets,ledgerbot.recurrences TO ledgerbot_reader;
INSERT INTO ledgerbot.schema_migrations(version) VALUES(1) ON CONFLICT DO NOTHING;
COMMIT;
