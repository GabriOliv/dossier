import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { section } from "../../scripts/release/changelog.mjs";

interface Source {
  file: string;
  text: string;
}

/** The text under every `### Deprecated` of every version of the changelog, `Unreleased` included. */
function deprecatedText(changelog: string): string {
  const versions = [...changelog.matchAll(/^## \[([^\]]+)\]/gm)].map((m) => m[1]);
  return versions
    .map((v) => section(changelog, v) ?? "")
    .map((body) => body.split(/^### /m).find((part) => part.startsWith("Deprecated\n")) ?? "")
    .join("\n");
}

/** The name a declaration introduces: `export function name`, `interface Name`, `const name`, or a member `name?:`. */
function declaredName(after: string): string | undefined {
  const line = after.split("\n").find((l) => l.trim() !== "") ?? "";
  const named =
    /^\s*(?:export\s+)?(?:default\s+)?(?:declare\s+)?(?:async\s+)?(?:function\*?|class|interface|type|const|let|var|enum)\s+(\w+)/.exec(
      line,
    );
  return (named ?? /^\s*(?:readonly\s+)?(\w+)\??\s*[:(]/.exec(line))?.[1];
}

/**
 * Every problem in the `@deprecated` tags of the sources, checked against the changelog: a tag without a replacement
 * (a `code` span or a {@link}), a tag with no declaration after it, and a name that no `### Deprecated` mentions in a code span.
 */
function problems(sources: Source[], changelog: string): string[] {
  const codeSpans = [...deprecatedText(changelog).matchAll(/`([^`\n]+)`/g)].map((m) => m[1]);
  const found: string[] = [];
  for (const { file, text } of sources) {
    for (const block of text.matchAll(/\/\*\*([\s\S]*?)\*\//g)) {
      const tag = /@deprecated\b([\s\S]*?)(?=\n\s*\*?\s*@\w|$)/.exec(block[1]);
      if (!tag) continue;
      const note = tag[1].replace(/^\s*\*\s?/gm, "").trim();
      const name = declaredName(text.slice((block.index ?? 0) + block[0].length));
      if (!/`[^`]+`|\{@link /.test(note)) found.push(`${file}: @deprecated ${name ?? "?"} names no replacement`);
      if (!name) found.push(`${file}: @deprecated is not followed by a declaration`);
      else if (!codeSpans.some((span) => new RegExp(`(?<![\\w-])${name}(?![\\w-])`).test(span)))
        found.push(`${file}: ${name} is @deprecated but no ### Deprecated of CHANGELOG.md names it`);
    }
  }
  return found;
}

function sourcesOf(dir: string): Source[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourcesOf(path);
    return /\.tsx?$/.test(entry.name) ? [{ file: path, text: readFileSync(path, "utf8") }] : [];
  });
}

const changelogWith = (deprecated: string, added = "- Nothing.") =>
  `# Changelog\n\n## [Unreleased]\n\n### Added\n\n${added}\n\n### Deprecated\n\n${deprecated}\n\n## [0.1.0] - 2026-11-05\n\n### Added\n\n- First.\n`;

test("GOV-11 a @deprecated tag without a replacement fails, one that names it passes", () => {
  const changelog = changelogWith("- `a`, `b`, `c`, `d`, `e`");
  const src = (doc: string, decl: string) => [{ file: "x.ts", text: `${doc}\n${decl}\n` }];
  for (const doc of ["/** @deprecated */", "/** @deprecated Obsolete. */", "/**\n * Old.\n * @deprecated\n */"]) {
    const found = problems(src(doc, "export function a() {}"), changelog);
    expect(found, doc).toEqual(["x.ts: @deprecated a names no replacement"]);
  }
  expect(problems(src("/** @deprecated Use `b` instead. */", "export function a() {}"), changelog)).toEqual([]);
  expect(
    problems(
      src("/**\n * Old.\n * @deprecated Use {@link b}.\n * @param x y\n */", "export function a() {}"),
      changelog,
    ),
  ).toEqual([]);
});

test("GOV-11 the replacement is read up to the next tag, so a later tag does not count as one", () => {
  const text = "/**\n * @deprecated\n * @see `b`\n */\nexport function a() {}\n";
  expect(problems([{ file: "x.ts", text }], changelogWith("- `a`"))).toEqual([
    "x.ts: @deprecated a names no replacement",
  ]);
});

test("GOV-12 a @deprecated symbol that no ### Deprecated names fails with the symbol", () => {
  const text = "/** @deprecated Use `newThing`. */\nexport function oldThing() {}\n";
  expect(problems([{ file: "x.ts", text }], changelogWith("- `somethingElse`"))).toEqual([
    "x.ts: oldThing is @deprecated but no ### Deprecated of CHANGELOG.md names it",
  ]);
  // A word of the prose is not the name: only a code span names the symbol.
  const prefix = [{ file: "x.ts", text: "/** @deprecated Use `tone`. */\nprefix?: string\n" }];
  const prose = "- The aliases without the `--ds-` prefix: use `--ds-ink`.";
  expect(problems(prefix, changelogWith(prose))).toEqual([
    "x.ts: prefix is @deprecated but no ### Deprecated of CHANGELOG.md names it",
  ]);
  expect(problems(prefix, changelogWith(`${prose} The \`prefix\` option too.`))).toEqual([]);
});

test("GOV-12 a mention under Added does not count", () => {
  const text = "/** @deprecated Use `newThing`. */\nexport function oldThing() {}\n";
  const changelog = changelogWith("- `somethingElse`", "- `oldThing` was renamed to `newThing`.");
  expect(problems([{ file: "x.ts", text }], changelog)).toHaveLength(1);
});

test("GOV-12 a name that is only part of a longer name does not count", () => {
  const text = "/** @deprecated Use `newThing`. */\nexport function oldThing() {}\n";
  expect(problems([{ file: "x.ts", text }], changelogWith("- `oldThingy` and `--oldThing`"))).toHaveLength(1);
});

test("GOV-12 a symbol under ### Deprecated of any version passes, whatever it declares", () => {
  const changelog = `# Changelog\n\n## [Unreleased]\n\n## [0.2.0] - 2026-12-01\n\n### Deprecated\n\n- \`Old\`, \`oldConst\` and \`legacy\`: use \`New\`.\n`;
  const text = [
    "/** @deprecated Use `New`. */\nexport interface Old {}",
    "/** @deprecated Use `New`. */\nexport const oldConst = 1;",
    "export interface Props {\n  /** @deprecated Use `tone`. */\n  legacy?: string;\n}",
  ].join("\n");
  expect(problems([{ file: "x.ts", text }], changelog)).toEqual([]);
});

test("GOV-12 a @deprecated tag with no declaration after it fails", () => {
  expect(problems([{ file: "x.ts", text: "/** @deprecated Use `b`. */\n" }], changelogWith("- `b`"))).toEqual([
    "x.ts: @deprecated is not followed by a declaration",
  ]);
});

test("GOV-11 every @deprecated in the real src names a replacement", () => {
  const sources = sourcesOf("src");
  expect(sources.length).toBeGreaterThan(0);
  const found = problems(sources, readFileSync("CHANGELOG.md", "utf8"));
  expect(found.filter((p) => p.includes("names no replacement"))).toEqual([]);
});

test("GOV-12 every @deprecated in the real src appears under a Deprecated heading of the real changelog", () => {
  expect(problems(sourcesOf("src"), readFileSync("CHANGELOG.md", "utf8"))).toEqual([]);
});
