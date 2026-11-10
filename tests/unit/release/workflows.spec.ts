import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { parse } from "yaml";

interface Step {
  name?: string;
  uses?: string;
  run?: string;
  if?: string;
  with?: Record<string, unknown>;
  "continue-on-error"?: unknown;
}
interface Job {
  needs?: string | string[];
  if?: string;
  permissions?: Record<string, string>;
  "continue-on-error"?: unknown;
  steps: Step[];
}
interface Workflow {
  on: Record<string, any>;
  permissions?: Record<string, string>;
  jobs: Record<string, Job>;
}

const text = readFileSync(".github/workflows/release.yml", "utf8");
const wf = parse(text) as Workflow;
const { preflight, verify, release, smoke } = wf.jobs;
const needs = (j: Job) => [j.needs ?? []].flat();
/** Index of the first step whose `run` contains `cmd`; -1 when none. */
const at = (j: Job, cmd: string) => j.steps.findIndex((s) => s.run?.includes(cmd));
const onTagOnly = (j: Job) => j.if?.replace(/\s+/g, " ").trim() === "github.event_name == 'push'";

test("REL-01 a version tag runs format, unit tests, publint and consumer tests in order", () => {
  expect(wf.on.push).toEqual({ tags: ["v*"] });
  const order = ["npm ci", "npm run format", "npm test", "npm run lint:package", "npm run test:consumer"].map((c) =>
    at(verify, c),
  );
  expect(order.every((i) => i >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  expect(verify.steps.every((s) => s.if === undefined && s["continue-on-error"] === undefined)).toBe(true);
});

test("REL-02 the release job creates the tag's release with the tarball", () => {
  const create = release.steps[at(release, "gh release create")].run!;
  expect(create).toContain('gh release create "$GITHUB_REF_NAME" ".pack/gabrioliv-dossier-${version}.tgz"');
  expect(create).toContain('--title "$GITHUB_REF_NAME"');
  expect(create).toContain('version="${GITHUB_REF_NAME#v}"');
});

test("REL-03 the attached tarball is the one the consumer tests installed", () => {
  const upload = verify.steps.find((s) => s.uses?.startsWith("actions/upload-artifact@"))!;
  expect(verify.steps.indexOf(upload)).toBeGreaterThan(at(verify, "npm run test:consumer"));
  expect(upload.with).toMatchObject({ name: "tarball", path: ".pack/*.tgz", "if-no-files-found": "error" });
  for (const job of [release, smoke]) {
    const download = job.steps.find((s) => s.uses?.startsWith("actions/download-artifact@"))!;
    expect(download.with).toMatchObject({ name: "tarball", path: ".pack" });
    // Nothing after verify may build or pack again: no npm at all, and node only runs the release scripts.
    const runs = job.steps.map((s) => s.run ?? "").join("\n");
    expect(runs).not.toMatch(/\bnpm\b|fixtures\.mjs|test:consumer|vite build/);
    for (const call of runs.match(/\bnode \S+/g) ?? []) expect(call).toMatch(/^node scripts\/release\/[a-z-]+\.mjs$/);
  }
  expect(verify.steps.slice(at(verify, "npm run test:consumer") + 1).some((s) => s.run?.includes("npm pack"))).toBe(
    false,
  );
});

test("REL-04 REL-10 preflight checks a tag against package.json and origin/main, with the full history", () => {
  const checkout = preflight.steps.find((s) => s.uses?.startsWith("actions/checkout@"))!;
  expect(checkout.with).toMatchObject({ "fetch-depth": 0 });
  const step = preflight.steps[at(preflight, "scripts/release/preflight.mjs")];
  expect(step.run).toContain('node scripts/release/preflight.mjs "$GITHUB_REF_NAME" origin/main');
  expect(step.if).toBe("github.event_name == 'push'");
});

test("REL-05 no release job runs unless preflight and verify passed", () => {
  expect(needs(verify)).toContain("preflight");
  expect(needs(release)).toContain("verify");
  expect(needs(smoke)).toContain("release");
  for (const [name, job] of Object.entries(wf.jobs)) {
    expect(job.if ?? "", name).not.toMatch(/always\(\)|failure\(\)|cancelled\(\)/);
    expect(job["continue-on-error"], name).toBeUndefined();
    for (const step of job.steps) {
      const label = `${name}: ${step.name ?? step.uses ?? step.run}`;
      expect(step["continue-on-error"], label).toBeUndefined();
      expect(step.if ?? "", label).not.toMatch(/always\(\)|failure\(\)|cancelled\(\)/);
    }
  }
});

test("REL-06 only the release job can write, and nothing talks to npm", () => {
  expect(wf.permissions).toEqual({ contents: "read" });
  for (const [name, job] of Object.entries(wf.jobs)) {
    if (name === "release") expect(job.permissions).toEqual({ contents: "write" });
    else expect(Object.values(job.permissions ?? {}).includes("write"), name).toBe(false);
  }
  expect(text).not.toMatch(/npm publish|npm login|NPM_TOKEN|NODE_AUTH_TOKEN/);
  expect(text).not.toMatch(/secrets\.(?!GITHUB_TOKEN)/);
});

test("REL-07 a manual run keeps the tarball as an artifact and creates no release", () => {
  expect(wf.on).toHaveProperty("workflow_dispatch");
  expect(verify.if).toBeUndefined();
  expect(onTagOnly(release)).toBe(true);
  expect(onTagOnly(smoke)).toBe(true);
});

test("REL-08 an existing release fails instead of being replaced", () => {
  const guard = at(release, 'gh release view "$GITHUB_REF_NAME"');
  expect(guard).toBeGreaterThanOrEqual(0);
  expect(guard).toBeLessThanOrEqual(at(release, "gh release create"));
  expect(release.steps[guard].run).toMatch(/exit 1/);
  expect(text).not.toMatch(/--clobber|gh release delete/);
});

test("REL-09 the release stays a draft until the tarball is uploaded", () => {
  const step = release.steps[at(release, "gh release create")];
  const run = step.run!;
  // A failed upload must stop the step before the release is published.
  expect(step).not.toHaveProperty("shell");
  expect(run.split("\n")[0]).toBe("set -euo pipefail");
  expect(run).not.toContain("||");
  const create = run.indexOf("gh release create");
  const publish = run.indexOf('gh release edit "$GITHUB_REF_NAME" --draft=false');
  expect(run.slice(create, run.indexOf("\n", create))).toContain("--draft");
  expect(publish).toBeGreaterThan(create);
});

test("REL-11 the release job writes its text with notes.mjs and uses it as the notes", () => {
  const run = release.steps[at(release, "gh release create")].run!;
  expect(run).toContain('node scripts/release/notes.mjs "$version" > notes.md');
  expect(run).toContain("--notes-file notes.md");
  expect(run).not.toContain("--generate-notes");
});

test("GOV-06 the release is created with --notes-file and without --generate-notes", () => {
  const run = release.steps[at(release, "gh release create")].run!;
  const create = run.slice(run.indexOf("gh release create"), run.indexOf("\n", run.indexOf("gh release create")));
  expect(create).toMatch(/ --notes-file notes\.md(\s|$)/);
  expect(text).not.toContain("--generate-notes");
});

test("REL-12 the smoke job installs the README URL of the tag and compares it with the tested tarball", () => {
  const run = smoke.steps[at(smoke, "scripts/release/verify-install.mjs")].run!;
  expect(run).toContain(
    'node scripts/release/verify-install.mjs "https://github.com/GabriOliv/dossier/releases/download/$GITHUB_REF_NAME/gabrioliv-dossier-${version}.tgz" ".pack/gabrioliv-dossier-${version}.tgz"',
  );
});

test("CI-01 pull requests run the consumer tests", () => {
  const pr = parse(readFileSync(".github/workflows/pr.yml", "utf8")) as Workflow;
  expect(pr.on).toHaveProperty("pull_request");
  const [job] = Object.values(pr.jobs);
  const step = job.steps.find((s) => s.run?.trim() === "npm run test:consumer");
  expect(step).toBeDefined();
  expect(step!.if).toBeUndefined();
  expect(step!["continue-on-error"]).toBeUndefined();
});

test("VIS-21 pr.yml and gallery.yml upload test-results/ when a test fails", () => {
  for (const [file, job] of [
    ["pr.yml", "check"],
    ["gallery.yml", "build-test"],
  ] as const) {
    const steps = (parse(readFileSync(`.github/workflows/${file}`, "utf8")) as Workflow).jobs[job].steps;
    const upload = steps.findIndex((s) => s.uses?.startsWith("actions/upload-artifact@"));
    expect(upload, file).toBeGreaterThan(-1);
    expect(steps[upload].if, file).toBe("failure()");
    expect(steps[upload].with?.path, file).toBe("test-results/");
    const lastTest = Math.max(...steps.map((s, i) => (/playwright test|npm run test:/.test(s.run ?? "") ? i : -1)));
    expect(lastTest, file).toBeGreaterThan(-1);
    expect(upload, file).toBeGreaterThan(lastTest);
  }
});

test("GOV-25 gallery.yml builds Storybook, copies it to gallery/dist/storybook and uploads gallery/dist", () => {
  const gallery = parse(readFileSync(".github/workflows/gallery.yml", "utf8")) as Workflow;
  const { steps } = gallery.jobs["build-test"];
  const build = steps.findIndex((s) => s.run?.trim() === "npm run build:storybook");
  const copy = steps.findIndex((s) => /^cp -r storybook-static gallery\/dist\/storybook$/.test(s.run?.trim() ?? ""));
  const upload = steps.findIndex((s) => s.uses?.startsWith("actions/upload-pages-artifact@"));
  expect(build, "the build step").toBeGreaterThan(-1);
  expect(copy, "the copy step").toBeGreaterThan(-1);
  expect(upload, "the upload step").toBeGreaterThan(-1);
  // The copy needs the build, and the upload needs both.
  expect(build).toBeLessThan(copy);
  expect(copy).toBeLessThan(upload);
  expect(steps[upload].with?.path).toBe("gallery/dist");
  // The site is published from a push to main, by a job that runs after the build and the tests.
  expect(gallery.on.push.branches).toContain("main");
  const deploy = Object.values(gallery.jobs).find((j) =>
    j.steps.some((s) => s.uses?.startsWith("actions/deploy-pages@")),
  );
  expect(deploy, "the deploy job").toBeDefined();
  expect(needs(deploy!), "the deploy job needs build-test").toContain("build-test");
  // The build emits relative paths, so no base is configured for either site.
  expect(readFileSync(".storybook/vite.config.ts", "utf8")).not.toMatch(/\bbase\s*:/);
});
