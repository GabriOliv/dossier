import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { expect, test } from "@playwright/test";
import { build, type Rollup } from "vite";
import config from "../../vite.config";

const read = (p: string) => readFileSync(p, "utf8");
const names = (dir: string, ext: RegExp) =>
  readdirSync(dir)
    .filter((f) => ext.test(f))
    .map((f) => f.replace(ext, ""))
    .sort();
/** Every .js file under dist/, as a path relative to the repo. */
const distJs = (dir = "dist"): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? distJs(join(dir, e.name)) : e.name.endsWith(".js") ? [join(dir, e.name)] : [],
  );

/** The files of dist that start with use client: the overlays of primitives-overlays and the Tabs of primitives-disclosure. */
const CLIENT = [
  "dist/components/Dialog.js",
  "dist/components/Popover.js",
  "dist/components/Tooltip.js",
  "dist/components/Menu.js",
  "dist/components/Tabs.js",
  "dist/components/Toaster.js",
];

test("FWK-10 dist has one file per module of src", () => {
  expect(existsSync("dist/index.js"), "run npm run build first").toBe(true);
  expect(names("dist/components", /\.js$/)).toEqual(names("src/components", /\.tsx$/));
  expect(names("dist/lib", /\.js$/)).toEqual(names("src/lib", /\.ts$/));
});

test("FWK-11 dist/index.js imports each component from its own file and holds no component body", () => {
  const index = read("dist/index.js");
  const exported = [...read("src/index.ts").matchAll(/from "\.\/components\/(\w+)"/g)].map((m) => m[1]);
  expect(exported).toHaveLength(49);
  for (const name of exported) expect(index, name).toMatch(new RegExp(`from "\\./components/${name}\\.js"`));
  const code = index.replace(/^\/\/# sourceMappingURL=.*$/m, "");
  for (const line of code.split("\n").filter((l) => l.trim()))
    expect(line).toMatch(/^(import \{[^}]*\} from "\.\/components\/\w+\.js";|export \{|\s+\w+,?$|\};)$/);
  expect(code).not.toMatch(/forwardRef|function|=>|jsx/);
});

test("OVL-02 the file of each overlay starts with use client, and no other file of dist has the directive", () => {
  for (const file of CLIENT) expect(read(file).startsWith('"use client";\n'), file).toBe(true);
  const marked = distJs().filter((f) => /^\s*["']use client["']/.test(read(f)));
  expect(marked.sort()).toEqual([...CLIENT].sort());
});

test("FWK-20 every .js of dist has its .js.map beside it and ends with sourceMappingURL", () => {
  const files = distJs();
  expect(files.length).toBeGreaterThan(30);
  for (const file of files) {
    expect(existsSync(file + ".map"), file).toBe(true);
    expect(read(file).trimEnd().split("\n").at(-1), file).toBe(`//# sourceMappingURL=${basename(file)}.map`);
  }
});

test("FWK-21 the sourcesContent of every map equals the src file each source points to", () => {
  for (const file of distJs()) {
    const map = JSON.parse(read(file + ".map")) as { sources: string[]; sourcesContent: string[] };
    // index.js only re-exports, so it has no mapped code and no source.
    if (file !== "dist/index.js") expect(map.sources.length, file).toBeGreaterThan(0);
    expect(map.sourcesContent, file).toHaveLength(map.sources.length);
    map.sources.forEach((source, i) => {
      const path = join(dirname(file), source);
      expect(path, file).toMatch(/^src\/.+\.tsx?$/);
      expect(map.sourcesContent[i], path).toBe(read(path));
    });
  }
});

test("FWK-32 a second build gives the same bytes for every .js and .js.map of dist", async () => {
  const out = (await build({ configFile: "vite.config.ts", logLevel: "silent", build: { write: false } })) as
    | Rollup.RollupOutput
    | Rollup.RollupOutput[];
  const chunks = (Array.isArray(out) ? out[0] : out).output.filter((o): o is Rollup.OutputChunk => o.type === "chunk");
  expect(chunks.map((c) => join("dist", c.fileName)).sort()).toEqual(distJs().sort());
  for (const chunk of chunks) {
    const file = join("dist", chunk.fileName);
    expect(chunk.code, file).toBe(read(file));
    expect(chunk.map!.toString(), file).toBe(read(file + ".map"));
  }
});

/** The use-client fixtures built with the library's own vite.config.ts, one file per module: file name to code. */
async function buildFixtures(): Promise<Record<string, string>> {
  const dir = "tests/fixtures/use-client/";
  // The library's own config, plugins and output included, with only the entries replaced (a merge would add them to
  // the library's entries).
  const out = (await build({
    ...config,
    configFile: false,
    logLevel: "silent",
    build: {
      ...config.build,
      write: false,
      lib: { entry: { a: dir + "a.tsx", b: dir + "b.tsx", c: dir + "c.tsx" }, formats: ["es"] },
    },
  })) as Rollup.RollupOutput | Rollup.RollupOutput[];
  const chunks = (Array.isArray(out) ? out[0] : out).output.filter((o): o is Rollup.OutputChunk => o.type === "chunk");
  return Object.fromEntries(chunks.map((c) => [c.fileName, c.code]));
}

test("FWK-12 a module that starts with use client keeps it on line 1 of its file", async () => {
  const files = await buildFixtures();
  expect(files["c.js"].split("\n")[0]).toBe('"use client";');
  expect(files["c.js"]).toContain("useState");
});

test("FWK-13 a module without use client has none in its file, in the fixture and in dist", async () => {
  const files = await buildFixtures();
  expect(Object.keys(files).sort()).toEqual(["a.js", "b.js", "c.js"]);
  expect(files["b.js"]).not.toContain("use client");
  expect(files["b.js"]).toContain("forwardRef");
  // The overlays hold state and effects (primitives-overlays): only their files carry the directive.
  for (const file of distJs().filter((f) => !CLIENT.includes(f))) expect(read(file), file).not.toContain("use client");
});

test("FWK-31 a use client after a license comment still lands on line 1", async () => {
  const files = await buildFixtures();
  expect(read("tests/fixtures/use-client/a.tsx").split("\n")[0]).toBe("/**");
  expect(files["a.js"].split("\n")[0]).toBe('"use client";');
  expect(files["a.js"]).toContain("useState");
});

test("FWK-22 the package carries every .js.map of dist and no file of src", () => {
  const [info] = JSON.parse(execFileSync("npm", ["pack", "--dry-run", "--json"], { encoding: "utf8" })) as {
    files: { path: string }[];
  }[];
  const paths = info.files.map((f) => f.path);
  const maps = distJs().map((f) => f + ".map");
  expect(maps.length).toBeGreaterThan(30);
  for (const map of maps) expect(paths, map).toContain(map);
  expect(paths.filter((p) => p.startsWith("src/"))).toEqual([]);
});

test("DIS-02 the file of Tabs starts with use client, and the files of Accordion and Pagination do not", () => {
  expect(read("dist/components/Tabs.js").startsWith('"use client";\n')).toBe(true);
  for (const name of ["Accordion", "Pagination"])
    expect(read(`dist/components/${name}.js`), name).not.toMatch(/^\s*["']use client["']/);
});

test("FBL-02 the file of Toaster starts with use client, and the files of the other six do not", () => {
  expect(read("dist/components/Toaster.js").startsWith('"use client";\n')).toBe(true);
  for (const name of ["Icon", "Spinner", "Skeleton", "Stack", "Grid", "Divider"])
    expect(read(`dist/components/${name}.js`), name).not.toMatch(/^\s*["']use client["']/);
});
