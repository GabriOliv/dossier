import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

interface Entry {
  id: string;
  title: string;
  type: string;
  tags?: string[];
}

// The built Storybook: run `npm run build:all` first.
const index = JSON.parse(readFileSync("storybook-static/index.json", "utf8")) as { entries: Record<string, Entry> };
const entries = Object.values(index.entries);
const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

test("SUI-10 one Overview story and one docs page per function export", async () => {
  const lib = (await import("../../dist/index.js")) as Record<string, any>;
  const exported = Object.keys(lib)
    .filter(
      (k) =>
        /^[A-Z]/.test(k) &&
        (typeof lib[k] === "function" ||
          [Symbol.for("react.forward_ref"), Symbol.for("react.memo")].includes(lib[k]?.$$typeof)),
    )
    .sort();
  // Overview/All holds every section on one page: it is not a story per export.
  const stories = entries
    .filter((e) => e.type === "story" && e.title === "Overview" && e.id !== "overview--all")
    .map((e) => e.id);
  for (const name of exported) expect(stories, `${name} has no Overview story`).toContain(`overview--${kebab(name)}`);
  // The composition is the one story that is not an export.
  expect(stories.sort()).toEqual([...exported, "TestRunReport"].map((n) => `overview--${kebab(n)}`).sort());
  const docs = entries.filter((e) => e.type === "docs" && e.title.startsWith("Components/"));
  expect(docs.map((e) => e.title.replace(/^Components\//, "")).sort()).toEqual(exported);
});

test("SUI-06 TestRunReport is an Overview story", async ({ page }) => {
  expect(entries.some((e) => e.id === "overview--test-run-report" && e.type === "story")).toBe(true);
  await page.goto("iframe.html?id=overview--test-run-report&viewMode=story");
  const section = page.locator("section#TestRunReport");
  await expect(section).toBeVisible();
  await expect(section).toHaveAttribute("data-composition", "TestRunReport");
  await expect(section.locator(".ds-errnote")).toBeVisible();
});

test("SUI-10 the test-only fixture stories are built into index.json with no dev tag and no docs page", () => {
  const fixtures = entries.filter((e) => e.title === "Fixtures");
  // tests/support/story.ts names them: each one opens by id, and none shows in the sidebar or the docs.
  expect(
    fixtures
      .filter((e) => e.type === "story")
      .map((e) => e.id)
      .sort(),
  ).toEqual([
    "fixtures--divider-vertical",
    "fixtures--grid-layout",
    "fixtures--spinner-buttons",
    "fixtures--stack-gaps",
  ]);
  expect(fixtures.filter((e) => e.type === "docs")).toEqual([]);
  for (const e of fixtures) expect(e.tags ?? [], e.id).not.toContain("dev");
  // Every other story still shows in the sidebar.
  expect(
    entries.filter((e) => e.type === "story" && e.title === "Overview").every((e) => e.tags?.includes("dev")),
  ).toBe(true);
});
