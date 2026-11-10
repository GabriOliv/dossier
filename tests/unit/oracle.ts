import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** Dossier's original bundle.js, run in a sandbox whose `window.React` is the test's React. */
const source = readFileSync(new URL("../../source/components/bundle.js", import.meta.url), "utf8");
const sandbox: { window: { React: typeof React; Dossier?: Record<string, React.FC<any>> } } = { window: { React } };
runInNewContext(source, sandbox);

export const original = sandbox.window.Dossier!;

/** The nine typography classes of tokens.css, renamed with the ds-t- prefix in the library. */
export const TYPE_CLASSES = ["display", "title", "figure", "figure-xl", "heading", "body", "caption", "label", "datum"];

/**
 * Renames the nine typography classes inside `class` attributes, and only there: `label` → `ds-t-label`.
 * Applied to the original markup only, so a port that kept an old name still fails.
 */
export function renameTypeClasses(html: string): string {
  return html.replace(/ class="([^"]*)"/g, (_, list: string) => {
    const tokens = list.split(" ").map((c) => (TYPE_CLASSES.includes(c) ? "ds-t-" + c : c));
    return ` class="${tokens.join(" ")}"`;
  });
}

/**
 * Replaces generated ids with placeholders numbered in order of first appearance, in `id`, `for`,
 * `aria-describedby` and `url(#…)` only, so references must still point at the same element.
 * Classes are never touched here: a `ds-tf-*` class difference stays visible.
 */
export function normalizeIds(html: string): string {
  const seen = new Map<string, string>();
  const ph = (v: string) => {
    if (!seen.has(v)) seen.set(v, `«id${seen.size + 1}»`);
    return seen.get(v)!;
  };
  return html
    .replace(/ (id|for|aria-describedby)="([^"]*)"/g, (_, attr: string, v: string) => {
      const value = attr === "aria-describedby" ? v.split(" ").map(ph).join(" ") : ph(v);
      return ` ${attr}="${value}"`;
    })
    .replace(/url\(#([^)]*)\)/g, (_, v: string) => `url(#${ph(v)})`);
}

/** Static markup of the original Dossier component `name` with `props`, normalized as the plan defines. */
export function renderOriginal(name: string, props: object): string {
  return normalizeIds(renameTypeClasses(renderToStaticMarkup(React.createElement(original[name], props))));
}

/** Static markup of a ported element, for comparison with renderOriginal (ids normalized only). */
export function render(element: React.ReactElement): string {
  return normalizeIds(renderToStaticMarkup(element));
}
