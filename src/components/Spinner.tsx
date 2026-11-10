import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";

interface SpinnerOwnProps {
  /** The text next to the cells and the accessible name, falling back to English ("Loading"). */
  labels?: Partial<Locale["Spinner"]>;
  className?: string;
}

export type SpinnerProps = SpinnerOwnProps & NativeProps<"span", SpinnerOwnProps>;

/**
 * Four square cells lit one at a time in steps while the user accepts motion; with reduced motion they stand still,
 * two lit. The text stays visible. A live region of its own, so a screen reader announces it when it appears.
 */
export const Spinner = forwardRef<HTMLSpanElement, SpinnerProps>(function Spinner({ labels, className, ...rest }, ref) {
  const label = pick(labels?.label, en.Spinner.label);
  return (
    <span ref={ref} role="status" aria-label={label} className={cls("ds-spinner", className)} {...rest}>
      <span className="ds-spin-cells" aria-hidden="true">
        <span className="ds-spin-cell" />
        <span className="ds-spin-cell" />
        <span className="ds-spin-cell" />
        <span className="ds-spin-cell" />
      </span>
      <span className="ds-t-label ds-spin-text">{label}</span>
    </span>
  );
});
