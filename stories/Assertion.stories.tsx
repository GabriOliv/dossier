import type { Meta, StoryObj } from "@storybook/react-vite";
import { Assertion } from "../src";

const meta = {
  title: "Components/Assertion",
  component: Assertion,
  args: {
    label: "CHK-114 · status code",
    expected: "200 OK",
    actual: "500 Internal Server Error",
    location: "checkout.spec.ts:88",
  },
} satisfies Meta<typeof Assertion>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Failed: Story = {};
export const Passed: Story = {
  args: { label: "CHK-101 · cart total", expected: "84.90", actual: "84.90", location: "cart.spec.ts:41" },
};
