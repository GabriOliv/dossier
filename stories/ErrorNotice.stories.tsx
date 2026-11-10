import type { Meta, StoryObj } from "@storybook/react-vite";
import { ErrorNotice } from "../src";

const meta = {
  title: "Components/ErrorNotice",
  component: ErrorNotice,
  args: {
    code: "Run 0427",
    meta: "2026-10-21 03:12 UTC",
    title: "Release blocked: 2 checks failed",
    action: "Rerun after fix #1182",
    items: ["CHK-114 · Checkout returns 500 under load", "CHK-121 · p95 latency 1.84 s, limit 1.20 s"],
    children: "The build cannot ship until both checks pass or a waiver is approved.",
  },
} satisfies Meta<typeof ErrorNotice>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TitleOnly: Story = {
  args: { code: undefined, meta: undefined, action: undefined, items: undefined, children: undefined },
};
