import { useState, type ReactNode } from "react";
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

const THEMES = ["paper", "void", "blueprint"] as const;
type Theme = (typeof THEMES)[number];
const KEY = "dossier-gallery-theme";

function Variant({ name, scroll, children }: { name: string; scroll?: boolean; children: ReactNode }) {
  return (
    <div className="gal-variant">
      <span className="gal-cap">{name}</span>
      {scroll ? <div className="gal-scroll">{children}</div> : children}
    </div>
  );
}

const columns = [
  { key: "id", label: "Id" },
  { key: "item", label: "Item" },
  { key: "qty", label: "Qty", numeric: true },
  { key: "ms", label: "Time (ms)", numeric: true },
];
const rows = [
  { id: "A-01", item: "Intake", qty: "12", ms: "410" },
  { id: "A-02", item: "Review", qty: "8", ms: "1,280" },
  { id: "A-03", item: "Archive", qty: "31", ms: "95" },
];

const tree = {
  label: "Dossier",
  code: "root",
  children: [
    { label: "Tokens", code: "T", children: [{ label: "Colour" }, { label: "Type", active: true }] },
    { label: "Components", code: "C", children: [{ label: "Atoms" }, { label: "Diagrams" }] },
  ],
};

const STAGES = ["A", "B", "C", "D"] as const;

const SECTIONS: { name: string; desc: string; body: ReactNode }[] = [
  {
    name: "DataHeader",
    desc: "Inverse band with title and file code, then a meta row closed by a rule.",
    body: (
      <>
        <Variant name='variant="band"'>
          <DataHeader title="Quarterly review" code="File 0427 · Rev B" kicker="Internal" meta="12 Mar 2026" />
        </Variant>
        <Variant name='variant="running"'>
          <DataHeader variant="running" title="Quarterly review" code="0427" kicker="Page 2" meta="Rev B" />
        </Variant>
      </>
    ),
  },
  {
    name: "SectionTitle",
    desc: "Opens a section: signal bar, section number, title over a rule.",
    body: (
      <>
        <Variant name="index + meta">
          <SectionTitle index="02" title="Findings" meta="3 items" />
        </Variant>
        <Variant name="title only">
          <SectionTitle title="Summary" />
        </Variant>
      </>
    ),
  },
  {
    name: "Readout",
    desc: "One labelled figure, optionally hero-sized, with an optional trend.",
    body: (
      <div className="ds-row">
        <Readout label="Uptime" value="99.98" unit="%" note="Last 30 days" />
        <Readout label="Latency" value="124" unit="ms" trend="down" delta="-8 ms" />
        <Readout label="Open issues" value="17" tone="signal" trend="up" delta="+3" />
        <Readout label="Throughput" value="4.2" unit="k/s" size="hero" tone="signal" />
      </div>
    ),
  },
  {
    name: "Tag",
    desc: "A square, outlined label in mono caps for status, revision or classification.",
    body: (
      <div className="ds-row">
        <Tag>Draft</Tag>
        <Tag variant="solid">Active</Tag>
        <Tag variant="inverse">Archived</Tag>
      </div>
    ),
  },
  {
    name: "DataTable",
    desc: "Ruled table; numeric columns in mono, right-aligned.",
    body: (
      <>
        <Variant name="caption + highlighted row" scroll>
          <DataTable caption="Intake log" columns={columns} rows={rows} highlightRows={[1]} />
        </Variant>
        <Variant name="plain" scroll>
          <DataTable columns={columns} rows={rows.slice(0, 2)} />
        </Variant>
      </>
    ),
  },
  {
    name: "FieldList",
    desc: "Label/value record rows, or a term/description glossary.",
    body: (
      <>
        <Variant name='variant="record" columns={2}'>
          <FieldList
            columns={2}
            fields={[
              { label: "Owner", value: "G. Laureano" },
              { label: "Status", value: "In review", active: true },
              { label: "Hash", value: "9f2c1ab", mono: true },
              { label: "Updated", value: "12 Mar 2026", mono: true },
            ]}
          />
        </Variant>
        <Variant name='variant="definition"'>
          <FieldList
            variant="definition"
            fields={[
              { label: "Token", value: "A named design decision." },
              { label: "Theme", value: "A set of token values." },
            ]}
          />
        </Variant>
      </>
    ),
  },
  {
    name: "Schematic",
    desc: "Concentric rings with nodes and 45-degree leader lines to mono callouts.",
    body: (
      <Variant name="size=240, rings=4" scroll>
        <Schematic
          title="Network rings"
          size={240}
          rings={4}
          nodes={[
            { ring: 1, angle: -60, label: "Core" },
            { ring: 2, angle: 200, label: "Relay A", active: true },
            { ring: 3, angle: 30, label: "Relay B" },
            { ring: 4, angle: -140, label: "Perimeter" },
            { ring: 4, angle: 120, label: "Outpost" },
          ]}
        />
      </Variant>
    ),
  },
  {
    name: "Hierarchy",
    desc: "A top-down tree of square nodes with orthogonal connectors.",
    body: (
      <Variant name="root + active node" scroll>
        <Hierarchy title="Dossier structure" root={tree} />
      </Variant>
    ),
  },
  {
    name: "Quote",
    desc: "An uppercase pull quote, or a statement with a kicker and a note.",
    body: (
      <>
        <Variant name='variant="quote"'>
          <Quote source="Field notes" code="FN-12">
            Measure twice, <span className="ds-hl">file once.</span>
          </Quote>
        </Variant>
        <Variant name='variant="statement"'>
          <Quote variant="statement" kicker="Key message" note="Colour is never the only cue.">
            Every result carries a <span className="ds-hl">word</span>.
          </Quote>
        </Variant>
      </>
    ),
  },
  {
    name: "Footnotes",
    desc: "Numbered notes under a short rule.",
    body: (
      <Footnotes
        notes={[{ text: "Figures rounded to the nearest millisecond." }, { text: "Source: internal audit, Q1 2026." }]}
      />
    ),
  },
  {
    name: "StatusFlag",
    desc: "The result of one check as a square mono flag.",
    body: (
      <div className="ds-row">
        <StatusFlag status="pass" />
        <StatusFlag status="fail" />
        <StatusFlag status="skip" />
        <StatusFlag status="pending" />
      </div>
    ),
  },
  {
    name: "CheckLog",
    desc: "A list of checks with results and a pass/fail summary.",
    body: (
      <Variant name="mixed results" scroll>
        <CheckLog
          title="Release checks"
          checks={[
            { id: "c-01", label: "Build", result: "pass", detail: "vite build", duration: "4.1 s" },
            { id: "c-02", label: "Unit tests", result: "pass", detail: "83 specs", duration: "12 s" },
            { id: "c-03", label: "Consumer smoke", result: "fail", detail: "Docusaurus 3", duration: "30 s" },
            { id: "c-04", label: "Publint", result: "skip" },
            { id: "c-05", label: "Deploy", result: "pending" },
          ]}
        />
      </Variant>
    ),
  },
  {
    name: "StageIcon",
    desc: "Maturity stage glyph, A to D, at two sizes.",
    body: (
      <>
        <Variant name='size="sm"'>
          <div className="ds-row">
            {STAGES.map((s) => (
              <StageIcon key={s} stage={s} size="sm" />
            ))}
          </div>
        </Variant>
        <Variant name='size="lg"'>
          <div className="ds-row">
            {STAGES.map((s) => (
              <StageIcon key={s} stage={s} size="lg" />
            ))}
          </div>
        </Variant>
        <Variant name="decorative">
          <StageIcon stage="C" size="lg" decorative />
        </Variant>
      </>
    ),
  },
];

