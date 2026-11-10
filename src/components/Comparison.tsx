import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import { headingTag, type NativeProps } from "../lib/native";

export interface ComparisonColumn {
  /** Defaults to A, B, C. */
  code?: string;
  title: string;
  lead?: string;
  items?: ReactNode[];
  /** The recommended or current column; its rule and bullets turn signal. */
  active?: boolean;
}

interface ComparisonOwnProps {
  /** Two or three columns; extra columns are dropped. */
  columns: ComparisonColumn[];
  /** Heading level of each column title, 1 to 6 (default 3). */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export type ComparisonProps = ComparisonOwnProps & NativeProps<"div", ComparisonOwnProps>;

/** Port of Dossier's Comparison: two or three parallel criteria columns. */
export const Comparison = forwardRef<HTMLDivElement, ComparisonProps>(function Comparison(
  { columns = [], level, className, style, ...rest },
  ref,
) {
  const cols = columns.slice(0, 3);
  const H = headingTag(level, "h3");
  return (
    <div
      ref={ref}
      className={cls("ds-compare", className)}
      style={{ gridTemplateColumns: "repeat(" + Math.max(cols.length, 1) + ", minmax(0, 1fr))", ...style }}
      {...rest}
    >
      {cols.map((c, i) => (
        <section key={i} className={cls("ds-cmp-col", c.active && "ds-cmp-on")}>
          <span className="ds-t-label ds-cmp-code">{c.code || String.fromCharCode(65 + i)}</span>
          <H className="ds-t-title ds-cmp-title">{c.title}</H>
          {c.lead ? <p className="ds-t-body ds-cmp-lead">{c.lead}</p> : null}
          {c.items && c.items.length ? (
            <ul className="ds-cmp-list">
              {c.items.map((t, k) => (
                <li key={k} className="ds-t-body ds-cmp-item">
                  {t}
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </div>
  );
});
