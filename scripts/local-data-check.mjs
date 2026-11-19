// Read-only SQLite inspection. It never creates a database, runs migrations,
// reveals login emails/passwords or prints financial records.
import { existsSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { createInterface } from "node:readline/promises";
const path = resolve(
  process.env.LEDGERBOT_DATABASE_PATH || "./data/ledgerbot.sqlite",
);
const info = {
  date: new Date().toISOString(),
  databaseFile: basename(path),
  exists: existsSync(path),
  oneDriveFolder: path.toLowerCase().includes("onedrive"),
  customEnvironmentPath: !!process.env.LEDGERBOT_DATABASE_PATH,
  configurationNote:
    "Checks this terminal’s configured/default SQLite path; does not load private .env files. Compare the app’s data reference when available.",
};
const question = createInterface({
  input: process.stdin,
  output: process.stdout,
});
let email = "";
try {
  email = (
    await question.question(
      "Enter your practice login email (not password); it will NOT be included in the report: ",
    )
  )
    .trim()
    .toLowerCase();
} finally {
  question.close();
}
if (info.exists) {
  info.fileBytes = statSync(path).size;
  let db;
  try {
    db = new DatabaseSync(path, { readOnly: true });
    info.databaseReadable = true;
    const names = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((r) => r.name);
    info.hasLedgerBotSchema = ["users", "accounts", "transactions"].every((n) =>
      names.includes(n),
    );
    if (info.hasLedgerBotSchema) {
      info.totalLoginCount = db
        .prepare("SELECT count(*) count FROM users")
        .get().count;
      info.totalAccountCount = db
        .prepare("SELECT count(*) count FROM accounts")
        .get().count;
      const user = email
        ? db.prepare("SELECT id FROM users WHERE email=?").get(email)
        : null;
      info.requestedLoginFound = !!user;
      if (user)
        for (const table of [
          "accounts",
          "transactions",
          "categories",
          "budgets",
          "recurrences",
        ])
          info[table + "ForRequestedLogin"] = db
            .prepare(`SELECT count(*) count FROM ${table} WHERE user_id=?`)
            .get(user.id).count;
    }
    const marker = path + ".storage.json";
    if (existsSync(marker))
      info.dataReference = createHash("sha256")
        .update(JSON.parse(readFileSync(marker, "utf8")).reference)
        .digest("hex")
        .slice(0, 12);
  } catch {
    info.databaseReadable = false;
    info.note =
      "Could not read this database safely. No database was created or repaired.";
  } finally {
    db?.close();
  }
} else
  info.note =
    "No database at the checked location. Do NOT create replacement accounts or delete files. Keep your original folder.";
const output = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "LedgerBot-Local-Data-Summary.txt",
);
writeFileSync(output, JSON.stringify(info, null, 2));
console.log(JSON.stringify(info, null, 2));
console.log(
  "Saved LedgerBot-Local-Data-Summary.txt beside this script. It contains counts only, not emails or financial records.",
);
