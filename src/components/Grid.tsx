import { forwardRef, type CSSProperties, type ReactNode } from "react";
import { cls } from "../lib/cls";
import { gapOf, type Gap } from "../lib/gap";
import type { NativeProps } from "../lib/native";

interface GridOwnProps {
  children?: ReactNode;
  /** A number of equal columns; below 640 px the grid has one column. Ignored when `minColumnWidth` is set. */
  columns?: number;
  /** Columns at least this wide (a CSS length, or a number of px) that fill the row: `repeat(auto-fit, minmax(w, 1fr))`. */
  minColumnWidth?: string | number;
  /** A step of the `--ds-space-*` scale: 1, 2, 3, 4, 6, 8 or 12. Default and fallback: 3. */
  gap?: Gap;
  className?: string;
}

export type GridProps = GridOwnProps & NativeProps<"div", GridOwnProps>;

/** Items on a grid, spaced by the Dossier scale: a grid `div`. */
export const Grid = forwardRef<HTMLDivElement, GridProps>(function Grid(
  { children, columns, minColumnWidth, gap, className, style, ...rest },
  ref,
) {
  const min =
    minColumnWidth === undefined || minColumnWidth === ""
      ? undefined
      : `${minColumnWidth}`.replace(/^(\d+(\.\d+)?)$/, "$1px");
  const cols = min === undefined && Number.isInteger(columns) && columns! >= 1 ? columns : undefined;
  const own: CSSProperties | undefined =
    min !== undefined
      ? { gridTemplateColumns: `repeat(auto-fit, minmax(${min}, 1fr))` }
      : cols !== undefined
        ? ({ "--ds-grid-cols": cols } as CSSProperties)
        : undefined;
  return (
    <div
      ref={ref}
      className={cls("ds-grid", cols !== undefined && "ds-grid-cols", `ds-gap-${gapOf(gap)}`, className)}
      style={own ? { ...own, ...style } : style}
      {...rest}
    >
      {children}
    </div>
  );
});
