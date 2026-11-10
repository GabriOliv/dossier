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

test("LIC-04 the README names MIT and OFL 1.1", () => {
  const text = section(read("README.md"), "## License");
  expect(text).toContain("MIT");
  expect(text).toContain("Open Font License 1.1");
});

test("DOC-05 the README lists every export and no other component", async () => {
  const lib = await import("../../../dist/index.js");
  const exported = Object.keys(lib)
    .filter((k) => {
      const c = (lib as Record<string, any>)[k];
      return (
        typeof c === "function" || [Symbol.for("react.forward_ref"), Symbol.for("react.memo")].includes(c?.$$typeof)
      );
    })
    .sort();
  const section = read("README.md").split("\n## Components\n")[1].split("\n## ")[0];
  const listed = [...section.matchAll(/`([^`]+)`/g)].map((m) => m[1]).sort();
  // 49 components and toast(), the one function export that is not a component.
  expect(exported).toHaveLength(50);
  expect(exported).toContain("toast");
  expect(listed).toEqual(exported);
});

test("PRM-07 the README lists Button, IconButton, Link, Checkbox, Switch, RadioGroup and Select in Components and shows NextLink with the ds-link class", () => {
  const readme = read("README.md");
  const components = readme.split("\n## Components\n")[1].split("\n## ")[0];
  for (const name of ["Button", "IconButton", "Link", "Checkbox", "Switch", "RadioGroup", "Select"])
    expect(components, name).toContain(`\`${name}\``);
  const links = section(readme, "## Links and routers");
  expect(links).toContain('<NextLink className="ds-link">');
  expect(links).toMatch(/<NextLink href="\/docs" className="ds-link">/);
  expect(links).toContain("<Link href=");
});

test("DOC-06 the README documents the shared component API", () => {
  const text = section(read("README.md"), "## Shared component API");
  expect(text).toMatch(/Every component forwards its `ref` to its root element and accepts the native attributes/);
  expect(text).toContain("the consumer's value wins");
  expect(text).toContain("`className` is added to the component's own classes");
  expect(text).toMatch(/`TextField` sends `ref` and the native attributes to its `<input>`/);
  expect(text).toContain("`DataHeader`, `SectionTitle`, `Comparison` and `ErrorNotice` take `level`");
});

test("DOC-07 the README says the components work in Server Components and ship sourcemaps", () => {
  const text = section(read("README.md"), "## Server Components and sourcemaps");
  expect(text).toContain("Each component without state works in React Server Components");
  expect(text).toContain('A component that needs the client carries `"use client"` at the top of its own file');
  expect(text).toContain("The package ships a sourcemap beside each `.js` file, with the original TSX inside");
});

test("STY-25 the README links docs/theming.md and names tokens only by --ds-", () => {
  const readme = read("README.md");
  expect(section(readme, "## Theming")).toContain("[docs/theming.md](docs/theming.md)");
  expect(section(readme, "## Theming")).toContain("`--ds-ink`");
  const t = JSON.parse(read("tokens/tokens.json"));
  const names: string[] = [
    ...["color", "shadow", "spacing", "radius", "stroke"].flatMap((k) =>
      t[k].tokens.map((x: { name: string }) => x.name),
    ),
    ...Object.keys(t.type.families).map((f) => `font-${f}`),
    ...t.type.groups.flatMap((g: { styles: { name: string }[] }) => g.styles.map((st) => `text-${st.name}`)),
  ];
  expect(names).toContain("ink");
  const old = new RegExp(`(?<![\\w-])--(${names.join("|")})(?![\\w-])`, "g");
  expect(readme.match(old)).toBeNull();
});

test("VIS-20 the README shows the two update commands under Development and says references come from the container", () => {
  const text = section(read("README.md"), "## Development");
  expect(text).toContain("docker compose run --rm node npm run test:visual:update");
  expect(text).toContain("docker compose run --rm node npm run test:markup:update");
  expect(text).toContain("References are generated only in the container");
});

test("I18N-25 the README shows labels={ptBR.TextField} with its import and a pt-BR number format", () => {
  const text = section(read("README.md"), "## Labels and number formats");
  expect(text).toContain('import { ptBR } from "@gabrioliv/dossier/locales/pt-BR";');
  expect(text).toContain("labels={ptBR.TextField}");
  expect(text).toContain('format={(v) => v.toLocaleString("pt-BR")}');
});

