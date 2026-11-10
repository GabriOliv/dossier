import { createElement } from "react";

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
  Assertion: { label: "CHK-114 · status", expected: "200 OK", actual: "500", location: "checkout.spec.ts:88" },
  BarChart: {
    title: "Units",
    max: 600,
    data: [
      { label: "North", value: 412 },
      { label: "Core", value: 506, active: true },
    ],
  },
  Comparison: {
    columns: [
      { code: "A", title: "Impact", lead: "High when:", items: ["One", "Two"], active: true },
      { title: "Effort" },
    ],
  },
  Connector: { width: 96, height: 32, from: "top-left", first: "vertical", active: true },
  Contents: { items: [{ title: "Scope", description: "Objectives.", page: 4, active: true }, { title: "Proposal" }] },
  Dimension: { length: 120, label: "120 px", active: true },
  ErrorNotice: {
    title: "Release blocked",
    code: "Run 0427",
    meta: "UTC",
    action: "Rerun",
    items: ["CHK-114"],
    children: "Fix first.",
  },
  LineChart: {
    title: "Adoption",
    unit: "%",
    data: [
      { x: "Jun", y: 30, callout: true },
      { x: "Jul", y: 44 },
      { x: "Aug", y: 58, active: true },
    ],
  },
  Meter: { label: "Signal", value: 7, max: 10, tone: "signal" },
  ProportionDial: {
    value: 90,
    label: "Deep learning",
    title: "Models",
    segments: [{ angle: -25, label: "Forecasting" }],
  },
  Redacted: { length: 8 },
  TextField: { label: "Approver", defaultValue: "Release manager", hint: "Who signs off." },
  Timeline: {
    events: [
      { at: "Cycle 1", label: "Survey", note: "Logged" },
      { at: "Cycle 10", label: "Relay", active: true },
    ],
  },
  ToleranceBar: { label: "p95 latency", value: 1.84, max: 1.2, scaleMax: 2.4, unit: "s" },
  Transcript: { title: "Log 07", lines: [{ time: "04:12", speaker: "Control", text: "Confirm.", active: true }] },
  Button: { variant: "solid", children: "Salvar" },
  IconButton: { label: "Fechar", children: "x" },
  Link: { href: "/docs", children: "Docs" },
  Checkbox: { label: "Aceito", hint: "You can change it later." },
  Switch: { label: "Notificações", defaultChecked: true },
  RadioGroup: {
    label: "Plano",
    defaultValue: "pro",
    options: [
      { value: "free", label: "Free" },
      { value: "pro", label: "Pro" },
    ],
  },
  Select: {
    label: "País",
    placeholder: "Escolha",
    options: [
      { value: "br", label: "Brasil" },
      { value: "pt", label: "Portugal" },
    ],
  },
  Dialog: { open: true, onClose: () => {}, title: "Excluir arquivo", description: "Sem volta.", children: "Texto" },
  Popover: { trigger: createElement("button", null, "Filtros"), children: "Painel" },
  Tooltip: { content: "Copiar", children: createElement("button", null, "C") },
  Menu: { trigger: createElement("button", null, "Ações"), items: [{ label: "Editar", onSelect: () => {} }] },
  Tabs: {
    tabs: [
      { value: "a", label: "Resumo", content: "Painel um" },
      { value: "b", label: "Checks", content: "Painel dois" },
    ],
  },
  Accordion: { items: [{ title: "Envio", content: "Em dois dias.", defaultOpen: true }], exclusive: true },
  Pagination: { page: 5, total: 20, href: (n) => `?page=${n}` },
  Icon: { name: "check", label: "Concluído" },
  Spinner: {},
  Skeleton: { variant: "block", height: 48 },
  Stack: {
    direction: "row",
    gap: 2,
    children: [createElement("span", { key: "a" }, "A"), createElement("span", { key: "b" }, "B")],
  },
  Grid: { columns: 2, children: [createElement("span", { key: "a" }, "A"), createElement("span", { key: "b" }, "B")] },
  Divider: { weight: "rule" },
  Toaster: {},
};
