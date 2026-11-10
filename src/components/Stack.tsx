import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import { gapOf, type Gap } from "../lib/gap";
import type { NativeProps } from "../lib/native";

interface StackOwnProps {
  children?: ReactNode;
  /** "column" (default) or "row". */
  direction?: "column" | "row";
  /** A step of the `--ds-space-*` scale: 1, 2, 3, 4, 6, 8 or 12. Default and fallback: 3. */
  gap?: Gap;
  /** `align-items`. */
  align?: "start" | "center" | "end" | "stretch" | "baseline";
  /** `justify-content`. */
  justify?: "start" | "center" | "end" | "between";
  /** Lets the items wrap onto more lines. */
  wrap?: boolean;
  className?: string;
}

export type StackProps = StackOwnProps & NativeProps<"div", StackOwnProps>;

/** Items in a line, spaced by the Dossier scale: a flex `div`. */
export const Stack = forwardRef<HTMLDivElement, StackProps>(function Stack(
  { children, direction, gap, align, justify, wrap, className, ...rest },
  ref,
) {
  return (
    <div
      ref={ref}
      className={cls(
        "ds-stack",
        direction === "row" && "ds-stack-row",
        `ds-gap-${gapOf(gap)}`,
        align && `ds-stack-align-${align}`,
        justify && `ds-stack-justify-${justify}`,
        wrap && "ds-stack-wrap",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
});
