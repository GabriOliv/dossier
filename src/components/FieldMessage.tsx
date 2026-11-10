import { ErrorMark } from "./ErrorMark";

/** The line under a form control: the error when there is one, else the hint, else nothing. Same look as TextField's. */
export function FieldMessage({ id, error, hint }: { id: string; error?: string; hint?: string }) {
  if (error)
    return (
      <div id={id} className="ds-t-caption ds-tf-msg ds-tf-error">
        <ErrorMark size={12} />
        <span>{error}</span>
      </div>
    );
  return hint ? (
    <div id={id} className="ds-t-caption ds-tf-msg">
      {hint}
    </div>
  ) : null;
}
