#!/usr/bin/env node
// Usage: node scripts/release/notes.mjs <version>
// Prints the top of the release text: the install command for that version. GitHub's generated notes follow it.
const [version] = process.argv.slice(2);
const url = `https://github.com/GabriOliv/dossier/releases/download/v${version}/gabrioliv-dossier-${version}.tgz`;
console.log(["```bash", `npm install ${url}`, "```", ""].join("\n"));
