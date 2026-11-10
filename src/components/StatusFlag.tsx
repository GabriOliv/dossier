import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

export type CheckResult = "pass" | "fail" | "skip" | "pending";

interface StatusFlagOwnProps {
  status: CheckResult;
  /** Overrides the word (default Pass, Fail, Skipped, Pending), shown uppercase by CSS. */
  children?: ReactNode;
  /** The four words, each falling back to English: `labels={ptBR.StatusFlag}`. */
  labels?: Partial<Locale["StatusFlag"]>;
  className?: string;
}

export type StatusFlagProps = StatusFlagOwnProps & NativeProps<"span", StatusFlagOwnProps>;

/** Port of Dossier's StatusFlag: pass / fail / skipped / pending, with a mark and a word. */
export const StatusFlag = forwardRef<HTMLSpanElement, StatusFlagProps>(function StatusFlag(
  { status, children, labels, className, ...rest },
  ref,
) {
  const st: CheckResult = status in en.StatusFlag ? status : "pending";
  return (
    <span ref={ref} className={cls("ds-t-label", "ds-flag", "ds-flag-" + st, className)} {...rest}>
      {st === "fail" ? (
        <svg className="ds-flag-x" viewBox="0 0 8 8" width={8} height={8} aria-hidden="true">
          <path d="M1 1 L7 7 M7 1 L1 7" />
        </svg>
      ) : (
        <span className="ds-flag-dot" aria-hidden="true" />
      )}
      {children || pick(labels?.[st], en.StatusFlag[st])}
    </span>
  );
});
