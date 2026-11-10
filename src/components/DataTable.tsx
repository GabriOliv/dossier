import { forwardRef, type ReactNode } from "react";
import { cls } from "../lib/cls";
import type { NativeProps } from "../lib/native";

export interface DataTableColumn {
  key: string;
  label: string;
  /** Mono, tabular, right-aligned. */
  numeric?: boolean;
}

interface DataTableOwnProps {
  caption?: string;
  columns: DataTableColumn[];
  rows: Array<Record<string, ReactNode>>;
  /** Row indexes to mark with signal-tint and the heavy index bar. One or two at most. */
  highlightRows?: number[];
  className?: string;
}

export type DataTableProps = DataTableOwnProps & NativeProps<"table", DataTableOwnProps>;

/** Port of Dossier's DataTable: ruled table; numeric columns in mono, right-aligned. */
export const DataTable = forwardRef<HTMLTableElement, DataTableProps>(function DataTable(
  { caption, columns, rows, highlightRows, className, ...rest },
  ref,
) {
  const cols = columns || [];
  const hl = highlightRows || [];
  return (
    <table ref={ref} className={cls("ds-table", className)} {...rest}>
      {caption ? <caption className="ds-t-heading ds-table-caption">{caption}</caption> : null}
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.key} scope="col" className={cls("ds-t-label", c.numeric && "ds-num")}>
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {(rows || []).map((r, i) => (
          <tr key={i} className={hl.indexOf(i) >= 0 ? "ds-row-hl" : undefined}>
            {cols.map((c) => (
              <td key={c.key} className={c.numeric ? "ds-t-datum ds-num" : "ds-t-body"}>
                {r[c.key]}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
});
