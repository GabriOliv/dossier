import type * as React from 'react';

export interface DataHeaderProps {
  /** "band" (default): the page-opening title band. "running": the slim header repeated on every following page or slide. */
  variant?: 'band' | 'running';
  /** Band: page title in `display`, 1–3 words. Running: the document name. */
  title: string;
  /** File code, right side of the band, e.g. "FILE 0427 · REV B". */
  code?: string;
  /** Section marker after the signal index square, e.g. "Section 01". */
  kicker?: string;
  /** Band: right-aligned metadata, e.g. "Classification: internal". Running: the page number, e.g. "03 / 12". */
  meta?: string;
  className?: string;
}
export declare function DataHeader(props: DataHeaderProps): React.ReactElement;

export interface ReadoutProps {
  /** Field label, uppercase mono. */
  label: string;
  /** The figure. Numerals only; format it yourself (separators, decimals). */
  value: React.ReactNode;
  /** Unit after the figure: "%", "km", "units". */
  unit?: string;
  /** One-line caption under the figure. */
  note?: string;
  /** "signal" for the one readout that matters most on the page. */
  tone?: 'ink' | 'signal';
  /** "hero": the figure in `figure-xl`; one per page or slide. */
  size?: 'default' | 'hero';
  /** Triangle pointer: up, down or flat. Always pair it with `delta`. */
  trend?: 'up' | 'down' | 'flat';
  /** The change in words and numbers, e.g. "+12% vs Q2". */
  delta?: string;
  className?: string;
}
export declare function Readout(props: ReadoutProps): React.ReactElement;

export interface TagProps {
  /** outline (default) = neutral; solid = signal, the active state; inverse = archived or restricted. */
  variant?: 'outline' | 'solid' | 'inverse';
  /** One or two words. */
  children: string;
  className?: string;
}
export declare function Tag(props: TagProps): React.ReactElement;

export interface DataTableColumn {
  key: string;
  label: string;
  /** Mono, tabular, right-aligned. */
  numeric?: boolean;
}
export interface DataTableProps {
  caption?: string;
  columns: DataTableColumn[];
  rows: Array<Record<string, React.ReactNode>>;
  /** Row indexes to mark with signal-tint and the heavy index bar. One or two at most. */
  highlightRows?: number[];
  className?: string;
}
export declare function DataTable(props: DataTableProps): React.ReactElement;

export interface SchematicNode {
  /** 1 = innermost ring. */
  ring: number;
  /** Degrees, 0 = right (3 o'clock), clockwise. */
  angle: number;
  label: string;
  /** Signal fill; one active node per diagram. */
  active?: boolean;
}
export interface SchematicProps {
  /** Outer ring diameter in px (default 240). */
  size?: number;
  /** Ring count (default 4). */
  rings?: number;
  nodes?: SchematicNode[];
  /** Width reserved each side for callouts (default 120). */
  labelWidth?: number;
  /** Degree ticks on the outer ring (default true). */
  ticks?: boolean;
  /** Accessible name of the diagram. */
  title?: string;
  className?: string;
}
export declare function Schematic(props: SchematicProps): React.ReactElement;

export interface SectionTitleProps {
  /** Section number, shown as "SECTION 02" after the signal bar. */
  index?: string | number;
  /** Section title, uppercase in `title`. */
  title: string;
  /** Right-aligned metadata, e.g. "Pages 03–05". */
  meta?: string;
  className?: string;
}
export declare function SectionTitle(props: SectionTitleProps): React.ReactElement;

export interface Field {
  label: string;
  value: React.ReactNode;
  /** Set codes, dates and coordinates in `datum`. */
  mono?: boolean;
  /** Value in signal; one per list. */
  active?: boolean;
}
export interface FieldListProps {
  fields: Field[];
  /** "record" (default): mono labels, one-line values. "definition": a term in body semibold beside a longer description, one column. */
  variant?: 'record' | 'definition';
  /** Record only: 1 (default) or 2 columns. */
  columns?: 1 | 2;
  className?: string;
}
export declare function FieldList(props: FieldListProps): React.ReactElement;

export interface MeterProps {
  label: string;
  /** Whole number of filled cells. */
  value: number;
  /** Cell count (default 10). */
  max?: number;
  /** "signal" for the one meter that matters most. */
  tone?: 'ink' | 'signal';
  className?: string;
}
export declare function Meter(props: MeterProps): React.ReactElement;

export interface BarDatum {
  label: string;
  value: number;
  /** Signal bar; one per chart. */
  active?: boolean;
}
export interface BarChartProps {
  data: BarDatum[];
  /** Axis maximum (default: the largest value). */
  max?: number;
  /** Unit after each value. */
  unit?: string;
  /** Formats values and scale ticks. */
  format?: (v: number) => string;
  /** Scale row with 0, half and max (default true). */
  scale?: boolean;
  /** Accessible name. */
  title?: string;
  className?: string;
}
export declare function BarChart(props: BarChartProps): React.ReactElement;

