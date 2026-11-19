import type { Client, QueryResult } from "pg";
import {
  decryptDraft,
  encryptDraft,
  draftConfiguration,
} from "./draft-crypto.ts";
// Operator-only maintenance, not an application or AI endpoint. No plaintext/IDs in results.
export async function rotateDrafts(
  client: Client,
  apply = false,
  batchSize = 100,
) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 1000)
    throw new Error("Invalid rotation batch size");
  const config = draftConfiguration();
  if (config.version !== 2)
    throw new Error("A versioned active key is required");
  const role = await client.query(
    "SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user",
  );
  if (!role.rows[0]?.rolsuper && !role.rows[0]?.rolbypassrls)
    throw new Error("A separate unrestricted maintenance role is required");
  let last: string | null = null,
    checked = 0,
    changed = 0;
  await client.query(
    apply
      ? "BEGIN ISOLATION LEVEL SERIALIZABLE"
      : "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY",
  );
  try {
    for (;;) {
      const result: QueryResult<{ id: string; user_id: string; data: string }> =
        await client.query(
          `SELECT id,user_id,data FROM ledgerbot.proposals WHERE ($1::uuid IS NULL OR id>$1) ORDER BY id LIMIT $2${apply ? " FOR UPDATE" : ""}`,
          [last, batchSize],
        );
      if (!result.rows.length) break;
      for (const row of result.rows) {
        const plain = decryptDraft(row.data, row.user_id, row.id);
        const envelope = JSON.parse(row.data) as { v: number; kid?: string };
        checked++;
        if (envelope.v !== 2 || envelope.kid !== config.activeId) {
          if (apply)
            await client.query(
              "UPDATE ledgerbot.proposals SET data=$1 WHERE id=$2 AND user_id=$3",
              [encryptDraft(plain, row.user_id), row.id, row.user_id],
            );
          changed++;
        }
        last = row.id;
      }
    }
    await client.query("COMMIT");
    return {
      checked,
      ...(apply ? { changed } : { wouldChange: changed }),
      applied: apply,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
