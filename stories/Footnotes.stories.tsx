import type { Meta, StoryObj } from "@storybook/react-vite";
import { Footnotes } from "../src";

const meta = {
  title: "Components/Footnotes",
  component: Footnotes,
  args: {
    notes: [{ text: "Figures rounded to the nearest millisecond." }, { text: "Source: internal audit, Q1 2026." }],
  },
} satisfies Meta<typeof Footnotes>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
