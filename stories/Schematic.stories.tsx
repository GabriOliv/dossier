import type { Meta, StoryObj } from "@storybook/react-vite";
import { Schematic } from "../src";

const meta = {
  title: "Components/Schematic",
  component: Schematic,
  args: {
    title: "Network rings",
    size: 240,
    rings: 4,
    nodes: [
      { ring: 1, angle: -60, label: "Core" },
      { ring: 2, angle: 200, label: "Relay A", active: true },
      { ring: 3, angle: 30, label: "Relay B" },
      { ring: 4, angle: -140, label: "Perimeter" },
      { ring: 4, angle: 120, label: "Outpost" },
    ],
  },
} satisfies Meta<typeof Schematic>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