test("I18N-26 the README says StageIcon is named in English by default and labels={ptBR.StageIcon} gives the Portuguese names", () => {
  const text = section(read("README.md"), "## Labels and number formats");
  expect(text).toContain("`StageIcon` is named in English by default");
  expect(text).toContain("`labels={ptBR.StageIcon}` gives the Portuguese names");
});

test("OVL-09 the README lists Dialog, Popover, Tooltip and Menu in Components and shows a controlled Dialog with useState", () => {
  const readme = read("README.md");
  const components = readme.split("\n## Components\n")[1].split("\n## ")[0];
  for (const name of ["Dialog", "Popover", "Tooltip", "Menu"]) expect(components, name).toContain(`\`${name}\``);
  const overlays = section(readme, "## Overlays");
  expect(overlays).toContain("useState");
  expect(overlays).toMatch(/const \[open, setOpen\] = useState\(false\)/);
  expect(overlays).toMatch(/<Dialog\b[^>]*\bopen=\{open\}/);
  expect(overlays).toMatch(/onClose=\{\(\) => setOpen\(false\)\}/);
  expect(overlays).toMatch(/<Button onClick=\{\(\) => setOpen\(true\)\}>/);
});

test("DIS-08 the README lists Tabs, Accordion and Pagination in Components and shows Pagination with href and the preventDefault note", () => {
  const readme = read("README.md");
  const components = readme.split("\n## Components\n")[1].split("\n## ")[0];
  for (const name of ["Tabs", "Accordion", "Pagination"]) expect(components, name).toContain(`\`${name}\``);
  const disclosure = section(readme, "## Disclosure");
  for (const name of ["Tabs", "Accordion", "Pagination"]) expect(disclosure, name).toContain(`\`${name}\``);
  expect(disclosure).toMatch(/<Pagination\b[^>]*\bhref=\{\(n\) => /);
  expect(disclosure).toContain("`event.preventDefault()`");
  expect(disclosure).toContain("`onChange`");
});

test("FBL-08 the README lists the feedback and layout primitives in Components and shows <Toaster /> with a toast() call", () => {
  const readme = read("README.md");
  const components = readme.split("\n## Components\n")[1].split("\n## ")[0];
  for (const name of ["Toaster", "toast", "Spinner", "Skeleton", "Stack", "Grid", "Divider", "Icon"])
    expect(components, name).toContain(`\`${name}\``);
  const text = section(readme, "## Feedback and layout");
  expect(text).toContain('import { Button, Toaster, toast } from "@gabrioliv/dossier";');
  expect(text).toContain("<Toaster />");
  expect(text).toMatch(/toast\(\{ title: "[^"]+"/);
});

/** Common Portuguese words; none occurs in the README's English text or in "Estágio B · Broto", a real string. */
const PORTUGUESE =
  /\b(não|para|como|você|uma|dos|das|com|ou|pelo|pela|quando|então|também|são|está|nada|tudo|fica|cada|sem|mais|já|isso|esta|este|seu|sua)\b/i;

test("GOV-30 the README is English, with the premise sections in order and the four links", () => {
  const readme = read("README.md");
  const headings = [...readme.matchAll(/^## (.+)$/gm)].map((m) => m[1]);
  const premise = [
    "Install",
    "Usage",
    "Entry points",
    "Components",
    "Theming",
    "Versioning",
    "Development",
    "Release",
    "License",
  ];
  const others = [
    "Links and routers",
    "Overlays",
    "Disclosure",
    "Feedback and layout",
    "Shared component API",
    "Server Components and sourcemaps",
    "Labels and number formats",
  ];
  const positions = premise.map((h) => headings.indexOf(h));
  expect(positions.every((i) => i >= 0)).toBe(true);
  expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  for (const h of others) expect(headings, h).toContain(h);
  expect(headings.filter((h) => premise.includes(h) || others.includes(h))).toHaveLength(headings.length);
  expect(headings.indexOf("Labels and number formats")).toBeGreaterThan(headings.indexOf("Theming"));
  for (const h of others.slice(0, 6)) expect(headings.indexOf(h), h).toBeGreaterThan(headings.indexOf("Components"));
  for (const link of [
    "https://gabrioliv.github.io/dossier/",
    "https://gabrioliv.github.io/dossier/storybook/",
    "docs/theming.md",
    "CONTRIBUTING.md",
  ])
    expect(readme, link).toContain(`](${link})`);
  const prose = readme
    .replace(/```[\s\S]*?```/g, "")
    .replace(/\("Estágio B · Broto"\)/, "")
    .replace(/`[^`\n]*`/g, "")
    .replace(/https?:\/\/\S+/g, "");
  expect(prose.match(PORTUGUESE)).toBeNull();
  expect(prose.match(/[áàâãéêíóôõúç]/i)).toBeNull();
});

test("GOV-33 the README headings are English and the Portuguese ones are gone", () => {
  const readme = read("README.md");
  for (const h of ["## Components", "## License", "## Development"]) expect(readme, h).toContain(`\n${h}\n`);
  for (const h of ["## Componentes", "## Licenças", "## Desenvolvimento"]) expect(readme, h).not.toContain(h);
});

test("GOV-10 the README Versioning section states the version policy", () => {
  const text = section(read("README.md"), "## Versioning");
  expect(text).toMatch(/Versioning is strict semver: a break needs a major release/);
  expect(text).toMatch(/A deprecated API keeps working for at least one minor release/);
  expect(text).toContain("`@deprecated` on the type");
  expect(text).toContain("under `Deprecated` in the [CHANGELOG](CHANGELOG.md)");
});

const contributing = () => read("CONTRIBUTING.md");

test("GOV-31 CONTRIBUTING says everything runs in the container and lists the commands and Conventional Commits", () => {
  const text = contributing();
  expect(text).toContain("`node` container of [compose.yaml](compose.yaml)");
  expect(text).toContain("Nothing is installed on your machine");
  for (const cmd of [
    "npm test",
    "npm run build",
    "npm run format",
    "npm run test:visual:update",
    "npm run test:markup:update",
  ])
    expect(text, cmd).toContain(`docker compose run --rm node ${cmd}`);
  expect(text).toContain("npx playwright test");
  expect(text).toContain("Conventional Commits");
  expect(text).toMatch(/adds a line under `Unreleased` in \[CHANGELOG\.md\]/);
});

test("GOV-32 CONTRIBUTING has the new component checklist, one item each", () => {
  const text = contributing();
  const list = text.split("## A new component")[1].split("\n- [ ] ").slice(1);
  expect(list).toHaveLength(10);
  const item = (re: RegExp) => list.filter((l) => re.test(l));
  for (const re of [
    /^`ref` goes to the root element, and the native attributes/,
    /^If it has a fixed text, it takes `labels`, with the keys in both `en` and `ptBR`/,
    /^`"use client"` only if it uses state or effects/,
    /^A section in the gallery/,
    /^A story .* and an MDX page/,
    /^A markup snapshot/,
    /^Screenshots/,
    /^Zero axe violations/,
    /^Forced colors/,
    /^A line in `CHANGELOG\.md`/,
  ])
    expect(item(re), String(re)).toHaveLength(1);
  // The wiring the other tests enforce.
  for (const wiring of [
    "src/index.ts",
    "`Components`",
    "`KEYS`",
    "`LIMITS`",
    "`CLIENT`",
    "`CASES_API`",
    "css.spec.ts",
    "tests/unit/api-types.ts",
    "<Name>Accepts",
    "<Name>NoInnerHTML",
    "`ADDED`",
    "tests/gallery/uppercase.spec.ts",
  ])
    expect(text, wiring).toContain(wiring);
});

const stageLine = () => {
  const line = section(read("docs/maturity-stages.md"), "## In the QA Garden")
    .split("\n")
    .find((l) => l.startsWith("- Component:"));
  expect(line).toBeDefined();
  return line as string;
};

test("RVW-13 the StageIcon line passes the Portuguese labels", () => {
  expect(stageLine()).toContain('<StageIcon stage="A|B|C|D" size="sm|lg" labels={ptBR.StageIcon} />');
});

test("RVW-14 the StageIcon line names the pt-BR import", () => {
  expect(stageLine()).toContain("Import `ptBR` from `@gabrioliv/dossier/locales/pt-BR`");
});

test("RVW-15 release step 1 raises the version in package-lock.json", () => {
  const step = section(read("README.md"), "## Release")
    .split("\n")
    .find((l) => l.startsWith("1. "));
  expect(step).toContain("package-lock.json");
});

test("RVW-16 the Development section names the original bundle", () => {
  const text = section(read("README.md"), "## Development");
  expect(text).toContain("source/components/bundle.js");
  expect(text).not.toContain("The original `bundle.js`");
});
