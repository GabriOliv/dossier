#!/usr/bin/env node
// Builds the library, packs it with `npm pack`, installs the tarball (never a link) in each consumer fixture,
// and builds the fixtures: fixtures/vite -> dist/, fixtures/docusaurus -> build/ (with the package) and
// build-plain/ (without it, for the Mermaid and focus comparisons).
import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const run = (cmd, cwd = root, env = {}) => {
  console.log(`\n$ ${cmd}${cwd === root ? "" : `   (in ${cwd.slice(root.length + 1)})`}`);
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, ...env } });
};

run("npm run build");
const pack = join(root, ".pack");
rmSync(pack, { recursive: true, force: true });
mkdirSync(pack);
run(`npm pack --pack-destination ${pack}`);
const [tarball] = readdirSync(pack).filter((f) => f.endsWith(".tgz"));
if (!tarball) throw new Error("npm pack produced no tarball");

for (const name of ["vite", "docusaurus"]) {
  const dir = join(root, "fixtures", name);
  run("npm ci --no-audit --no-fund", dir);
  run(`npm install --no-save --no-audit --no-fund ${join(pack, tarball)}`, dir);
}
run("npm run build", join(root, "fixtures/vite"));
run("npm run build", join(root, "fixtures/docusaurus"));
run("npx docusaurus build --out-dir build-plain", join(root, "fixtures/docusaurus"), { DOSSIER: "0" });
