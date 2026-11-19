import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { randomBytes } from "node:crypto";
import assert from "node:assert/strict";
const execFile = promisify(execFileCallback);
const suffix = randomBytes(6).toString("hex"),
  name = `ledgerbot-qa-${suffix}`,
  image = `ledgerbot:qa-${suffix}`;
const base = resolve("data/container-qa"),
  work = `${base}/${suffix}`,
  reports = `${work}/reports`,
  cache = `${base}/cache`,
  input = `${work}/image.tar`;
const scanner =
  "aquasec/trivy@sha256:8f6bb947dbc528902e11f2f5be52f7b519f6a39d5d148f41166f2040499768fb";
let created = false;
const docker = async (...args) =>
  (
    await execFile("docker", ["--host=unix:///var/run/docker.sock", ...args], {
      maxBuffer: 16 * 1024 * 1024,
    })
  ).stdout;
await mkdir(reports, { recursive: true, mode: 0o700 });
await mkdir(cache, { recursive: true, mode: 0o700 });
try {
  console.log(
    "Building the isolated production artifact; no runtime credentials are passed to the build.",
  );
  const secret = process.env.CODEX_PROXY_CERT
    ? ["--secret", `id=proxy_ca,src=${process.env.CODEX_PROXY_CERT}`]
    : [];
  await docker("build", ...secret, "-t", image, ".");
  const imageId = (
    await docker("image", "inspect", image, "--format", "{{.Id}}")
  ).trim();
  await docker(
    "run",
    "--detach",
    "--name",
    name,
    "--read-only",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--pids-limit=128",
    "--memory=512m",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=64m",
    "--tmpfs",
    "/app/.next/cache:rw,nosuid,size=32m,uid=1000,gid=1000",
    "-p",
    "127.0.0.1::3000",
    image,
  );
  created = true;
  const mapping = (await docker("port", name, "3000/tcp")).trim();
  assert.match(mapping, /^127\.0\.0\.1:\d+$/);
  const origin = `http://${mapping}`;
  let alive = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    try {
      const response = await fetch(`${origin}/api/health`, {
        signal: AbortSignal.timeout(1000),
      });
      alive = response.ok && (await response.json()).status === "alive";
    } catch {}
    if (alive) break;
    await new Promise((done) => setTimeout(done, 250));
  }
  assert.ok(alive, "Container did not become live");
  assert.equal(
    (
      await fetch(`${origin}/api/health?ready=1`, {
        signal: AbortSignal.timeout(5000),
      })
    ).status,
    503,
  );
  assert.equal(
    (await fetch(`${origin}/api/state`, { signal: AbortSignal.timeout(5000) }))
      .status,
    503,
  );
  assert.equal(
    (
      await (
        await fetch(`${origin}/api/config`, {
          signal: AbortSignal.timeout(5000),
        })
      ).json()
    ).allowSignup,
    false,
  );
  const inspect = JSON.parse(await docker("inspect", name))[0];
  assert.equal(inspect.Config.User, "node");
  assert.equal(inspect.HostConfig.ReadonlyRootfs, true);
  assert.deepEqual(inspect.HostConfig.CapDrop, ["ALL"]);
  assert.ok(inspect.HostConfig.SecurityOpt.includes("no-new-privileges"));
  const inventory = JSON.parse(
    await docker(
      "exec",
      name,
      "node",
      "-e",
      'const fs=require("fs"); console.log(JSON.stringify({uid:process.getuid(),lint:fs.existsSync("/app/node_modules/eslint"),data:fs.existsSync("/app/data"),npm:fs.existsSync("/usr/local/lib/node_modules/npm"),env:[".env",".env.local",".env.production",".env.production.local"].some(p=>fs.existsSync("/app/"+p))}))',
    ),
  );
  assert.deepEqual(inventory, {
    uid: 1000,
    lint: false,
    data: false,
    npm: false,
    env: false,
  });
  console.log(
    "Runtime boundary passed: non-root/read-only, no local data/credentials/lint/npm, closed registration and fail-closed unconfigured finance.",
  );
  await docker("save", image, "-o", input);
  const scanArgs = [
    "run",
    "--rm",
    "--user",
    `${process.getuid()}:${process.getgid()}`,
    "--read-only",
    "--cap-drop=ALL",
    "--security-opt=no-new-privileges",
    "--pids-limit=128",
    "--memory=4g",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,size=2g",
    "--mount",
    `type=bind,src=${input},dst=/image.tar,readonly`,
    "--mount",
    `type=bind,src=${reports},dst=/scan`,
    "--mount",
    `type=bind,src=${cache},dst=/cache`,
    "--mount",
    "type=bind,src=/etc/ssl/certs/ca-certificates.crt,dst=/run/trust.pem,readonly",
    "-e",
    "SSL_CERT_FILE=/run/trust.pem",
    scanner,
    "image",
    "--cache-dir",
    "/cache",
    "--input",
    "/image.tar",
    "--scanners",
    "vuln",
    "--skip-version-check",
    "--db-repository",
    "ghcr.io/aquasecurity/trivy-db:2",
    "--severity",
    "HIGH,CRITICAL",
    "--exit-code",
    "1",
    "--format",
    "json",
    "--output",
    "/scan/report.json",
    "--quiet",
  ];
  console.log(
    "Scanning the exact artifact with the official pinned scanner and verified current vulnerability database.",
  );
  let scanFailed = false;
  try {
    await docker(...scanArgs);
  } catch {
    scanFailed = true;
  }
  const raw = await readFile(`${reports}/report.json`, "utf8"),
    report = JSON.parse(raw);
  const findings = (report.Results || []).flatMap(
    (item) => item.Vulnerabilities || [],
  );
  const summary = {
    imageId,
    runtimeBoundary: "passed",
    high: findings.filter((v) => v.Severity === "HIGH").length,
    critical: findings.filter((v) => v.Severity === "CRITICAL").length,
    scanner,
    observedAt: new Date().toISOString(),
  };
  await writeFile(
    `${base}/latest-summary.json`,
    JSON.stringify(summary, null, 2),
    { mode: 0o600 },
  );
  await writeFile(`${base}/latest-report.json`, raw, { mode: 0o600 });
  console.log(JSON.stringify(summary));
  assert.equal(scanFailed, false, "Container scan failed");
  assert.equal(
    findings.length,
    0,
    "High/critical image findings block the release",
  );
  console.log(
    "PASS: container packaging, runtime boundary and high/critical vulnerability gate.",
  );
} catch (error) {
  console.error(
    `Container QA failed: ${error instanceof assert.AssertionError ? error.message : "inspect the local tooling failure; no payloads or secrets logged"}`,
  );
  process.exitCode = 1;
} finally {
  if (created)
    await docker("rm", "--force", name).catch(() => {
      console.error("Could not remove this test container");
      process.exitCode = 1;
    });
}
