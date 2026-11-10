import { forwardRef, type ReactNode } from "react";
import { ErrorMark } from "./ErrorMark";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import { headingTag, type NativeProps } from "../lib/native";

interface ErrorNoticeOwnProps {
  /** One line: what failed and what it blocks. Uppercased. */
  title: string;
  /** Error or run code, shown as "ERROR · <code>" in contrast-error. */
  code?: string;
  /** Right-aligned metadata, e.g. a timestamp. */
  meta?: string;
  /** One or two sentences of explanation. */
  children?: ReactNode;
  /** Specific failures, one line each. */
  items?: ReactNode[];
  /** The next step, after a triangle pointer. */
  action?: string;
  /** true: role="alert", so screen readers announce it on render. Only for errors that appear after a user action. */
  live?: boolean;
  /** Heading level of the title, 1 to 6 (default 3). */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Fixed texts, each falling back to English: `labels={ptBR.ErrorNotice}`. */
  labels?: Partial<Locale["ErrorNotice"]>;
  className?: string;
}

export type ErrorNoticeProps = ErrorNoticeOwnProps & NativeProps<"section", ErrorNoticeOwnProps>;

/** Port of Dossier's ErrorNotice: a blocking error at the top of a page or module. */
export const ErrorNotice = forwardRef<HTMLElement, ErrorNoticeProps>(function ErrorNotice(
  { title, code, meta, children, items, action, live, level, labels, className, ...rest },
  ref,
) {
  const H = headingTag(level, "h3");
  const error = pick(labels?.error, en.ErrorNotice.error);
  return (
    <section
      ref={ref}
      className={cls("ds-errnote", className)}
      role={live ? "alert" : undefined}
      aria-label={error}
      {...rest}
    >
      <div className="ds-errnote-head">
        <ErrorMark size={16} />
        <span className="ds-t-label ds-errnote-code">{error + (code ? " · " + code : "")}</span>
        {meta ? <span className="ds-t-label ds-errnote-meta">{meta}</span> : null}
      </div>
      <H className="ds-t-heading ds-errnote-title">{title}</H>
      {children ? <div className="ds-t-body ds-errnote-body">{children}</div> : null}
      {items && items.length ? (
        <ul className="ds-errnote-list">
          {items.map((t, i) => (
            <li key={i} className="ds-t-body ds-errnote-item">
              {t}
            </li>
          ))}
        </ul>
      ) : null}
      {action ? (
        <div className="ds-t-label ds-errnote-action">
          <svg className="ds-pointer" viewBox="0 0 10 10" width={8} height={8} aria-hidden="true">
            <polygon points="1,1 9,5 1,9" />
          </svg>
          <span>{action}</span>
        </div>
      ) : null}
    </section>
  );
});
