import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

interface Run {
  version: string;
  /** `react` resolved to its react-server build (it has no useState). */
  serverBuild: boolean;
  /** Why importing dist/index.js failed, or null. */
  importError: string | null;
  components: string[];
  checked: string[];
  reported: { file: string; spec: string; name: string }[];
  server: Record<string, string[]>;
}

const run = (dir?: string): Run => {
  expect(existsSync("tests/react19/node_modules/react"), "run npm run setup:react19 first").toBe(true);
  const args = [
    "--conditions=react-server",
    "--import",
    "./tests/ssr/register-react19.mjs",
    "tests/ssr/react-server.mjs",
  ];
  return JSON.parse(execFileSync("node", dir ? [...args, dir] : args, { encoding: "utf8" }));
};
const fixtures = "tests/fixtures/react-server";
const exported = () => [...readFileSync("src/index.ts", "utf8").matchAll(/export \{ (\w+),/g)].map((m) => m[1]).sort();

test("FWK-01 dist/index.js imports under react-server with React 19 and exposes the 49 components", () => {
  const r = run();
  expect(r.version.startsWith("19.")).toBe(true);
  expect(r.serverBuild).toBe(true);
  expect(r.importError).toBeNull();
  // toast() comes from the use client file of Toaster, so it is a client reference, a function, but not a component:
  // src/index.ts exports it next to Toaster, on a line the export regex reads as Toaster's.
  expect(r.components).toContain("toast");
  const components = r.components.filter((n) => n !== "toast");
  expect(components.sort()).toEqual(exported());
  expect(components).toHaveLength(49);
});

test("FWK-02 no module of dist without use client imports a client-only name from react", () => {
  const r = run();
  expect(r.checked).toContain("dist/index.js");
  expect(r.checked).toContain("dist/components/TextField.js");
  expect(r.checked.length).toBeGreaterThan(30);
  expect(r.reported).toEqual([]);
  // Every import form of react is checked, not only named imports.
  const forms = run(fixtures).reported;
  const of = (name: string) => forms.filter((x) => x.file === `${fixtures}/${name}.js`).map((x) => x.name);
  expect(of("namespace")).toEqual(["useState"]);
  expect(of("default")).toEqual(["useRef", "useEffect"]);
  expect(of("reexport")).toEqual(["useState"]);
  expect(of("comment")).toEqual(["useContext"]);
});

test("FWK-03 a sample without use client that imports useState is reported with its path and the name", () => {
  const r = run(fixtures);
  expect(r.reported.filter((x) => x.file.endsWith("server.js"))).toEqual([
    { file: `${fixtures}/server.js`, spec: "react", name: "useState" },
  ]);
});

test("FWK-04 a sample with use client on line 1 that imports useState is not reported", () => {
  const r = run(fixtures);
  expect(r.checked).toContain(`${fixtures}/client.js`);
  expect(r.reported.filter((x) => x.file.endsWith("client.js"))).toEqual([]);
});

test("FWK-05 dist/index.js does not start with use client", () => {
  expect(readFileSync("dist/index.js", "utf8").split("\n")[0]).not.toMatch(/use client/);
});

test("FWK-30 react/jsx-runtime follows the same rule against its react-server build", () => {
  const r = run(fixtures);
  expect(r.server["react/jsx-runtime"]).toEqual(expect.arrayContaining(["Fragment", "jsx", "jsxs"]));
  expect(r.reported.filter((x) => x.file.endsWith("jsx.js"))).toEqual([
    { file: `${fixtures}/jsx.js`, spec: "react/jsx-runtime", name: "jsxClientOnly" },
  ]);
});

test("PRM-03 Button, IconButton, Link, Checkbox, RadioGroup, Switch and Select carry no use client and import under react-server", () => {
  const r = run();
  expect(r.importError).toBeNull();
  for (const name of ["Button", "IconButton", "Link", "Checkbox", "RadioGroup", "Switch", "Select"]) {
    const file = `dist/components/${name}.js`;
    expect(r.components, name).toContain(name);
    expect(r.checked, name).toContain(file);
    expect(readFileSync(file, "utf8").split("\n")[0], name).not.toMatch(/use client/);
    expect(readFileSync(`src/components/${name}.tsx`, "utf8"), name).not.toMatch(/^\s*["']use client["']/);
    expect(
      r.reported.filter((x) => x.file === file),
      name,
    ).toEqual([]);
  }
  // What the fields share is checked the same way.
  for (const file of ["dist/components/FieldMessage.js", "dist/lib/field.js"]) {
    expect(r.checked, file).toContain(file);
    expect(
      r.reported.filter((x) => x.file === file),
      file,
    ).toEqual([]);
  }
});

test("OVL-03 dist/index.js imports under react-server with Dialog, Popover, Tooltip and Menu, which carry use client", () => {
  const r = run();
  expect(r.serverBuild).toBe(true);
  expect(r.importError).toBeNull();
  for (const name of ["Dialog", "Popover", "Tooltip", "Menu"]) {
    const file = `dist/components/${name}.js`;
    expect(r.components, name).toContain(name);
    expect(readFileSync(file, "utf8").split("\n")[0], name).toBe('"use client";');
    expect(readFileSync(`src/components/${name}.tsx`, "utf8"), name).toMatch(/^["']use client["']/);
  }
  expect(r.reported).toEqual([]);
});

test("DIS-02 dist/index.js imports under react-server with Tabs, which carries use client, and with Accordion and Pagination, which do not", () => {
  const r = run();
  expect(r.serverBuild).toBe(true);
  expect(r.importError).toBeNull();
  for (const name of ["Tabs", "Accordion", "Pagination"]) expect(r.components, name).toContain(name);
  expect(readFileSync("dist/components/Tabs.js", "utf8").split("\n")[0]).toBe('"use client";');
  expect(readFileSync("src/components/Tabs.tsx", "utf8")).toMatch(/^["']use client["']/);
  for (const name of ["Accordion", "Pagination"]) {
    const file = `dist/components/${name}.js`;
    expect(r.checked, name).toContain(file);
    expect(readFileSync(file, "utf8").split("\n")[0], name).not.toMatch(/use client/);
    expect(readFileSync(`src/components/${name}.tsx`, "utf8"), name).not.toMatch(/^\s*["']use client["']/);
    expect(
      r.reported.filter((x) => x.file === file),
      name,
    ).toEqual([]);
  }
  expect(r.reported).toEqual([]);
});

test("FBL-02 dist/index.js imports under react-server with Toaster and toast, which carry use client, and with the six others, which do not", () => {
  const r = run();
  expect(r.serverBuild).toBe(true);
  expect(r.importError).toBeNull();
  for (const name of ["Toaster", "toast", "Icon", "Spinner", "Skeleton", "Stack", "Grid", "Divider"])
    expect(r.components, name).toContain(name);
  expect(readFileSync("dist/components/Toaster.js", "utf8").split("\n")[0]).toBe('"use client";');
  expect(readFileSync("src/components/Toaster.tsx", "utf8")).toMatch(/^["']use client["']/);
  for (const name of ["Icon", "Spinner", "Skeleton", "Stack", "Grid", "Divider"]) {
    const file = `dist/components/${name}.js`;
    expect(r.checked, name).toContain(file);
    expect(readFileSync(file, "utf8").split("\n")[0], name).not.toMatch(/use client/);
    expect(readFileSync(`src/components/${name}.tsx`, "utf8"), name).not.toMatch(/^\s*["']use client["']/);
    expect(
      r.reported.filter((x) => x.file === file),
      name,
    ).toEqual([]);
  }
  expect(r.reported).toEqual([]);
});
