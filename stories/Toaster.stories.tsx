import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button, Toaster, toast } from "../src";
import { Row } from "./layout";

const meta = {
  title: "Components/Toaster",
  component: Toaster,
} satisfies Meta<typeof Toaster>;
export default meta;
type Story = StoryObj<typeof meta>;

/** The Toaster is mounted once; any handler calls toast(). */
export const Default: Story = {
  render: (args) => (
    <>
      <Row>
        <Button onClick={() => toast({ title: "File saved", description: "run-0042.pdf" })}>Save</Button>
        <Button tone="danger" onClick={() => toast({ title: "Upload failed", tone: "error" })}>
          Upload
        </Button>
      </Row>
      <Toaster {...args} />
    </>
  ),
};
