import { useId } from "react";

/**
 * A per-instance id that is the same on the server and in the browser, for `id`, `htmlFor`, `aria-*` and
 * `url(#…)`. Built on React's `useId`, whose ids carry `:` (React 18) or `«»` (React 19.0–19.1), which need
 * escaping inside `url(#…)` and CSS selectors. Those delimiters are dropped; letters, digits, `_` and `-` remain.
 */
export function useStableId(prefix: string): string {
  return prefix + useId().replace(/[^A-Za-z0-9_-]/g, "");
}
