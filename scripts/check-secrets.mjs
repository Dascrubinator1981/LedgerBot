// A bounded repository guard, not a replacement for independent secret scanning.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
const files = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const patterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:ghp_|github_pat_)[A-Za-z0-9_]{30,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{40,}\b/,
  /\bAKIA[0-9A-Z]{16}\b/,
];
const findings = [];
for (const file of files) {
  if (
    /\.(?:sqlite(?:-wal|-shm)?|xlsx|xls|pem|key)$/.test(file) ||
    (/(^|\/)\.env(?:\.|$)/.test(file) && !file.endsWith(".env.example"))
  )
    findings.push(file);
  else if (patterns.some((pattern) => pattern.test(readFileSync(file, "utf8"))))
    findings.push(file);
}
if (findings.length) {
  console.error(
    `Repository secret/data guard failed in ${findings.length} file(s). Inspect locally; matches are not printed.`,
  );
  process.exitCode = 1;
} else
  console.log(
    `Repository guard passed for ${files.length} tracked files. No payloads printed; pattern scanning is not proof that all secrets are absent.`,
  );
