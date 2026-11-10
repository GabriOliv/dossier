import { forwardRef } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

interface MeterOwnProps {
  label: string;
  /** Whole number of filled cells. */
  value: number;
  /** Cell count (default 10). */
  max?: number;
  /** "signal" for the one meter that matters most. */
  tone?: "ink" | "signal";
  className?: string;
}

export type MeterProps = MeterOwnProps & NativeProps<"div", MeterOwnProps>;

/** Port of Dossier's Meter: a segmented scale of square cells. */
export const Meter = forwardRef<HTMLDivElement, MeterProps>(function Meter(
  { label, value, max: maxProp, tone, className, ...rest },
  ref,
) {
  const max = maxProp || 10;
  const val = Math.max(0, Math.min(max, Math.round(value || 0)));
  const cells = [];
  for (let i = 0; i < max; i++) cells.push(<span key={i} className={i < val ? "ds-cell ds-cell-on" : "ds-cell"} />);
  return (
    <div
      ref={ref}
      className={cls("ds-meter", tone === "signal" && "ds-meter-signal", className)}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={val}
      aria-label={label}
      {...rest}
    >
      <span className="ds-t-label ds-meter-label">{label}</span>
      <span className="ds-meter-cells" aria-hidden="true">
        {cells}
      </span>
      <span className="ds-t-datum ds-meter-value">{val + "/" + max}</span>
    </div>
  );
});
