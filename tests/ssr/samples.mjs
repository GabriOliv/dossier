// Props for every public export, used by the SSR test. A new export without an entry here fails the test.
export const samples = {
  DataHeader: { title: "Run 0427", code: "File 0427 · Rev B", kicker: "Section 01", meta: "Suite 3/3 pass" },
  SectionTitle: { index: "02", title: "Findings", meta: "Pages 03–05" },
  Readout: { label: "Pass rate", value: "98.6", unit: "%", trend: "up", delta: "+1.2 vs last run", tone: "signal" },
  Tag: { variant: "solid", children: "Live" },
  DataTable: {
    caption: "Sector index",
    highlightRows: [1],
    columns: [
      { key: "sector", label: "Sector" },
      { key: "units", label: "Units", numeric: true },
    ],
    rows: [
      { sector: "Northern relay", units: "412" },
      { sector: "Central core", units: "506" },
    ],
  },
  FieldList: {
    fields: [
      { label: "Sector", value: "North" },
      { label: "Code", value: "N-01", mono: true, active: true },
    ],
  },
  Schematic: {
    rings: 3,
    nodes: [
      { ring: 1, angle: -30, label: "core", active: true },
      { ring: 3, angle: 120, label: "edge" },
    ],
  },
  Hierarchy: { root: { label: "Root", code: "R-0", children: [{ label: "Leaf", active: true }, { label: "Leaf 2" }] } },
  Quote: { children: "Quality is a habit.", source: "Field report", code: "FILE 0427" },
  Footnotes: { notes: [{ text: "First note." }, { id: "B", text: "Second note." }] },
  StatusFlag: { status: "fail" },
  CheckLog: {
    title: "Smoke",
    checks: [
      { id: "C-1", label: "Loads", result: "pass", duration: "1.2s" },
      { id: "C-2", label: "Saves", result: "fail", detail: "500" },
    ],
  },
  StageIcon: { stage: "D", size: "lg" },
};
