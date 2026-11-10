import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../src";

const meta = {
  title: "Components/Button",
  component: Button,
  args: { children: "Review" },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {};
export const Solid: Story = { args: { variant: "solid", children: "Approve" } };
export const Text: Story = { args: { variant: "text", children: "Cancel" } };
export const Danger: Story = { args: { variant: "solid", tone: "danger", children: "Delete" } };
export const Small: Story = { args: { size: "sm" } };
export const Disabled: Story = { args: { disabled: true } };
export const Loading: Story = { args: { variant: "solid", loading: true, children: "Approve" } };
