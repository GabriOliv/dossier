#!/usr/bin/env node
// Builds the library, packs it with `npm pack`, installs the tarball (never a link) in each consumer fixture,
// and builds the fixtures: fixtures/vite -> dist/, fixtures/docusaurus -> build/ (with the package) and
// build-plain/ (without it, for the Mermaid and focus comparisons). The two Docusaurus builds run at the same time.
// `--no-build` reuses the existing dist/ instead of running `npm run build`.
import { execSync, spawn } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, rmSync, symlinkSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname, "..");
const run = (cmd, cwd = root, env = {}) => {
  console.log(`\n$ ${cmd}${cwd === root ? "" : `   (in ${cwd.slice(root.length + 1)})`}`);
  execSync(cmd, { cwd, stdio: "inherit", env: { ...process.env, ...env } });
};

/** Same as `run`, asynchronous: starts the command now and resolves when it exits. */
const runAsync = (cmd, cwd = root, env = {}) =>
  new Promise((resolve, reject) => {
    console.log(`\n$ ${cmd}   (in ${cwd.slice(root.length + 1)})`);
    spawn(cmd, { cwd, shell: true, stdio: "inherit", env: { ...process.env, ...env } }).on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`)),
    );
  });

if (!process.argv.includes("--no-build")) run("npm run build");
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
const docusaurus = join(root, "fixtures/docusaurus");
// Docusaurus writes its generated files to .docusaurus/ beside the config, so the plain build runs in a copy
// of the fixture (sharing node_modules) to keep the two builds from overwriting each other.
const plain = join(root, "fixtures/.docusaurus-plain");
rmSync(plain, { recursive: true, force: true });
cpSync(docusaurus, plain, {
  recursive: true,
  filter: (src) => !/[\\/](node_modules|build|build-plain|\.docusaurus)$/.test(src),
});
symlinkSync(join(docusaurus, "node_modules"), join(plain, "node_modules"), "dir");
try {
  await Promise.all([
    runAsync("npm run build", docusaurus),
    runAsync(`npx docusaurus build --out-dir ${join(docusaurus, "build-plain")}`, plain, { DOSSIER: "0" }),
  ]);
} finally {
  rmSync(plain, { recursive: true, force: true });
}
