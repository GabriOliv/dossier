/** One entry of a page list: a page number, or `…` for two or more hidden pages. */
export type PageItem = number | "…";

/**
 * The pages to show for `page` of `total`: always the first, the last, the current one and `siblings` on each side,
 * with `…` for two or more hidden pages. The list keeps the same length at every page, so near an edge the window
 * shifts inward, and a single hidden page shows in place of a `…`. A `page` out of 1 to `total` counts as the nearer
 * end.
 */
export function pageItems(page: number, total: number, siblings: number): PageItem[] {
  const pages = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);
  if (total <= 2 * siblings + 5) return pages(1, total);
  const current = Math.min(Math.max(page, 1), total);
  const start = Math.min(Math.max(current - siblings, 3), total - 2 - 2 * siblings);
  const end = start + 2 * siblings;
  return [1, start === 3 ? 2 : "…", ...pages(start, end), end === total - 2 ? total - 1 : "…", total];
}
