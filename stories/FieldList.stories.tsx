import type { Meta, StoryObj } from "@storybook/react-vite";
import { FieldList } from "../src";

const meta = {
  title: "Components/FieldList",
  component: FieldList,
  args: {
    columns: 2,
    fields: [
      { label: "Owner", value: "G. Laureano" },
      { label: "Status", value: "In review", active: true },
      { label: "Hash", value: "9f2c1ab", mono: true },
      { label: "Updated", value: "12 Mar 2026", mono: true },
    ],
  },
} satisfies Meta<typeof FieldList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Record: Story = {};
export const Definition: Story = {
  args: {
    variant: "definition",
    columns: undefined,
    fields: [
      { label: "Token", value: "A named design decision." },
      { label: "Theme", value: "A set of token values." },
    ],
  },
};
