#!/usr/bin/env node
// Gera CSS a partir de tokens.json.
// Sem --class-prefix, o resultado é byte a byte igual ao tokens.css do artifact Dossier (versão 1793668292-91b3).
// Uso: node scripts/build-tokens.mjs <tokens.json> <saida.css> [--class-prefix ds-t-]
import { readFileSync, writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const flag = args.indexOf("--class-prefix");
const prefix = flag >= 0 ? args[flag + 1] : "";
const [src, out] = flag >= 0 ? args.filter((_, i) => i !== flag && i !== flag + 1) : args;
if (!src || !out) {
  console.error("Uso: build-tokens.mjs <tokens.json> <saida.css> [--class-prefix ds-t-]");
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
writeFileSync(out, lines.join("\n") + "\n");
