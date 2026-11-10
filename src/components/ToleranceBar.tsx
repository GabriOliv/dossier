import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import { ErrorMark } from "./ErrorMark";

interface ToleranceBarOwnProps {
  label: string;
  value: number;
  /** Allowed range; give min, max or both. */
  min?: number;
  max?: number;
  /** Scale ends (default 0 and 1.25 × the larger of max and value). */
  scaleMin?: number;
  scaleMax?: number;
  unit?: string;
  format?: (v: number) => string;
  /** State words and accessible-name texts, each falling back to English: `labels={ptBR.ToleranceBar}`. */
  labels?: Partial<Locale["ToleranceBar"]>;
  className?: string;
}

export type ToleranceBarProps = ToleranceBarOwnProps & NativeProps<"div", ToleranceBarOwnProps>;

const roundTo = (v: number) => Math.round(v * 1000) / 1000;

/** Port of Dossier's ToleranceBar: one measured value against its allowed range. */
export const ToleranceBar = forwardRef<HTMLDivElement, ToleranceBarProps>(function ToleranceBar(
  { label, value, min, max, scaleMin, scaleMax, unit: unitProp, format, labels, className, ...rest },
  ref,
) {
  const val = Number(value) || 0;
  const hasMin = min != null;
  const hasMax = max != null;
  const lo = scaleMin != null ? scaleMin : 0;
  const hi = scaleMax != null ? scaleMax : Math.max(hasMax ? max : 0, val) * 1.25 || 1;
  const fmt = format || ((v: number) => String(v));
  const unit = unitProp ? " " + unitProp : "";
  const above = hasMax && val > max;
  const below = hasMin && val < min;
  const ok = !above && !below;
  const pct = (v: number) => Math.max(0, Math.min(100, ((v - lo) / (hi - lo || 1)) * 100));
  const a = pct(hasMin ? min : lo);
  const b = pct(hasMax ? max : hi);
  const v = pct(val);
  const word = ok ? pick(labels?.within, en.ToleranceBar.within) : pick(labels?.out, en.ToleranceBar.out);
  const excess = ok ? "" : " " + (above ? "+" + fmt(roundTo(val - max!)) : "−" + fmt(roundTo(min! - val))) + unit;
  const limit = hasMin && hasMax ? fmt(min) + "–" + fmt(max) : hasMax ? "≤ " + fmt(max) : "≥ " + fmt(min!);
  return (
    <div ref={ref} className={cls("ds-tol", !ok && "ds-tol-out", className)} {...rest}>
      <div className="ds-tol-head">
        <span className="ds-t-label ds-tol-label">{label}</span>
        <span className="ds-tol-read">
          <span className="ds-t-datum ds-tol-value">{fmt(val) + unit}</span>
          <span className="ds-t-label ds-tol-state">
            {ok ? null : <ErrorMark size={10} />}
            {/* One flex item, so the space before the excess stays. */}
            <span>
              <span className="ds-tol-word">{word}</span>
              {excess}
            </span>
          </span>
        </span>
      </div>
      <div
        className="ds-tol-track"
        role="img"
        aria-label={
          (label || pick(labels?.value, en.ToleranceBar.value)) +
          ": " +
          fmt(val) +
          unit +
          ", " +
          pick(labels?.limit, en.ToleranceBar.limit) +
          " " +
          limit +
          unit +
          ", " +
          word
        }
      >
        <span className="ds-tol-band" style={{ left: a + "%", width: b - a + "%" }} />
        <span className="ds-tol-marker" style={{ left: v + "%" }} />
      </div>
      <div className="ds-t-label ds-tol-scale" aria-hidden="true">
        <span className="ds-tol-tick ds-tol-tick-start" style={{ left: "0%" }}>
          {fmt(lo)}
        </span>
        {hasMin && a > 0 ? (
          <span className="ds-tol-tick ds-tol-lim" style={{ left: a + "%" }}>
            {fmt(min)}
          </span>
        ) : null}
        {hasMax && b < 100 ? (
          <span className="ds-tol-tick ds-tol-lim" style={{ left: b + "%" }}>
            {fmt(max)}
          </span>
        ) : null}
        <span className="ds-tol-tick ds-tol-tick-end" style={{ left: "100%" }}>
          {fmt(hi) + unit}
        </span>
      </div>
      <div className="ds-t-caption ds-tol-limit">{"Limit " + limit + unit}</div>
    </div>
  );
});
