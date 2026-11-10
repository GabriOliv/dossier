import { useState, type ReactNode } from "react";
import {
  Accordion,
  Assertion,
  BarChart,
  Button,
  Checkbox,
  CheckLog,
  Comparison,
  Connector,
  Contents,
  DataHeader,
  DataTable,
  Dialog,
  Dimension,
  Divider,
  ErrorNotice,
  FieldList,
  Footnotes,
  Grid,
  Hierarchy,
  Icon,
  IconButton,
  type IconName,
  LineChart,
  Link,
  Menu,
  Meter,
  Pagination,
  Popover,
  ProportionDial,
  Quote,
  RadioGroup,
  Readout,
  Redacted,
  Schematic,
  SectionTitle,
  Select,
  Skeleton,
  Spinner,
  Stack,
  StageIcon,
  StatusFlag,
  Switch,
  Tabs,
  Tag,
  TextField,
  Timeline,
  toast,
  Toaster,
  ToleranceBar,
  Tooltip,
  Transcript,
} from "@gabrioliv/dossier";

const THEMES = ["paper", "void", "blueprint"] as const;
type Theme = (typeof THEMES)[number];
const KEY = "dossier-gallery-theme";

function Variant({ name, scroll, children }: { name: string; scroll?: boolean; children: ReactNode }) {
  return (
    <div className="gal-variant">
      <span className="gal-cap">{name}</span>
      {scroll ? (
        // A keyboard can scroll only what it can focus; the region is named after the example.
        <div className="gal-scroll" tabIndex={0} role="region" aria-label={name}>
          {children}
        </div>
      ) : (
        children
      )}
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

const cross = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const ICON_NAMES: IconName[] = [
  "close",
  "check",
  "plus",
  "minus",
  "chevron-up",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "arrow-up",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "search",
  "menu",
  "more",
  "external",
  "copy",
  "download",
  "info",
  "warning",
  "error",
  "loading",
];

const plans = [
  { value: "free", label: "Free" },
  { value: "team", label: "Team" },
  { value: "org", label: "Organization" },
];

const countries = [
  { value: "br", label: "Brazil" },
  { value: "pt", label: "Portugal" },
  { value: "ar", label: "Argentina" },
];

/** A Button that opens a Dialog and holds its state, the way a consumer does. */
function DialogDemo({ alert }: { alert?: boolean }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>{alert ? "Open alert dialog" : "Open dialog"}</Button>
      <Dialog
        open={open}
        onClose={close}
        alert={alert}
        title={alert ? "Discard the draft?" : "Delete file"}
        description={
          alert
            ? "The changes since the last save are lost."
            : "report-final-2026.pdf leaves the folder and cannot be restored."
        }
        actions={
          <>
            <Button variant="text" onClick={close}>
              Cancel
            </Button>
            <Button variant="solid" tone="danger" onClick={close}>
              {alert ? "Discard" : "Delete"}
            </Button>
          </>
        }
      >
        {alert ? null : "Shared links stop working."}
      </Dialog>
    </>
  );
}

/** A Pagination of buttons that holds the page, the way a consumer does with client state. */
function PaginationDemo() {
  const [page, setPage] = useState(1);
  return <Pagination page={page} total={7} onChange={setPage} />;
}

const runTabs = [
  { value: "summary", label: "Summary", content: "12 checks ran in 4.2 s: 11 passed, 1 failed." },
  { value: "checks", label: "Checks", content: "Intake, review and archive passed; export failed on the timeout." },
  { value: "logs", label: "Logs", content: "02:14:07 export started; 02:14:11 timeout after 4000 ms." },
];

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
  {
    name: "Assertion",
    desc: "A failed or passed check: expected against actual, with the source location.",
    body: (
      <>
        <Variant name="failed">
          <Assertion
            label="CHK-114 · status code"
            expected="200 OK"
            actual="500 Internal Server Error"
            location="checkout.spec.ts:88"
          />
        </Variant>
        <Variant name="passed">
          <Assertion label="CHK-101 · cart total" expected="84.90" actual="84.90" location="cart.spec.ts:41" />
        </Variant>
      </>
    ),
  },
  {
    name: "BarChart",
    desc: "Horizontal bars on a shared scale, one bar highlighted.",
    body: (
      <Variant name="title + unit + max" scroll>
        <BarChart
          title="Units by sector"
          unit="units"
          max={600}
          data={[
            { label: "Northern relay", value: 412 },
            { label: "Central core", value: 506, active: true },
            { label: "Eastern array", value: 198 },
            { label: "Outpost", value: 88 },
          ]}
        />
      </Variant>
    ),
  },
  {
    name: "Comparison",
    desc: "Side-by-side columns with a code, a title, a lead and a list.",
    body: (
      <Variant name="two columns, one active">
        <Comparison
          columns={[
            {
              code: "Criterion A",
              title: "Impact",
              lead: "An initiative rates high on impact when it does one of the following:",
              items: ["Is required to reach the target state", "Cuts cost or raises revenue by a measurable amount"],
              active: true,
            },
            {
              code: "Criterion B",
              title: "Effort",
              lead: "Effort is assessed on three factors:",
              items: ["Ease of implementation", "Required time frame", "Required resources: people and capital"],
            },
          ]}
        />
      </Variant>
    ),
  },
  {
    name: "Connector",
    desc: "An orthogonal arrow from one corner of its box to the opposite corner.",
    body: (
      <>
        <Variant name="straight, width=96 height=0" scroll>
          <div className="gal-flow">
            <span className="ds-t-title">Observation</span>
            <Connector width={96} height={0} from="top-left" />
            <span className="ds-t-title">Assessment</span>
            <Connector width={96} height={0} from="top-left" active />
            <span className="ds-t-title">Decision</span>
          </div>
        </Variant>
        <Variant name="bent, first vertical / horizontal" scroll>
          <div className="gal-flow">
            <Connector width={160} height={64} from="bottom-right" first="vertical" />
            <Connector width={160} height={64} from="bottom-right" first="horizontal" />
            <Connector width={160} height={64} from="top-left" first="horizontal" active />
          </div>
        </Variant>
      </>
    ),
  },
  {
    name: "Contents",
    desc: "A table of contents: title, description and page number per entry.",
    body: (
      <Variant name="one active entry">
        <Contents
          items={[
            {
              title: "Project and strategy",
              description: "Scope, objectives and the constraints the plan works within.",
              page: 4,
            },
            {
              title: "Proposal",
              description: "Three options, their cost and the recommended path.",
              page: 9,
              active: true,
            },
            {
              title: "Change management",
              description: "Rollout sequence, owners and the review cadence.",
              page: 15,
            },
          ]}
        />
      </Variant>
    ),
  },
  {
    name: "Dimension",
    desc: "A measurement line with end ticks and a label.",
    body: (
      <>
        <Variant name="length=320" scroll>
          <Dimension length={320} label="320 px" />
        </Variant>
        <Variant name="active pair" scroll>
          <div className="gal-flow">
            <Dimension length={152} label="152" active />
            <Dimension length={152} label="152" />
          </div>
        </Variant>
      </>
    ),
  },
  {
    name: "ErrorNotice",
    desc: "A blocking notice with a title, details, a list of causes and an action.",
    body: (
      <Variant name="items + action + meta">
        <ErrorNotice
          code="Run 0427"
          meta="2026-10-21 03:12 UTC"
          title="Release blocked: 2 checks failed"
          action="Rerun after fix #1182"
          items={["CHK-114 · Checkout returns 500 under load", "CHK-121 · p95 latency 1.84 s, limit 1.20 s"]}
        >
          The build cannot ship until both checks pass or a waiver is approved.
        </ErrorNotice>
      </Variant>
    ),
  },
  {
    name: "LineChart",
    desc: "A line over labelled points with a hatched area, a callout and an active point.",
    body: (
      <Variant name="unit=%, width=860" scroll>
        <LineChart
          title="Adoption rate by month"
          unit="%"
          width={860}
          data={[
            { x: "Jun", y: 30, callout: true },
            { x: "Jul", y: 44 },
            { x: "Aug", y: 58 },
            { x: "Sep", y: 66 },
            { x: "Oct", y: 70 },
            { x: "Nov", y: 92 },
            { x: "Dec", y: 130, active: true },
          ]}
        />
      </Variant>
    ),
  },
  {
    name: "Meter",
    desc: "A row of cells filled up to a value out of a maximum.",
    body: (
      <Variant name='default, tone="signal"'>
        <div className="gal-stack">
          <Meter label="Signal strength" value={7} />
          <Meter label="Coverage" value={9} tone="signal" />
          <Meter label="Redundancy" value={4} />
        </div>
      </Variant>
    ),
  },
  {
    name: "ProportionDial",
    desc: "A dotted dial with an arc for one value and leader lines to labelled segments.",
    body: (
      <Variant name="value=90, three segments" scroll>
        <ProportionDial
          value={90}
          label="Deep learning"
          title="Models by architecture"
          segments={[
            { angle: -25, label: "Forecasting" },
            { angle: 35, label: "Ranking" },
            { angle: 150, label: "Personalization" },
          ]}
        />
      </Variant>
    ),
  },
  {
    name: "Redacted",
    desc: "An inline black bar that stands in for hidden text.",
    body: (
      <Variant name="in a sentence">
        <p className="ds-t-body gal-prose">
          Subject transferred to <Redacted length={10} /> on <Redacted length={6} /> under directive{" "}
          <Redacted length={4} />. Escort of two, no incidents logged.
        </p>
      </Variant>
    ),
  },
  {
    name: "TextField",
    desc: "A square text input or textarea with label, hint and error state.",
    body: (
      <Variant name="textarea with error, input with hint">
        <div className="gal-stack">
          <TextField
            label="Waiver reason"
            required
            multiline
            rows={2}
            error="Write a reason before waiving a failed check."
          />
          <TextField label="Approver" defaultValue="Release manager" hint="Who signs off on build 3.18.2." />
        </div>
      </Variant>
    ),
  },
  {
    name: "Timeline",
    desc: "Events along an axis with a time, a label and a note.",
    body: (
      <Variant name="four events, one active" scroll>
        <Timeline
          events={[
            { at: "Cycle 1", label: "Survey", note: "First readings logged" },
            { at: "Cycle 10", label: "Relay network", note: "Four relays linked" },
            { at: "Cycle 100", label: "Core online", note: "Network self-sustaining", active: true },
            { at: "Cycle 1000", label: "Projected", note: "Model estimate" },
          ]}
        />
      </Variant>
    ),
  },
  {
    name: "ToleranceBar",
    desc: "A value against a limit on a scale, in or out of range.",
    body: (
      <Variant name="above max / within max / below min">
        <div className="gal-stack">
          <ToleranceBar
            label="p95 latency"
            value={1.84}
            max={1.2}
            scaleMax={2.4}
            unit="s"
            format={(v) => v.toFixed(2)}
          />
          <ToleranceBar label="Error rate" value={0.3} max={1} scaleMax={2} unit="%" />
          <ToleranceBar label="Battery voltage" value={3.1} min={3.3} max={4.2} scaleMin={3} scaleMax={4.5} unit="V" />
        </div>
      </Variant>
    ),
  },
  {
    name: "Transcript",
    desc: "Timed lines of dialogue by speaker, one line highlighted.",
    body: (
      <Variant name="with redactions">
        <Transcript
          title="Transcript — Log 07"
          lines={[
            { time: "04:12", speaker: "Control", text: "Relay A, confirm position." },
            {
              time: "04:12",
              speaker: "Relay A",
              text: (
                <>
                  Holding at grid 41 by 12. Visual on <Redacted length={9} />, no change.
                </>
              ),
            },
            { time: "04:13", speaker: "Control", text: "Hold. Next contact in twelve minutes.", active: true },
            {
              time: "04:25",
              speaker: "Relay A",
              text: (
                <>
                  Contact lost near <Redacted length={6} />.
                </>
              ),
            },
          ]}
        />
      </Variant>
    ),
  },
  {
    name: "Button",
    desc: "A square button in three variants, with a danger tone for destructive actions and a compact size.",
    body: (
      <>
        <Variant name='variant="outline" (default), "solid", "text"'>
          <div className="ds-row">
            <Button>Review</Button>
            <Button variant="solid">Approve</Button>
            <Button variant="text">Cancel</Button>
          </div>
        </Variant>
        <Variant name='tone="danger"'>
          <div className="ds-row">
            <Button tone="danger">Reject</Button>
            <Button variant="solid" tone="danger">
              Delete
            </Button>
            <Button variant="text" tone="danger">
              Discard
            </Button>
          </div>
        </Variant>
        <Variant name='size="sm"'>
          <div className="ds-row">
            <Button size="sm">Review</Button>
            <Button variant="solid" size="sm">
              Approve
            </Button>
            <Button variant="text" size="sm">
              Cancel
            </Button>
          </div>
        </Variant>
        <Variant name="disabled">
          <div className="ds-row">
            <Button disabled>Review</Button>
            <Button variant="solid" disabled>
              Approve
            </Button>
            <Button variant="text" disabled>
              Cancel
            </Button>
          </div>
        </Variant>
      </>
    ),
  },
  {
    name: "IconButton",
    desc: "A square Button that shows an icon and is named by its label.",
    body: (
      <>
        <Variant name="variants">
          <div className="ds-row">
            <IconButton label="Close">{cross}</IconButton>
            <IconButton label="Dismiss" variant="solid">
              {cross}
            </IconButton>
            <IconButton label="Clear" variant="text">
              {cross}
            </IconButton>
          </div>
        </Variant>
        <Variant name='tone="danger", size="sm", disabled'>
          <div className="ds-row">
            <IconButton label="Remove" variant="solid" tone="danger">
              {cross}
            </IconButton>
            <IconButton label="Close small" size="sm">
              {cross}
            </IconButton>
            <IconButton label="Close disabled" disabled>
              {cross}
            </IconButton>
          </div>
        </Variant>
      </>
    ),
  },
  {
    name: "Link",
    desc: "An anchor in the signal colour, underlined; the ds-link class gives the same look to a router's link.",
    body: (
      <Variant name="Link and a plain a element with class ds-link">
        <p className="gal-prose ds-t-body">
          Read the <Link href="#Link">full documentation</Link> or the{" "}
          <a className="ds-link" href="#Link">
            changelog
          </a>
          .
        </p>
      </Variant>
    ),
  },
  {
    name: "Checkbox",
    desc: "A square checkbox with its label, hint and error, on a native input.",
    body: (
      <>
        <Variant name="unchecked and checked">
          <div className="gal-stack">
            <Checkbox label="Send me the weekly digest" />
            <Checkbox label="Accept the terms" defaultChecked />
          </div>
        </Variant>
        <Variant name="hint">
          <Checkbox label="Share anonymous usage" hint="You can change this later in settings." />
        </Variant>
        <Variant name="error + required">
          <Checkbox label="Accept the terms" required error="Accept the terms to continue." />
        </Variant>
        <Variant name="disabled">
          <div className="gal-stack">
            <Checkbox label="Locked option" disabled />
            <Checkbox label="Locked and checked" disabled defaultChecked />
          </div>
        </Variant>
      </>
    ),
  },
  {
    name: "Switch",
    desc: "A square on/off switch with its label, hint and error, on a native checkbox with the switch role.",
    body: (
      <>
        <Variant name="off and on">
          <div className="gal-stack">
            <Switch label="Email notifications" />
            <Switch label="Auto-archive closed runs" defaultChecked />
          </div>
        </Variant>
        <Variant name="hint">
          <Switch label="Weekly digest" hint="Sent on Monday morning." />
        </Variant>
        <Variant name="error + required">
          <Switch label="Allow data export" required error="Turn this on to export the run." />
        </Variant>
        <Variant name="disabled">
          <div className="gal-stack">
            <Switch label="Managed by your admin" disabled />
            <Switch label="Managed and on" disabled defaultChecked />
          </div>
        </Variant>
      </>
    ),
  },
  {
    name: "Tabs",
    desc: "Tabs with automatic activation: the arrow keys, Home and End move focus and show the panel; Tab moves on to it. The list scrolls on its own when the tabs do not fit.",
    body: (
      <>
        <Variant name="label + tabs">
          <Tabs label="Run views" tabs={runTabs} />
        </Variant>
        <Variant name="disabled tab + defaultValue">
          <Tabs
            label="Run views, one disabled"
            defaultValue="checks"
            tabs={[runTabs[0], runTabs[1], { ...runTabs[2], disabled: true }]}
          />
        </Variant>
        <Variant name="tabs wider than the list">
          <Tabs
            label="Report sections"
            tabs={["Summary", "Checks", "Logs", "Timings", "Artifacts", "Environment", "History"].map((label) => ({
              value: label,
              label,
              content: `${label} of the run.`,
            }))}
          />
        </Variant>
      </>
    ),
  },
  {
    name: "Accordion",
    desc: "Sections on native details elements: they open and close without JS, and the page search opens the one it finds text in. With exclusive, opening one closes the other.",
    body: (
      <>
        <Variant name="defaultOpen (several open at once)">
          <Accordion
            items={[
              { title: "How do I ship?", content: "The order leaves in two business days." },
              { title: "Can I return it?", content: "Within thirty days, with the receipt.", defaultOpen: true },
              { title: "Do you invoice?", content: "Every order has an invoice by e-mail." },
            ]}
          />
        </Variant>
        <Variant name="exclusive">
          <Accordion
            exclusive
            items={[
              { title: "Intake", content: "Where a file enters the archive.", defaultOpen: true },
              { title: "Review", content: "Where two people read it." },
              { title: "Archive", content: "Where it stays for ten years." },
            ]}
          />
        </Variant>
      </>
    ),
  },
  {
    name: "Pagination",
    desc: "Previous, the pages and Next. With href each page is a link that works without JS; without it each is a button that calls onChange. The current page is marked, and Previous and Next are disabled at the ends.",
    body: (
      <>
        <Variant name="href: page={5} total={20}">
          <Pagination page={5} total={20} href={(n) => `#page-${n}`} />
        </Variant>
        <Variant name="onChange: buttons, from page 1">
          <PaginationDemo />
        </Variant>
        <Variant name="siblings={2}, last page">
          <Pagination page={20} total={20} siblings={2} href={(n) => `#page-${n}`} />
        </Variant>
      </>
    ),
  },
  {
    name: "Icon",
    desc: "The 22 icons of the Dossier set: a 1 px square-capped stroke in currentColor, on a 16 px or a 24 px grid. Without label an icon is hidden from assistive tech.",
    body: (
      <>
        <Variant name="size={16} (default)">
          <div className="ds-row">
            {ICON_NAMES.map((name) => (
              <Icon key={name} name={name} />
            ))}
          </div>
        </Variant>
        <Variant name="size={24}">
          <div className="ds-row">
            {ICON_NAMES.map((name) => (
              <Icon key={name} name={name} size={24} />
            ))}
          </div>
        </Variant>
        <Variant name='label="Search", in the signal colour'>
          <span style={{ color: "var(--ds-signal)" }}>
            <Icon name="search" size={24} label="Search" />
          </span>
        </Variant>
      </>
    ),
  },
  {
    name: "Spinner",
    desc: "Four square cells lit one at a time in steps, with the text beside them. With reduced motion the cells stand still, two lit.",
    body: (
      <>
        <Variant name="default">
          <Spinner />
        </Variant>
        <Variant name='labels={{ label: "Saving the run" }}'>
          <Spinner labels={{ label: "Saving the run" }} />
        </Variant>
        <Variant name="in a Button and an IconButton with loading">
          <div className="ds-row">
            <Button loading>Review</Button>
            <Button variant="solid" loading>
              Approve
            </Button>
            <IconButton label="Refresh" loading>
              {cross}
            </IconButton>
            <IconButton label="Send" variant="solid" loading>
              {cross}
            </IconButton>
          </div>
        </Variant>
      </>
    ),
  },
  {
    name: "Skeleton",
    desc: "A still placeholder in the panel colour, with no gradient and no movement. The container that loads carries aria-busy.",
    body: (
      <div aria-busy="true" className="gal-stack">
        <Variant name='variant="block" height="120px"'>
          <Skeleton variant="block" height="120px" />
        </Variant>
        <Variant name='variant="text" (default)'>
          <Skeleton />
          <Skeleton style={{ width: "60%" }} />
        </Variant>
      </div>
    ),
  },
  {
    name: "Stack",
    desc: "Items in a column or a row, spaced by a step of the --ds-space-* scale: 1, 2, 3, 4, 6, 8 or 12.",
    body: (
      <>
        <Variant name="default: column, gap 3">
          <Stack>
            <Tag>Intake</Tag>
            <Tag>Review</Tag>
            <Tag>Archive</Tag>
          </Stack>
        </Variant>
        <Variant name='direction="row" gap={6} align="center" justify="between" wrap'>
          <Stack direction="row" gap={6} align="center" justify="between" wrap>
            <Tag>Intake</Tag>
            <Button size="sm">Review</Button>
            <Tag>Archive</Tag>
          </Stack>
        </Variant>
      </>
    ),
  },
  {
    name: "Grid",
    desc: "Equal columns, one column below 640 px; or columns at least minColumnWidth wide that fill the row.",
    body: (
      <>
        <Variant name="columns={3}">
          <Grid columns={3}>
            <Readout label="Passed" value="128" />
            <Readout label="Failed" value="3" />
            <Readout label="Skipped" value="9" />
          </Grid>
        </Variant>
        <Variant name='minColumnWidth="200px" gap={4}'>
          <Grid minColumnWidth="200px" gap={4}>
            <Tag>Intake</Tag>
            <Tag>Review</Tag>
            <Tag>Archive</Tag>
            <Tag>Export</Tag>
          </Grid>
        </Variant>
      </>
    ),
  },
  {
    name: "Divider",
    desc: "A line between two groups, an hr: hair in rule-soft for decoration, rule and heavy in rule for structure, or vertical.",
    body: (
      <>
        <Variant name='weight="hair" (default), "rule", "heavy"'>
          <div className="gal-stack">
            <Divider />
            <Divider weight="rule" />
            <Divider weight="heavy" />
          </div>
        </Variant>
        <Variant name='orientation="vertical"'>
          <Stack direction="row" gap={4} align="center">
            <span className="ds-t-body">Intake</span>
            <Divider orientation="vertical" weight="rule" style={{ height: 32 }} />
            <span className="ds-t-body">Review</span>
          </Stack>
        </Variant>
      </>
    ),
  },
  {
    name: "Toaster",
    desc: "The live region where toast() shows its messages, at the bottom right (the full width at the bottom on a phone). A default toast leaves after 6 s, paused while the pointer or focus is on it; an error stays until closed.",
    body: (
      <>
        <Variant name="toast({ title, description })">
          <Button onClick={() => toast({ title: "File saved", description: "run-0042.pdf" })}>Save</Button>
        </Variant>
        <Variant name='toast({ title, tone: "error" })'>
          <Button tone="danger" onClick={() => toast({ title: "Upload failed", tone: "error" })}>
            Upload
          </Button>
        </Variant>
        <Variant name="toast({ title, duration: Infinity })">
          <Button onClick={() => toast({ title: "Review assigned", duration: Infinity })}>Assign</Button>
        </Variant>
        <Toaster />
      </>
    ),
  },
  {
    name: "RadioGroup",
    desc: "A group of exclusive options under a legend, with a hint and an error, on native radio inputs.",
    body: (
      <>
        <Variant name="label + options + defaultValue">
          <RadioGroup label="Plan" options={plans} defaultValue="team" />
        </Variant>
        <Variant name="hint">
          <RadioGroup label="Billing plan" options={plans} hint="You can switch plans at any time." />
        </Variant>
        <Variant name="error + required">
          <RadioGroup label="Environment" required options={plans} error="Choose an environment to continue." />
        </Variant>
        <Variant name="disabled option">
          <RadioGroup
            label="Support level"
            defaultValue="free"
            options={[
              { value: "free", label: "Community" },
              { value: "team", label: "Business hours", disabled: true },
              { value: "org", label: "Around the clock" },
            ]}
          />
        </Variant>
        <Variant name="disabled">
          <RadioGroup label="Region" options={plans} defaultValue="free" disabled />
        </Variant>
      </>
    ),
  },
  {
    name: "Select",
    desc: "A square native select with its label, hint and error and an arrow drawn in CSS.",
    body: (
      <>
        <Variant name="label + options">
          <Select label="Country" options={countries} defaultValue="pt" />
        </Variant>
        <Variant name="placeholder + hint">
          <Select
            label="Country of origin"
            options={countries}
            placeholder="Choose a country"
            hint="Where it was filed."
          />
        </Variant>
        <Variant name="error + required">
          <Select
            label="Country of review"
            required
            options={countries}
            placeholder="Choose a country"
            error="Choose a country to continue."
          />
        </Variant>
        <Variant name="disabled">
          <Select label="Locked country" options={countries} defaultValue="br" disabled />
        </Variant>
      </>
    ),
  },
  {
    name: "Dialog",
    desc: "A modal dialog on a native dialog element: hatched backdrop, focus kept inside, closed by Escape, the close button or the backdrop.",
    body: (
      <>
        <Variant name="title + description + actions">
          <DialogDemo />
        </Variant>
        <Variant name="alert">
          <DialogDemo alert />
        </Variant>
      </>
    ),
  },
  {
    name: "Popover",
    desc: "A non-modal panel tied to its trigger, closed by a click outside or Escape; it flips above the trigger when there is no room below.",
    body: (
      <Variant name='placement="bottom-start" (default)'>
        <Popover trigger={<Button>Filters</Button>}>
          <div className="gal-stack">
            <Checkbox label="Only open files" />
            <Button variant="solid" size="sm">
              Apply
            </Button>
          </div>
        </Popover>
      </Variant>
    ),
  },
  {
    name: "Tooltip",
    desc: "A short text tip for its trigger, shown after 500 ms of hover or keyboard focus and hidden by Escape.",
    body: (
      <Variant name="IconButton + content">
        <Tooltip content="Copy link">
          <IconButton label="Copy">{cross}</IconButton>
        </Tooltip>
      </Variant>
    ),
  },
  {
    name: "Menu",
    desc: "A flat list of actions on a button, used by keyboard alone: arrows, Home, End, Enter and Escape.",
    body: (
      <Variant name="items + disabled + tone danger">
        <Menu
          trigger={<Button>Actions</Button>}
          items={[
            { label: "Edit", onSelect: () => {} },
            { label: "Duplicate", onSelect: () => {} },
            { label: "Share", onSelect: () => {}, disabled: true },
            { label: "Delete", onSelect: () => {}, tone: "danger" },
          ]}
        />
      </Variant>
    ),
  },
];

