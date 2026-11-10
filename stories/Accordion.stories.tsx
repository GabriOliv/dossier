import type { Meta, StoryObj } from "@storybook/react-vite";
import { Accordion } from "../src";

const meta = {
  title: "Components/Accordion",
  component: Accordion,
  args: {
    items: [
      { title: "How do I ship?", content: "The order leaves in two business days." },
      { title: "Can I return it?", content: "Within thirty days, with the receipt.", defaultOpen: true },
      { title: "Do you invoice?", content: "Every order has an invoice by e-mail." },
    ],
  },
} satisfies Meta<typeof Accordion>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Exclusive: Story = { args: { exclusive: true } };
