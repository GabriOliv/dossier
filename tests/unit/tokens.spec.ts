import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { TYPE_CLASSES } from "./oracle";

const build = (...flags: string[]) => {
  const out = join(mkdtempSync(join(tmpdir(), "tokens-")), "tokens.css");
  execFileSync("node", ["scripts/build-tokens.mjs", "tokens/tokens.json", out, ...flags]);
  return readFileSync(out, "utf8");
};

test("tokens.json is the artifact's tokens.json", () => {
  expect(readFileSync("tokens/tokens.json", "utf8")).toBe(readFileSync("source/tokens.json", "utf8"));
});

test("STY-16 build-tokens without a prefix reproduces Dossier's tokens.css byte for byte", () => {
  const sha = createHash("sha256").update(build()).digest("hex");
  expect(sha).toBe("e455abdf427246ccacde43cc90bdb2fd3115e591fcdc0e6bd683870be68b36d8");
});

test("the prefixed build differs from Dossier's tokens.css only in the nine class selectors", () => {
  const plain = build().split("\n");
  const prefixed = build("--class-prefix", "ds-t-").split("\n");
  expect(prefixed).toHaveLength(plain.length);
  const changed = plain.flatMap((line, i) => (line === prefixed[i] ? [] : [[line, prefixed[i]]]));
  expect(changed).toEqual(TYPE_CLASSES.map((c) => [`.${c} {`, `.ds-t-${c} {`]));
  expect(readFileSync("dist/tokens.css", "utf8")).toBe(build("--class-prefix", "ds-t-", "--var-prefix", "ds-"));
});

interface Tok {
  name: string;
  value: string | Record<string, string>;
}
const tokens = JSON.parse(readFileSync("tokens/tokens.json", "utf8"));
const themes: string[] = tokens.color.themes.map((x: { id: string }) => x.id);
const themed: Tok[] = [...tokens.color.tokens, ...tokens.shadow.tokens];
const valueIn = (tok: Tok, theme: string) =>
  (typeof tok.value === "string" ? tok.value : (tok.value[theme] ?? tok.value[themes[0]])).replace(
    /^\{(.+)\}$/,
    "var(--ds-$1)",
  );
/** Each `selector { ... }` block of a CSS file: selector to its declarations, name to value without the note. */
const blocks = (css: string) =>
  Object.fromEntries(
    [...css.matchAll(/^([^@\n{][^\n{]*) \{\n([\s\S]*?)\n\}/gm)].map(([, selector, body]) => [
      selector,
      Object.fromEntries([...body.matchAll(/^ {2}(--[\w-]+): (.*?);(?: \/\*.*\*\/)?$/gm)].map((m) => [m[1], m[2]])),
    ]),
  ) as Record<string, Record<string, string>>;
const selectorOf = (theme: string, i: number) =>
  i === 0 ? `:root, [data-theme="${theme}"]` : `[data-theme="${theme}"]`;
const files = () => ["dist/tokens.css", "dist/styles.css"].map((f) => [f, readFileSync(f, "utf8")] as const);

test("STY-10 every token is declared as --ds-<name>: colour and shadow in each theme block, the rest in :root", () => {
  const styles = tokens.type.groups.flatMap((g: { family: string; styles: any[] }) =>
    g.styles.map((st) => ({ ...st, family: st.family || g.family })),
  );
  for (const [file, css] of files()) {
    const b = blocks(css);
    themes.forEach((theme, i) => {
      for (const tok of themed)
        expect(b[selectorOf(theme, i)][`--ds-${tok.name}`], `${file} ${theme} ${tok.name}`).toBe(valueIn(tok, theme));
    });
    const root = b[":root"];
    for (const family of ["spacing", "radius", "stroke"])
      for (const tok of tokens[family].tokens) expect(root[`--ds-${tok.name}`], `${file} ${tok.name}`).toBe(tok.value);
    for (const [name, stack] of Object.entries(tokens.type.families))
      expect(root[`--ds-font-${name}`], file).toBe(stack);
    for (const st of styles)
      expect(root[`--ds-text-${st.name}`], file).toBe(
        `${st.fontWeight} ${st.fontSize}/${st.lineHeight} var(--ds-font-${st.family})`,
      );
    expect(styles.length).toBeGreaterThan(5);
  }
});

test("STY-11 each block that declares --ds-<name> also declares the alias --<name>: var(--ds-<name>)", () => {
  for (const [file, css] of files()) {
    const b = blocks(css);
    const declaring = Object.entries(b).filter(([, decl]) => Object.keys(decl).some((n) => n.startsWith("--ds-")));
    expect(declaring.map(([s]) => s).sort(), file).toEqual([...themes.map(selectorOf), ":root"].sort());
    for (const [selector, decl] of declaring)
      for (const name of Object.keys(decl).filter((n) => n.startsWith("--ds-")))
        expect(decl[name.replace("--ds-", "--")], `${file} ${selector} ${name}`).toBe(`var(${name})`);
  }
});
