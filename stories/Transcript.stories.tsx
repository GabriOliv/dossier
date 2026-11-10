import type { Meta, StoryObj } from "@storybook/react-vite";
import { Redacted, Transcript } from "../src";

const meta = {
  title: "Components/Transcript",
  component: Transcript,
  args: {
    title: "Transcript — Log 07",
    lines: [
      { time: "04:12", speaker: "Control", text: "Relay A, confirm position." },
      {
        time: "04:12",
        speaker: "Relay A",
        text: (
          <>
            Holding at grid 41 by 12. Visual on <Redacted length={9} />, no change.
          </>
        ),
      },
      { time: "04:13", speaker: "Control", text: "Hold. Next contact in twelve minutes.", active: true },
      {
        time: "04:25",
        speaker: "Relay A",
        text: (
          <>
            Contact lost near <Redacted length={6} />.
          </>
        ),
      },
    ],
  },
} satisfies Meta<typeof Transcript>;
export default meta;
type Story = StoryObj<typeof meta>;

export const WithRedactions: Story = {};
