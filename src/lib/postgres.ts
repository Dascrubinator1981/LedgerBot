import { Pool, type PoolClient } from "pg";
import type { SQLInputValue } from "node:sqlite";
import type { FinanceDb } from "./finance-db";
import { encryptDraft, decryptDraft } from "./draft-crypto";
let pool: Pool | undefined;
export async function closePostgres() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
function databasePool() {
  if (!pool) {
    const raw = process.env.LEDGERBOT_POSTGRES_URL;
    if (!raw) throw new Error("Postgres is not configured");
    const uri = new URL(raw),
      local = ["127.0.0.1", "localhost", "[::1]"].includes(uri.hostname);
    if (!local) {
      for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
        uri.searchParams.delete(key);
    }
    pool = new Pool({
      connectionString: uri.toString(),
      ssl: local ? false : { rejectUnauthorized: true },
      max: 10,
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
    });
  }
  return pool;
}
export async function postgresReady() {
  const result = await databasePool().query(
    "SELECT (SELECT count(*)::integer FROM ledgerbot.schema_migrations WHERE version BETWEEN 1 AND 6) AS versions,rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
  );
  const row = result.rows[0];
  return row?.versions === 6 && !row.rolsuper && !row.rolbypassrls;
}
export class PostgresDatabase implements FinanceDb {
  private savepoint = false;
  constructor(
    readonly client: PoolClient,
    readonly userId: string,
  ) {}
  prepare(sql: string) {
    let index = 0;
    let query = sql.replace(/\?/g, () => `$${++index}`);
    const proposals = /\bproposals\b/i.test(query);
    if (proposals)
      query = query.replace(/SELECT data FROM/i, "SELECT id,data FROM");
    const execute = async (values: SQLInputValue[]) => {
      const bound = [...values];
      if (proposals && /^INSERT/i.test(query))
        bound[2] = encryptDraft(String(bound[2]), this.userId);
      if (proposals && /^UPDATE.*SET data=/i.test(query))
        bound[0] = encryptDraft(String(bound[0]), this.userId);
      const result = await this.client.query(query, bound);
      return result.rows.map((row) => {
        if (row.data !== undefined) {
          if (proposals) row.data = decryptDraft(row.data, this.userId, row.id);
          else if (typeof row.data !== "string")
            row.data = JSON.stringify(row.data);
        }
        for (const field of [
          "revision",
          "expires",
          "created",
          "expires_at",
          "created_at",
          "used",
          "version",
        ])
          if (typeof row[field] === "string") {
            const number = Number(row[field]);
            if (!Number.isSafeInteger(number))
              throw new Error("Unsafe database integer");
            row[field] = number;
          }
        return row;
      });
    };
    return {
      get: async (...values: SQLInputValue[]) => (await execute(values))[0],
      all: async (...values: SQLInputValue[]) => execute(values),
      run: async (...values: SQLInputValue[]) => execute(values),
    };
  }
  async exec(sql: string) {
    if (sql === "BEGIN IMMEDIATE") {
      if (this.savepoint) throw new Error("Nested financial commit");
      await this.client.query("SAVEPOINT finance_commit");
      await this.client.query("SET CONSTRAINTS ALL DEFERRED");
      this.savepoint = true;
      return;
    }
    if (sql === "COMMIT" && this.savepoint) {
      await this.client.query("SET CONSTRAINTS ALL IMMEDIATE");
      await this.client.query("RELEASE SAVEPOINT finance_commit");
      this.savepoint = false;
      return;
    }
    if (sql === "ROLLBACK" && this.savepoint) {
      await this.client.query("ROLLBACK TO SAVEPOINT finance_commit");
      await this.client.query("RELEASE SAVEPOINT finance_commit");
      this.savepoint = false;
      return;
    }
    await this.client.query(sql);
  }
}
export async function withTenantDatabase<T>(
  userId: string,
  work: (db: PostgresDatabase) => Promise<T>,
): Promise<T> {
  const client = await databasePool().connect();
  try {
    // The subject is supplied only by a server-verified provider identity, never a route payload.
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query("SET LOCAL search_path TO ledgerbot,pg_catalog");
    await client.query("SELECT set_config('request.jwt.claim.sub',$1,true)", [
      userId,
    ]);
    const role = await client.query(
      "SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
    );
    if (role.rows[0].rolsuper || role.rows[0].rolbypassrls)
      throw new Error("App database connection must not bypass row security");
    const result = await work(new PostgresDatabase(client, userId));
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
