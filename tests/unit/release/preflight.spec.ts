import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, test } from "@playwright/test";

const script = resolve("scripts/release/preflight.mjs");

/** A throwaway repo with package.json at 0.1.0 committed on main, and one commit on a side branch. */
function repo() {
  const dir = mkdtempSync(join(tmpdir(), "dossier-preflight-"));
  const git = (...args: string[]) =>
    spawnSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: dir, encoding: "utf8" });
  git("init", "-q", "-b", "main");
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", version: "0.1.0" }));
  git("add", ".");
  git("commit", "-qm", "one");
  git("checkout", "-qb", "side");
  writeFileSync(join(dir, "side.txt"), "side");
  git("add", ".");
  git("commit", "-qm", "two");
  return { dir, git };
}

function preflight(dir: string, tag: string) {
  const r = spawnSync("node", [script, tag, "main"], { cwd: dir, encoding: "utf8" });
  return { status: r.status, out: r.stdout + r.stderr };
}

test("REL-04 the tag v0.1.0 on a commit of main passes", () => {
  const { dir, git } = repo();
  git("checkout", "-q", "main");
  expect(preflight(dir, "v0.1.0").status).toBe(0);
});

test("REL-04 a tag that differs from package.json fails with both versions", () => {
  const { dir, git } = repo();
  git("checkout", "-q", "main");
  const r = preflight(dir, "v9.9.9");
  expect(r.status).toBe(1);
  expect(r.out).toContain("9.9.9");
  expect(r.out).toContain("0.1.0");
});

test("REL-04 a tag that is not v<version>, such as vteste, fails", () => {
  const { dir, git } = repo();
  git("checkout", "-q", "main");
  const r = preflight(dir, "vteste");
  expect(r.status).toBe(1);
  expect(r.out).toContain("0.1.0");
});

test("REL-10 a tag on a commit outside main fails", () => {
  const { dir } = repo(); // HEAD is the side commit, with the right version
  const r = preflight(dir, "v0.1.0");
  expect(r.status).toBe(1);
  expect(r.out).toMatch(/not on main/);
});
