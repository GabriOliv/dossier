import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

export interface Footnote {
  /** Defaults to 01, 02, … */
  id?: string;
  text: ReactNode;
}

interface FootnotesOwnProps {
  notes: Footnote[];
  className?: string;
}

export type FootnotesProps = FootnotesOwnProps & NativeProps<"ol", FootnotesOwnProps>;

/** Port of Dossier's Footnotes: numbered notes under a short rule. */
export const Footnotes = forwardRef<HTMLOListElement, FootnotesProps>(function Footnotes(
  { notes, className, ...rest },
  ref,
) {
  return (
    <ol ref={ref} className={cls("ds-notes", className)} {...rest}>
      {notes.map((n, i) => (
        <li key={i} className="ds-note">
          <span className="ds-t-label ds-note-id">{n.id != null ? String(n.id) : (i < 9 ? "0" : "") + (i + 1)}</span>
          <span className="ds-t-caption ds-note-text">{n.text}</span>
        </li>
      ))}
    </ol>
  );
});
