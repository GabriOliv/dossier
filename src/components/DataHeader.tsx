import { cls, up } from "../lib/cls";

export interface DataHeaderProps {
  /** "band" (default): the page-opening title band. "running": the slim header repeated on later pages. */
  variant?: "band" | "running";
  title: string;
  /** File code, right side of the band, e.g. "FILE 0427 · REV B". */
  code?: string;
  kicker?: string;
  meta?: string;
  className?: string;
}

/** Port of Dossier's DataHeader: inverse band with title and file code, then a meta row closed by a rule. */
export function DataHeader({ variant, title, code, kicker, meta, className }: DataHeaderProps) {
  if (variant === "running") {
    return (
      <header className={cls("ds-running", className)}>
        <span className="ds-index" aria-hidden="true" />
        <span className="ds-t-label ds-running-title">{up(title)}</span>
        {code ? <span className="ds-t-label ds-running-code">{up(code)}</span> : null}
        <span className="ds-spacer" />
        {kicker ? <span className="ds-t-label ds-running-kicker">{up(kicker)}</span> : null}
        {meta ? <span className="ds-t-label ds-running-meta">{up(meta)}</span> : null}
      </header>
    );
  }
  return (
    <header className={cls("ds-header", className)}>
      <div className="ds-header-band">
        <h1 className="ds-t-display ds-header-title">{up(title)}</h1>
        {code ? <span className="ds-t-label ds-header-code">{up(code)}</span> : null}
      </div>
      {kicker || meta ? (
        <div className="ds-header-meta">
          <span className="ds-index" aria-hidden="true" />
          {kicker ? <span className="ds-t-label ds-header-kicker">{up(kicker)}</span> : null}
          <span className="ds-spacer" />
          {meta ? <span className="ds-t-label ds-header-metatext">{up(meta)}</span> : null}
        </div>
      ) : null}
    </header>
  );
}
