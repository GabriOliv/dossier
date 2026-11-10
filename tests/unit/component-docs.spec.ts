import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { memo } from "react";

const STORIES = "stories";
const read = (path: string) => readFileSync(path, "utf8");
const mdxFiles = () => readdirSync(STORIES).filter((f) => f.endsWith(".mdx"));

/** The sections of a docs page, in order. */
const HEADINGS = ["Usage", "Do and don't", "Accessibility", "Props"];

/** The 28 report components, the group the first docs pages cover. */
const REPORT = [
  "Assertion",
  "BarChart",
  "CheckLog",
  "Comparison",
  "Connector",
  "Contents",
  "DataHeader",
  "DataTable",
  "Dimension",
  "ErrorNotice",
  "FieldList",
  "Footnotes",
  "Hierarchy",
  "LineChart",
  "Meter",
  "ProportionDial",
  "Quote",
  "Readout",
  "Redacted",
  "Schematic",
  "SectionTitle",
  "StageIcon",
  "StatusFlag",
  "Tag",
  "TextField",
  "Timeline",
  "ToleranceBar",
  "Transcript",
];

/**
 * The keys each interactive component accepts, which its `Accessibility` section must name. Each is the `event.key`
 * name (or `Shift+Tab`) the component, or the native element under it, handles.
 */
const KEYS: Record<string, string[]> = {
  TextField: ["Tab", "Shift+Tab", "Enter"],
  Hierarchy: ["Tab", "Shift+Tab", "ArrowLeft", "ArrowRight"],
  Button: ["Tab", "Shift+Tab", "Enter", "Space"],
  IconButton: ["Tab", "Shift+Tab", "Enter", "Space"],
  Link: ["Tab", "Shift+Tab", "Enter"],
  Checkbox: ["Tab", "Shift+Tab", "Space"],
  Switch: ["Tab", "Shift+Tab", "Space"],
  RadioGroup: ["Tab", "Shift+Tab", "ArrowDown", "ArrowUp", "Space"],
  Select: ["Tab", "Shift+Tab", "ArrowDown", "ArrowUp", "Enter", "Space", "Escape"],
  Dialog: ["Escape", "Tab", "Shift+Tab", "Enter", "Space"],
  Popover: ["Enter", "Space", "Tab", "Shift+Tab", "Escape"],
  Tooltip: ["Tab", "Escape"],
  Menu: ["Enter", "Space", "ArrowDown", "ArrowUp", "Home", "End", "Escape", "Tab"],
  Tabs: ["Tab", "Shift+Tab", "ArrowRight", "ArrowLeft", "Home", "End"],
  Accordion: ["Tab", "Shift+Tab", "Enter", "Space"],
  Pagination: ["Tab", "Shift+Tab", "Enter", "Space"],
  Toaster: ["Tab", "Shift+Tab", "Enter", "Space"],
};

/**
 * The known limits each page states in `Do and don't`: one distinctive term for each, so a removed limit fails. The
 * terms are in the order of the limits of the spec.
 */
const LIMITS: Record<string, string[]> = {
  Pagination: ["10.5", "`NaN` or a negative number as `siblings`", "Ctrl+click"],
  Accordion: ["only the first"],
  Tabs: ["at a disabled tab"],
  Popover: ["right edge"],
  Toaster: ["a `duration` of 0, a negative number or `NaN`", "only spaces", "unmounts", "::backdrop"],
  Divider: ['align="center"'],
  Button: ['"use client"'],
};

/** What marks a component as interactive in its source: a focusable element, a handler or a control inside. */
const INTERACTIVE =
  /tabIndex|onKeyDown|onClick|onChange|onFocus|<button|<a\b|<input|<select|<textarea|<details|<Button|<IconButton/;

/** The components among the exports of a module: capitalised functions, forwardRef and memo objects, not `toast()`. */
function componentNames(lib: Record<string, any>): string[] {
  const kinds = [Symbol.for("react.forward_ref"), Symbol.for("react.memo")];
  return Object.keys(lib)
    .filter((k) => /^[A-Z]/.test(k) && (typeof lib[k] === "function" || kinds.includes(lib[k]?.$$typeof)))
    .sort();
}

/** The components exported by `dist/index.js`. */
async function components(): Promise<string[]> {
  return componentNames((await import("../../dist/index.js")) as Record<string, any>);
}

interface Section {
  heading: string;
  /** Every line under the heading, up to the next `##`. */
  body: string;
}

/** Splits a page at its `##` headings, in order. A `##` inside a code fence is not a heading. */
function sections(mdx: string): Section[] {
  const out: Section[] = [];
  let fenced = false;
  for (const line of mdx.split("\n")) {
    if (line.startsWith("```")) fenced = !fenced;
    const heading = !fenced && /^## (.+?)\s*$/.exec(line);
    if (heading) out.push({ heading: heading[1], body: "" });
    else if (out.length) out[out.length - 1].body += line + "\n";
  }
  return out;
}

/** The body without its code fences. */
const outsideFences = (body: string) => body.replace(/^```[\s\S]*?^```.*$/gm, "");

/** The prose of a body: no code fences, no JSX lines, no blank lines. */
const prose = (body: string) =>
  outsideFences(body)
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("<"))
    .join("\n");

const section = (mdx: string, heading: string) => sections(mdx).find((s) => s.heading === heading);

/**
 * What is wrong between the exported components and the pages: an export with no `stories/<Name>.mdx`, and a page
 * with no export of its name.
 */
function docsProblems(exported: string[], files: string[]): string[] {
  const pages = files.filter((f) => f.endsWith(".mdx")).map((f) => f.slice(0, -4));
  return [
    ...exported.filter((n) => !pages.includes(n)).map((n) => `${n} has no ${STORIES}/${n}.mdx`),
    ...pages.filter((n) => !exported.includes(n)).map((n) => `${STORIES}/${n}.mdx has no matching export`),
  ];
}

