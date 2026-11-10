import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Tag } from "../../src/components/Tag";

const doc = readFileSync("docs/theming.md", "utf8");
const tokens = JSON.parse(readFileSync("tokens/tokens.json", "utf8"));
const themed: { name: string; usage: string }[] = [...tokens.color.tokens, ...tokens.shadow.tokens];

/** The text under a `## ` heading of docs/theming.md, up to the next one. */
const section = (heading: string) => {
  const start = doc.indexOf(`\n## ${heading}\n`);
  expect(start, heading).toBeGreaterThanOrEqual(0);
  return doc.slice(start + heading.length + 5).split(/\n## /)[0];
};
/** The body rows of the first table of a section, as trimmed cells. */
const rows = (heading: string) =>
  section(heading)
    .split("\n")
    .filter((l) => l.startsWith("|"))
    .slice(2)
    .map((l) =>
      l
        .slice(1, -1)
        .split("|")
        .map((c) => c.trim()),
    );
const example = doc.match(/```css\n([\s\S]*?)```/)![1];
const id = example.match(/^\[data-theme="([\w-]+)"\] \{/)![1];
const declared = Object.fromEntries([...example.matchAll(/^ {2}(--[\w-]+): (.*);$/gm)].map((m) => [m[1], m[2]]));
const rgb = (hex: string) => `rgb(${[1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(", ")})`;

async function open(page: Page, markup: string, example: string) {
  await page.setContent(`<!doctype html><html><head></head><body>${markup}</body></html>`);
  await page.addStyleTag({ content: readFileSync("dist/styles.css", "utf8") });
  await page.addStyleTag({ content: example });
}
const style = (page: Page, selector: string, property: string) =>
  page.$eval(selector, (el, p) => getComputedStyle(el).getPropertyValue(p), property);

test("STY-20 the colour and shadow table lists each such token of tokens.json by --ds- name with its usage, and no other", () => {
  expect(rows("Colour and shadow tokens")).toEqual(themed.map((t) => [`\`--ds-${t.name}\``, t.usage]));
  expect(themed).toHaveLength(13);
});

test("STY-21 the scale table lists each spacing, radius, stroke, family and text style token by --ds- name, and no other", () => {
  const names = [
    ...["spacing", "radius", "stroke"].flatMap((k) => tokens[k].tokens.map((t: { name: string }) => t.name)),
    ...Object.keys(tokens.type.families).map((f) => `font-${f}`),
    ...tokens.type.groups.flatMap((g: { styles: { name: string }[] }) => g.styles.map((s) => `text-${s.name}`)),
  ];
  expect(rows("Scale tokens").map((r) => r[0])).toEqual(names.map((n) => `\`--ds-${n}\``));
  expect(names).toContain("text-label");
});

test("STY-22 the example is a [data-theme] block that defines each colour and shadow token", () => {
  expect(example.trimEnd()).toMatch(/^\[data-theme="[\w-]+"\] \{\n[\s\S]*\n\}$/);
  expect(Object.keys(declared).sort()).toEqual(themed.map((t) => `--ds-${t.name}`).sort());
});

test("STY-23 a solid Tag inside the example theme is filled with the example's --ds-signal", async ({ page }) => {
  const tag = renderToStaticMarkup(createElement(Tag, { variant: "solid", children: "Live" }));
  await open(page, `<div data-theme="${id}">${tag}</div>`, example);
  expect(declared["--ds-signal"]).toMatch(/^#[0-9a-f]{6}$/);
  expect(await style(page, ".ds-tag", "background-color")).toBe(rgb(declared["--ds-signal"]));
  expect(rgb(declared["--ds-signal"])).not.toBe("rgb(0, 47, 167)");
});

test("STY-24 the doc states the layer order, where unlayered CSS wins, color-scheme and the deprecated names", () => {
  expect(section("Cascade layers")).toContain("`@layer dossier.tokens, dossier.base, dossier.components;`");
  expect(section("Cascade layers")).toContain("CSS without a layer wins over every layer. With `styles.css`");
  expect(section("Cascade layers")).toContain("With `docusaurus.css`, unlayered CSS does not win");
  expect(section("A theme of your own")).toContain("A dark theme of your own needs `color-scheme: dark`");
  expect(section("Old names")).toContain("The names without `--ds-` are deprecated aliases");
});

test("STY-30 a token the theme leaves out keeps the Paper value at :root", async ({ page }) => {
  const partial = example.replace(/^ {2}--ds-panel: .*\n/m, "");
  expect(partial).not.toContain("--ds-panel");
  const markup = `<div data-theme="${id}"><i id="panel" style="background-color: var(--ds-panel)"></i><i id="paper" style="background-color: var(--ds-paper)"></i></div>`;
  await open(page, markup, partial);
  expect(await style(page, "#panel", "background-color")).toBe("rgb(230, 230, 225)");
  expect(await style(page, "#paper", "background-color")).toBe(rgb(declared["--ds-paper"]));
});

test("STY-33 inside a theme of your own, the old names give that theme's values", async ({ page }) => {
  const probes = ["ink", "signal", "rule", "paper"].map((n) => `<i id="${n}" style="color: var(--${n})"></i>`).join("");
  await open(page, `<div data-theme="${id}">${probes}</div><i id="outside" style="color: var(--ink)"></i>`, example);
  expect(declared["--ds-rule"]).toBe("var(--ds-ink)");
  for (const n of ["ink", "signal", "paper"])
    expect(await style(page, `#${n}`, "color"), n).toBe(rgb(declared[`--ds-${n}`]));
  expect(await style(page, "#rule", "color")).toBe(rgb(declared["--ds-ink"]));
  expect(await style(page, "#outside", "color")).toBe("rgb(11, 12, 14)");
  // Every colour and shadow name, read as the custom property itself.
  const resolved = (v: string) => (v === "var(--ds-ink)" ? declared["--ds-ink"] : v);
  for (const t of themed) {
    const old = (await style(page, "#ink", `--${t.name}`)).trim();
    expect(old, t.name).toBe(resolved(declared[`--ds-${t.name}`]));
  }
  expect(themed.map((t) => t.name)).toContain("focus-ring");
});

test("GOV-34 docs/theming.md is English: no common Portuguese word, no accented letter, and not trivial", () => {
  const prose = doc.replace(/```[\s\S]*?```/g, "").replace(/`[^`\n]*`/g, "");
  expect(
    prose.match(
      /\b(não|para|como|você|uma|dos|das|com|ou|pelo|pela|quando|então|também|são|está|nada|tudo|fica|cada|sem|mais|já|isso|esta|este|seu|sua)\b/i,
    ),
  ).toBeNull();
  expect(prose.match(/[áàâãéêíóôõúç]/i)).toBeNull();
  expect(doc.length).toBeGreaterThan(3000);
  expect(doc).toContain("\n## Cascade layers\n");
  expect(doc).toContain("\n## A theme of your own\n");
});
