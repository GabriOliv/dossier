import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Button, Dialog, type DialogProps } from "../src";

/** The state lives with the consumer: a Button opens the Dialog and `onClose` closes it. */
function Controlled(args: DialogProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        {...args}
        open={open}
        onClose={() => setOpen(false)}
        actions={
          <>
            <Button variant="text" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="solid" tone="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
          </>
        }
      />
    </>
  );
}

const meta = {
  title: "Components/Dialog",
  component: Dialog,
  args: {
    open: false,
    onClose: () => {},
    title: "Delete file",
    description: "report-final-2026.pdf leaves the folder and cannot be restored.",
    children: "Shared links stop working.",
  },
  render: (args) => <Controlled {...args} />,
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Alert: Story = {
  args: { alert: true, title: "Discard the draft?", description: "The changes since the last save are lost." },
};
