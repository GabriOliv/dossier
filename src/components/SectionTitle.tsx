import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import { headingTag, type NativeProps } from "../lib/native";

interface SectionTitleOwnProps {
  /** Section number, shown as "SECTION 02" after the signal bar. */
  index?: string | number;
  title: string;
  meta?: string;
  /** Heading level of the title, 1 to 6 (default 2). */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Fixed texts, each falling back to English: `labels={ptBR.SectionTitle}`. */
  labels?: Partial<Locale["SectionTitle"]>;
  className?: string;
}

export type SectionTitleProps = SectionTitleOwnProps & NativeProps<"div", SectionTitleOwnProps>;

/** Port of Dossier's SectionTitle: signal bar and section number over an uppercase title, closed by a rule. */
export const SectionTitle = forwardRef<HTMLDivElement, SectionTitleProps>(function SectionTitle(
  { index, title, meta, level, labels, className, ...rest },
  ref,
) {
  const H = headingTag(level, "h2");
  return (
    <div ref={ref} className={cls("ds-section", className)} {...rest}>
      <div className="ds-section-top">
        <span className="ds-section-bar" aria-hidden="true" />
        {index != null ? (
          <span className="ds-t-label ds-section-index">
            {pick(labels?.section, en.SectionTitle.section) + " " + String(index)}
          </span>
        ) : null}
      </div>
      <div className="ds-section-row">
        <H className="ds-t-title ds-section-title">{title}</H>
        {meta ? <span className="ds-t-label ds-section-meta">{meta}</span> : null}
      </div>
    </div>
  );
});
