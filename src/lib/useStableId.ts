import { useId } from "react";

/**
 * A per-instance id that is the same on the server and in the browser, for `id`, `htmlFor`, `aria-*` and
 * `url(#…)`. Built on React's `useId`, whose ids are `:<prefix>R1:` (React 18), `«<prefix>R1»` (React 19.0–19.1) or
 * `_<prefix>R_1_` (React 19.2), where `<prefix>` is the root's `identifierPrefix`. Only React's own delimiters are
 * dropped, so every version gives `<prefix>R1`. Any other character outside letters, digits, `_` and `-` is dropped
 * too, to stay safe in `url(#…)` and CSS selectors: two roots need prefixes that differ in those characters.
 */
export function useStableId(prefix: string): string {
  const id = useId();
  let core = id.slice(1, -1);
  if (id[0] === "_") core = core.replace(/([Rr])_(?=[^_]*$)/, "$1");
  return prefix + core.replace(/[^A-Za-z0-9_-]/g, "");
}
