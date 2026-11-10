import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { headingTag, type NativeProps } from "../lib/native";

interface DataHeaderOwnProps {
  /** "band" (default): the page-opening title band. "running": the slim header repeated on later pages. */
  variant?: "band" | "running";
  title: string;
  /** File code, right side of the band, e.g. "FILE 0427 · REV B". */
  code?: string;
  kicker?: string;
  meta?: string;
  /** Heading level of the band title, 1 to 6 (default 1). The running variant has no heading. */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
}

export type DataHeaderProps = DataHeaderOwnProps & NativeProps<"header", DataHeaderOwnProps>;

/** Port of Dossier's DataHeader: inverse band with title and file code, then a meta row closed by a rule. */
export const DataHeader = forwardRef<HTMLElement, DataHeaderProps>(function DataHeader(
  { variant, title, code, kicker, meta, level, className, ...rest },
  ref,
) {
  if (variant === "running") {
    return (
      <header ref={ref} className={cls("ds-running", className)} {...rest}>
        <span className="ds-index" aria-hidden="true" />
        <span className="ds-t-label ds-running-title">{title}</span>
        {code ? <span className="ds-t-label ds-running-code">{code}</span> : null}
        <span className="ds-spacer" />
        {kicker ? <span className="ds-t-label ds-running-kicker">{kicker}</span> : null}
        {meta ? <span className="ds-t-label ds-running-meta">{meta}</span> : null}
      </header>
    );
  }
  const H = headingTag(level, "h1");
  return (
    <header ref={ref} className={cls("ds-header", className)} {...rest}>
      <div className="ds-header-band">
        <H className="ds-t-display ds-header-title">{title}</H>
        {code ? <span className="ds-t-label ds-header-code">{code}</span> : null}
      </div>
      {kicker || meta ? (
        <div className="ds-header-meta">
          <span className="ds-index" aria-hidden="true" />
          {kicker ? <span className="ds-t-label ds-header-kicker">{kicker}</span> : null}
          <span className="ds-spacer" />
          {meta ? <span className="ds-t-label ds-header-metatext">{meta}</span> : null}
        </div>
      ) : null}
    </header>
  );
});
