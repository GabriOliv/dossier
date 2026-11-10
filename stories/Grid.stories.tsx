import type { Meta, StoryObj } from "@storybook/react-vite";
import { Grid, Readout } from "../src";

const meta = {
  title: "Components/Grid",
  component: Grid,
  args: {
    columns: 3,
    children: [
      <Readout key="a" label="Passed" value="128" />,
      <Readout key="b" label="Failed" value="3" />,
      <Readout key="c" label="Skipped" value="9" />,
    ],
  },
} satisfies Meta<typeof Grid>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Columns: Story = {};
export const MinColumnWidth: Story = { args: { columns: undefined, minColumnWidth: "200px", gap: 4 } };
