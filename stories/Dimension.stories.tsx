import type { Meta, StoryObj } from "@storybook/react-vite";
import { Dimension } from "../src";

const meta = {
  title: "Components/Dimension",
  component: Dimension,
  args: { length: 320, label: "320 px" },
} satisfies Meta<typeof Dimension>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Active: Story = { args: { length: 152, label: "152", active: true } };
