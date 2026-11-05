import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";

interface Run {
  version: string;
  html: Record<string, string>;
  errors: Record<string, string>;
  ids: string[];
  samples: string[];
}

const run = (react19: boolean): Run => {
  const args = [...(react19 ? ["--import", "./tests/ssr/register-react19.mjs"] : []), "tests/ssr/render.mjs"];
  return JSON.parse(execFileSync("node", args, { encoding: "utf8" }));
};

for (const [label, react19, major] of [
  ["React 18", false, "18."],
  ["React 19", true, "19."],
] as const) {
  test(`SSR-01 every export of dist renders on the server with ${label}`, () => {
    expect(existsSync("dist/index.js"), "run npm run build first").toBe(true);
    if (react19) expect(existsSync("tests/react19/node_modules/react"), "run npm run setup:react19 first").toBe(true);
    const r = run(react19);
    expect(r.version.startsWith(major)).toBe(true);
    expect(r.errors).toEqual({});
    expect(Object.keys(r.html).sort()).toEqual([...r.samples].sort());
    for (const [name, html] of Object.entries(r.html)) expect(html.length, name).toBeGreaterThan(0);
  });

  test(`SSR-02 useStableId gives the same id on every server render, safe in url(#…), with ${label}`, () => {
    const [a, b] = run(react19).ids;
    expect(a).toBe(b);
    const id = a.match(/for="([^"]*)"/)![1];
    expect(id).toMatch(/^ds-tf-[A-Za-z0-9_-]+$/);
    expect(a).toContain(`id="${id}-label"`);
  });
}

test("SSR-03 React 18 and React 19 render the same markup", () => {
  expect(run(true).html).toEqual(run(false).html);
});
