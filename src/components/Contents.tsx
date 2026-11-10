import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

export interface ContentsItem {
  /** Defaults to 01, 02, … */
  index?: string;
  title: string;
  description?: string;
  page?: string | number;
  /** The current section; its number turns signal. */
  active?: boolean;
}

interface ContentsOwnProps {
  items: ContentsItem[];
  /** The page prefix, falling back to English: `labels={ptBR.Contents}`. */
  labels?: Partial<Locale["Contents"]>;
  className?: string;
}

export type ContentsProps = ContentsOwnProps & NativeProps<"ol", ContentsOwnProps>;

/** Port of Dossier's Contents: numbered table of contents. */
export const Contents = forwardRef<HTMLOListElement, ContentsProps>(function Contents(
  { items = [], labels, className, ...rest },
  ref,
) {
  return (
    <ol ref={ref} className={cls("ds-contents", className)} {...rest}>
      {items.map((it, i) => (
        <li key={i} className={cls("ds-toc-item", it.active && "ds-toc-on")}>
          <span className="ds-t-figure ds-toc-index">
            {it.index != null ? String(it.index) : (i < 9 ? "0" : "") + (i + 1)}
          </span>
          <span className="ds-t-title ds-toc-title">{it.title}</span>
          <span className="ds-t-body ds-toc-desc">{it.description || ""}</span>
          <span className="ds-t-label ds-toc-page">
            {it.page != null ? pick(labels?.page, en.Contents.page) + " " + it.page : ""}
          </span>
        </li>
      ))}
    </ol>
  );
});
