import type { Meta, StoryObj } from "@storybook/react-vite";
import { Redacted } from "../src";

const meta = {
  title: "Components/Redacted",
  component: Redacted,
  args: { length: 10 },
} satisfies Meta<typeof Redacted>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const InASentence: Story = {
  render: () => (
    <p className="ds-t-body" style={{ maxWidth: 560 }}>
      Subject transferred to <Redacted length={10} /> on <Redacted length={6} /> under directive <Redacted length={4} />
      . Escort of two, no incidents logged.
    </p>
  ),
};
