import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "../src";

const meta = {
  title: "Components/Checkbox",
  component: Checkbox,
  args: { label: "Send me the weekly digest" },
} satisfies Meta<typeof Checkbox>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {};
export const Checked: Story = { args: { label: "Accept the terms", defaultChecked: true } };
export const WithHint: Story = {
  args: { label: "Share anonymous usage", hint: "You can change this later in settings." },
};
export const WithError: Story = {
  args: { label: "Accept the terms", required: true, error: "Accept the terms to continue." },
};
export const Disabled: Story = { args: { label: "Locked option", disabled: true } };
