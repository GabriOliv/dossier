import type { Meta, StoryObj } from "@storybook/react-vite";
import { Hierarchy } from "../src";

const meta = {
  title: "Components/Hierarchy",
  component: Hierarchy,
  args: {
    title: "Dossier structure",
    root: {
      label: "Dossier",
      code: "root",
      children: [
        { label: "Tokens", code: "T", children: [{ label: "Colour" }, { label: "Type", active: true }] },
        { label: "Components", code: "C", children: [{ label: "Atoms" }, { label: "Diagrams" }] },
      ],
    },
  },
} satisfies Meta<typeof Hierarchy>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LeftRight: Story = { args: { layout: "left-right" } };
export const Folder: Story = { args: { layout: "folder" } };
