import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProportionDial } from "../src";

const meta = {
  title: "Components/ProportionDial",
  component: ProportionDial,
  args: {
    value: 90,
    label: "Deep learning",
    title: "Models by architecture",
    segments: [
      { angle: -25, label: "Forecasting" },
      { angle: 35, label: "Ranking" },
      { angle: 150, label: "Personalization" },
    ],
  },
} satisfies Meta<typeof ProportionDial>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
