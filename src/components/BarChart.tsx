import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

export interface BarDatum {
  label: string;
  value: number;
  /** Signal bar; one per chart. */
  active?: boolean;
}

interface BarChartOwnProps {
  data: BarDatum[];
  /** Axis maximum (default: the largest value). */
  max?: number;
  /** Unit after each value. */
  unit?: string;
  /** Formats values and scale ticks. */
  format?: (v: number) => string;
  /** Scale row with 0, half and max (default true). */
  scale?: boolean;
  /** Accessible name. */
  title?: string;
  /** The accessible name used without `title`, falling back to English: `labels={ptBR.BarChart}`. */
  labels?: Partial<Locale["BarChart"]>;
  className?: string;
}

export type BarChartProps = BarChartOwnProps & NativeProps<"div", BarChartOwnProps>;

/** Port of Dossier's BarChart: horizontal bars on one axis, one bar in signal. */
export const BarChart = forwardRef<HTMLDivElement, BarChartProps>(function BarChart(
  { data: dataProp, max: maxProp, unit, format, scale, title, labels, className, ...rest },
  ref,
) {
  const data = dataProp || [];
  const max = maxProp || Math.max(...data.map((d) => d.value), 1);
  const fmt = format || ((v: number) => String(v));
  return (
    <div
      ref={ref}
      className={cls("ds-bars", className)}
      role="list"
      aria-label={title || pick(labels?.name, en.BarChart.name)}
      {...rest}
    >
      {data.map((d, i) => {
        const pct = Math.max(0, Math.min(100, (d.value / max) * 100));
        return (
          <div key={i} role="listitem" className={cls("ds-bar", d.active && "ds-bar-on")}>
            <span className="ds-t-label ds-bar-label">{d.label}</span>
            <span className="ds-bar-track">
              <span className="ds-bar-fill" style={{ width: pct + "%" }} />
            </span>
            <span className="ds-t-datum ds-bar-value">{fmt(d.value) + (unit ? " " + unit : "")}</span>
          </div>
        );
      })}
      {scale !== false ? (
        <div key="scale" className="ds-bar ds-bar-scale" aria-hidden="true">
          <span />
          <span className="ds-t-label ds-bar-ticks">
            <span>0</span>
            <span>{fmt(max / 2)}</span>
            <span>{fmt(max)}</span>
          </span>
          <span />
        </div>
      ) : null}
    </div>
  );
});
