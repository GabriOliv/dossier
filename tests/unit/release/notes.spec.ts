import { execFileSync } from "node:child_process";
import { expect, test } from "@playwright/test";

test("REL-11 the release text starts with the install command for the version", () => {
  for (const v of ["0.1.0", "1.2.3"]) {
    const out = execFileSync("node", ["scripts/release/notes.mjs", v], { encoding: "utf8" });
    expect(out.startsWith("```bash\n")).toBe(true);
    expect(out.split("\n")[1]).toBe(
      `npm install https://github.com/GabriOliv/dossier/releases/download/v${v}/gabrioliv-dossier-${v}.tgz`,
    );
  }
});
