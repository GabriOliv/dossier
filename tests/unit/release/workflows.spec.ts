import { readdirSync, readFileSync } from "node:fs";
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
const { preflight, test: testCall, release, smoke } = wf.jobs;
const needs = (j: Job) => [j.needs ?? []].flat();
/** Index of the first step whose `run` contains `cmd`; -1 when none. */
const at = (j: Job, cmd: string) => j.steps.findIndex((s) => s.run?.includes(cmd));
const onTagOnly = (j: Job) => j.if?.replace(/\s+/g, " ").trim() === "github.event_name == 'push'";

test("REL-01 a version tag runs format, unit tests, publint and consumer tests in order", () => {
  expect(wf.on.push).toEqual({ tags: ["v*"] });
  // The tag runs test.yml, whose jobs are the PR's: format, the unit and browser shards, then the consumer job.
  expect((testCall as { uses?: string }).uses).toBe("./.github/workflows/test.yml");
  expect(testCall.if).toBeUndefined();
  const called = parse(readFileSync(".github/workflows/test.yml", "utf8")) as Workflow;
  expect(called.on).toHaveProperty("workflow_call");
  const { consumer, format, unit, browser } = called.jobs;
  expect(format.steps.some((s) => s.run?.trim() === "npm run format")).toBe(true);
  expect(unit.steps.some((s) => /playwright test --project unit\b/.test(s.run ?? ""))).toBe(true);
  expect(browser.steps.some((s) => /playwright test --project component\b/.test(s.run ?? ""))).toBe(true);
  const order = ["npm ci", "npm run test:consumer", "npm run lint:package"].map((c) => at(consumer, c));
  expect(order.every((i) => i >= 0)).toBe(true);
  expect([...order].sort((a, b) => a - b)).toEqual(order);
  for (const [name, job] of Object.entries(called.jobs)) {
    expect(job.if, name).toBeUndefined();
    expect(
      job.steps.every((s) => s.if === undefined || s.if === "failure()"),
      name,
    ).toBe(true);
    expect(
      job.steps.every((s) => s["continue-on-error"] === undefined),
      name,
    ).toBe(true);
  }
});

test("REL-02 the release job creates the tag's release with the tarball", () => {
  const create = release.steps[at(release, "gh release create")].run!;
  expect(create).toContain('gh release create "$GITHUB_REF_NAME" ".pack/gabrioliv-dossier-${version}.tgz"');
  expect(create).toContain('--title "$GITHUB_REF_NAME"');
  expect(create).toContain('version="${GITHUB_REF_NAME#v}"');
});

