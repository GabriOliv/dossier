import { forwardRef, type ReactNode } from "react";
import { ErrorMark } from "./ErrorMark";
import { StatusFlag } from "./StatusFlag";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

interface AssertionOwnProps {
  /** What is being checked, e.g. "CHK-114 · status code". */
  label?: string;
  expected: ReactNode;
  actual: ReactNode;
  /** Overrides the result; by default it passes when expected and actual are equal as strings. */
  pass?: boolean;
  /** Where the assertion lives, e.g. "checkout.spec.ts:88". */
  location?: string;
  /** Fixed texts, each falling back to English: `labels={ptBR.Assertion}`. */
  labels?: Partial<Locale["Assertion"]>;
  className?: string;
}

export type AssertionProps = AssertionOwnProps & NativeProps<"div", AssertionOwnProps>;

/** Port of Dossier's Assertion: expected vs actual for one check. */
export const Assertion = forwardRef<HTMLDivElement, AssertionProps>(function Assertion(
  { label, expected, actual, pass: passProp, location, labels, className, ...rest },
  ref,
) {
  const pass = passProp != null ? !!passProp : String(expected) === String(actual);
  return (
    <div ref={ref} className={cls("ds-assert", !pass && "ds-assert-fail", className)} {...rest}>
      <div className="ds-assert-head">
        <span className="ds-t-label ds-assert-label">{label || pick(labels?.label, en.Assertion.label)}</span>
        {/* The flag reads its pass and fail words from the same labels. */}
        <StatusFlag status={pass ? "pass" : "fail"} labels={labels} />
      </div>
      <dl className="ds-assert-rows">
        <div className="ds-assert-row">
          <dt className="ds-t-label">{pick(labels?.expected, en.Assertion.expected)}</dt>
          <dd className="ds-t-datum">{expected}</dd>
        </div>
        <div className="ds-assert-row ds-assert-actual">
          <dt className="ds-t-label">{pick(labels?.actual, en.Assertion.actual)}</dt>
          <dd className="ds-t-datum">
            {pass ? null : <ErrorMark size={12} />}
            <span>{actual}</span>
          </dd>
        </div>
      </dl>
      {location ? <div className="ds-t-caption ds-assert-loc">{location}</div> : null}
    </div>
  );
});