export interface TimelineEvent {
  /** Position on the axis: "Cycle 10", "2026", "T+04:00". */
  at: string;
  label: string;
  note?: string;
  /** Signal marker; one per timeline. */
  active?: boolean;
}
export interface TimelineProps {
  /** Events in order, spaced evenly. 3–6 reads best. */
  events: TimelineEvent[];
  className?: string;
}
export declare function Timeline(props: TimelineProps): React.ReactElement;

export interface HierarchyNode {
  label: string;
  code?: string;
  /** Signal fill; one per tree. */
  active?: boolean;
  children?: HierarchyNode[];
}
export interface HierarchyProps {
  /** The root renders on the inverse fill. */
  root: HierarchyNode;
  title?: string;
  className?: string;
}
export declare function Hierarchy(props: HierarchyProps): React.ReactElement | null;

export interface DimensionProps {
  /** Measured length in px (default 240). The SVG adds 6px each side for the end ticks. */
  length?: number;
  /** Text over the line (default "<length> PX"). */
  label?: string | number;
  /** Signal stroke for the measure being discussed. */
  active?: boolean;
  className?: string;
}
export declare function Dimension(props: DimensionProps): React.ReactElement;

export interface QuoteProps {
  /** "quote" (default): attributed quote with a hanging mark. "statement": the slide's key message, no mark. */
  variant?: 'quote' | 'statement';
  /** The text, one or two sentences, set uppercase in `title`. Wrap the key figure in <span className="ds-hl"> to set it in signal. */
  children: React.ReactNode;
  /** Statement only: eyebrow label above the text. */
  kicker?: string;
  /** Statement only: one supporting sentence below, in `body`. */
  note?: string;
  /** Who or what said it. */
  source?: string;
  /** File code, right-aligned on the source line. */
  code?: string;
  className?: string;
}
export declare function Quote(props: QuoteProps): React.ReactElement;

export interface TranscriptLine {
  /** Time code, e.g. "04:12". */
  time?: string;
  speaker: string;
  /** May contain Redacted elements. */
  text: React.ReactNode;
  /** Speaker in signal; the line being discussed. */
  active?: boolean;
}
export interface TranscriptProps {
  title?: string;
  lines: TranscriptLine[];
  className?: string;
}
export declare function Transcript(props: TranscriptProps): React.ReactElement;

export interface RedactedProps {
  /** Approximate character count to cover (2–40, default 8). Never pass the hidden text. */
  length?: number;
  className?: string;
}
export declare function Redacted(props: RedactedProps): React.ReactElement;

export interface Footnote {
  /** Defaults to 01, 02, … */
  id?: string;
  text: React.ReactNode;
}
export interface FootnotesProps {
  notes: Footnote[];
  className?: string;
}
export declare function Footnotes(props: FootnotesProps): React.ReactElement;

export interface ContentsItem {
  /** Defaults to 01, 02, … */
  index?: string;
  title: string;
  description?: string;
  page?: string | number;
  /** The current section; its number turns signal. */
  active?: boolean;
}
export interface ContentsProps {
  items: ContentsItem[];
  className?: string;
}
export declare function Contents(props: ContentsProps): React.ReactElement;

export interface ComparisonColumn {
  /** Defaults to A, B, C. */
  code?: string;
  title: string;
  lead?: string;
  items?: React.ReactNode[];
  /** The recommended or current column; its rule and bullets turn signal. */
  active?: boolean;
}
export interface ComparisonProps {
  /** Two or three columns; extra columns are dropped. */
  columns: ComparisonColumn[];
  className?: string;
}
export declare function Comparison(props: ComparisonProps): React.ReactElement;

export interface LinePoint {
  /** Axis label, e.g. "Jun". */
  x: string;
  y: number;
  /** Show the value above the point. */
  callout?: boolean;
  /** The point the text is about: signal node, halo and large callout. One per chart. */
  active?: boolean;
}
export interface LineChartProps {
  data: LinePoint[];
  /** Appended to callout values, e.g. "%". */
  unit?: string;
  format?: (v: number) => string;
  /** Defaults 0 and the largest value. */
  yMin?: number;
  yMax?: number;
  /** Hatched area under the line (default true). */
  area?: boolean;
  /** viewBox size; the SVG scales down to its container. Defaults 720 × 240. */
  width?: number;
  height?: number;
  /** Accessible name. */
  title?: string;
  className?: string;
}
export declare function LineChart(props: LineChartProps): React.ReactElement;

export interface DialSegment {
  /** Degrees, 0 = right (3 o'clock), clockwise. Keep clear of the value callout. */
  angle: number;
  label: string;
}
export interface ProportionDialProps {
  /** 0–100. */
  value: number;
  /** What the share counts, shown under the percentage. */
  label?: string;
  /** Category callouts on the outer ring. */
  segments?: DialSegment[];
  /** Outer ring diameter (default 240). */
  size?: number;
  /** Room each side for callouts (default 180). */
  labelWidth?: number;
  /** Dot spacing in px (default 12). */
  dotStep?: number;
  title?: string;
  className?: string;
}
export declare function ProportionDial(props: ProportionDialProps): React.ReactElement;

