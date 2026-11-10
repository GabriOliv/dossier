import type { Meta, StoryObj } from "@storybook/react-vite";
import { SectionTitle } from "../src";

const meta = {
  title: "Components/SectionTitle",
  component: SectionTitle,
  args: { index: "02", title: "Findings", meta: "3 items" },
} satisfies Meta<typeof SectionTitle>;
export default meta;
type Story = StoryObj<typeof meta>;

export const IndexAndMeta: Story = {};
export const TitleOnly: Story = { args: { index: undefined, title: "Summary", meta: undefined } };
