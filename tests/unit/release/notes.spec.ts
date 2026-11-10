import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, test } from "@playwright/test";

const script = resolve("scripts/release/notes.mjs");

const changelog = `# Changelog

## [Unreleased]

### Added

- Unreleased entry.

## [2.0.0] - 2027-03-01

### Added

- Entry of the version after.

## [1.2.3] - 2026-12-01

### Fixed

- Entry of 1.2.3.

### Changed

- Second entry of 1.2.3.

## [0.1.0] - 2026-11-05

### Added

- Entry of the version before.
`;

/** A temp dir that holds the CHANGELOG, as the repo root does when the release job runs the script. */
function project(text = changelog) {
  const dir = mkdtempSync(join(tmpdir(), "dossier-notes-"));
  writeFileSync(join(dir, "CHANGELOG.md"), text);
  return dir;
}

const notes = (dir: string, version: string) => execFileSync("node", [script, version], { cwd: dir, encoding: "utf8" });

test("REL-11 the release text starts with the install command for the version", () => {
  const dir = project();
  for (const v of ["0.1.0", "1.2.3"]) {
    const out = notes(dir, v);
    expect(out.startsWith("```bash\n")).toBe(true);
    expect(out.split("\n")[1]).toBe(
      `npm install https://github.com/GabriOliv/dossier/releases/download/v${v}/gabrioliv-dossier-${v}.tgz`,
    );
  }
});

test("GOV-05 the output is the install block, then the section of the version without its heading", () => {
  const url = "https://github.com/GabriOliv/dossier/releases/download/v1.2.3/gabrioliv-dossier-1.2.3.tgz";
  expect(notes(project(), "1.2.3")).toBe(
    [
      "```bash",
      `npm install ${url}`,
      "```",
      "",
      "### Fixed",
      "",
      "- Entry of 1.2.3.",
      "",
      "### Changed",
      "",
      "- Second entry of 1.2.3.",
      "",
    ].join("\n"),
  );
});

test("GOV-05 nothing of the neighbouring sections reaches the output", () => {
  const out = notes(project(), "1.2.3");
  expect(out).not.toContain("## [1.2.3]");
  expect(out).not.toContain("Entry of the version before");
  expect(out).not.toContain("Entry of the version after");
  expect(out).not.toContain("Unreleased entry");
  expect(out).not.toContain("2.0.0");
  expect(out).not.toContain("0.1.0");
});

test("GOV-05 the last section of the file is read up to the end", () => {
  const out = notes(project(), "0.1.0");
  expect(out).toContain("- Entry of the version before.");
  expect(out).not.toContain("Entry of 1.2.3");
});

test("GOV-05 a version with no section fails and names the version", () => {
  const r = spawnSync("node", [script, "9.9.9"], { cwd: project(), encoding: "utf8" });
  expect(r.status).toBe(1);
  expect(r.stderr).toContain("9.9.9");
  expect(r.stdout).toBe("");
});
