import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { check, section } from "../../../scripts/release/changelog.mjs";

const changelog = readFileSync("CHANGELOG.md", "utf8");
const kinds = ["Added", "Changed", "Deprecated", "Removed", "Fixed"];

/** The bullets of one `### <kind>` subsection of 1.0.0. */
function bullets(kind: string): string {
  const body = section(changelog, "1.0.0")!;
  const sub = body.split(/^### /m).find((part) => part.startsWith(`${kind}\n`));
  return sub ?? "";
}

test("GOV-01 the changelog starts with the title, one paragraph citing Keep a Changelog and the versioning policy, then Unreleased", () => {
  expect(changelog).toMatch(/^# Changelog\n\n[^#\n][^\n]*\n\n## \[Unreleased\]\n/);
  const paragraph = changelog.split("\n")[2];
  expect(paragraph).toContain("Keep a Changelog");
  expect(paragraph).toMatch(/\[Versioning\]\(README\.md#versioning\)/);
});

test("GOV-02 1.0.0 is the only release below Unreleased", () => {
  expect([...changelog.matchAll(/^## \[([^\]]+)\]/gm)].map((m) => m[1])).toEqual(["Unreleased", "1.0.0"]);
  expect(section(changelog, "1.0.0")).toContain("`StageIcon`");
});

test("GOV-02 every line of 1.0.0 is a bullet under one of the five headings", () => {
  const body = section(changelog, "1.0.0")!;
  const lines = body.split("\n").filter((line) => line.trim() !== "");
  expect(lines[0]).toMatch(/^### /);
  let current = "";
  for (const line of lines) {
    if (line.startsWith("### ")) {
      current = line.slice(4);
      expect(kinds, line).toContain(current);
    } else {
      expect(line, `under ### ${current}`).toMatch(/^- \S/);
    }
  }
  expect(kinds.filter((kind) => bullets(kind) !== "")).toEqual(["Added", "Deprecated"]);
});

test("GOV-02 1.0.0 has an entry for each feature a consumer can see, under Added", () => {
  const entries: [feature: string, pattern: RegExp][] = [
    ["component-api: ref", /`ref` and the native attributes/],
    ["component-api: level", /`level` \(1 to 6\) on `DataHeader`, `SectionTitle`, `Comparison` and `ErrorNotice`/],
    ["framework-compat: use client", /"use client"/],
    ["framework-compat: sourcemaps", /sourcemap beside each `\.js`/],
    ["styling-contract: tokens", /`--ds-<name>`/],
    ["styling-contract: layers", /`dossier\.tokens`, `dossier\.base` and `dossier\.components`/],
    ["a11y-checks: forced colors", /forced-colors/],
    ["a11y-checks: Hierarchy keyboard", /`Hierarchy` can be reached and scrolled with the keyboard/],
    ["i18n: labels", /`labels` on every component/],
    ["i18n: locale sets", /`@gabrioliv\/dossier\/locales\/pt-BR`/],
    ["i18n: uppercase", /uppercase on screen/],
    ["primitives-actions-forms", /`Button`, `IconButton`, `Link`.*`Checkbox`, `Switch`, `RadioGroup` and `Select`/],
    ["primitives-overlays", /`Dialog`, `Popover`, `Tooltip` and `Menu`/],
    ["primitives-disclosure", /`Tabs`, `Accordion` and `Pagination`/],
    [
      "primitives-feedback-layout: components",
      /`Spinner`, `Skeleton`, `Stack`, `Grid`, `Divider`, and `Toaster` with the `toast\(\)` function/,
    ],
    ["primitives-feedback-layout: loading", /`loading` on `Button` and `IconButton`/],
  ];
  for (const [feature, pattern] of entries) {
    expect(bullets("Added"), feature).toMatch(pattern);
  }
});

test("GOV-02 section returns the text of a version without its heading, and null for a version that has none", () => {
  const text =
    "# T\n\n## [Unreleased]\n\n### Added\n\n- a\n\n## [1.0.0] - 2026-01-02\n\n### Fixed\n\n- b\n\n## [0.9.0] - 2025-12-31\n\n- c\n";
  expect(section(text, "1.0.0")).toBe("### Fixed\n\n- b");
  expect(section(text, "Unreleased")).toBe("### Added\n\n- a");
  expect(section(text, "0.9.0")).toBe("- c");
  expect(section(text, "2.0.0")).toBeNull();
  expect(section(text, "1.0")).toBeNull();
});

test("GOV-03 Added says StageIcon is named in English by default and how to get the Portuguese names", () => {
  const line = bullets("Added")
    .split("\n")
    .find((l) => l.includes("labels={ptBR.StageIcon}"));
  expect(line).toBeDefined();
  expect(line).toContain("English");
});

test("GOV-03 Deprecated lists the CSS aliases without --ds- and names the replacement", () => {
  const deprecated = bullets("Deprecated");
  expect(deprecated).toContain("`--paper`");
  expect(deprecated).toContain("`--ink`");
  expect(deprecated).toContain("`--ds-paper`");
  expect(deprecated).toContain("`--ds-ink`");
  expect(deprecated).toMatch(/aliases/);
  expect(deprecated).toContain("Setting an old name does not change the components");
  expect(deprecated).toContain("removed in a future major release");
});

test("GOV-41 the real changelog passes the format check", () => {
  expect(check(changelog)).toEqual([]);
});

test("GOV-41 a section date outside YYYY-MM-DD fails with the line", () => {
  for (const heading of [
    "## [0.2.0] - 05/11/2026",
    "## [0.2.0] - 2026-13-01",
    "## [0.2.0] - 2026-11-5",
    "## [0.2.0]",
  ]) {
    const problems = check(`# Changelog\n\n## [Unreleased]\n\n${heading}\n\n### Added\n\n- x\n`);
    expect(problems, heading).toHaveLength(1);
    expect(problems[0], heading).toContain("CHANGELOG.md:5");
    expect(problems[0], heading).toContain(heading);
  }
  expect(check("## [0.2.0] - 2026-11-06\n")).toEqual([]);
});

test("GOV-41 a subsection that is not Added, Changed, Deprecated, Removed or Fixed fails with the line", () => {
  const problems = check("# Changelog\n\n## [Unreleased]\n\n### Added\n\n- x\n\n### Features\n\n- y\n");
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain("CHANGELOG.md:9");
  expect(problems[0]).toContain("### Features");
  for (const kind of kinds) expect(check(`## [Unreleased]\n\n### ${kind}\n`)).toEqual([]);
});
