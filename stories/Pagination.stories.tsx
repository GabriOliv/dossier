import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { Pagination, type PaginationProps } from "../src";

/** Without `href` the pages are buttons, and the consumer holds the page. */
function Buttons(args: PaginationProps) {
  const [page, setPage] = useState(1);
  return <Pagination {...args} page={page} onChange={setPage} />;
}

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  args: { page: 5, total: 20, href: (n: number) => `#page-${n}` },
} satisfies Meta<typeof Pagination>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Links: Story = {};
export const Siblings: Story = { args: { page: 10, siblings: 2 } };
export const LastPage: Story = { args: { page: 20 } };
export const WithButtons: Story = {
  args: { href: undefined },
  render: (args) => <Buttons {...args} />,
};
