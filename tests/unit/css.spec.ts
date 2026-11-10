import { existsSync, readdirSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { TYPE_CLASSES } from "./oracle";

const read = (p: string) => readFileSync(p, "utf8");
const bundle = read("source/components/bundle.css").split("\n");
const MOVED = [0, 2, 3, 4, 244]; // @import, body, .ds-demo, .ds-row, :focus-visible
const typeSelector = new RegExp(`\\.(${TYPE_CLASSES.join("|")})(?![\\w-])`, "g");
const tokenJson = JSON.parse(read("tokens/tokens.json"));
/** Every token name of tokens.json, as the CSS custom property names it without a prefix. */
const TOKENS: string[] = [
  ...["color", "shadow", "spacing", "radius", "stroke"].flatMap((k) =>
    tokenJson[k].tokens.map((x: { name: string }) => x.name),
  ),
  ...Object.keys(tokenJson.type.families).map((f) => `font-${f}`),
  ...tokenJson.type.groups.flatMap((g: { styles: { name: string }[] }) => g.styles.map((st) => `text-${st.name}`)),
];
const tokenVar = new RegExp(`var\\(--(${[...TOKENS].sort((a, b) => b.length - a.length).join("|")})(?=[,)])`, "g");
/** The rename of STY-15: var(--<token>) becomes var(--ds-<token>). */
const dsVars = (l: string) => l.replace(tokenVar, "var(--ds-$1");

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
  [
    ".ds-header-title { margin: 0; font-family: var(--font-display); text-transform: uppercase; }",
    ".ds-header-title { margin: 0; font-family: var(--font-display); text-transform: uppercase; overflow-wrap: anywhere; }",
  ],
  [
    ".ds-running .ds-t-label { font-family: var(--font-mono); white-space: nowrap; }",
    ".ds-running .ds-t-label { font-family: var(--font-mono); white-space: nowrap; } .ds-running .ds-running-title { white-space: normal; overflow-wrap: anywhere; min-width: 0; }",
  ],
];

