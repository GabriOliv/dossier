import { forwardRef } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

export interface TimelineEvent {
  /** Position on the axis: "Cycle 10", "2026", "T+04:00". */
  at: string;
  label: string;
  note?: string;
  /** Signal marker; one per timeline. */
  active?: boolean;
}

interface TimelineOwnProps {
  /** Events in order, spaced evenly. 3–6 reads best. */
  events: TimelineEvent[];
  className?: string;
}

export type TimelineProps = TimelineOwnProps & NativeProps<"ol", TimelineOwnProps>;

/** Port of Dossier's Timeline: evenly spaced events on one axis ending in a pointer. */
export const Timeline = forwardRef<HTMLOListElement, TimelineProps>(function Timeline(
  { events, className, ...rest },
  ref,
) {
  return (
    <ol ref={ref} className={cls("ds-timeline", className)} {...rest}>
      {(events || []).map((e, i) => (
        <li key={i} className={cls("ds-tl-item", e.active && "ds-tl-on")}>
          <span className="ds-t-label ds-tl-at">{e.at}</span>
          <span className="ds-tl-axis" aria-hidden="true">
            <span className="ds-tl-mark" />
          </span>
          <span className="ds-t-body ds-tl-label">{e.label}</span>
          {e.note ? <span className="ds-t-caption ds-tl-note">{e.note}</span> : null}
        </li>
      ))}
    </ol>
  );
});
