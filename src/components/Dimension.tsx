import { forwardRef } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

interface DimensionOwnProps {
  /** Measured length in px (default 240). The SVG adds 6px each side for the end ticks. */
  length?: number;
  /** Text over the line (default "<length> PX"). */
  label?: string | number;
  /** Signal stroke for the measure being discussed. */
  active?: boolean;
  className?: string;
}

export type DimensionProps = DimensionOwnProps & NativeProps<"svg", DimensionOwnProps>;

/** Port of Dossier's Dimension: a blueprint measure line with end ticks and a centred value. */
export const Dimension = forwardRef<SVGSVGElement, DimensionProps>(function Dimension(
  { length, label, active, className, ...rest },
  ref,
) {
  const L = length || 240;
  const H = 28;
  const y = 20;
  const text = label != null ? String(label) : L + " px";
  return (
    <svg
      ref={ref}
      className={cls("ds-dim", active && "ds-dim-on", className)}
      viewBox={"-6 0 " + (L + 12) + " " + H}
      width={L + 12}
      height={H}
      role="img"
      aria-label={text}
      {...rest}
    >
      <line className="ds-dim-line" x1={0} y1={y + 0.5} x2={L} y2={y + 0.5} />
      <line className="ds-dim-line" x1={0.5} y1={y - 8} x2={0.5} y2={H} />
      <line className="ds-dim-line" x1={L - 0.5} y1={y - 8} x2={L - 0.5} y2={H} />
      <line className="ds-dim-tick" x1={-4} y1={y + 4} x2={4} y2={y - 4} />
      <line className="ds-dim-tick" x1={L - 4} y1={y + 4} x2={L + 4} y2={y - 4} />
      <text className="ds-t-label ds-dim-text" x={L / 2} y={11} textAnchor="middle">
        {text}
      </text>
    </svg>
  );
});
