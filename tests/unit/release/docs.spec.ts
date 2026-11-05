import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

const read = (path: string) => readFileSync(path, "utf8");
const pkg = JSON.parse(read("package.json")) as { version: string; license?: string };

// The MIT license as published at https://opensource.org/license/mit, with the year and holder filled in.
const MIT = `MIT License

Copyright (c) 2026 GabriOliv

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`;

test("LIC-01 LICENSE is MIT for GabriOliv", () => {
  expect(read("LICENSE")).toBe(MIT);
});

test("LIC-02 package.json declares MIT", () => {
  expect(pkg.license).toBe("MIT");
});

test("LIC-03 the tarball carries LICENSE and the font licenses", () => {
  const out = execFileSync("npm", ["pack", "--dry-run", "--json"], { encoding: "utf8" });
  const [info] = JSON.parse(out) as { files: { path: string }[] }[];
  const paths = info.files.map((f) => f.path);
  expect(paths).toContain("LICENSE");
  expect(paths.filter((p) => /^dist\/fonts\/LICENSE-/.test(p)).sort()).toEqual([
    "dist/fonts/LICENSE-ibm-plex-mono.txt",
    "dist/fonts/LICENSE-ibm-plex-sans-condensed.txt",
    "dist/fonts/LICENSE-ibm-plex-sans.txt",
  ]);
});

const section = (md: string, heading: string) => {
  const start = md.indexOf(`\n${heading}\n`);
  expect(start).toBeGreaterThanOrEqual(0);
  const rest = md.slice(start + heading.length + 2);
  const end = rest.search(/^## /m);
  return end === -1 ? rest : rest.slice(0, end);
};

test("DOC-01 the README install URL matches package.json's version", () => {
  const version = pkg.version;
  const url = `https://github.com/GabriOliv/dossier/releases/download/v${version}/gabrioliv-dossier-${version}.tgz`;
  expect(read("README.md")).toContain(`npm install ${url}`);
});

/** The numbered steps of the README's Release section, in order. */
const releaseSteps = () =>
  section(read("README.md"), "## Release")
    .split("\n")
    .filter((l) => /^\d+\. /.test(l));

test("DOC-02 the README explains how to cut a release", () => {
  const steps = releaseSteps();
  const find = (re: RegExp) => steps.findIndex((l) => re.test(l));
  const order = [
    find(/`version`.*`package\.json`/),
    find(/commit.*`main`/),
    find(/`git tag v/),
    find(/`git push origin v/),
  ];
  expect(
    order.every((i) => i >= 0),
    steps.join("\n"),
  ).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
});

test("DOC-04 the README pushes main before the tag", () => {
  const steps = releaseSteps();
  const pushMain = steps.findIndex((l) => l.includes("`git push origin main`"));
  expect(pushMain).toBeGreaterThan(steps.findIndex((l) => /commit.*`main`/.test(l)));
  expect(pushMain).toBeLessThan(steps.findIndex((l) => l.includes("`git tag v")));
});

test("DOC-03 PLANO.md points F3 and versioning at AD-001", () => {
  const lines = read("PLANO.md").split("\n");
  for (const heading of ["### F3. Publicar `0.1.0` (meio dia)", "## 6. Versionamento"]) {
    const at = lines.indexOf(heading);
    expect(at).toBeGreaterThanOrEqual(0);
    const next = lines.slice(at + 1).find((l) => l.trim() !== "");
    expect(next?.startsWith(">")).toBe(true);
    expect(next).toContain("AD-001");
    expect(next).toMatch(/sem npm/);
    expect(next).toContain("Dependabot");
  }
});

test("LIC-04 the README names MIT and OFL 1.1", () => {
  const text = section(read("README.md"), "## Licenças");
  expect(text).toContain("MIT");
  expect(text).toContain("Open Font License 1.1");
});
