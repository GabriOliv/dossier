import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Menu } from "../src";

const meta = {
  title: "Components/Menu",
  component: Menu,
  args: {
    trigger: <Button>Actions</Button>,
    items: [
      { label: "Edit", onSelect: () => {} },
      { label: "Duplicate", onSelect: () => {} },
      { label: "Delete", onSelect: () => {}, tone: "danger" },
    ],
  },
  // The list opens over the page: room below the trigger for it.
  decorators: [
    (Story) => (
      <div style={{ minHeight: 200 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Menu>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithDisabled: Story = {
  args: {
    items: [
      { label: "Edit", onSelect: () => {} },
      { label: "Share", onSelect: () => {}, disabled: true },
      { label: "Delete", onSelect: () => {}, tone: "danger" },
    ],
  },
};
