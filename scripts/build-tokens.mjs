#!/usr/bin/env node
// Generates CSS from tokens.json.
// Without --class-prefix and --var-prefix, the output is byte for byte the tokens.css of the Dossier artifact
// (version 1793668292-91b3).
// --var-prefix ds- declares each token as --ds-<name> and, in the same block, the alias --<name>: var(--ds-<name>).
// Usage: node scripts/build-tokens.mjs <tokens.json> <out.css> [--class-prefix ds-t-] [--var-prefix ds-]
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const option = (name) => {
  const i = args.indexOf(name);
  return i < 0 ? "" : args.splice(i, 2)[1];
};
const prefix = option("--class-prefix");
const varPrefix = option("--var-prefix");
const [src, out] = args;
if (!src || !out) {
  console.error("Usage: build-tokens.mjs <tokens.json> <out.css> [--class-prefix ds-t-] [--var-prefix ds-]");
  process.exit(1);
}

const t = JSON.parse(readFileSync(src, "utf8"));
const css = (v) => String(v).replace(/^\{(.+)\}$/, "var(--$1)");
const note = (x) => (x.usage ? ` /* ${x.usage} */` : "");
const themes = t.color.themes.map((x) => x.id);
const valueOf = (tok, theme) => (typeof tok.value === "string" ? tok.value : (tok.value[theme] ?? tok.value[themes[0]]));

const lines = [`/* ${t.name} — generated from tokens.json */`];
themes.forEach((theme, i) => {
  lines.push(i === 0 ? `:root, [data-theme="${theme}"] {` : `[data-theme="${theme}"] {`);
  for (const tok of [...t.color.tokens, ...t.shadow.tokens]) {
    lines.push(`  --${tok.name}: ${css(valueOf(tok, theme))};${i === 0 ? note(tok) : ""}`);
  }
  lines.push("}");
});

lines.push(":root {");
for (const family of ["spacing", "radius", "stroke"]) {
  for (const tok of t[family].tokens) lines.push(`  --${tok.name}: ${tok.value};${note(tok)}`);
}
for (const [name, stack] of Object.entries(t.type.families)) lines.push(`  --font-${name}: ${stack};`);
const styles = t.type.groups.flatMap((g) => g.styles.map((s) => ({ ...s, family: s.family || g.family })));
for (const s of styles) {
  lines.push(`  --text-${s.name}: ${s.fontWeight} ${s.fontSize}/${s.lineHeight} var(--font-${s.family});${note(s)}`);
}
lines.push("}");

for (const s of styles) {
  lines.push(
    `.${prefix}${s.name} {`,
    `  font-family: var(--font-${s.family});`,
    `  font-size: ${s.fontSize};`,
    `  line-height: ${s.lineHeight};`,
    `  font-weight: ${s.fontWeight};`,
    `  letter-spacing: ${s.letterSpacing};`,
    "}",
  );
}
const prefixed = (line) => line.replaceAll("var(--", `var(--${varPrefix}`);
const output = !varPrefix
  ? lines
  : lines.flatMap((line) => {
      const m = line.match(/^  --([\w-]+): (.*)$/);
      return m ? [`  --${varPrefix}${m[1]}: ${prefixed(m[2])}`, `  --${m[1]}: var(--${varPrefix}${m[1]});`] : [prefixed(line)];
    });
// The old colour and shadow names follow any theme, Dossier's own or the consumer's.
const aliases = !varPrefix
  ? []
  : [
      ":root, [data-theme] {",
      ...[...t.color.tokens, ...t.shadow.tokens].map((tok) => `  --${tok.name}: var(--${varPrefix}${tok.name});`),
      "}",
    ];
writeFileSync(out, [...output, ...aliases].join("\n") + "\n");
