import type { Meta, StoryObj } from "@storybook/react-vite";
import { Quote } from "../src";

const meta = {
  title: "Components/Quote",
  component: Quote,
  args: {
    source: "Field notes",
    code: "FN-12",
    children: (
      <>
        Measure twice, <span className="ds-hl">file once.</span>
      </>
    ),
  },
} satisfies Meta<typeof Quote>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Statement: Story = {
  args: {
    variant: "statement",
    source: undefined,
    code: undefined,
    kicker: "Key message",
    note: "Colour is never the only cue.",
    children: (
      <>
        Every result carries a <span className="ds-hl">word</span>.
      </>
    ),
  },
};
