import type { Meta, StoryObj } from "@storybook/react-vite";
import "../.storybook/overview.css";
import { SECTIONS, TestRunReport as Report } from "./overview/sections";

/**
 * One story per component, with the variants and states of the gallery section it replaces: the browser tests open
 * these stories (tests/support/story.ts). Each story renders `<section id="<Name>" data-component="<Name>">`.
 */
const meta = { title: "Overview" } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

function Overview({ name }: { name: string }) {
  if (name === "TestRunReport") {
    return (
      <section id={name} data-composition={name} className="gal-section">
        <h2 className="ds-t-heading">{name}</h2>
        <p className="gal-desc ds-t-body">
          A composition, not an exported component: a failed regression run with every error component in context.
        </p>
        <Report />
      </section>
    );
  }
  const s = SECTIONS.find((x) => x.name === name)!;
  return (
    <section id={name} data-component={name} className="gal-section">
      <h2 className="ds-t-heading">{name}</h2>
      <p className="gal-desc ds-t-body">{s.desc}</p>
      {s.body}
    </section>
  );
}

const overview = (name: string): Story => ({ render: () => <Overview name={name} /> });

/** Every section on one page, in the order of `SECTIONS`: the tests that visit every section open this story once. */
export const All: Story = {
  render: () => (
    <>
      {[...SECTIONS.map((s) => s.name), "TestRunReport"].map((name) => (
        <Overview key={name} name={name} />
      ))}
    </>
  ),
};

export const DataHeader: Story = overview("DataHeader");
export const SectionTitle: Story = overview("SectionTitle");
export const Readout: Story = overview("Readout");
export const Tag: Story = overview("Tag");
export const DataTable: Story = overview("DataTable");
export const FieldList: Story = overview("FieldList");
export const Schematic: Story = overview("Schematic");
export const Hierarchy: Story = overview("Hierarchy");
export const Figure: Story = overview("Figure");
export const Quote: Story = overview("Quote");
export const Footnotes: Story = overview("Footnotes");
export const StatusFlag: Story = overview("StatusFlag");
export const CheckLog: Story = overview("CheckLog");
export const StageIcon: Story = overview("StageIcon");
export const Assertion: Story = overview("Assertion");
export const BarChart: Story = overview("BarChart");
export const Comparison: Story = overview("Comparison");
export const Connector: Story = overview("Connector");
export const Contents: Story = overview("Contents");
export const Dimension: Story = overview("Dimension");
export const ErrorNotice: Story = overview("ErrorNotice");
export const LineChart: Story = overview("LineChart");
export const Meter: Story = overview("Meter");
export const ProportionDial: Story = overview("ProportionDial");
export const Redacted: Story = overview("Redacted");
export const TextField: Story = overview("TextField");
export const Timeline: Story = overview("Timeline");
export const ToleranceBar: Story = overview("ToleranceBar");
export const Transcript: Story = overview("Transcript");
export const Button: Story = overview("Button");
export const IconButton: Story = overview("IconButton");
export const Link: Story = overview("Link");
export const Checkbox: Story = overview("Checkbox");
export const Switch: Story = overview("Switch");
export const Tabs: Story = overview("Tabs");
export const Accordion: Story = overview("Accordion");
export const Pagination: Story = overview("Pagination");
export const Icon: Story = overview("Icon");
export const Spinner: Story = overview("Spinner");
export const Skeleton: Story = overview("Skeleton");
export const Stack: Story = overview("Stack");
export const Grid: Story = overview("Grid");
export const Divider: Story = overview("Divider");
export const Toaster: Story = overview("Toaster");
export const RadioGroup: Story = overview("RadioGroup");
export const Select: Story = overview("Select");
export const Dialog: Story = overview("Dialog");
export const Popover: Story = overview("Popover");
export const Tooltip: Story = overview("Tooltip");
export const Menu: Story = overview("Menu");
export const TestRunReport: Story = overview("TestRunReport");
