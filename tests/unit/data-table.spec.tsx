import { expect, test } from "@playwright/test";
import { DataTable, type DataTableProps } from "../../src/components/DataTable";
import { render, renderOriginal } from "./oracle";

/** source/components/DataTable/preview.html */
const preview: DataTableProps = {
  caption: "Sector index",
  highlightRows: [1],
  columns: [
    { key: "sector", label: "Sector" },
    { key: "code", label: "Code", numeric: true },
    { key: "units", label: "Units", numeric: true },
    { key: "share", label: "Share", numeric: true },
  ],
  rows: [
    { sector: "Northern relay", code: "N-01", units: "412", share: "34.2%" },
    { sector: "Central core", code: "C-00", units: "506", share: "42.0%" },
    { sector: "Eastern array", code: "E-07", units: "198", share: "16.4%" },
    { sector: "Outpost", code: "X-12", units: "88", share: "7.3%" },
  ],
};

const cases: [string, DataTableProps][] = [
  ["preview", preview],
  ["no caption, no highlight, className", { columns: preview.columns, rows: preview.rows.slice(0, 2), className: "x" }],
  [
    "two highlighted rows and a node cell",
    {
      ...preview,
      highlightRows: [0, 3],
      rows: [...preview.rows.slice(0, 3), { sector: <b>Outpost</b>, code: "X-12" }],
    },
  ],
  ["no rows", { columns: preview.columns, rows: [] }],
];

for (const [name, props] of cases) {
  test(`DATA-01 DataTable port matches Dossier: ${name}`, () => {
    expect(render(<DataTable {...props} />)).toBe(renderOriginal("DataTable", props));
  });
}
