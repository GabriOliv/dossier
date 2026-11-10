import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tag } from "../src";

const meta = {
  title: "Components/Tag",
  component: Tag,
  args: { children: "Draft" },
} satisfies Meta<typeof Tag>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {};
export const Solid: Story = { args: { variant: "solid", children: "Active" } };
export const Inverse: Story = { args: { variant: "inverse", children: "Archived" } };
