import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "../src";

const meta = {
  title: "Components/Switch",
  component: Switch,
  args: { label: "Email notifications" },
} satisfies Meta<typeof Switch>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};
export const On: Story = { args: { label: "Auto-archive closed runs", defaultChecked: true } };
export const WithHint: Story = { args: { label: "Weekly digest", hint: "Sent on Monday morning." } };
export const WithError: Story = {
  args: { label: "Allow data export", required: true, error: "Turn this on to export the run." },
};
export const Disabled: Story = { args: { label: "Managed by your admin", disabled: true } };
