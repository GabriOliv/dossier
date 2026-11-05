# TextField

A square text input (or textarea) with a mono label above and a hint or error below. In the error state the border becomes `stroke-rule` `contrast-error`, the label and message turn `contrast-error`, the message gets the error mark, and the input carries `aria-invalid` and `aria-describedby`.

**Consumer provides:** `label`, and as needed `name`, `type`, `value` + `onChange` or `defaultValue`, `placeholder`, `hint`, `error`, `required`, `disabled`, `multiline`, `rows`. Max width 420px.

- Do: write errors as the fix ("Write a reason before waiving a failed check."), not only the fault.
- Do: show the error after the person leaves the field or submits, not while they type.
- Don't: rely on the red border alone; the message is required whenever `error` is set.