const waiverNotes = [
  { text: "Limits from the performance budget, revision C." },
  { text: "Load profile: 120 requests per second for 60 s against staging." },
];

/** The card's composition, not an export: a failed regression run built from the library's components. */
function TestRunReport() {
  return (
    <div className="gal-report">
      <DataHeader
        title="Regression run"
        code="Run 0427 · Build 3.18.2"
        kicker="Section 01 — Summary"
        meta="Status: blocked"
      />
      <ErrorNotice
        code="Run 0427"
        meta="2026-10-21 03:12 UTC"
        title="Release blocked: 2 checks failed"
        action="Rerun after fix #1182"
        items={["CHK-114 · Checkout returns 500 under load", "CHK-121 · p95 latency 1.84 s, limit 1.20 s"]}
      >
        The build cannot ship until both checks pass or a waiver is approved.
      </ErrorNotice>
      <div className="ds-row">
        <Readout label="Checks run" value="148" />
        <Readout label="Pass rate" value="98.0" unit="%" trend="down" delta="−1.4% vs run 0426" />
        <Readout label="Duration" value="14:32" unit="min" />
      </div>
      <SectionTitle index="02" title="Check results" meta="6 of 148 shown" />
      <div className="gal-scroll" tabIndex={0} role="region" aria-label="Check results">
        <CheckLog
          title="Checkout suite"
          checks={[
            { id: "CHK-101", label: "Cart totals match line items", result: "pass", duration: "0.4 s" },
            {
              id: "CHK-114",
              label: "Checkout returns 200 under load",
              result: "fail",
              detail: "500 Internal Server Error at 120 rps",
              duration: "2.1 s",
            },
            { id: "CHK-117", label: "Payment token refresh", result: "pass", duration: "0.9 s" },
            {
              id: "CHK-121",
              label: "p95 latency within budget",
              result: "fail",
              detail: "1.84 s against a 1.20 s limit",
              duration: "60.0 s",
            },
            { id: "CHK-130", label: "Coupon stacking rules", result: "skip", detail: "Blocked by CHK-114" },
            { id: "CHK-142", label: "Order confirmation email", result: "pass", duration: "1.2 s" },
          ]}
        />
      </div>
      <SectionTitle index="03" title="Failure detail" meta="CHK-114 · CHK-121" />
      <div className="gal-two">
        <Assertion
          label="CHK-114 · status code"
          expected="200 OK"
          actual="500 Internal Server Error"
          location="checkout.spec.ts:88"
        />
        <div className="gal-stack">
          <ToleranceBar
            label="CHK-121 · p95 latency"
            value={1.84}
            max={1.2}
            scaleMax={2.4}
            unit="s"
            format={(v) => v.toFixed(2)}
          />
          <ToleranceBar label="Error rate" value={0.3} max={1} scaleMax={2} unit="%" />
        </div>
      </div>
      <SectionTitle index="04" title="Waiver" meta="Optional" />
      <div className="gal-two">
        <div className="gal-stack">
          <TextField
            label="Waiver reason"
            required
            multiline
            rows={3}
            error="Write a reason before waiving a failed check."
          />
          <TextField label="Approver" defaultValue="Release manager" hint="Who signs off on build 3.18.2." />
        </div>
        <FieldList
          fields={[
            { label: "Checks to waive", value: "CHK-121", mono: true },
            { label: "Not waivable", value: "CHK-114 (server error)" },
            { label: "Expires", value: "Run 0430", mono: true },
            { label: "Status", value: <StatusFlag status="pending" /> },
          ]}
        />
      </div>
      <Footnotes notes={waiverNotes} />
    </div>
  );
}

const COMPOSITION = "TestRunReport";

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
            <li>
              <a href={"#" + COMPOSITION}>{COMPOSITION}</a>
            </li>
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
        <section id={COMPOSITION} data-composition={COMPOSITION} className="gal-section">
          <h2 className="ds-t-heading">{COMPOSITION}</h2>
          <p className="gal-desc ds-t-body">
            A composition, not an exported component: a failed regression run with every error component in context.
          </p>
          <TestRunReport />
        </section>
      </main>
    </div>
  );
}
