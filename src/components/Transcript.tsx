import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

export interface TranscriptLine {
  /** Time code, e.g. "04:12". */
  time?: string;
  speaker: string;
  /** May contain Redacted elements. */
  text: ReactNode;
  /** Speaker in signal; the line being discussed. */
  active?: boolean;
}

interface TranscriptOwnProps {
  title?: string;
  lines: TranscriptLine[];
  className?: string;
}

export type TranscriptProps = TranscriptOwnProps & NativeProps<"div", TranscriptOwnProps>;

/** Port of Dossier's Transcript: time-coded dialogue log. */
export const Transcript = forwardRef<HTMLDivElement, TranscriptProps>(function Transcript(
  { title, lines = [], className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cls("ds-transcript", className)} {...rest}>
      {title ? <div className="ds-t-heading ds-tr-title">{title}</div> : null}
      <ol className="ds-tr-lines">
        {lines.map((l, i) => (
          <li key={i} className={cls("ds-tr-line", l.active && "ds-tr-on")}>
            <span className="ds-t-label ds-tr-time">{l.time || ""}</span>
            <span className="ds-t-label ds-tr-speaker">{l.speaker}</span>
            <span className="ds-t-body ds-tr-text">{l.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
});
