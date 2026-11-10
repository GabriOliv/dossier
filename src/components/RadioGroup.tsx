import { forwardRef, type ChangeEvent } from "react";
import { cls } from "../lib/cls";
import { useFieldIds } from "../lib/field";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { FieldMessage } from "./FieldMessage";

/** One radio of a RadioGroup. */
export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioGroupOwnProps {
  /** The legend of the group. */
  label: string;
  /** One radio per option, in a vertical list. */
  options: RadioOption[];
  /** The `name` all the radios share; generated when missing. */
  name?: string;
  /** Controlled value (pair with onChange) or defaultValue for uncontrolled: the `value` of the chosen option. */
  value?: string;
  defaultValue?: string;
  /** Called with the change event of the radio picked: `e.target.value` is the `value` of its option. */
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
  /** Help text under the group when there is no error. */
  hint?: string;
  /** Error message: turns the radios and legend contrast-error and sets aria-invalid. Say what to do, not only what is wrong. */
  error?: string;
  required?: boolean;
  /** Fixed texts, each falling back to English: `labels={ptBR.RadioGroup}`. */
  labels?: Partial<Locale["RadioGroup"]>;
  /** Goes on the fieldset; the ref and every native attribute (`disabled`, `id`…) go there too. */
  className?: string;
}

export type RadioGroupProps = RadioGroupOwnProps & NativeProps<"fieldset", RadioGroupOwnProps>;

/** A group of exclusive options with a legend, hint and error state, on native `<input type="radio">` in a `<fieldset>`. */
export const RadioGroup = forwardRef<HTMLFieldSetElement, RadioGroupProps>(function RadioGroup(
  { label, options, name, value, defaultValue, onChange, hint, error, required, labels, className, ...rest },
  ref,
) {
  const { id, msgId } = useFieldIds(rest.id);
  const invalid = !!error;
  const checked =
    value !== undefined
      ? (v: string) => ({ checked: v === value })
      : defaultValue !== undefined
        ? (v: string) => ({ defaultChecked: v === defaultValue })
        : () => ({});
  return (
    <fieldset
      id={id}
      className={cls("ds-fc ds-radios", invalid && "ds-tf-invalid", className)}
      aria-describedby={invalid || hint ? msgId : undefined}
      {...rest}
      ref={ref}
    >
      <legend className="ds-t-label ds-tf-label ds-fc-legend">
        {label}
        {required ? <span className="ds-tf-req">{" · " + pick(labels?.required, en.RadioGroup.required)}</span> : null}
      </legend>
      {options.map((o) => (
        <label key={o.value} className={cls("ds-fc-row", (o.disabled || rest.disabled) && "ds-fc-off")}>
          <span className="ds-fc-ctl">
            <input
              type="radio"
              className="ds-fc-input ds-fc-radio"
              name={name ?? id}
              value={o.value}
              required={required}
              disabled={o.disabled}
              aria-invalid={invalid ? "true" : undefined}
              onChange={onChange}
              {...checked(o.value)}
            />
            <span className="ds-fc-pip" aria-hidden="true" />
          </span>
          <span className="ds-t-body ds-fc-text">{o.label}</span>
        </label>
      ))}
      <FieldMessage id={msgId} error={error} hint={hint} />
    </fieldset>
  );
});
