import type { Meta, StoryObj } from "@storybook/react-vite";
import { Link } from "../src";

const meta = {
  title: "Components/Link",
  component: Link,
  args: { href: "#", children: "Full documentation" },
} satisfies Meta<typeof Link>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
/** The look of Link for a router's link: put the `ds-link` class on it, as in `<NextLink className="ds-link">`. */
export const ClassOnAnchor: Story = {
  render: () => (
    <a className="ds-link" href="#">
      Changelog
    </a>
  ),
};
