import type { Meta, StoryObj } from "@storybook/react-vite";
import { CheckLog } from "../src";

const meta = {
  title: "Components/CheckLog",
  component: CheckLog,
  args: {
    title: "Release checks",
    checks: [
      { id: "c-01", label: "Build", result: "pass", detail: "vite build", duration: "4.1 s" },
      { id: "c-02", label: "Unit tests", result: "pass", detail: "83 specs", duration: "12 s" },
      { id: "c-03", label: "Consumer smoke", result: "fail", detail: "Docusaurus 3", duration: "30 s" },
      { id: "c-04", label: "Publint", result: "skip" },
      { id: "c-05", label: "Deploy", result: "pending" },
    ],
  },
} satisfies Meta<typeof CheckLog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const MixedResults: Story = {};
