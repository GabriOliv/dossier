import type { Meta, StoryObj } from "@storybook/react-vite";
import { Select } from "../src";

const meta = {
  title: "Components/Select",
  component: Select,
  args: {
    label: "Country",
    defaultValue: "pt",
    options: [
      { value: "br", label: "Brazil" },
      { value: "pt", label: "Portugal" },
      { value: "ar", label: "Argentina" },
    ],
  },
} satisfies Meta<typeof Select>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithPlaceholder: Story = {
  args: { defaultValue: undefined, placeholder: "Choose a country", hint: "Where it was filed." },
};
export const WithError: Story = {
  args: {
    defaultValue: undefined,
    placeholder: "Choose a country",
    required: true,
    error: "Choose a country to continue.",
  },
};
export const Disabled: Story = { args: { defaultValue: "br", disabled: true } };
