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

test("build-tokens without a prefix reproduces Dossier's tokens.css byte for byte", () => {
  const sha = createHash("sha256").update(build()).digest("hex");
  expect(sha).toBe("e455abdf427246ccacde43cc90bdb2fd3115e591fcdc0e6bd683870be68b36d8");
});

test("the prefixed build differs from Dossier's tokens.css only in the nine class selectors", () => {
  const plain = build().split("\n");
  const prefixed = build("--class-prefix", "ds-t-").split("\n");
  expect(prefixed).toHaveLength(plain.length);
  const changed = plain.flatMap((line, i) => (line === prefixed[i] ? [] : [[line, prefixed[i]]]));
  expect(changed).toEqual(TYPE_CLASSES.map((c) => [`.${c} {`, `.ds-t-${c} {`]));
  expect(readFileSync("dist/tokens.css", "utf8")).toBe(prefixed.join("\n"));
});
