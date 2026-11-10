import type { Meta, StoryObj } from "@storybook/react-vite";
import { LineChart } from "../src";

const meta = {
  title: "Components/LineChart",
  component: LineChart,
  args: {
    title: "Adoption rate by month",
    unit: "%",
    width: 860,
    data: [
      { x: "Jun", y: 30, callout: true },
      { x: "Jul", y: 44 },
      { x: "Aug", y: 58 },
      { x: "Sep", y: 66 },
      { x: "Oct", y: 70 },
      { x: "Nov", y: 92 },
      { x: "Dec", y: 130, active: true },
    ],
  },
} satisfies Meta<typeof LineChart>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const NoArea: Story = { args: { area: false } };
