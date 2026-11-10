import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

test("VIS-17 no test compares a component's markup with Dossier's original; snapshots are the expected markup", async () => {
  // This file names the ways to the original only as the text it searches for.
  const files = readdirSync("tests/unit").filter((f) => /\.spec\.tsx?$/.test(f) && f !== "markup.spec.ts");
  expect(files.length).toBeGreaterThan(30);
  /** A file reaches the original through ./oracle (other than its helpers), or by running source/components/bundle.js itself. */
  const reaches = (text: string) => {
    if (/import \* as \w+ from "\.\/oracle"/.test(text)) return true;
    const names = [...text.matchAll(/import \{([^}]*)\} from "\.\/oracle"/g)].flatMap((m) =>
      m[1].split(",").map((n) => n.trim().split(/\s+as\s+/)[0]),
    );
    const helpers = ["render", "normalizeIds", "renameTypeClasses", "TYPE_CLASSES"];
    return names.some((n) => n && !helpers.includes(n)) || /components\/bundle\.js|runInNewContext/.test(text);
  };
  // Only these use the original, as a source and never as the expected markup of a case: CMP-16 (props and branches
  // the cases cover), the check that the oracle runs, and DIAL-02/03 (the original's defect the port fixes).
  expect(files.filter((f) => reaches(readFileSync(`tests/unit/${f}`, "utf8"))).sort()).toEqual([
    "ports.spec.tsx",
    "proportion-dial.spec.tsx",
    "vendor.spec.ts",
  ]);
  expect(reaches('import { original } from "./oracle";\nconst html = original.Tag;')).toBe(true);
  expect(reaches('import * as o from "./oracle";')).toBe(true);
  expect(reaches('import { render } from "./oracle";')).toBe(false);
  expect(Object.keys(await import("./markup"))).toEqual(["expectMarkup"]);
});

test("VIS-10 there is one markup snapshot per exported component, each with named case blocks", () => {
  const exported = [...readFileSync("src/index.ts", "utf8").matchAll(/export \{ (\w+),/g)].map((m) => m[1]).sort();
  expect(exported).toHaveLength(49);
  const dir = "tests/unit/__snapshots__";
  expect(readdirSync(dir).sort()).toEqual(exported.map((n) => `${n}.html`).sort());
  for (const name of exported) {
    const blocks = readFileSync(`${dir}/${name}.html`, "utf8").split(/^## /m).slice(1);
    expect(blocks.length, name).toBeGreaterThan(0);
    for (const b of blocks) expect(b, name).toMatch(/^[^\n]+\n<[\s\S]*>\n/);
  }
});

test("VIS-16 CMP-16 is unchanged and still passes", () => {
  // The two CMP-16 tests of ports.spec.tsx, byte for byte as they were before this feature (de1960a), but for the path of the bundle.
  const blocks = readFileSync("tests/unit/ports.spec.tsx", "utf8").match(/^test\("CMP-16[\s\S]*?^\}\);$/gm)!;
  expect(blocks).toHaveLength(2);
  expect(createHash("sha256").update(blocks.join("\n")).digest("hex")).toBe(
    "12ccb4bbcbf5082f08e8f768f041b4e22899ef46cac238b59be9f824a5cc0eb3",
  );
  const out = execFileSync(
    "npx",
    // Only ports.spec.tsx, and never VIS-16 itself: this test's title also holds "CMP-16" and would run itself again.
    [
      "playwright",
      "test",
      "tests/unit/ports.spec.tsx",
      "--project=unit",
      "-g",
      "CMP-16",
      "--grep-invert",
      "VIS-16",
      "--workers=1",
      "--reporter=list",
      "--output",
      join(tmpdir(), "vis-16"),
    ],
    { encoding: "utf8" },
  );
  expect(out).toMatch(/\b2 passed\b/);
  expect(out).not.toMatch(/failed/);
});