export interface ConnectorProps {
  /** Box width and height in px. Set one to 0 for a straight arrow. Defaults 160 × 64. */
  width?: number;
  height?: number;
  /** Start corner; the arrow ends at the opposite corner. Default "bottom-right". */
  from?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Which leg runs first (default "vertical"). */
  first?: 'vertical' | 'horizontal';
  /** Signal stroke; one per composition. */
  active?: boolean;
  className?: string;
}
export declare function Connector(props: ConnectorProps): React.ReactElement;

export type CheckResult = 'pass' | 'fail' | 'skip' | 'pending';

export interface StatusFlagProps {
  /** pass: ink outline + filled square. fail: contrast-error fill + cross. skip: dashed muted outline. pending: muted outline + hollow square. */
  status: CheckResult;
  /** Overrides the word (default PASS, FAIL, SKIPPED, PENDING). Keep it one word. */
  children?: string;
  className?: string;
}
export declare function StatusFlag(props: StatusFlagProps): React.ReactElement;

export interface ErrorNoticeProps {
  /** One line: what failed and what it blocks. Uppercased. */
  title: string;
  /** Error or run code, shown as "ERROR · <code>" in contrast-error. */
  code?: string;
  /** Right-aligned metadata, e.g. a timestamp. */
  meta?: string;
  /** One or two sentences of explanation. */
  children?: React.ReactNode;
  /** Specific failures, one line each. */
  items?: React.ReactNode[];
  /** The next step, after a triangle pointer. */
  action?: string;
  /** true: role="alert", so screen readers announce it on render. Only for errors that appear after a user action. */
  live?: boolean;
  className?: string;
}
export declare function ErrorNotice(props: ErrorNoticeProps): React.ReactElement;

export interface Check {
  id?: string;
  label: string;
  result: CheckResult;
  /** One line: the failure reason, the measured value, or why it was skipped. */
  detail?: string;
  /** Formatted duration, e.g. "2.1 s". */
  duration?: string;
}
export interface CheckLogProps {
  title?: string;
  checks: Check[];
  className?: string;
}
export declare function CheckLog(props: CheckLogProps): React.ReactElement;

export interface AssertionProps {
  /** What is being checked, e.g. "CHK-114 · status code". */
  label?: string;
  expected: React.ReactNode;
  actual: React.ReactNode;
  /** Overrides the result; by default it passes when expected and actual are equal as strings. */
  pass?: boolean;
  /** Where the assertion lives, e.g. "checkout.spec.ts:88". */
  location?: string;
  className?: string;
}
export declare function Assertion(props: AssertionProps): React.ReactElement;

export interface ToleranceBarProps {
  label: string;
  value: number;
  /** Allowed range; give min, max or both. */
  min?: number;
  max?: number;
  /** Scale ends (default 0 and 1.25 × the larger of max and value). */
  scaleMin?: number;
  scaleMax?: number;
  unit?: string;
  format?: (v: number) => string;
  className?: string;
}
export declare function ToleranceBar(props: ToleranceBarProps): React.ReactElement;

export interface TextFieldProps {
  label: string;
  name?: string;
  type?: string;
  /** Controlled value (pair with onChange) or defaultValue for uncontrolled. */
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  placeholder?: string;
  /** Help text under the field when there is no error. */
  hint?: string;
  /** Error message: turns the border and label contrast-error and sets aria-invalid. Say what to do, not only what is wrong. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Renders a textarea. */
  multiline?: boolean;
  rows?: number;
  className?: string;
}
export declare function TextField(props: TextFieldProps): React.ReactElement;

declare global {
  interface Window {
    Dossier: {
      DataHeader: typeof DataHeader;
      SectionTitle: typeof SectionTitle;
      Readout: typeof Readout;
      Tag: typeof Tag;
      DataTable: typeof DataTable;
      FieldList: typeof FieldList;
      Meter: typeof Meter;
      BarChart: typeof BarChart;
      Timeline: typeof Timeline;
      Schematic: typeof Schematic;
      Hierarchy: typeof Hierarchy;
      Dimension: typeof Dimension;
      Quote: typeof Quote;
      Transcript: typeof Transcript;
      Redacted: typeof Redacted;
      Footnotes: typeof Footnotes;
      Contents: typeof Contents;
      Comparison: typeof Comparison;
      LineChart: typeof LineChart;
      ProportionDial: typeof ProportionDial;
      Connector: typeof Connector;
      StatusFlag: typeof StatusFlag;
      ErrorNotice: typeof ErrorNotice;
      CheckLog: typeof CheckLog;
      Assertion: typeof Assertion;
      ToleranceBar: typeof ToleranceBar;
      TextField: typeof TextField;
    };
  }
}
