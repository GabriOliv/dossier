#!/usr/bin/env node
// Usage: node scripts/release/preflight.mjs <tag> <main-ref>
// Fails unless <tag> is "v" + the version in ./package.json and HEAD is a commit of <main-ref>.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const [tag, mainRef] = process.argv.slice(2);
const { version } = JSON.parse(readFileSync("package.json", "utf8"));

if (tag !== `v${version}`) {
  console.error(`Tag ${tag} does not match package.json version ${version} (expected v${version}).`);
  process.exit(1);
}
if (spawnSync("git", ["merge-base", "--is-ancestor", "HEAD", mainRef]).status !== 0) {
  console.error(`The commit of ${tag} is not on main (${mainRef}). Merge it into main before tagging.`);
  process.exit(1);
}
console.log(`${tag} matches package.json and is on main.`);
