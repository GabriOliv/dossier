// Renders every export of dist/index.js on the server, twice, once more with a ref, an id and a data-testid, once
// more with its pt-BR labels when it has a label set, plus a
// useStableId probe; prints JSON.
// Usage: node [--import ./tests/ssr/register-react19.mjs] tests/ssr/render.mjs
import { createElement, createRef } from "react";
import { version } from "react";
import { renderToString } from "react-dom/server";
import * as lib from "../../dist/index.js";
import { ptBR } from "../../dist/locales/pt-BR.js";
import { useStableId } from "../../src/lib/useStableId.ts";
import { samples } from "./samples.mjs";

const html = {};
const errors = {};
const native = {};
const nativeErrors = {};
for (const [name, Component] of Object.entries(lib)) {
  // A component is a function or a forwardRef object.
  if (typeof Component !== "function" && Component?.$$typeof !== Symbol.for("react.forward_ref")) continue;
  // toast() is the one function export that is not a component: it queues a message for <Toaster />.
  if (name === "toast") continue;
  try {
    html[name] = renderToString(createElement(Component, samples[name] ?? {}));
  } catch (e) {
    errors[name] = String(e?.stack ?? e);
  }
  const extra = { ref: createRef(), id: "ssr-" + name, "data-testid": "ssr-" + name };
  try {
    native[name] = renderToString(createElement(Component, { ...samples[name], ...extra }));
  } catch (e) {
    nativeErrors[name] = String(e?.stack ?? e);
  }
}
// Each component that has a label set, rendered once more with its pt-BR labels.
const labeled = {};
const labeledErrors = {};
for (const [name, labels] of Object.entries(ptBR)) {
  try {
    labeled[name] = renderToString(createElement(lib[name], { ...samples[name], labels }));
  } catch (e) {
    labeledErrors[name] = String(e?.stack ?? e);
  }
}
function Probe() {
  const id = useStableId("ds-tf-");
  return createElement("label", { htmlFor: id, id: id + "-label" }, "x");
}
const ids = [renderToString(createElement(Probe)), renderToString(createElement(Probe))];
// Two roots on one page, told apart only by an underscore in identifierPrefix.
const prefixed = ["a_", "a"].map((identifierPrefix) => renderToString(createElement(Probe), { identifierPrefix }));
process.stdout.write(
  JSON.stringify({
    version,
    html,
    errors,
    native,
    nativeErrors,
    labeled,
    labeledErrors,
    ids,
    prefixed,
    samples: Object.keys(samples),
  }),
);
