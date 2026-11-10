import type { Meta, StoryObj } from "@storybook/react-vite";
import { Divider } from "../src";

const meta = {
  title: "Components/Divider",
  component: Divider,
} satisfies Meta<typeof Divider>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Hair: Story = {};
export const Rule: Story = { args: { weight: "rule" } };
export const Heavy: Story = { args: { weight: "heavy" } };
export const Vertical: Story = {
  args: { orientation: "vertical", weight: "rule" },
  render: (args) => (
    <div style={{ display: "flex", gap: 16, height: 48 }}>
      <span>Intake</span>
      <Divider {...args} />
      <span>Review</span>
    </div>
  ),
};
