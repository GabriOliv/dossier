// Reads CHANGELOG.md, written by hand in the Keep a Changelog format.
// section(text, version): the text under "## [<version>]", without the heading, or null when there is none.
// check(text): the format problems of the file, each naming its line; an empty list means it is valid.

const KINDS = ["Added", "Changed", "Deprecated", "Removed", "Fixed"];

const lines = (text) => text.split(/\r?\n/);

export function section(text, version) {
  const all = lines(text);
  const start = all.findIndex((line) => line.startsWith(`## [${version}]`));
  if (start === -1) return null;
  const end = all.findIndex((line, i) => i > start && line.startsWith("## "));
  return all
    .slice(start + 1, end === -1 ? undefined : end)
    .join("\n")
    .trim();
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function check(text) {
  const problems = [];
  lines(text).forEach((line, i) => {
    const where = `CHANGELOG.md:${i + 1}: ${line}`;
    if (line.startsWith("## ")) {
      if (line === "## [Unreleased]") return;
      const match = /^## \[[^\]]+\] - (.*)$/.exec(line);
      if (!match) problems.push(`${where} (expected "## [<version>] - YYYY-MM-DD")`);
      else if (!validDate(match[1])) problems.push(`${where} (the date must be YYYY-MM-DD)`);
    } else if (line.startsWith("### ") && !KINDS.includes(line.slice(4))) {
      problems.push(`${where} (a subsection must be one of ${KINDS.join(", ")})`);
    }
  });
  return problems;
}
