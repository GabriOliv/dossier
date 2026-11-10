import { forwardRef } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

interface ConnectorOwnProps {
  /** Box width and height in px. Set one to 0 for a straight arrow. Defaults 160 × 64. */
  width?: number;
  height?: number;
  /** Start corner; the arrow ends at the opposite corner. Default "bottom-right". */
  from?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  /** Which leg runs first (default "vertical"). */
  first?: "vertical" | "horizontal";
  /** Signal stroke; one per composition. */
  active?: boolean;
  className?: string;
}

export type ConnectorProps = ConnectorOwnProps & NativeProps<"svg", ConnectorOwnProps>;

/** Port of Dossier's Connector: an orthogonal arrow from one corner of its box to the opposite corner. */
export const Connector = forwardRef<SVGSVGElement, ConnectorProps>(function Connector(
  { width, height, from: fromProp, first, active, className, ...rest },
  ref,
) {
  const w = width != null ? width : 160;
  const hh = height != null ? height : 64;
  const from = fromProp || "bottom-right";
  const vertFirst = first !== "horizontal";
  const pad = 6;
  const sx = from.indexOf("right") >= 0 ? w : 0;
  const sy = from.indexOf("bottom") >= 0 ? hh : 0;
  const tx = w - sx;
  const ty = hh - sy;
  let mx = vertFirst ? sx : tx;
  let my = vertFirst ? ty : sy;
  let dx = tx - mx;
  let dy = ty - my;
  if (dx === 0 && dy === 0) {
    mx = sx;
    my = sy;
    dx = tx - sx;
    dy = ty - sy;
  }
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const bx = tx - ux * 9;
  const by = ty - uy * 9;
  const head = [tx + "," + ty, bx - uy * 4.5 + "," + (by + ux * 4.5), bx + uy * 4.5 + "," + (by - ux * 4.5)].join(" ");
  return (
    <svg
      ref={ref}
      className={cls("ds-connector", active && "ds-conn-on", className)}
      viewBox={-pad + " " + -pad + " " + (w + pad * 2) + " " + (hh + pad * 2)}
      width={w + pad * 2}
      height={hh + pad * 2}
      aria-hidden="true"
      {...rest}
    >
      <g transform="translate(0.5 0.5)">
        <polyline className="ds-conn-line" points={[sx + "," + sy, mx + "," + my, bx + "," + by].join(" ")} />
        <polygon className="ds-conn-head" points={head} />
      </g>
    </svg>
  );
});
