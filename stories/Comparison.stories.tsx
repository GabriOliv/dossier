import type { Meta, StoryObj } from "@storybook/react-vite";
import { Comparison } from "../src";

const meta = {
  title: "Components/Comparison",
  component: Comparison,
  args: {
    columns: [
      {
        code: "Criterion A",
        title: "Impact",
        lead: "An initiative rates high on impact when it does one of the following:",
        items: ["Is required to reach the target state", "Cuts cost or raises revenue by a measurable amount"],
        active: true,
      },
      {
        code: "Criterion B",
        title: "Effort",
        lead: "Effort is assessed on three factors:",
        items: ["Ease of implementation", "Required time frame", "Required resources: people and capital"],
      },
    ],
  },
} satisfies Meta<typeof Comparison>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TwoColumns: Story = {};
