import type { Meta, StoryObj } from "@storybook/react-vite";
import { StageIcon } from "../src";
import { Row } from "./layout";

const STAGES = ["A", "B", "C", "D"] as const;

const meta = {
  title: "Components/StageIcon",
  component: StageIcon,
  args: { stage: "C", size: "lg" },
} satisfies Meta<typeof StageIcon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Decorative: Story = { args: { decorative: true } };
export const AllStages: Story = {
  render: () => (
    <Row>
      {STAGES.map((s) => (
        <StageIcon key={s} stage={s} size="sm" />
      ))}
      {STAGES.map((s) => (
        <StageIcon key={s} stage={s} size="lg" />
      ))}
    </Row>
  ),
};
