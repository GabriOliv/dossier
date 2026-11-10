import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

interface Motion {
  selector: string;
  property: string;
}

/**
 * Each `transition*` or `animation*` declaration whose value is not `none` and that sits outside
 * `@media (prefers-reduced-motion: no-preference)`, with the selector of its rule.
 */
/** A guard is one media query, with no `not`, no comma and no `or` (both an OR), that requires no-preference. */
const guards = (prelude: string) => {
  const p = prelude.toLowerCase();
  return (
    /^@media\b/.test(p) &&
    !p.includes(",") &&
    !/\b(not|or)\b/.test(p) &&
    /\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/.test(p)
  );
};

function motionOutsideGuard(source: string): Motion[] {
  const css = source.replace(/\/\*[\s\S]*?\*\//g, "");
  const out: Motion[] = [];
  const stack: string[] = [];
  let buf = "";
  let parens = 0;
  let quote = "";
  const declaration = () => {
    const m = buf.match(/^\s*([\w-]+)\s*:([\s\S]*)$/);
    buf = "";
    const property = m?.[1].toLowerCase() ?? "";
    if (!m || !/^(transition|animation)(-[\w-]+)?$/.test(property) || m[2].trim().toLowerCase() === "none") return;
    if (stack.some(guards)) return;
    out.push({ selector: [...stack].reverse().find((p) => !p.startsWith("@")) ?? "", property });
  };
  for (const ch of css) {
    if (quote) {
      if (ch === quote) quote = "";
      buf += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      buf += ch;
    } else if (ch === "(" || ch === ")") {
      parens += ch === "(" ? 1 : -1;
      buf += ch;
    } else if (ch === "{" && !parens) {
      stack.push(buf.trim());
      buf = "";
    } else if (ch === ";" && !parens) {
      declaration();
    } else if (ch === "}" && !parens) {
      declaration();
      stack.pop();
    } else buf += ch;
  }
  return out;
}

const FILES = ["styles.css", "base.css", "docusaurus.css", "tokens.css"];

test("A11Y-20 no CSS file of dist declares motion outside prefers-reduced-motion: no-preference", () => {
  const found = FILES.flatMap((f) =>
    motionOutsideGuard(readFileSync(`dist/${f}`, "utf8")).map((m) => ({ file: f, ...m })),
  );
  expect(found).toEqual([]);
  // The guard reads the real file, layers and media blocks included: one added rule is reported.
  const styles = readFileSync("dist/styles.css", "utf8");
  const nested = styles.replace(
    /@layer components \{\n/,
    "$&@media (max-width: 639px) { .ds-tag { animation-name: x; } }\n",
  );
  expect(nested).not.toBe(styles);
  expect(motionOutsideGuard(nested)).toEqual([{ selector: ".ds-tag", property: "animation-name" }]);
});

test("A11Y-21 a transition outside the media block is reported with its selector and property", () => {
  expect(motionOutsideGuard(".y { color: red; }\n.x { transition: opacity 1s }")).toEqual([
    { selector: ".x", property: "transition" },
  ]);
});

test("A11Y-22 the same transition inside prefers-reduced-motion: no-preference is not reported", () => {
  expect(
    motionOutsideGuard("@media (prefers-reduced-motion: no-preference) { .x { transition: opacity 1s } }"),
  ).toEqual([]);
});

test("A11Y-23 transition: none outside the media block is not reported", () => {
  expect(motionOutsideGuard(".x { transition: none }")).toEqual([]);
});

test("A11Y-24 only a plain no-preference query guards motion, and property names match in any case", () => {
  const rule = ".x { transition: opacity 1s }";
  for (const media of [
    "@media not all and (prefers-reduced-motion: no-preference)",
    "@media (prefers-reduced-motion: no-preference), (min-width: 1px)",
    "@media (min-width: 0) or (prefers-reduced-motion: no-preference)",
    "@media (prefers-reduced-motion: reduce)",
  ])
    expect(motionOutsideGuard(`${media} { ${rule} }`), media).toEqual([{ selector: ".x", property: "transition" }]);
  expect(
    motionOutsideGuard("@media screen and (prefers-reduced-motion: no-preference) { .x { transition: opacity 1s } }"),
  ).toEqual([]);
  expect(motionOutsideGuard(".x { TRANSITION: opacity 1s; Animation-Name: spin }")).toEqual([
    { selector: ".x", property: "transition" },
    { selector: ".x", property: "animation-name" },
  ]);
});
