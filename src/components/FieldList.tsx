import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

export interface Field {
  label: string;
  value: ReactNode;
  mono?: boolean;
  /** Value in signal; one per list. */
  active?: boolean;
}

interface FieldListOwnProps {
  fields: Field[];
  variant?: "record" | "definition";
  columns?: 1 | 2;
  className?: string;
}

export type FieldListProps = FieldListOwnProps & NativeProps<"dl", FieldListOwnProps>;

/** Port of Dossier's FieldList: label/value record rows, or a term/description glossary. */
export const FieldList = forwardRef<HTMLDListElement, FieldListProps>(function FieldList(
  { fields, variant, columns, className, ...rest },
  ref,
) {
  const def = variant === "definition";
  return (
    <dl
      ref={ref}
      className={cls("ds-fields", def && "ds-fields-def", !def && columns === 2 && "ds-fields-2", className)}
      {...rest}
    >
      {fields.map((f, i) => (
        <div key={i} className="ds-field">
          {def ? (
            <dt className="ds-t-body ds-field-term">{f.label}</dt>
          ) : (
            <dt className="ds-t-label ds-field-label">{f.label}</dt>
          )}
          <dd className={cls(f.mono ? "ds-t-datum" : "ds-t-body", "ds-field-value", f.active && "ds-field-on")}>
            {f.value}
          </dd>
        </div>
      ))}
    </dl>
  );
});
