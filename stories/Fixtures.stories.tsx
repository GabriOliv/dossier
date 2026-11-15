import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import "../.storybook/overview.css";
import { Button, Divider, Grid, Readout, Stack, Tag } from "../src";
import { Variant } from "./overview/sections";

/**
 * Scenarios the browser tests measure and the public Overview does not show: gaps out of the scale, six-item grids,
 * vertical dividers in containers, loading Button pairs. Tagged out of the sidebar and the docs; they stay in
 * `index.json` and open by `iframe.html?id=fixtures--<story>` (tests/support/story.ts).
 */
const meta = { title: "Fixtures", tags: ["!dev", "!autodocs"] } satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

/** The section the tests find by id, like an Overview story. */
const Fixture = ({ name, children }: { name: string; children: ReactNode }) => (
  <section id={name} data-component={name} className="gal-section">
    <h2 className="ds-t-heading">{name}</h2>
    {children}
  </section>
);

const GRID_ITEMS = ["Intake", "Review", "Archive", "Export", "Verify", "Report"].map((label) => (
  <Tag key={label}>{label}</Tag>
));

export const StackGaps: Story = {
  render: () => (
    <Fixture name="Stack">
      <Variant name="gap={1}, {2}, {3}, {4}, {6}, {8}, {12}: each step of the scale">
        <div className="gal-stack">
          {([1, 2, 3, 4, 6, 8, 12] as const).map((gap) => (
            <Stack key={gap} direction="row" gap={gap}>
              <Tag>Intake</Tag>
              <Tag>Review</Tag>
            </Stack>
          ))}
        </div>
      </Variant>
      <Variant name='gap out of the scale: 0, 5, 7, 10, 13, -1, 2.5, NaN, "4"'>
        <div className="gal-stack">
          {[0, 5, 7, 10, 13, -1, 2.5, Number.NaN, "4"].map((gap) => (
            <Stack key={String(gap)} direction="row" gap={gap as never}>
              <Tag>Intake</Tag>
              <Tag>Review</Tag>
            </Stack>
          ))}
        </div>
      </Variant>
    </Fixture>
  ),
};

export const GridLayout: Story = {
  render: () => (
    <Fixture name="Grid">
      <Variant name="columns={3}">
        <Grid columns={3} style={{ maxWidth: 1000 }}>
          <Readout label="Passed" value="128" />
          <Readout label="Failed" value="3" />
          <Readout label="Skipped" value="9" />
          <Readout label="Retried" value="5" />
          <Readout label="Blocked" value="1" />
          <Readout label="Flaky" value="2" />
        </Grid>
      </Variant>
      <Variant name='minColumnWidth="200px" gap={4}'>
        <Grid minColumnWidth="200px" gap={4} style={{ maxWidth: 1000 }}>
          {GRID_ITEMS}
        </Grid>
      </Variant>
      <Variant name='columns={2} with minColumnWidth="200px": minColumnWidth wins'>
        <Grid columns={2} minColumnWidth="200px" style={{ maxWidth: 1000 }}>
          {GRID_ITEMS}
        </Grid>
      </Variant>
      <Variant name="gap={1}, {2}, {3}, {4}, {6}, {8}, {12}: each step of the scale">
        <div className="gal-stack">
          {([1, 2, 3, 4, 6, 8, 12] as const).map((gap) => (
            <Grid key={gap} columns={2} gap={gap}>
              <Tag>Intake</Tag>
              <Tag>Review</Tag>
            </Grid>
          ))}
        </div>
      </Variant>
      <Variant name='gap out of the scale: 0, 5, 13, -1, 2.5, NaN, "4"'>
        <div className="gal-stack">
          {[0, 5, 13, -1, 2.5, Number.NaN, "4"].map((gap) => (
            <Grid key={String(gap)} columns={2} gap={gap as never}>
              <Tag>Intake</Tag>
              <Tag>Review</Tag>
            </Grid>
          ))}
        </div>
      </Variant>
    </Fixture>
  ),
};

export const DividerVertical: Story = {
  render: () => (
    <Fixture name="Divider">
      <Variant name='orientation="vertical" takes the height of a flex row, a stretching row and a block'>
        <div className="gal-stack">
          {([undefined, "rule", "heavy"] as const).flatMap((weight) => [
            <div key={`flex-${weight}`} style={{ display: "flex", height: 80 }}>
              <Divider orientation="vertical" weight={weight} />
              <span className="ds-t-body">a</span>
            </div>,
            <div key={`stretch-${weight}`} style={{ display: "flex", alignItems: "stretch" }}>
              <Divider orientation="vertical" weight={weight} />
              <p className="ds-t-body" style={{ margin: 0, height: 64 }}>
                a
              </p>
            </div>,
            <div key={`block-${weight}`} style={{ height: 80 }}>
              <Divider orientation="vertical" weight={weight} />
            </div>,
          ])}
        </div>
      </Variant>
      <Variant name='orientation="vertical" in a row flex, a grid and a block of definite height'>
        <div className="gal-stack">
          <div style={{ display: "flex" }}>
            <p className="ds-t-body" style={{ margin: 0, height: 64 }}>
              a
            </p>
            <Divider orientation="vertical" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "auto auto" }}>
            <p className="ds-t-body" style={{ margin: 0, height: 64 }}>
              a
            </p>
            <Divider orientation="vertical" />
          </div>
          <div style={{ height: 80 }}>
            <p className="ds-t-body" style={{ margin: 0 }}>
              a
            </p>
            <Divider orientation="vertical" />
          </div>
        </div>
      </Variant>
    </Fixture>
  ),
};

export const SpinnerButtons: Story = {
  render: () => (
    <Fixture name="Spinner">
      <Variant name="loading: each variant and tone beside the same Button not loading">
        <div className="gal-stack">
          {(["outline", "solid", "text"] as const).flatMap((variant) =>
            [undefined, "danger" as const].map((tone) => (
              <div className="ds-row" key={variant + (tone ?? "")}>
                <Button variant={variant} tone={tone}>
                  Approve the run
                </Button>
                <Button variant={variant} tone={tone} loading>
                  Approve the run
                </Button>
              </div>
            )),
          )}
        </div>
      </Variant>
      <Variant name="loading with a short label, standard and sm">
        <div className="ds-row">
          <Button loading>OK</Button>
          <Button size="sm" loading>
            OK
          </Button>
        </div>
      </Variant>
    </Fixture>
  ),
};
