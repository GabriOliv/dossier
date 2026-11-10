import type { Meta, StoryObj } from "@storybook/react-vite";
import { Timeline } from "../src";

const meta = {
  title: "Components/Timeline",
  component: Timeline,
  args: {
    events: [
      { at: "Cycle 1", label: "Survey", note: "First readings logged" },
      { at: "Cycle 10", label: "Relay network", note: "Four relays linked" },
      { at: "Cycle 100", label: "Core online", note: "Network self-sustaining", active: true },
      { at: "Cycle 1000", label: "Projected", note: "Model estimate" },
    ],
  },
} satisfies Meta<typeof Timeline>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
