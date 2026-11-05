import { existsSync, readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { TYPE_CLASSES } from "./oracle";

const read = (p: string) => readFileSync(p, "utf8");
const bundle = read("source/components/bundle.css").split("\n");
const MOVED = [0, 2, 3, 4, 244]; // @import, body, .ds-demo, .ds-row, :focus-visible
const typeSelector = new RegExp(`\\.(${TYPE_CLASSES.join("|")})(?![\\w-])`, "g");

/**
 * Line prefixes rewritten in bundle.css (old → new). Modifiers compound with their base class so they win by
 * specificity, not by source order (Docusaurus' clean-css restructureRules reorders rules); host shields are
 * declarations of the rule they guard.
 */
const EDITS: [string, string][] = [
  [".ds-readout-signal { border-top", ".ds-readout.ds-readout-signal { border-top"],
  [".ds-readout-hero { min-width", ".ds-readout.ds-readout-hero { min-width"],
  [".ds-tag-solid {", ".ds-tag.ds-tag-solid {"],
  [".ds-tag-inverse {", ".ds-tag.ds-tag-inverse {"],
  [".ds-sch-node-on {", ".ds-sch-node.ds-sch-node-on {"],
  [".ds-sch-on-text {", ".ds-sch-text.ds-sch-on-text {"],
  [".ds-fields-2 {", ".ds-fields.ds-fields-2 {"],
  [".ds-field-term {", ".ds-field .ds-field-term {"],
  [".ds-tree > ul { padding-top: 0; }", ".ds-tree.ds-tree > ul { padding-top: 0; }"],
  [".ds-tree > ul > li { padding-top: 0; }", ".ds-tree.ds-tree > ul > li { padding-top: 0; }"],
  [".ds-tree-root {", ".ds-tree-node.ds-tree-root:not(.ds-tree-on) {"],
  [".ds-tree-root .ds-tree-code {", ".ds-tree-root:not(.ds-tree-on) .ds-tree-code {"],
  [".ds-tree-on {", ".ds-tree-node.ds-tree-on {"],
  [".ds-statement {", ".ds-quote.ds-statement {"],
  [".ds-flag-pending {", ".ds-flag.ds-flag-pending {"],
  [".ds-flag-skip {", ".ds-flag.ds-flag-skip {"],
  [".ds-flag-fail {", ".ds-flag.ds-flag-fail {"],
  [
    ".ds-table { border-collapse: collapse; width: 100%; color: var(--ink); }",
    ".ds-table { display: table; margin: 0; overflow: visible; background: transparent; border-collapse: collapse; width: 100%; color: var(--ink); }",
  ],
  [".ds-table th { font-family", ".ds-table th { border: 0; background: transparent; font-family"],
  [".ds-table td { padding", ".ds-table td { border: 0; background: transparent; color: inherit; padding"],
  [
    ".ds-quote-text { margin: 0;",
    ".ds-quote-text { margin: 0; padding: 0; border: 0; box-shadow: none; color: inherit;",
  ],
];

test("CSS-01 components.css is bundle.css without page-wide and demo rules, classes renamed, plus the listed edits", () => {
  expect(MOVED.map((i) => bundle[i].slice(0, 14))).toEqual([
    "@import url('h",
    "body { margin:",
    ".ds-demo { pad",
    ".ds-row { disp",
    ":focus-visible",
  ]);
  const used = new Set<number>();
  const expected = bundle
    .filter((_, i) => !MOVED.includes(i))
    .map((l) => l.replace(typeSelector, ".ds-t-$1"))
    .map((l) => {
      const k = EDITS.findIndex(([from]) => l.startsWith(from));
      if (k < 0) return l;
      used.add(k);
      return EDITS[k][1] + l.slice(EDITS[k][0].length);
    })
    .filter((l) => l !== "");
  expect(EDITS.filter((_, k) => !used.has(k))).toEqual([]);
  const own = read("src/styles/components.css");
  const shield = own.match(/\/\* Shield against host styles:[^\n]*\n[^\n]*\*\/\n(?:\.ds-[^\n]*\n){3}/)![0];
  const phone = own.match(/\n\/\* Phone width:[^\n]*\n@media \(max-width: 639px\) \{\n[\s\S]*\n\}\n$/)![0];
  const rest = own
    .replace(shield, "")
    .replace(phone, "")
    .split("\n")
    .filter((l) => l !== "");
  expect(rest).toEqual(expected);
});

test("CSS-02 styles.css has no page-wide rule, no @import, no demo rule and no unprefixed typography class", () => {
  for (const file of ["dist/styles.css", "dist/docusaurus.css"]) {
    const css = read(file);
    expect(css).not.toContain("@import");
    expect(css).not.toMatch(/(^|[\s,}])body\s*\{/);
    expect(css).not.toMatch(/(^|[\s,}]):focus-visible/m);
    expect(css).not.toMatch(/\.ds-(demo|row)\s*\{/);
    expect(css.match(typeSelector)).toBeNull();
    expect(css).not.toMatch(/fonts\.googleapis/);
  }
});

test("CSS-03 base.css holds the page-wide rules moved out of bundle.css", () => {
  const base = read("dist/base.css");
  expect(base).toContain(bundle[2]);
  expect(base).toContain(bundle[244]);
  expect(base).toContain("color-scheme: dark");
  expect(read("gallery/gallery.css")).toContain(bundle[3]);
  expect(read("gallery/gallery.css")).toContain(bundle[4]);
});

test("CSS-04 twelve local woff2 files (six faces, latin and latin-ext) with the OFL", () => {
  const files = readdirSync("dist/fonts");
  const woff2 = files.filter((f) => f.endsWith(".woff2")).sort();
  expect(woff2).toHaveLength(12);
  const styles = read("dist/styles.css");
  for (const f of woff2) expect(styles).toContain(`url(./fonts/${f}) format('woff2')`);
  expect(styles.match(/@font-face/g)).toHaveLength(12);
  for (const [family, weights] of [
    ["IBM Plex Sans Condensed", [600, 700]],
    ["IBM Plex Sans", [400, 600]],
    ["IBM Plex Mono", [400, 500]],
  ] as const) {
    for (const w of weights) {
      const faces = styles.match(new RegExp(`font-family: '${family}';[^}]*font-weight: ${w};`, "g"));
      expect(faces, `${family} ${w}`).toHaveLength(2);
    }
  }
  for (const pkg of ["ibm-plex-sans", "ibm-plex-sans-condensed", "ibm-plex-mono"]) {
    expect(read(`dist/fonts/LICENSE-${pkg}.txt`)).toContain("SIL OPEN FONT LICENSE");
  }
});

test("CSS-05 docusaurus.css is styles.css, then dark mode with the Void values, then the Infima bridge", () => {
  const styles = read("dist/styles.css");
  const docu = read("dist/docusaurus.css");
  expect(docu.startsWith(styles)).toBe(true);
  const voidBlock = read("source/tokens.css").match(/\[data-theme="void"\] \{\n([\s\S]*?)\n\}/)![1];
  const darkBlock = docu.match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/)![1];
  expect(darkBlock).toBe(voidBlock);
  const bridge = docu.match(/html\[data-theme\] \{\n([\s\S]*?)\n\}/)![1];
  for (const v of [
    "--ifm-background-color",
    "--ifm-font-color-base",
    "--ifm-color-primary",
    "--ifm-color-primary-dark",
    "--ifm-color-primary-darker",
    "--ifm-color-primary-darkest",
    "--ifm-color-primary-light",
    "--ifm-color-primary-lighter",
    "--ifm-color-primary-lightest",
    "--ifm-font-family-base",
    "--ifm-heading-font-family",
    "--ifm-font-family-monospace",
    "--ifm-global-radius",
    "--ifm-table-stripe-background",
  ]) {
    expect(bridge).toContain(`  ${v}: `);
  }
});

test("CSS-06 tokens.json, tokens.css and the stage assets ship in dist", () => {
  expect(read("dist/tokens.json")).toBe(read("source/tokens.json"));
  expect(existsSync("dist/assets/stages/base/estagio-d-fruto-48.svg")).toBe(true);
});
