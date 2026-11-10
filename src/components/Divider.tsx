import { forwardRef } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

interface DividerOwnProps {
  /** "hair" (default): a `--ds-stroke-hair` line in `--ds-rule-soft`, decoration. "rule" and "heavy": `--ds-stroke-rule` and `--ds-stroke-heavy` in `--ds-rule`, structure. */
  weight?: "hair" | "rule" | "heavy";
  /**
   * "horizontal" (default) or "vertical". A vertical Divider takes its height from a row flex container, a grid or a
   * container of definite height; in an auto-height block it has no height.
   */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export type DividerProps = DividerOwnProps & NativeProps<"hr", DividerOwnProps>;

/** A line between two groups: an `<hr>`, so it is a separator for assistive tech. */
export const Divider = forwardRef<HTMLHRElement, DividerProps>(function Divider(
  { weight, orientation, className, ...rest },
  ref,
) {
  const vertical = orientation === "vertical";
  return (
    <hr
      ref={ref}
      className={cls(
        "ds-divider",
        (weight === "rule" || weight === "heavy") && `ds-divider-${weight}`,
        vertical && "ds-divider-vertical",
        className,
      )}
      {...(vertical ? { "aria-orientation": "vertical" } : {})}
      {...rest}
    />
  );
});
