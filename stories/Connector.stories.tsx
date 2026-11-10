import type { Meta, StoryObj } from "@storybook/react-vite";
import { Connector } from "../src";

const meta = {
  title: "Components/Connector",
  component: Connector,
  args: { width: 160, height: 64, from: "bottom-right", first: "vertical" },
} satisfies Meta<typeof Connector>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Bent: Story = {};
export const Straight: Story = { args: { width: 96, height: 0, from: "top-left" } };
export const Active: Story = { args: { from: "top-left", first: "horizontal", active: true } };
