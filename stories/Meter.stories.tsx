import type { Meta, StoryObj } from "@storybook/react-vite";
import { Meter } from "../src";

const meta = {
  title: "Components/Meter",
  component: Meter,
  args: { label: "Signal strength", value: 7 },
} satisfies Meta<typeof Meter>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Signal: Story = { args: { label: "Coverage", value: 9, tone: "signal" } };
