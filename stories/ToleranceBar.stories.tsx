import type { Meta, StoryObj } from "@storybook/react-vite";
import { ToleranceBar } from "../src";

const meta = {
  title: "Components/ToleranceBar",
  component: ToleranceBar,
  args: { label: "p95 latency", value: 1.84, max: 1.2, scaleMax: 2.4, unit: "s", format: (v: number) => v.toFixed(2) },
} satisfies Meta<typeof ToleranceBar>;
export default meta;
type Story = StoryObj<typeof meta>;

export const AboveMax: Story = {};
export const WithinMax: Story = {
  args: { label: "Error rate", value: 0.3, max: 1, scaleMax: 2, unit: "%", format: undefined },
};
export const BelowMin: Story = {
  args: {
    label: "Battery voltage",
    value: 3.1,
    min: 3.3,
    max: 4.2,
    scaleMin: 3,
    scaleMax: 4.5,
    unit: "V",
    format: undefined,
  },
};
