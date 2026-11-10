import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusFlag } from "../src";
import { Row } from "./layout";

const meta = {
  title: "Components/StatusFlag",
  component: StatusFlag,
  args: { status: "pass" },
} satisfies Meta<typeof StatusFlag>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const All: Story = {
  render: () => (
    <Row>
      <StatusFlag status="pass" />
      <StatusFlag status="fail" />
      <StatusFlag status="skip" />
      <StatusFlag status="pending" />
    </Row>
  ),
};
