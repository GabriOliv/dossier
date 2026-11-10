import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart } from "../src";

const meta = {
  title: "Components/BarChart",
  component: BarChart,
  args: {
    title: "Units by sector",
    unit: "units",
    max: 600,
    data: [
      { label: "Northern relay", value: 412 },
      { label: "Central core", value: 506, active: true },
      { label: "Eastern array", value: 198 },
      { label: "Outpost", value: 88 },
    ],
  },
} satisfies Meta<typeof BarChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoScale: Story = { args: { scale: false } };
