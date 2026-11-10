import { forwardRef, type ReactElement } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import { useStableId } from "../lib/useStableId";

export interface LinePoint {
  /** Axis label, e.g. "Jun". */
  x: string;
  y: number;
  /** Show the value above the point. */
  callout?: boolean;
  /** The point the text is about: signal node, halo and large callout. One per chart. */
  active?: boolean;
}

interface LineChartOwnProps {
  data: LinePoint[];
  /** Appended to callout values, e.g. "%". */
  unit?: string;
  format?: (v: number) => string;
  /** Defaults 0 and the largest value. */
  yMin?: number;
  yMax?: number;
  /** Hatched area under the line (default true). */
  area?: boolean;
  /** viewBox size; the SVG scales down to its container. Defaults 720 × 240. */
  width?: number;
  height?: number;
  /** Accessible name. */
  title?: string;
  /** The accessible name used without `title`, falling back to English: `labels={ptBR.LineChart}`. */
  labels?: Partial<Locale["LineChart"]>;
  className?: string;
}

export type LineChartProps = LineChartOwnProps & NativeProps<"svg", LineChartOwnProps>;

/** Port of Dossier's LineChart: one trend line over a hatched area, with value callouts on chosen points. */
export const LineChart = forwardRef<SVGSVGElement, LineChartProps>(function LineChart(
  {
    data: dataProp,
    unit: unitProp,
    format,
    yMin: yMinProp,
    yMax: yMaxProp,
    area,
    width,
    height,
    title,
    labels,
    className,
    ...rest
  },
  ref,
) {
  const hid = useStableId("ds-hatch-");
  const data = dataProp || [];
  const n = data.length;
  const W = width || 720;
  const H = height || 240;
  const padT = 64;
  const padB = 32;
  const padX = 48;
  const baseY = H - padB;
  const ys = data.map((d) => d.y);
  const yMin = yMinProp != null ? yMinProp : 0;
  const yMax = yMaxProp != null ? yMaxProp : Math.max(...ys, yMin + 1);
  const fmt = format || ((v: number) => String(v));
  const unit = unitProp || "";
  const X = (i: number) => (n > 1 ? padX + (i * (W - padX * 2)) / (n - 1) : W / 2);
  const Y = (v: number) => baseY - ((v - yMin) / (yMax - yMin || 1)) * (baseY - padT);
  const pts = data.map((d, i) => [X(i), Y(d.y)]);
  const line = pts.map((q) => q[0] + "," + q[1]).join(" ");
  const parts: ReactElement[] = [];
  parts.push(
    <defs key="defs">
      <pattern id={hid} width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line className="ds-lc-hatch" x1={0} y1={0} x2={0} y2={6} />
      </pattern>
    </defs>,
  );
  if (area !== false && n > 1) {
    parts.push(
      <polygon
        key="area"
        fill={"url(#" + hid + ")"}
        points={line + " " + X(n - 1) + "," + baseY + " " + X(0) + "," + baseY}
      />,
    );
  }
  parts.push(<line key="base" className="ds-lc-base" x1={0} y1={baseY + 0.5} x2={W} y2={baseY + 0.5} />);
  data.forEach((d, i) => {
    const x = Math.round(X(i)) + 0.5;
    parts.push(<line key={"tk" + i} className="ds-lc-tick" x1={x} y1={baseY} x2={x} y2={baseY + 6} />);
    parts.push(
      <text
        key={"xl" + i}
        className={cls("ds-t-label ds-lc-xlabel", d.active && "ds-lc-on-text")}
        x={X(i)}
        y={baseY + 22}
        textAnchor="middle"
      >
        {d.x}
      </text>,
    );
  });
  if (n > 1) parts.push(<polyline key="line" className="ds-lc-line" points={line} />);
  data.forEach((d, i) => {
    const x = pts[i][0];
    const y = pts[i][1];
    if (d.callout || d.active) {
      parts.push(
        <line
          key={"cl" + i}
          className={cls("ds-lc-leader", d.active && "ds-lc-on")}
          x1={x}
          y1={y - (d.active ? 14 : 8)}
          x2={x}
          y2={y - 30}
        />,
      );
      parts.push(
        <text
          key={"ct" + i}
          className={d.active ? "ds-t-title ds-lc-callout ds-lc-callout-on" : "ds-t-heading ds-lc-callout"}
          x={x}
          y={y - 36}
          textAnchor="middle"
        >
          {fmt(d.y) + unit}
        </text>,
      );
    }
    if (d.active) parts.push(<circle key={"halo" + i} className="ds-lc-halo" cx={x} cy={y} r={12} />);
    parts.push(
      <circle
        key={"p" + i}
        className={d.active ? "ds-lc-node ds-lc-node-on" : "ds-lc-node"}
        cx={x}
        cy={y}
        r={d.active ? 5 : 4}
      />,
    );
  });
  return (
    <svg
      ref={ref}
      className={cls("ds-linechart", className)}
      viewBox={"0 0 " + W + " " + H}
      width={W}
      height={H}
      role="img"
      aria-label={title || pick(labels?.name, en.LineChart.name)}
      {...rest}
    >
      {parts}
    </svg>
  );
});
