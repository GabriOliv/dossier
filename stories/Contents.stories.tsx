import type { Meta, StoryObj } from "@storybook/react-vite";
import { Contents } from "../src";

const meta = {
  title: "Components/Contents",
  component: Contents,
  args: {
    items: [
      {
        title: "Project and strategy",
        description: "Scope, objectives and the constraints the plan works within.",
        page: 4,
      },
      { title: "Proposal", description: "Three options, their cost and the recommended path.", page: 9, active: true },
      { title: "Change management", description: "Rollout sequence, owners and the review cadence.", page: 15 },
    ],
  },
} satisfies Meta<typeof Contents>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
