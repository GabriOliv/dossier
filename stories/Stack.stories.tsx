import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Stack } from "../src";

const meta = {
  title: "Components/Stack",
  component: Stack,
  args: {
    children: [<Button key="a">Review</Button>, <Button key="b">Approve</Button>, <Button key="c">Archive</Button>],
  },
} satisfies Meta<typeof Stack>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Column: Story = {};
export const Row: Story = { args: { direction: "row", gap: 2 } };
export const Between: Story = { args: { direction: "row", justify: "between", align: "center", wrap: true } };
