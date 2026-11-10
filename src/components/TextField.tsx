import { forwardRef, type ChangeEvent, type Ref } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import { useStableId } from "../lib/useStableId";
import { ErrorMark } from "./ErrorMark";

interface TextFieldOwnProps {
  label: string;
  name?: string;
  type?: string;
  /** Controlled value (pair with onChange) or defaultValue for uncontrolled. */
  value?: string;
  defaultValue?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  /** Help text under the field when there is no error. */
  hint?: string;
  /** Error message: turns the border and label contrast-error and sets aria-invalid. Say what to do, not only what is wrong. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Renders a textarea. */
  multiline?: boolean;
  rows?: number;
  /** Fixed texts, each falling back to English: `labels={ptBR.TextField}`. */
  labels?: Partial<Locale["TextField"]>;
  /** Goes on the outer div; the ref and every native attribute go on the input or textarea. */
  className?: string;
}

export type TextFieldProps = TextFieldOwnProps & NativeProps<"input", TextFieldOwnProps>;

/** Port of Dossier's TextField: a square text input with label, hint and error state. */
export const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(function TextField(
  {
    label,
    name,
    type,
    value,
    defaultValue,
    onChange,
    placeholder,
    hint,
    error,
    required,
    disabled,
    multiline,
    rows,
    labels,
    className,
    ...rest
  },
  ref,
) {
  const auto = useStableId("ds-tf-");
  const id = rest.id ?? auto;
  const msgId = id + "-msg";
  const invalid = !!error;
  const shared = {
    id,
    className: "ds-t-body ds-tf-input",
    name,
    placeholder,
    required,
    disabled,
    "aria-invalid": invalid ? ("true" as const) : undefined,
    "aria-describedby": invalid || hint ? msgId : undefined,
    onChange,
    ...(value !== undefined ? { value } : defaultValue !== undefined ? { defaultValue } : {}),
  };
  return (
    <div className={cls("ds-textfield", invalid && "ds-tf-invalid", className)}>
      <label className="ds-t-label ds-tf-label" htmlFor={id}>
        {label}
        {required ? <span className="ds-tf-req">{" · " + pick(labels?.required, en.TextField.required)}</span> : null}
      </label>
      {multiline ? (
        <textarea
          {...shared}
          rows={rows || 3}
          {...(rest as NativeProps<"textarea", TextFieldOwnProps>)}
          ref={ref as Ref<HTMLTextAreaElement>}
        />
      ) : (
        <input {...shared} type={type || "text"} {...rest} ref={ref as Ref<HTMLInputElement>} />
      )}
      {invalid ? (
        <div id={msgId} className="ds-t-caption ds-tf-msg ds-tf-error">
          <ErrorMark size={12} />
          <span>{error}</span>
        </div>
      ) : hint ? (
        <div id={msgId} className="ds-t-caption ds-tf-msg">
          {hint}
        </div>
      ) : null}
    </div>
  );
});
