import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

interface RedactedOwnProps {
  /** Approximate character count to cover (2–40, default 8). Never pass the hidden text. */
  length?: number;
  /** The accessible name, falling back to English: `labels={ptBR.Redacted}`. */
  labels?: Partial<Locale["Redacted"]>;
  className?: string;
}

export type RedactedProps = RedactedOwnProps & NativeProps<"span", RedactedOwnProps>;

/** Port of Dossier's Redacted: an inline black bar. Takes a length, never the hidden text. */
export const Redacted = forwardRef<HTMLSpanElement, RedactedProps>(function Redacted(
  { length, labels, className, style, ...rest },
  ref,
) {
  const n = Math.max(2, Math.min(40, length || 8));
  return (
    <span
      ref={ref}
      className={cls("ds-redact", className)}
      role="img"
      aria-label={pick(labels?.name, en.Redacted.name)}
      style={{ width: n * 0.6 + "em", ...style }}
      {...rest}
    />
  );
});
