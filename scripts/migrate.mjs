import { openDatabase } from "../src/lib/db.ts";
const db = openDatabase();
console.log(
  "Applied schema version",
  db.prepare("SELECT max(version) version FROM schema_migrations").get()
    .version,
);
db.close();
