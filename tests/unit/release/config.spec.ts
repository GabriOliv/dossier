import { existsSync, readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const config = readFileSync("playwright.config.ts", "utf8");

test("STK-14 the config sets 80% workers", () => {
  expect(config).toMatch(/workers:\s*"80%"/);
});

test("SUI-02 the config declares one project per test kind", () => {
  const names = [...config.matchAll(/name:\s*"([\w-]+)"/g)].map((m) => m[1]);
  for (const kind of ["unit", "component", "visual", "visual-phone", "a11y", "docs", "site", "consumer"]) {
    expect(names).toContain(kind);
  }
  for (const kind of ["component", "visual", "a11y", "docs", "site", "unit", "consumer"]) {
    expect(config).toContain(`testDir: "tests/${kind}"`);
  }
});

test("SUI-01 no gallery, tests/gallery or tests/storybook directory", () => {
  for (const dir of ["gallery", "tests/gallery", "tests/storybook"]) expect(existsSync(dir), dir).toBe(false);
});

test("SUI-02 tests live only in the folders by kind", () => {
  const KINDS = ["unit", "component", "visual", "a11y", "docs", "site", "consumer"];
  // Helpers and fixtures of the tests, not tests: the Storybook helpers, the rendering fixtures and the React 19 harness.
  const HELPERS = ["support", "fixtures", "react19", "ssr"];
  const folders = readdirSync("tests", { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
  expect(folders.filter((f) => !KINDS.includes(f) && !HELPERS.includes(f))).toEqual([]);
  const specs = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? e.name === "node_modules"
          ? []
          : specs(`${dir}/${e.name}`)
        : /\.spec\.tsx?$/.test(e.name)
          ? [`${dir}/${e.name}`]
          : [],
    );
  expect(specs("tests").filter((f) => HELPERS.some((h) => f.startsWith(`tests/${h}/`)))).toEqual([]);
  // No spec directly under tests/, outside every folder by kind.
  expect(readdirSync("tests").filter((f) => /\.spec\.tsx?$/.test(f))).toEqual([]);
});

const scripts = (
  JSON.parse(readFileSync("package.json", "utf8")) as {
    scripts: Record<string, string>;
  }
).scripts;
const PROJECTS = ["unit", "component", "visual", "visual-phone", "a11y", "docs", "site"];
const projectsOf = (cmd: string) => [...cmd.matchAll(/--project[ =]([\w-]+)/g)].map((m) => m[1]);

test("STK-01 test:all builds the library, the Storybook and the landing once and runs every project but consumer in one call", () => {
  const build = scripts["build:all"];
  expect(build.match(/npm run build\b/g)).toHaveLength(1);
  expect(build.match(/storybook build/g)).toHaveLength(1);
  expect(build.match(/vite build --config site\/vite\.config\.ts/g)).toHaveLength(1);
  const all = scripts["test:all"];
  expect(all.startsWith("npm run build:all")).toBe(true);
  expect(all.match(/playwright test/g)).toHaveLength(1);
  expect([...projectsOf(all)].sort()).toEqual([...PROJECTS].sort());
  expect(projectsOf(all)).not.toContain("consumer");
});

test("STK-02 test:all stops at the first failing test", () => {
  expect(scripts["test:all"]).toContain("--max-failures=1");
});

test("STK-03 test:all:full runs every project, the consumer suite included, and reports every failure", () => {
  const full = scripts["test:all:full"];
  expect(full.startsWith("npm run build:all")).toBe(true);
  expect(full).toContain("node scripts/fixtures.mjs");
  expect(full).toMatch(/playwright test\s*$/);
  expect(projectsOf(full)).toEqual([]);
  expect(full).not.toContain("--max-failures");
  expect(full).toContain("PW_CONSUMER=1");
});

test("STK-15 fixtures.mjs starts both Docusaurus builds before it waits for either", () => {
  const src = readFileSync("scripts/fixtures.mjs", "utf8");
  const group = src.match(/await Promise\.all\(\[([\s\S]*?)\]\);/);
  expect(group).not.toBeNull();
  const started = group![1];
  expect(started.match(/runAsync\(/g)).toHaveLength(2);
  expect(started).toContain('"npm run build", docusaurus');
  expect(started).toContain("build-plain");
  expect(started).toContain('DOSSIER: "0"');
  expect(src).toContain('process.argv.includes("--no-build")');
});
