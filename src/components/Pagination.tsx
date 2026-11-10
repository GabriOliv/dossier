import { forwardRef, type MouseEvent, type ReactNode } from "react";
import { cls } from "../lib/cls";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import { pageItems } from "../lib/pages";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";

interface PaginationOwnProps {
  /** The current page, from 1. A page out of 1 to `total` counts as the nearer end. */
  page: number;
  /** How many pages there are. With 1 or less nothing renders. */
  total: number;
  /** How many pages show on each side of the current one. Default 1. */
  siblings?: number;
  /** The address of page `n`: each page is then a link. Without it, each page is a button. */
  href?: (page: number) => string;
  /**
   * Called with the page and the click event when a page, Previous or Next is clicked. On a link it runs before the
   * browser follows it: call `event.preventDefault()` to route on the client instead.
   */
  onChange?: (page: number, event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => void;
  /** Fixed texts, each falling back to English. `page` goes before the number in each page's accessible name. */
  labels?: Partial<Locale["Pagination"]>;
  className?: string;
}

export type PaginationProps = PaginationOwnProps & NativeProps<"nav", PaginationOwnProps>;

/**
 * A `<nav>` with Previous, the pages and Next. With `href` each page is a link, which works without JS; without it each
 * is a button that calls `onChange`. The current page has `aria-current="page"`; Previous and Next are disabled at the
 * ends.
 */
export const Pagination = forwardRef<HTMLElement, PaginationProps>(function Pagination(
  { page, total, siblings = 1, href, onChange, labels, className, ...rest },
  ref,
) {
  if (total <= 1) return null;
  const current = Math.min(Math.max(page, 1), total);
  const pageLabel = pick(labels?.page, en.Pagination.page);

  /** Page `to` as a link or a button; `off` makes it a disabled one. */
  const control = (
    to: number,
    content: ReactNode,
    extra: { className: string; label?: string; off?: boolean; current?: boolean },
  ) => {
    const common = {
      className: cls("ds-t-label ds-pagination-item", extra.className),
      "aria-label": extra.label,
      "aria-current": extra.current ? ("page" as const) : undefined,
    };
    if (!href)
      return (
        <button type="button" {...common} disabled={extra.off} onClick={onChange && ((e) => onChange(to, e))}>
          {content}
        </button>
      );
    if (extra.off)
      return (
        <span {...common} aria-disabled="true">
          {content}
        </span>
      );
    return (
      <a {...common} href={href(to)} onClick={onChange && ((e) => onChange(to, e))}>
        {content}
      </a>
    );
  };

  return (
    <nav
      aria-label={pick(labels?.name, en.Pagination.name)}
      {...rest}
      ref={ref}
      className={cls("ds-pagination", className)}
    >
      <ul className="ds-pagination-list">
        <li>
          {control(current - 1, pick(labels?.previous, en.Pagination.previous), {
            className: "ds-pagination-step",
            off: current === 1,
          })}
        </li>
        {pageItems(current, total, siblings).map((item, i) => (
          <li key={i}>
            {item === "…" ? (
              <span className="ds-t-label ds-pagination-gap">…</span>
            ) : (
              control(item, item, {
                className: "ds-pagination-page",
                label: `${pageLabel} ${item}`,
                current: item === current,
              })
            )}
          </li>
        ))}
        <li>
          {control(current + 1, pick(labels?.next, en.Pagination.next), {
            className: "ds-pagination-step",
            off: current === total,
          })}
        </li>
      </ul>
    </nav>
  );
});
