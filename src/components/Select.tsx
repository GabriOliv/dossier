import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { useFieldIds } from "../lib/field";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { FieldMessage } from "./FieldMessage";

/** One option of a Select. */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectOwnProps {
  label: string;
  /** One `<option>` per item. */
  options: SelectOption[];
  /** A first, empty and disabled option, selected while there is no `value` or `defaultValue`. */
  placeholder?: string;
  /** Help text under the field when there is no error. */
  hint?: string;
  /** Error message: turns the border and label contrast-error and sets aria-invalid. Say what to do, not only what is wrong. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Fixed texts, each falling back to English: `labels={ptBR.Select}`. */
  labels?: Partial<Locale["Select"]>;
  /** Goes on the outer div; the ref and every native attribute (`value`, `defaultValue`, `onChange`, `name`…) go on the select. */
  className?: string;
}

export type SelectProps = SelectOwnProps & NativeProps<"select", SelectOwnProps>;

/** A square native select with its label, hint and error state and an arrow drawn in CSS. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, placeholder, hint, error, required, disabled, labels, className, id: ownId, ...rest },
  ref,
) {
  const { id, msgId } = useFieldIds(ownId);
  const invalid = !!error;
  // With a placeholder and no value of the consumer's, the empty option starts selected.
  const start = placeholder && rest.value === undefined && rest.defaultValue === undefined ? { defaultValue: "" } : {};
  return (
    <div className={cls("ds-fc", invalid && "ds-tf-invalid", className)}>
      <label className="ds-t-label ds-tf-label" htmlFor={id}>
        {label}
        {required ? <span className="ds-tf-req">{" · " + pick(labels?.required, en.Select.required)}</span> : null}
      </label>
      <span className="ds-select-box">
        <select
          id={id}
          className="ds-t-body ds-tf-input ds-select-input"
          required={required}
          disabled={disabled}
          aria-invalid={invalid ? "true" : undefined}
          aria-describedby={invalid || hint ? msgId : undefined}
          {...start}
          {...rest}
          ref={ref}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <svg className="ds-select-arrow" viewBox="0 0 10 6" width="10" height="6" aria-hidden="true">
          <path d="M0 0H10L5 6Z" />
        </svg>
      </span>
      <FieldMessage id={msgId} error={error} hint={hint} />
    </div>
  );
});
