import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "../src";

const cross = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const meta = {
  title: "Components/IconButton",
  component: IconButton,
  args: { label: "Close", children: cross },
} satisfies Meta<typeof IconButton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {};
export const Solid: Story = { args: { variant: "solid", label: "Dismiss" } };
export const Text: Story = { args: { variant: "text", label: "Clear" } };
export const Danger: Story = { args: { variant: "solid", tone: "danger", label: "Remove" } };
export const Small: Story = { args: { size: "sm" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { loading: true } };
