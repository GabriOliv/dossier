// Renders every export of dist/index.js on the server, twice, plus a useStableId probe; prints JSON.
// Usage: node [--import ./tests/ssr/register-react19.mjs] tests/ssr/render.mjs
import { createElement } from "react";
import { version } from "react";
import { renderToString } from "react-dom/server";
import * as lib from "../../dist/index.js";
import { useStableId } from "../../src/lib/useStableId.ts";
import { samples } from "./samples.mjs";

const html = {};
const errors = {};
for (const [name, Component] of Object.entries(lib)) {
  if (typeof Component !== "function") continue;
  try {
    html[name] = renderToString(createElement(Component, samples[name] ?? {}));
  } catch (e) {
    errors[name] = String(e?.stack ?? e);
  }
}
function Probe() {
  const id = useStableId("ds-tf-");
  return createElement("label", { htmlFor: id, id: id + "-label" }, "x");
}
const ids = [renderToString(createElement(Probe)), renderToString(createElement(Probe))];
process.stdout.write(JSON.stringify({ version, html, errors, ids, samples: Object.keys(samples) }));