const LABEL: Record<Theme, string> = { paper: "Paper", void: "Void", blueprint: "Blueprint" };

function initialTheme(): Theme {
  const t = document.documentElement.dataset.theme as Theme;
  return THEMES.includes(t) ? t : "paper";
}

export function App() {
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const pick = (t: Theme) => {
    setTheme(t);
    document.documentElement.dataset.theme = t;
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* storage unavailable */
    }
  };
  return (
    <div className="gal-wrap">
      <DataHeader
        title="Dossier gallery"
        code="@gabrioliv/dossier"
        kicker="Component showcase"
        meta={`${SECTIONS.length} components`}
      />
      <div className="gal-top">
        <nav className="gal-nav" aria-label="Components">
          <ul>
            {SECTIONS.map((s) => (
              <li key={s.name}>
                <a href={"#" + s.name}>{s.name}</a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="gal-theme" role="group" aria-label="Theme">
          {THEMES.map((t) => (
            <button key={t} type="button" className="gal-btn" aria-pressed={theme === t} onClick={() => pick(t)}>
              {LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      <main>
        {SECTIONS.map((s) => (
          <section key={s.name} id={s.name} data-component={s.name} className="gal-section">
            <h2 className="ds-t-heading">{s.name}</h2>
            <p className="gal-desc ds-t-body">{s.desc}</p>
            {s.body}
          </section>
        ))}
      </main>
    </div>
  );
}
