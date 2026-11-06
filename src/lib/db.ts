import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export function openDatabase(
  path = process.env.LEDGERBOT_DATABASE_PATH || "./data/ledgerbot.sqlite",
) {
  if (path !== ":memory:")
    mkdirSync(dirname(resolve(path)), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(path);
  db.exec(
    "PRAGMA foreign_keys=ON; PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;",
  );
  migrate(db);
  return db;
}
export function migrate(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS users(
      id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL,
      revision INTEGER NOT NULL DEFAULT 0, setup TEXT NOT NULL DEFAULT 'needs-review',
      promotions INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS sessions(
      hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL,
      csrf TEXT NOT NULL, principal TEXT NOT NULL CHECK(principal IN ('human','ai'))
    );
    CREATE TABLE IF NOT EXISTS accounts(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL,
      UNIQUE(id,user_id)
    );
    CREATE TABLE IF NOT EXISTS categories(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL,
      UNIQUE(id,user_id)
    );
    CREATE TABLE IF NOT EXISTS transfers(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), UNIQUE(id,user_id)
    );
    CREATE TABLE IF NOT EXISTS transactions(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), account_id TEXT NOT NULL,
      transfer_id TEXT, data TEXT NOT NULL, UNIQUE(id,user_id),
      FOREIGN KEY(account_id,user_id) REFERENCES accounts(id,user_id),
      FOREIGN KEY(transfer_id,user_id) REFERENCES transfers(id,user_id)
    );
    CREATE TABLE IF NOT EXISTS allocations(
      transaction_id TEXT NOT NULL, user_id TEXT NOT NULL, category_id TEXT NOT NULL,
      amount INTEGER NOT NULL CHECK(typeof(amount)='integer'),
      FOREIGN KEY(transaction_id,user_id) REFERENCES transactions(id,user_id) ON DELETE CASCADE,
      FOREIGN KEY(category_id,user_id) REFERENCES categories(id,user_id)
    );
    CREATE TABLE IF NOT EXISTS budgets(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), category_id TEXT NOT NULL,
      month TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(user_id,category_id,month),
      FOREIGN KEY(category_id,user_id) REFERENCES categories(id,user_id)
    );
    CREATE TABLE IF NOT EXISTS recurrences(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), account_id TEXT NOT NULL, data TEXT NOT NULL,
      FOREIGN KEY(account_id,user_id) REFERENCES accounts(id,user_id)
    );
    CREATE TABLE IF NOT EXISTS reconciliations(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), account_id TEXT NOT NULL, data TEXT NOT NULL,
      FOREIGN KEY(account_id,user_id) REFERENCES accounts(id,user_id)
    );
    CREATE TABLE IF NOT EXISTS proposals(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), data TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS challenges(
      hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), session_hash TEXT NOT NULL REFERENCES sessions(hash),
      proposal_id TEXT NOT NULL REFERENCES proposals(id), digest TEXT NOT NULL, version INTEGER NOT NULL,
      expires INTEGER NOT NULL, used INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS receipts(
      proposal_id TEXT PRIMARY KEY REFERENCES proposals(id), user_id TEXT NOT NULL REFERENCES users(id),
      idempotency_key TEXT NOT NULL, data TEXT NOT NULL, UNIQUE(user_id,idempotency_key)
    );
    CREATE TABLE IF NOT EXISTS audit(
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), proposal_id TEXT NOT NULL, event TEXT NOT NULL, created INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_attempts(key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
    INSERT OR IGNORE INTO schema_migrations(version) VALUES(1);
  `);
  const columns = (table: string) =>
    (db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
      (c) => c.name,
    );
  if (!columns("users").includes("timezone"))
    db.exec(
      "ALTER TABLE users ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Etc/UTC'",
    );
  if (!columns("users").includes("reminders"))
    db.exec(
      "ALTER TABLE users ADD COLUMN reminders TEXT NOT NULL DEFAULT '{}'",
    );
  if (!columns("users").includes("forecast_preferences"))
    db.exec(
      "ALTER TABLE users ADD COLUMN forecast_preferences TEXT NOT NULL DEFAULT '{}'",
    );
  db.exec("INSERT OR IGNORE INTO schema_migrations(version) VALUES(6)");
  if (!columns("sessions").includes("created_at"))
    db.exec(
      "ALTER TABLE sessions ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0",
    );
  db.exec(`
    CREATE UNIQUE INDEX IF NOT EXISTS recurrences_id_owner ON recurrences(id,user_id);
    CREATE TABLE IF NOT EXISTS occurrences(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),recurrence_id TEXT NOT NULL,due_date TEXT NOT NULL,data TEXT NOT NULL,UNIQUE(user_id,recurrence_id,due_date),FOREIGN KEY(recurrence_id,user_id) REFERENCES recurrences(id,user_id));
    INSERT OR IGNORE INTO schema_migrations(version) VALUES(2);
    CREATE TRIGGER IF NOT EXISTS occurrence_owner_insert BEFORE INSERT ON transactions WHEN json_extract(NEW.data,'$.occurrence.recurrenceId') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM recurrences WHERE id=json_extract(NEW.data,'$.occurrence.recurrenceId') AND user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Foreign schedule reference'); END;
    CREATE TRIGGER IF NOT EXISTS occurrence_owner_update BEFORE UPDATE OF data ON transactions WHEN json_extract(NEW.data,'$.occurrence.recurrenceId') IS NOT NULL AND NOT EXISTS(SELECT 1 FROM recurrences WHERE id=json_extract(NEW.data,'$.occurrence.recurrenceId') AND user_id=NEW.user_id) BEGIN SELECT RAISE(ABORT,'Foreign schedule reference'); END;
    INSERT OR IGNORE INTO schema_migrations(version) VALUES(3);
    INSERT OR IGNORE INTO schema_migrations(version) VALUES(4);
    CREATE TABLE IF NOT EXISTS security_events(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),event TEXT NOT NULL CHECK(event IN ('session_revoked','other_sessions_revoked')),created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS security_events_owner_time ON security_events(user_id,created);
    INSERT OR IGNORE INTO schema_migrations(version) VALUES(5);
  `);
}
let singleton: DatabaseSync | undefined;
export const database = () => (singleton ??= openDatabase());
