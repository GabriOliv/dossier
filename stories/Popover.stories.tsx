import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Checkbox, Popover } from "../src";

const meta = {
  title: "Components/Popover",
  component: Popover,
  args: {
    trigger: <Button>Filters</Button>,
    children: <Checkbox label="Only open files" />,
  },
  // The panel opens over the page: room below the trigger for it.
  decorators: [
    (Story) => (
      <div style={{ minHeight: 200 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Popover>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const TopEnd: Story = { args: { placement: "top-end" } };
