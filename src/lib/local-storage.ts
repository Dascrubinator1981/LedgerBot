import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { randomUUID, createHash } from "node:crypto";
import { PublicError } from "./errors.ts";
// No credentials or financial records are stored in this marker.
export function storageMarker(path: string) {
  const full = resolve(path),
    marker = `${full}.storage.json`;
  if (existsSync(marker)) {
    const value = JSON.parse(readFileSync(marker, "utf8")) as {
      reference: string;
    };
    if (!existsSync(full))
      throw new PublicError(
        "Your saved data file is missing. LedgerBot stopped instead of creating an empty replacement. Check your original folder or OneDrive availability; do not recreate your accounts.",
        503,
      );
    return { full, marker, reference: value.reference };
  }
  return { full, marker, reference: randomUUID() };
}
export function rememberStorage(value: ReturnType<typeof storageMarker>) {
  if (!existsSync(value.marker)) {
    try {
      writeFileSync(
        value.marker,
        JSON.stringify({ reference: value.reference }),
        { flag: "wx", mode: 0o600 },
      );
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
    }
  }
}
export function storageReference() {
  const path = process.env.LEDGERBOT_DATABASE_PATH || "./data/ledgerbot.sqlite";
  const marker = storageMarker(path);
  return {
    label: "This laptop’s local data",
    reference: createHash("sha256")
      .update(marker.reference)
      .digest("hex")
      .slice(0, 12),
    fileName: marker.full.split(/[\\/]/).pop()!,
    folder: dirname(marker.full).includes("OneDrive")
      ? "OneDrive folder — keep the data available offline"
      : "Local folder",
  };
}
