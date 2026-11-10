import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "../src";
import { Stack } from "./layout";

const meta = {
  title: "Components/Skeleton",
  component: Skeleton,
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {};
export const Block: Story = { args: { variant: "block", height: "120px" } };
export const Card: Story = {
  render: () => (
    <Stack>
      <Skeleton variant="block" height={96} />
      <Skeleton />
      <Skeleton />
    </Stack>
  ),
};
