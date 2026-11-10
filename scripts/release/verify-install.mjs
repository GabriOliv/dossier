#!/usr/bin/env node
// Usage: node scripts/release/verify-install.mjs <url> <tgz>
// Installs <url> into an empty project and fails unless npm recorded the sha512 of <tgz>, the tarball the tests
// installed. Peers (React) are not installed: what is checked is the download and its integrity.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [url, tgz] = process.argv.slice(2);
const expected = "sha512-" + createHash("sha512").update(readFileSync(tgz)).digest("base64");

const dir = mkdtempSync(join(tmpdir(), "dossier-smoke-"));
writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "smoke", version: "0.0.0", private: true }));
try {
  execFileSync("npm", ["install", "--no-audit", "--no-fund", "--legacy-peer-deps", url], {
    cwd: dir,
    stdio: "inherit",
  });
} catch {
  console.error(`npm install ${url} failed.`);
  process.exit(1);
}

const lock = JSON.parse(readFileSync(join(dir, "package-lock.json"), "utf8"));
const actual = lock.packages?.["node_modules/@gabrioliv/dossier"]?.integrity;
if (actual !== expected) {
  console.error(`The tarball at ${url} is not the tested one.\n  installed: ${actual}\n  tested:    ${expected}`);
  process.exit(1);
}
console.log(`${url} installs the tested tarball (${expected.slice(0, 20)}…).`);
