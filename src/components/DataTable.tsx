import type { ReactNode } from "react";
import { cls, up } from "../lib/cls";

export interface DataTableColumn {
  key: string;
  label: string;
  /** Mono, tabular, right-aligned. */
  numeric?: boolean;
}

export interface DataTableProps {
  caption?: string;
  columns: DataTableColumn[];
  rows: Array<Record<string, ReactNode>>;
  /** Row indexes to mark with signal-tint and the heavy index bar. One or two at most. */
  highlightRows?: number[];
  className?: string;
}

/** Port of Dossier's DataTable: ruled table; numeric columns in mono, right-aligned. */
export function DataTable({ caption, columns, rows, highlightRows, className }: DataTableProps) {
  const cols = columns || [];
  const hl = highlightRows || [];
  return (
    <table className={cls("ds-table", className)}>
      {caption ? <caption className="ds-t-heading ds-table-caption">{up(caption)}</caption> : null}
      <thead>
        <tr>
          {cols.map((c) => (
            <th key={c.key} scope="col" className={cls("ds-t-label", c.numeric && "ds-num")}>
              {up(c.label)}
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
}
