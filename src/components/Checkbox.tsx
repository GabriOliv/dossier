import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { useFieldIds } from "../lib/field";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { FieldMessage } from "./FieldMessage";

interface CheckboxOwnProps {
  /** The text beside the box; clicking it toggles the box. */
  label: string;
  /** Help text under the box when there is no error. */
  hint?: string;
  /** Error message: turns the box and label contrast-error and sets aria-invalid. Say what to do, not only what is wrong. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Fixed texts, each falling back to English: `labels={ptBR.Checkbox}`. */
  labels?: Partial<Locale["Checkbox"]>;
  /** Goes on the outer div; the ref and every native attribute (`checked`, `onChange`, `name`…) go on the input. */
  className?: string;
}

export type CheckboxProps = CheckboxOwnProps & Omit<NativeProps<"input", CheckboxOwnProps>, "type">;

/** A square checkbox with its label, hint and error state, on a native `<input type="checkbox">`. */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, hint, error, required, disabled, labels, className, id: ownId, ...rest },
  ref,
) {
  const { id, msgId } = useFieldIds(ownId);
  const invalid = !!error;
  return (
    <div className={cls("ds-fc", invalid && "ds-tf-invalid", className)}>
      <label className={cls("ds-fc-row", disabled && "ds-fc-off")}>
        <span className="ds-fc-ctl">
          <input
            id={id}
            className="ds-fc-input ds-fc-box"
            required={required}
            disabled={disabled}
            aria-invalid={invalid ? "true" : undefined}
            aria-describedby={invalid || hint ? msgId : undefined}
            {...rest}
            type="checkbox"
            ref={ref}
          />
          <span className="ds-fc-tick" aria-hidden="true" />
        </span>
        <span className="ds-t-body ds-fc-text">
          {label}
          {required ? <span className="ds-tf-req">{" · " + pick(labels?.required, en.Checkbox.required)}</span> : null}
        </span>
      </label>
      <FieldMessage id={msgId} error={error} hint={hint} />
    </div>
  );
});
