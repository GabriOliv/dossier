// The F1 slice, the same file in fixtures/vite and fixtures/docusaurus (tests/consumer checks they match).
// Each component sits in a [data-probe] wrapper so the tests can compare computed styles between hosts.
import {
  CheckLog,
  DataHeader,
  DataTable,
  FieldList,
  Footnotes,
  Hierarchy,
  Quote,
  Readout,
  Schematic,
  SectionTitle,
  StageIcon,
  StatusFlag,
  Tag,
} from "@gabrioliv/dossier";

export default function Slice() {
  return (
    // Inherited font (Dossier body text) and colour fixed here, as any page sets them, so the two hosts differ only
    // where the library is involved.
    <div data-slice="" style={{ font: "var(--text-body)", color: "var(--ink)" }}>
      <div data-probe="DataHeader">
        <DataHeader title="Run 0427" code="File 0427 · Rev B" kicker="Section 01" meta="Suite 3/3 pass" />
      </div>
      <div data-probe="DataHeader-running">
        <DataHeader variant="running" title="Run 0427" code="File 0427" kicker="Findings" meta="03 / 12" />
      </div>
      <div data-probe="SectionTitle">
        <SectionTitle index="02" title="Findings" meta="Pages 03–05" />
      </div>
      <div data-probe="Readout">
        <Readout
          label="Pass rate"
          value="98.6"
          unit="%"
          tone="signal"
          trend="up"
          delta="+1.2 vs last run"
          note="Nine cycles"
        />
      </div>
      <div data-probe="Tag">
        <Tag>Outline</Tag> <Tag variant="solid">Live</Tag> <Tag variant="inverse">Archived</Tag>
      </div>
      <div data-probe="DataTable">
        <DataTable
          caption="Sector index"
          highlightRows={[1]}
          columns={[
            { key: "sector", label: "Sector" },
            { key: "code", label: "Code", numeric: true },
            { key: "units", label: "Units", numeric: true },
            { key: "share", label: "Share", numeric: true },
          ]}
          rows={[
            { sector: "Northern relay", code: "N-01", units: "412", share: "34.2%" },
            { sector: "Central core", code: "C-00", units: "506", share: "42.0%" },
            { sector: "Eastern array", code: "E-07", units: "198", share: "16.4%" },
            { sector: "Outpost", code: "X-12", units: "88", share: "7.3%" },
          ]}
        />
      </div>
      <div data-probe="FieldList">
        <FieldList
          columns={2}
          fields={[
            { label: "Sector", value: "North" },
            { label: "Code", value: "N-01", mono: true, active: true },
            { label: "Units", value: "412", mono: true },
            { label: "Status", value: "Nominal" },
          ]}
        />
      </div>
      <div data-probe="FieldList-definition">
        <FieldList
          variant="definition"
          fields={[{ label: "Assertion", value: "Expected against actual for one check." }]}
        />
      </div>
      <div data-probe="Schematic">
        <Schematic
          rings={3}
          title="Tools by layer"
          nodes={[
            { ring: 1, angle: -30, label: "playwright", active: true },
            { ring: 2, angle: 140, label: "jenkins" },
            { ring: 3, angle: 60, label: "docker" },
          ]}
        />
      </div>
      <div data-probe="Hierarchy">
        <Hierarchy
          title="Certifications"
          root={{
            label: "Foundation",
            code: "CTFL",
            children: [
              { label: "Agile", code: "AT", active: true },
              { label: "Automation", code: "TAE" },
            ],
          }}
        />
      </div>
      <div data-probe="Quote">
        <Quote source="Field report" code="FILE 0427">
          Quality is a habit.
        </Quote>
      </div>
      <div data-probe="Quote-statement">
        <Quote variant="statement" kicker="Role" note="Nine cycles.">
          Stability holds at <span className="ds-hl">98.6%</span>.
        </Quote>
      </div>
      <div data-probe="Footnotes">
        <Footnotes notes={[{ text: "Measured on the staging cluster." }, { text: "Median of nine runs." }]} />
      </div>
      <div data-probe="StatusFlag">
        <StatusFlag status="pass" /> <StatusFlag status="fail" /> <StatusFlag status="skip" />{" "}
        <StatusFlag status="pending" />
      </div>
      <div data-probe="CheckLog">
        <CheckLog
          title="Smoke"
          checks={[
            { id: "C-1", label: "Loads the page", result: "pass", duration: "1.2s" },
            { id: "C-2", label: "Saves a draft", result: "fail", detail: "HTTP 500", duration: "0.8s" },
            { id: "C-3", label: "Exports PDF", result: "skip" },
          ]}
        />
      </div>
      <div data-probe="StageIcon">
        <StageIcon stage="A" /> <StageIcon stage="B" /> <StageIcon stage="C" /> <StageIcon stage="D" />{" "}
        <StageIcon stage="D" size="lg" />
      </div>
      <div data-probe="blueprint" data-theme="blueprint">
        <Tag variant="solid">Blueprint</Tag>
      </div>
      <p>
        <a href="#focus-target" id="focus-target">
          Focus target
        </a>
      </p>
    </div>
  );
}