test("REL-03 the attached tarball is the one the consumer tests installed", () => {
  const { consumer } = (parse(readFileSync(".github/workflows/test.yml", "utf8")) as Workflow).jobs;
  const upload = consumer.steps.find(
    (s) => s.uses?.startsWith("actions/upload-artifact@") && s.with?.name === "tarball",
  )!;
  expect(consumer.steps.indexOf(upload)).toBeGreaterThan(at(consumer, "npm run test:consumer"));
  expect(upload.with).toMatchObject({ name: "tarball", path: ".pack/*.tgz", "if-no-files-found": "error" });
  for (const job of [release, smoke]) {
    const download = job.steps.find((s) => s.uses?.startsWith("actions/download-artifact@"))!;
    expect(download.with).toMatchObject({ name: "tarball", path: ".pack" });
    // Nothing after the tests may build or pack again: no npm at all, and node only runs the release scripts.
    const runs = job.steps.map((s) => s.run ?? "").join("\n");
    expect(runs).not.toMatch(/\bnpm\b|fixtures\.mjs|test:consumer|vite build/);
    for (const call of runs.match(/\bnode \S+/g) ?? []) expect(call).toMatch(/^node scripts\/release\/[a-z-]+\.mjs$/);
  }
  expect(consumer.steps.slice(at(consumer, "npm run test:consumer") + 1).some((s) => s.run?.includes("npm pack"))).toBe(
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

test("REL-05 no release job runs unless preflight and the tests passed", () => {
  expect(needs(testCall)).toContain("preflight");
  expect(needs(release)).toContain("test");
  expect(needs(smoke)).toContain("release");
  for (const [name, job] of Object.entries(wf.jobs)) {
    expect(job.if ?? "", name).not.toMatch(/always\(\)|failure\(\)|cancelled\(\)/);
    expect(job["continue-on-error"], name).toBeUndefined();
    for (const step of job.steps ?? []) {
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
  expect(testCall.if).toBeUndefined();
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

const BROWSER_PROJECTS = ["component", "visual", "visual-phone", "a11y", "docs", "site"];
const projectsOf = (run: string) => [...run.matchAll(/--project[ =]([\w-]+)/g)].map((m) => m[1]);
const testWf = parse(readFileSync(".github/workflows/test.yml", "utf8")) as Workflow;
const { build, unit, browser, consumer, format } = testWf.jobs;
/** The `run` of the step that starts a Playwright call. */
const playwright = (j: Job) => j.steps.find((s) => s.run?.includes("playwright test"))!.run!;
const uploads = (j: Job) => j.steps.filter((s) => s.uses?.startsWith("actions/upload-artifact@"));

test("CI-01 pull requests run the consumer tests", () => {
  const pr = parse(readFileSync(".github/workflows/pr.yml", "utf8")) as Workflow;
  expect(pr.on).toHaveProperty("pull_request");
  // pr.yml calls test.yml, and test.yml holds the consumer job.
  expect(Object.values(pr.jobs).some((j) => (j as { uses?: string }).uses === "./.github/workflows/test.yml")).toBe(
    true,
  );
  expect(testWf.on).toHaveProperty("workflow_call");
  const step = consumer.steps.find((s) => s.run?.trim() === "npm run test:consumer");
  expect(step).toBeDefined();
  expect(step!.if).toBeUndefined();
  expect(step!["continue-on-error"]).toBeUndefined();
});

test("VIS-21 every test job of test.yml uploads test-results/ when a test fails", () => {
  const jobs = { unit, browser, consumer };
  for (const [name, job] of Object.entries(jobs)) {
    const upload = job.steps.findIndex((s) => s.uses?.startsWith("actions/upload-artifact@") && s.if === "failure()");
    expect(upload, name).toBeGreaterThan(-1);
    expect(job.steps[upload].with?.path, name).toBe("test-results/");
    const lastTest = Math.max(...job.steps.map((s, i) => (/playwright test|npm run test:/.test(s.run ?? "") ? i : -1)));
    expect(lastTest, name).toBeGreaterThan(-1);
    expect(upload, name).toBeGreaterThan(lastTest);
  }
});

test("GOV-25 the build job builds the library, the Storybook and the landing once, and uploads them", () => {
  const built = build.steps.findIndex((s) => s.run?.trim() === "npm run build:all");
  const upload = build.steps.findIndex((s) => s.uses?.startsWith("actions/upload-artifact@"));
  expect(built, "the build step").toBeGreaterThan(-1);
  expect(upload, "the upload step").toBeGreaterThan(built);
  expect(build.steps[upload].with?.name).toBe("build");
  expect(String(build.steps[upload].with?.path).split("\n").filter(Boolean)).toEqual([
    "dist/",
    "storybook-static/",
    "site/dist/",
  ]);
  // The build emits relative paths, so no base is configured for the Storybook.
  expect(readFileSync(".storybook/vite.config.ts", "utf8")).not.toMatch(/\bbase\s*:/);
});

test("STK-04 one build job builds the outputs and the test jobs download them without building again", () => {
  const builders = Object.entries(testWf.jobs).filter(([, j]) =>
    j.steps.some((s) => /npm run build|storybook build|vite build|npm test\b|test:consumer/.test(s.run ?? "")),
  );
  // Only the build job builds; the consumer job builds by packing, with no Storybook and no landing.
  expect(builders.map(([name]) => name).sort()).toEqual(["build", "consumer"]);
  expect(consumer.steps.some((s) => /storybook build|build:all|vite build/.test(s.run ?? ""))).toBe(false);
  for (const [name, job] of Object.entries({ unit, browser })) {
    expect(needs(job), name).toEqual(["build"]);
    const download = job.steps.find((s) => s.uses?.startsWith("actions/download-artifact@"))!;
    expect(download.with, name).toMatchObject({ name: "build" });
    expect(
      job.steps.some((s) => /npm run build|storybook build|vite build/.test(s.run ?? "")),
      name,
    ).toBe(false);
  }
});

test("STK-05 the unit job stops at its first failing test", () => {
  const run = playwright(unit);
  expect(projectsOf(run)).toEqual(["unit"]);
  expect(run).toContain("--max-failures=1");
  expect(run).toMatch(/--shard \$\{\{ matrix\.shard \}\}\/2/);
});

test("STK-06 the browser jobs run every test and report every failure", () => {
  const run = playwright(browser);
  expect(projectsOf(run).sort()).toEqual([...BROWSER_PROJECTS].sort());
  expect(run).not.toContain("--max-failures");
  expect(run).toMatch(/--shard \$\{\{ matrix\.shard \}\}\/4/);
  expect((browser as Job & { strategy: { matrix: { shard: number[] } } }).strategy.matrix.shard.length).toBe(4);
});

test("STK-13 each job of test.yml sets timeout-minutes: 5 and caches the npm downloads", () => {
  for (const [name, job] of Object.entries(testWf.jobs)) {
    expect((job as Job & { "timeout-minutes"?: number })["timeout-minutes"], name).toBe(5);
    const cache = job.steps.find((s) => s.uses?.startsWith("actions/cache@"));
    expect(cache?.with, name).toMatchObject({ path: "~/.npm" });
    expect(String(cache?.with?.key), name).toContain("hashFiles('package-lock.json')");
  }
  expect(format.steps.some((s) => s.run?.trim() === "npm run format")).toBe(true);
  expect(uploads(consumer).some((s) => s.with?.path === ".pack/*.tgz")).toBe(true);
});

test("STK-04 pr.yml has one job, the call of test.yml, so the PR builds once", () => {
  const pr = parse(readFileSync(".github/workflows/pr.yml", "utf8")) as Workflow;
  expect(Object.values(pr.jobs).map((j) => (j as { uses?: string }).uses)).toEqual(["./.github/workflows/test.yml"]);
});

const pages = parse(readFileSync(".github/workflows/pages.yml", "utf8")) as Workflow;
const { assemble, deploy } = pages.jobs;
const stepIndex = (j: Job, uses: string) => j.steps.findIndex((s) => s.uses?.startsWith(uses));

test("STK-08 a push to main deploys the build of the run, with no second Storybook build", () => {
  expect(pages.on.push.branches).toContain("main");
  expect((pages.jobs.test as { uses?: string }).uses).toBe("./.github/workflows/test.yml");
  expect(needs(assemble)).toEqual(["test"]);
  const download = assemble.steps[stepIndex(assemble, "actions/download-artifact@")];
  expect(download.with).toMatchObject({ name: "build" });
  for (const [name, job] of Object.entries(pages.jobs)) {
    expect(job.steps?.some((s) => /npm\b|storybook build|vite build/.test(s.run ?? "")) ?? false, name).toBe(false);
  }
  expect(stepIndex(deploy, "actions/deploy-pages@")).toBeGreaterThan(-1);
});

test("STK-09 the Pages deploy needs the test jobs, so a failed test job blocks it", () => {
  expect(needs(deploy)).toEqual(expect.arrayContaining(["test", "assemble"]));
  for (const [name, job] of Object.entries(pages.jobs)) {
    expect(job.if ?? "", name).not.toMatch(/always\(\)|failure\(\)|cancelled\(\)/);
    expect(job["continue-on-error"], name).toBeUndefined();
  }
});

test("SITE-12 the Pages site serves the Storybook at /dossier/storybook/", () => {
  const download = stepIndex(assemble, "actions/download-artifact@");
  const copy = assemble.steps.findIndex((s) => s.run?.trim() === "cp -r storybook-static site/dist/storybook");
  const upload = stepIndex(assemble, "actions/upload-pages-artifact@");
  expect(copy, "the copy step").toBeGreaterThan(-1);
  expect(download).toBeLessThan(copy);
  expect(copy).toBeLessThan(upload);
  // The landing is the site root (base /dossier/), so its dist/ with the Storybook inside is published at /dossier/.
  expect(assemble.steps[upload].with?.path).toBe("site/dist");
  expect(readFileSync("site/vite.config.ts", "utf8")).toMatch(/base:\s*"\/dossier\/"/);
});

test("STK-07 the Release workflow runs test.yml, as the PR does, before the release job", () => {
  const pr = parse(readFileSync(".github/workflows/pr.yml", "utf8")) as Workflow;
  const prCall = Object.values(pr.jobs).map((j) => (j as { uses?: string }).uses);
  expect((testCall as { uses?: string }).uses).toBe(prCall[0]);
  expect(needs(testCall)).toEqual(["preflight"]);
  expect(needs(release)).toEqual(["test"]);
});

test("STK-13 each job of every workflow sets timeout-minutes: 5", () => {
  for (const file of readdirSync(".github/workflows").filter((f) => f.endsWith(".yml"))) {
    const jobs = (parse(readFileSync(`.github/workflows/${file}`, "utf8")) as Workflow).jobs;
    // A job that calls a reusable workflow takes its timeouts from the jobs of that workflow.
    for (const [name, job] of Object.entries(jobs).filter(([, j]) => !(j as { uses?: string }).uses))
      expect((job as Job & { "timeout-minutes"?: number })["timeout-minutes"], `${file} ${name}`).toBe(5);
  }
});
