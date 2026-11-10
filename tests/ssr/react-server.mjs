// Under the react-server condition: imports dist/index.js, and lists each .js of a folder (dist by default) that
// imports from react or react/jsx-runtime a name their react-server build does not export, unless its line 1 is
// "use client", whatever the import form. The react-server builds are the files React's own exports map names. Prints JSON.
// Usage: node --conditions=react-server --import ./tests/ssr/register-react19.mjs tests/ssr/react-server.mjs [dir]
import { readdirSync, readFileSync } from "node:fs";
import { createRequire, registerHooks } from "node:module";
import { join } from "node:path";
import * as React from "react";

const dir = process.argv[2] ?? "dist";
const require = createRequire(new URL("../react19/node_modules/react/", import.meta.url));
const { exports } = require("./package.json");
const server = {
  react: Object.keys(require(exports["."]["react-server"])).sort(),
  "react/jsx-runtime": Object.keys(require(exports["./jsx-runtime"]["react-server"])).sort(),
};

// A bundler for Server Components never runs a module that starts with "use client": the server graph gets a reference
// to its exports instead. This hook does the same, so dist/index.js imports here as it does in such a bundler.
registerHooks({
  load(url, context, nextLoad) {
    const out = nextLoad(url, context);
    const code = String(out.source ?? "");
    if (out.format !== "module" || !/^["']use client["'];?\s*$/.test(code.split("\n")[0])) return out;
    const names = [...code.matchAll(/\bexport\s*\{([^}]*)\}/g)].flatMap((m) =>
      m[1].split(",").map((n) =>
        n
          .trim()
          .split(/\s+as\s+/)
          .pop(),
      ),
    );
    const source = names
      .filter(Boolean)
      .map((n) => `export const ${n} = Object.assign(() => null, { $$typeof: Symbol.for("react.client.reference") });`);
    return { ...out, source: source.join("\n"), shortCircuit: true };
  },
});

// A failed import is reported, not thrown, so the scan below still names the module and the name.
let components = [];
let importError = null;
try {
  const lib = await import("../../dist/index.js");
  components = Object.keys(lib).filter(
    (k) => typeof lib[k] === "function" || lib[k]?.$$typeof === Symbol.for("react.forward_ref"),
  );
} catch (e) {
  importError = String(e);
}

const files = (d) =>
  readdirSync(d, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(d, e.name)) : e.name.endsWith(".js") ? [join(d, e.name)] : [],
  );
const checked = files(dir).sort();
const reported = [];
for (const file of checked) {
  const code = readFileSync(file, "utf8");
  if (/^["']use client["'];?\s*$/.test(code.split("\n")[0])) continue;
  const check = (spec, name) => {
    if (name && !server[spec].includes(name)) reported.push({ file, spec, name });
  };
  // Every `import ... from` and `export ... from` of react: named, default, namespace and `export *`.
  for (const [, keyword, clause, spec] of code.matchAll(
    /\b(import|export)\s+([^;]*?)\s*from\s*["'](react|react\/jsx-runtime)["']/g,
  )) {
    const text = clause.replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, "").trim();
    const named = text.match(/\{([^}]*)\}/)?.[1] ?? "";
    for (const n of named.split(",")) check(spec, n.trim().split(/\s+as\s+/)[0]);
    if (keyword === "export" && text === "*") check(spec, "*");
    // A default or namespace binding: each `binding.name` used in the module is checked.
    const binding =
      text.match(/\*\s+as\s+(\w+)/)?.[1] ?? (keyword === "import" ? text.match(/^(\w+)\s*(?:,|$)/)?.[1] : undefined);
    if (binding) for (const [, n] of code.matchAll(new RegExp(`\\b${binding}\\.(\\w+)`, "g"))) check(spec, n);
  }
}

process.stdout.write(
  JSON.stringify({
    version: React.version,
    serverBuild: !("useState" in React),
    importError,
    components,
    checked,
    reported,
    server,
  }),
);
