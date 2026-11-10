import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

interface QuoteOwnProps {
  /** "quote" (default): attributed quote with a hanging mark. "statement": the key message, no mark. */
  variant?: "quote" | "statement";
  /** Wrap the key part in <span className="ds-hl"> to set it in signal. */
  children: ReactNode;
  kicker?: string;
  note?: string;
  source?: string;
  code?: string;
  className?: string;
}

export type QuoteProps = QuoteOwnProps & NativeProps<"figure", QuoteOwnProps>;

/** Port of Dossier's Quote: an uppercase pull quote, or a statement with a kicker and a note. */
export const Quote = forwardRef<HTMLElement, QuoteProps>(function Quote(
  { variant, children, kicker, note, source, code, className, ...rest },
  ref,
) {
  const st = variant === "statement";
  return (
    <figure ref={ref} className={cls("ds-quote", st && "ds-statement", className)} {...rest}>
      {st && kicker ? (
        <div className="ds-t-label ds-statement-kicker">
          <span className="ds-quote-dash" aria-hidden="true" />
          <span>{kicker}</span>
        </div>
      ) : null}
      {st ? (
        <p className="ds-t-title ds-quote-text">{children}</p>
      ) : (
        <blockquote className="ds-t-title ds-quote-text">
          <span className="ds-quote-mark" aria-hidden="true">
            “
          </span>
          {children}
        </blockquote>
      )}
      {st && note ? <p className="ds-t-body ds-statement-note">{note}</p> : null}
      {source || code ? (
        <figcaption className="ds-t-label ds-quote-source">
          <span className="ds-quote-dash" aria-hidden="true" />
          <span>{source}</span>
          {code ? <span className="ds-quote-code">{code}</span> : null}
        </figcaption>
      ) : null}
    </figure>
  );
});
