import type { Meta, StoryObj } from "@storybook/react-vite";
import { RadioGroup } from "../src";

const meta = {
  title: "Components/RadioGroup",
  component: RadioGroup,
  args: {
    label: "Plan",
    defaultValue: "team",
    options: [
      { value: "free", label: "Free" },
      { value: "team", label: "Team" },
      { value: "org", label: "Organization" },
    ],
  },
} satisfies Meta<typeof RadioGroup>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithHint: Story = { args: { defaultValue: undefined, hint: "You can switch plans at any time." } };
export const WithError: Story = {
  args: { defaultValue: undefined, required: true, error: "Choose a plan to continue." },
};
export const DisabledOption: Story = {
  args: {
    label: "Support level",
    defaultValue: "free",
    options: [
      { value: "free", label: "Community" },
      { value: "team", label: "Business hours", disabled: true },
      { value: "org", label: "Around the clock" },
    ],
  },
};
