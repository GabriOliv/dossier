import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

interface FigureOwnProps {
  /** The figure's number on the page, padded to two digits: `3` reads `FIG. 03`. */
  n: number | string;
  title: string;
  /** A short text at the right end of the legend, such as a revision. Nothing shows without it. */
  meta?: string;
  /** The image, diagram or table, and an optional `<figcaption>` under it. */
  children?: ReactNode;
  /** The `FIG.` prefix, falling back to English: `labels={ptBR.Figure}`. */
  labels?: Partial<Locale["Figure"]>;
  className?: string;
}

export type FigureProps = FigureOwnProps & NativeProps<"figure", FigureOwnProps>;

/** A numbered plate: `FIG. NN — TITLE` and an optional meta over a rule, then the image and its caption. */
export const Figure = forwardRef<HTMLElement, FigureProps>(function Figure(
  { n, title, meta, children, labels, className, ...rest },
  ref,
) {
  return (
    <figure ref={ref} className={cls("ds-fig", className)} {...rest}>
      <div className="ds-t-label ds-fig-legend">
        <span className="ds-fig-title">
          {`${pick(labels?.fig, en.Figure.fig)} ${String(n).padStart(2, "0")} — ${title}`}
        </span>
        {meta ? <span className="ds-fig-meta">{meta}</span> : null}
      </div>
      {children}
    </figure>
  );
});
