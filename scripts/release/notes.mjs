#!/usr/bin/env node
// Usage: node scripts/release/notes.mjs <version>
// Prints the release text: the install command for that version, then the text of its "## [<version>]" section
// in ./CHANGELOG.md, without the heading. Fails, naming the version, when the file has no such section.
import { existsSync, readFileSync } from "node:fs";
import { section } from "./changelog.mjs";

const [version] = process.argv.slice(2);
const changes = section(existsSync("CHANGELOG.md") ? readFileSync("CHANGELOG.md", "utf8") : "", version);
if (changes === null) {
  console.error(`CHANGELOG.md has no "## [${version}]" section, so there is no release text for ${version}.`);
  process.exit(1);
}
const url = `https://github.com/GabriOliv/dossier/releases/download/v${version}/gabrioliv-dossier-${version}.tgz`;
console.log(["```bash", `npm install ${url}`, "```", "", changes].join("\n"));
