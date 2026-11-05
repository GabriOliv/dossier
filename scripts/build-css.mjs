#!/usr/bin/env node
// Builds the CSS entries, fonts, tokens and assets of dist/ by plain concatenation: no @import, no PostCSS,
// so the order never depends on the consumer's bundler.
import { execFileSync } from "node:child_process";
import { copyFileSync, cpSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const read = (p) => readFileSync(join(root, p), "utf8");
const write = (p, s) => writeFileSync(join(dist, p), s);
mkdirSync(join(dist, "fonts"), { recursive: true });

// Tokens, typography classes prefixed with ds-t- (they collide with Mermaid's .label otherwise).
execFileSync("node", ["scripts/build-tokens.mjs", "tokens/tokens.json", "dist/tokens.css", "--class-prefix", "ds-t-"], {
  cwd: root,
});
copyFileSync(join(root, "tokens/tokens.json"), join(dist, "tokens.json"));

// Fonts: the six faces Dossier loads, latin and latin-ext only, copied from @fontsource as local woff2.
const FACES = [
  ["ibm-plex-sans-condensed", 600],
  ["ibm-plex-sans-condensed", 700],
  ["ibm-plex-sans", 400],
  ["ibm-plex-sans", 600],
  ["ibm-plex-mono", 400],
  ["ibm-plex-mono", 500],
];
const SUBSETS = ["latin-ext", "latin"];
const fontFaces = [];
for (const [pkg, weight] of FACES) {
  const dir = join(root, "node_modules/@fontsource", pkg);
  const css = readFileSync(join(dir, `${weight}.css`), "utf8");
  for (const subset of SUBSETS) {
    const file = `${pkg}-${subset}-${weight}-normal`;
    const block = css.match(new RegExp(`/\\* ${file} \\*/\\n@font-face \\{[^}]*\\}`));
    if (!block) throw new Error(`@fontsource/${pkg}/${weight}.css: no @font-face for ${file}`);
    const face = block[0].replace(
      `url(./files/${file}.woff2) format('woff2'), url(./files/${file}.woff) format('woff')`,
      `url(./fonts/${file}.woff2) format('woff2')`,
    );
    if (!face.includes(`url(./fonts/${file}.woff2)`)) throw new Error(`unexpected src in ${file}`);
    fontFaces.push(face);
    copyFileSync(join(dir, "files", `${file}.woff2`), join(dist, "fonts", `${file}.woff2`));
  }
  copyFileSync(join(dir, "LICENSE"), join(dist, "fonts", `LICENSE-${pkg}.txt`));
}
const fonts = `/* IBM Plex (SIL Open Font License 1.1, see fonts/LICENSE-*.txt), from @fontsource */\n${fontFaces.join("\n\n")}\n`;

// Docusaurus dark mode is data-theme="dark": give it the Void values, generated from tokens.json.
const t = JSON.parse(read("tokens/tokens.json"));
const css = (v) => String(v).replace(/^\{(.+)\}$/, "var(--$1)");
const themes = t.color.themes.map((x) => x.id);
const voidValue = (tok) => (typeof tok.value === "string" ? tok.value : (tok.value.void ?? tok.value[themes[0]]));
const dark = [
  `/* Docusaurus dark mode = Void, generated from tokens.json */`,
  `[data-theme="dark"] {`,
  ...[...t.color.tokens, ...t.shadow.tokens].map((tok) => `  --${tok.name}: ${css(voidValue(tok))};`),
  `}`,
].join("\n");

const styles = [fonts, readFileSync(join(dist, "tokens.css"), "utf8"), read("src/styles/components.css")].join("\n");
write("styles.css", styles);
write("base.css", read("src/styles/base.css"));
write("docusaurus.css", [styles, dark, read("src/styles/docusaurus-bridge.css")].join("\n"));

// SVG assets (stages, banners, diagrams, animations).
cpSync(join(root, "assets"), join(dist, "assets"), { recursive: true });
