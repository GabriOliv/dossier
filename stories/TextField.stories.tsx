import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextField } from "../src";

const meta = {
  title: "Components/TextField",
  component: TextField,
  args: { label: "Approver", defaultValue: "Release manager", hint: "Who signs off on build 3.18.2." },
} satisfies Meta<typeof TextField>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithHint: Story = {};
export const TextareaWithError: Story = {
  args: {
    label: "Waiver reason",
    defaultValue: undefined,
    hint: undefined,
    required: true,
    multiline: true,
    rows: 2,
    error: "Write a reason before waiving a failed check.",
  },
};
export const Disabled: Story = { args: { disabled: true } };
