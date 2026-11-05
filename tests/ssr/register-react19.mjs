// Resolves react and react-dom from tests/react19/ instead of the root (React 18).
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";

const parentURL = pathToFileURL(new URL("../react19/package.json", import.meta.url).pathname).href;
const isReact = (s) => /^react(-dom)?($|\/)/.test(s);

registerHooks({
  resolve: (specifier, context, nextResolve) =>
    nextResolve(specifier, isReact(specifier) ? { ...context, parentURL } : context),
});
