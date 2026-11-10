import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Tabs, type TabsProps } from "../src";

const tabs = [
  { value: "summary", label: "Summary", content: "12 checks ran in 4.2 s: 11 passed, 1 failed." },
  { value: "checks", label: "Checks", content: "Intake, review and archive passed; export failed on the timeout." },
  { value: "logs", label: "Logs", content: "02:14:07 export started; 02:14:11 timeout after 4000 ms." },
];

/** The consumer holds the selection: `value` and `onChange`. */
function Controlled(args: TabsProps) {
  const [value, setValue] = useState("logs");
  return <Tabs {...args} value={value} onChange={setValue} />;
}

const meta = {
  title: "Components/Tabs",
  component: Tabs,
  args: { label: "Run views", tabs },
} satisfies Meta<typeof Tabs>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const DefaultValue: Story = { args: { defaultValue: "checks" } };
export const WithDisabled: Story = { args: { tabs: [tabs[0], tabs[1], { ...tabs[2], disabled: true }] } };
export const ControlledValue: Story = {
  render: (args) => <Controlled {...args} />,
};
