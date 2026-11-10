import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon, type IconName } from "../src";
import { Row } from "./layout";

const NAMES: IconName[] = [
  "close",
  "check",
  "plus",
  "minus",
  "chevron-up",
  "chevron-down",
  "chevron-left",
  "chevron-right",
  "arrow-up",
  "arrow-down",
  "arrow-left",
  "arrow-right",
  "search",
  "menu",
  "more",
  "external",
  "copy",
  "download",
  "info",
  "warning",
  "error",
  "loading",
];

const meta = {
  title: "Components/Icon",
  component: Icon,
  args: { name: "check" },
} satisfies Meta<typeof Icon>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Size24: Story = { args: { size: 24 } };
export const Labelled: Story = { args: { name: "close", label: "Close" } };
export const AllIcons: Story = {
  render: (args) => (
    <Row>
      {NAMES.map((name) => (
        <Icon key={name} {...args} name={name} />
      ))}
    </Row>
  ),
};