test("CSS-01 components.css is bundle.css without page-wide and demo rules, classes and token names renamed, plus the listed edits, the uppercase block and the forced-colors block", () => {
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
    .map(dsVars)
    .filter((l) => l !== "");
  expect(EDITS.filter((_, k) => !used.has(k))).toEqual([]);
  const own = read("src/styles/components.css");
  const shield = own.match(/\/\* Shield against host styles:[^\n]*\n[^\n]*\*\/\n(?:\.ds-[^\n]*\n){3}/)![0];
  const upper = own.match(/\/\* Uppercase:[^\n]*\n(?:[^\n]+\n)+\n/)![0];
  const forced = own.match(
    /\/\* Forced colors \(Windows High Contrast\):[^\n]*\n@media \(forced-colors: active\) \{\n[\s\S]*?\n\}\n\n/,
  )![0];
  const forms = own.match(/\/\* Checkbox, Switch, RadioGroup, Select \*\/\n(?:[^\n]+\n)+\n/)![0];
  const phone = own.match(/\n\/\* Phone width:[^\n]*\n@media \(max-width: 639px\) \{\n[\s\S]*\n\}\n$/)![0];
  const primitives = own.match(/\/\* Button, IconButton, Link \*\/\n(?:[^\n]+\n)+\n/)![0];
  const overlays = own.match(/\/\* Dialog, Popover, Tooltip, Menu \*\/\n(?:[^\n]+\n)+\n/)![0];
  const disclosure = own.match(/\/\* Tabs, Accordion, Pagination \*\/\n(?:[^\n]+\n)+\n/)![0];
  const feedback = own.match(/\/\* Spinner, Skeleton, Stack, Grid, Divider, Icon, Toaster \*\/\n(?:[^\n]+\n)+\n/)![0];
  const rest = own
    .replace(shield, "")
    .replace(primitives, "")
    .replace(overlays, "")
    .replace(disclosure, "")
    .replace(feedback, "")
    .replace(upper, "")
    .replace(forced, "")
    .replace(forms, "")
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
  expect(base).toContain(dsVars(bundle[2]));
  expect(base).toContain(dsVars(bundle[244]));
  expect(base).toContain("color-scheme: dark");
  expect(read("gallery/gallery.css")).toContain(dsVars(bundle[3]));
  expect(read("gallery/gallery.css")).toContain(dsVars(bundle[4]));
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

test("CSS-05 docusaurus.css is styles.css without layers, then dark mode with the Void values, then the Infima bridge", () => {
  const styles = read("dist/styles.css");
  const docu = read("dist/docusaurus.css");
  const fonts = styles.slice(styles.indexOf("\n") + 1, styles.indexOf("@layer dossier {"));
  expect(docu.startsWith(fonts + read("dist/tokens.css") + "\n" + read("src/styles/components.css"))).toBe(true);
  const voidBlock = read("dist/tokens.css").match(/\[data-theme="void"\] \{\n([\s\S]*?)\n\}/)![1];
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

/** The top-level statements and blocks of a CSS file, comments dropped: each prelude with its body (null for a statement). */
function topLevel(css: string): { prelude: string; body: string | null }[] {
  const out: { prelude: string; body: string | null }[] = [];
  let depth = 0;
  let start = 0;
  let open = 0;
  for (let i = 0; i < css.length; i++) {
    if (css.startsWith("/*", i)) {
      const end = css.indexOf("*/", i + 2);
      if (depth === 0) css = css.slice(0, i) + " ".repeat(end + 2 - i) + css.slice(end + 2);
      i = end + 1;
    } else if (css[i] === "{") {
      if (depth++ === 0) open = i;
    } else if (css[i] === "}") {
      if (--depth === 0) {
        out.push({ prelude: css.slice(start, open).trim(), body: css.slice(open + 1, i) });
        start = i + 1;
      }
    } else if (css[i] === ";" && depth === 0) {
      out.push({ prelude: css.slice(start, i).trim(), body: null });
      start = i + 1;
    }
  }
  expect(css.slice(start).trim()).toBe("");
  return out;
}
const ORDER = "@layer dossier.tokens, dossier.base, dossier.components;";

test("STY-01 styles.css starts with the layer order line", () => {
  expect(read("dist/styles.css").split("\n")[0]).toBe(ORDER);
});

test("STY-02 styles.css holds tokens and type classes in dossier.tokens, components in dossier.components, only @font-face outside", () => {
  const items = topLevel(read("dist/styles.css"));
  expect(items.map((x) => x.prelude)).toEqual([ORDER.slice(0, -1), ...Array(12).fill("@font-face"), "@layer dossier"]);
  // Inside @layer dossier, `tokens` is dossier.tokens and `components` is dossier.components.
  const inner = topLevel(items.at(-1)!.body!);
  expect(inner.map((x) => x.prelude)).toEqual([
    "@layer tokens, base, components",
    "@layer tokens",
    "@layer components",
  ]);
  expect(inner[1].body).toBe("\n" + read("dist/tokens.css"));
  expect(inner[1].body).toMatch(/\.ds-t-label \{/);
  expect(inner[2].body).toBe("\n" + read("src/styles/components.css"));
});

test("STY-03 base.css holds all its rules in dossier.base, after the layer order line", () => {
  const items = topLevel(read("dist/base.css"));
  expect(items.map((x) => x.prelude)).toEqual([ORDER.slice(0, -1), "@layer dossier.base"]);
  expect(items[1].body).toBe("\n" + read("src/styles/base.css"));
  expect(items[1].body).toContain("body {");
});

test("STY-07 docusaurus.css has no @layer", () => {
  expect(read("dist/docusaurus.css")).not.toContain("@layer");
});

test("STY-12 docusaurus dark mode declares each colour and shadow token as --ds-<name> with the Void value, and its alias", () => {
  const t = JSON.parse(read("tokens/tokens.json"));
  const dark = read("dist/docusaurus.css")
    .match(/\[data-theme="dark"\] \{\n([\s\S]*?)\n\}/)![1]
    .split("\n");
  const names: string[] = [...t.color.tokens, ...t.shadow.tokens].map((x: { name: string }) => x.name);
  expect(names.length).toBe(13);
  expect(dark).toEqual(
    [...t.color.tokens, ...t.shadow.tokens].flatMap((tok: { name: string; value: string | Record<string, string> }) => [
      `  --ds-${tok.name}: ${(typeof tok.value === "string" ? tok.value : (tok.value.void ?? tok.value.paper)).replace(/^\{(.+)\}$/, "var(--ds-$1)")};`,
      `  --${tok.name}: var(--ds-${tok.name});`,
    ]),
  );
});

test("STY-15 src/styles, src/components, gallery and .storybook reference tokens only by var(--ds-*)", () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory()
        ? e.name === "dist" || e.name === "node_modules"
          ? []
          : walk(`${dir}/${e.name}`)
        : [`${dir}/${e.name}`],
    );
  const files = ["src/styles", "src/components", "gallery", ".storybook"]
    .flatMap(walk)
    .filter((f) => /\.(css|tsx?|html)$/.test(f));
  expect(files).toContain("src/components/StageIcon.tsx");
  expect(TOKENS).toContain("text-label");
  let prefixed = 0;
  for (const f of files) {
    const text = read(f);
    expect(text.match(tokenVar), f).toBeNull();
    prefixed += text.match(/var\(--ds-/g)?.length ?? 0;
  }
  expect(prefixed).toBeGreaterThan(500);
});
