import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataHeader } from "../src";

const meta = {
  title: "Components/DataHeader",
  component: DataHeader,
  args: { title: "Quarterly review", code: "File 0427 · Rev B", kicker: "Internal", meta: "12 Mar 2026" },
} satisfies Meta<typeof DataHeader>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Band: Story = {};
export const Running: Story = { args: { variant: "running", code: "0427", kicker: "Page 2", meta: "Rev B" } };