test("GOV-20 every report component has a page in stories", () => {
  expect(REPORT).toHaveLength(28);
  // The pages of the other components are covered by the test of all the exports below.
  expect(REPORT.filter((n) => !mdxFiles().includes(`${n}.mdx`))).toEqual([]);
});

test("GOV-20 every exported component has a page and no page lacks an export", async () => {
  const exported = await components();
  expect(exported).not.toContain("toast");
  expect(exported).toEqual(expect.arrayContaining(REPORT));
  expect(docsProblems(exported, mdxFiles())).toEqual([]);
});

test("GOV-20 each page attaches to the stories of its own component", () => {
  for (const file of mdxFiles()) {
    const name = file.slice(0, -4);
    const mdx = read(`${STORIES}/${file}`);
    const imported = /^import \* as (\w+) from "\.\/(\w+)\.stories";$/m.exec(mdx);
    expect(imported, `${file} imports its stories`).not.toBeNull();
    expect(imported![2], `${file} imports ${name}.stories`).toBe(name);
    expect(mdx, `${file} attaches with <Meta of>`).toContain(`<Meta of={${imported![1]}} />`);
  }
});

test("GOV-21 each page has Usage, Do and don't, Accessibility and Props, in this order, each with text", () => {
  for (const file of mdxFiles()) {
    const found = sections(read(`${STORIES}/${file}`));
    expect(
      found.map((s) => s.heading),
      `${file} headings`,
    ).toEqual(HEADINGS);
    for (const s of found) expect(prose(s.body).length, `${file}: ${s.heading} has text`).toBeGreaterThan(0);
  }
});

test("GOV-21 the section parser keeps order, ignores fences and counts only prose", () => {
  const mdx = ["# Title", "## Usage", "```", "## Not a heading", "```", "## Props", "<ArgTypes />", "text"].join("\n");
  expect(sections(mdx).map((s) => s.heading)).toEqual(["Usage", "Props"]);
  expect(prose(section(mdx, "Usage")!.body)).toBe("");
  expect(prose(section(mdx, "Props")!.body)).toBe("text");
});

test("GOV-22 the Props section of each page holds the ArgTypes table", () => {
  for (const file of mdxFiles()) {
    const props = section(read(`${STORIES}/${file}`), "Props");
    expect(props, `${file} has Props`).toBeDefined();
    expect(outsideFences(props!.body), `${file}: Props holds <ArgTypes />`).toMatch(/^<ArgTypes\b[^>]*\/>$/m);
  }
});

test("GOV-23 the Accessibility section of each interactive component names its keys", () => {
  for (const [name, keys] of Object.entries(KEYS)) {
    const a11y = section(read(`${STORIES}/${name}.mdx`), "Accessibility");
    expect(a11y, `${name} has Accessibility`).toBeDefined();
    for (const key of keys) expect(a11y!.body, `${name}: Accessibility names ${key}`).toContain(`\`${key}\``);
  }
});

test("GOV-23 every interactive component in src has its keys in the table", () => {
  const found = readdirSync("src/components")
    .filter((f) => f.endsWith(".tsx") && INTERACTIVE.test(read(`src/components/${f}`)))
    .map((f) => f.slice(0, -4))
    .sort();
  expect(found).toEqual(Object.keys(KEYS).sort());
});

test("GOV-26 the Toaster page documents toast(): its options, the returned id and toast.dismiss(id)", () => {
  const usage = section(read(`${STORIES}/Toaster.mdx`), "Usage")!.body;
  expect(usage).toMatch(/^### .*toast\(\)/m);
  expect(usage).toContain("toast.dismiss(id)");
  expect(usage).toMatch(/returns[^.]*\bid\b/);
  // Every option of ToastOptions in the source is documented, as a code name.
  const interfaceBody = /interface ToastOptions \{([\s\S]*?)\n\}/.exec(read("src/lib/toast-store.ts"))![1];
  const options = [...interfaceBody.matchAll(/^ {2}(\w+)\??:/gm)].map((m) => m[1]);
  expect(options).toEqual(["title", "description", "tone", "duration"]);
  for (const option of options) expect(usage, `option ${option}`).toContain(`\`${option}\``);
});

test("GOV-27 Do and don't states the known limits of each page", () => {
  for (const [name, terms] of Object.entries(LIMITS)) {
    const rules = section(read(`${STORIES}/${name}.mdx`), "Do and don't");
    expect(rules, `${name} has Do and don't`).toBeDefined();
    for (const term of terms) expect(rules!.body, `${name}: Do and don't has ${term}`).toContain(term);
  }
});

test("GOV-42 a component exported without a page fails with its name", () => {
  const sample = docsProblems(["Alpha", "Beta", "NewOne"], ["Alpha.mdx", "Beta.mdx"]);
  expect(sample).toEqual(["NewOne has no stories/NewOne.mdx"]);
  expect(sample.join("\n")).toContain("NewOne");
  expect(docsProblems(["Alpha"], ["Alpha.mdx", "Gone.mdx", "notes.md"])).toEqual([
    "stories/Gone.mdx has no matching export",
  ]);
  expect(docsProblems(["Alpha"], ["Alpha.mdx"])).toEqual([]);
  // A memo export is a component too: without a page it is named, like a plain function.
  const lib = { Alpha: () => null, NewMemo: memo(() => null), toast: () => null };
  expect(docsProblems(componentNames(lib), ["Alpha.mdx"])).toEqual(["NewMemo has no stories/NewMemo.mdx"]);
});
