import { forwardRef } from "react";
import { StatusFlag, type CheckResult } from "./StatusFlag";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

export interface Check {
  id?: string;
  label: string;
  result: CheckResult;
  detail?: string;
  duration?: string;
}

interface CheckLogOwnProps {
  title?: string;
  checks: Check[];
  /** The title and the four result words, each falling back to English: `labels={ptBR.CheckLog}`. */
  labels?: Partial<Locale["CheckLog"]>;
  className?: string;
}

export type CheckLogProps = CheckLogOwnProps & NativeProps<"div", CheckLogOwnProps>;

const ORDER: CheckResult[] = ["pass", "fail", "skip", "pending"];

/** Port of Dossier's CheckLog: a list of checks with results and a pass/fail summary. */
export const CheckLog = forwardRef<HTMLDivElement, CheckLogProps>(function CheckLog(
  { title, checks, labels, className, ...rest },
  ref,
) {
  const word = (k: CheckResult) => pick(labels?.[k], en.CheckLog[k]);
  // The rows show the same words as the summary.
  const flags = labels && { pass: word("pass"), fail: word("fail"), skip: word("skip"), pending: word("pending") };
  const n: Record<CheckResult, number> = { pass: 0, fail: 0, skip: 0, pending: 0 };
  for (const c of checks) if (n[c.result] != null) n[c.result]++;
  const sum = ORDER.filter((k) => n[k]).flatMap((k, i) => [
    ...(i
      ? [
          <span key={"sep" + k} aria-hidden="true">
            {" · "}
          </span>,
        ]
      : []),
    <span key={k} className={k === "fail" ? "ds-log-sum-fail" : undefined}>
      {n[k] + " " + word(k)}
    </span>,
  ]);
  return (
    <div ref={ref} className={cls("ds-checklog", className)} {...rest}>
      <div className="ds-log-head">
        <span className="ds-t-heading ds-log-title">{title || pick(labels?.title, en.CheckLog.title)}</span>
        <span className="ds-t-label ds-log-sum">{sum}</span>
      </div>
      <ol className="ds-log-rows">
        {checks.map((c, i) => (
          <li key={i} className={cls("ds-log-row", c.result === "fail" && "ds-log-fail")}>
            <span className="ds-t-label ds-log-id">{c.id || ""}</span>
            <span className="ds-t-body ds-log-label">{c.label}</span>
            <span className="ds-t-caption ds-log-detail">{c.detail || ""}</span>
            <span className="ds-t-datum ds-log-time">{c.duration || ""}</span>
            <span className="ds-log-flag">
              <StatusFlag status={c.result} labels={flags} />
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
});
