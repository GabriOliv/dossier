import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton, Tooltip } from "../src";

const cross = (
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
    <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="2" fill="none" />
  </svg>
);

const meta = {
  title: "Components/Tooltip",
  component: Tooltip,
  args: {
    content: "Copy link",
    children: <IconButton label="Copy">{cross}</IconButton>,
  },
  // The tip shows above the trigger: room for it.
  decorators: [
    (Story) => (
      <div style={{ paddingTop: 48 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tooltip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
