import type { Meta, StoryObj } from "@storybook/react-vite";
import { Figure } from "../src";

const meta = {
  title: "Components/Figure",
  component: Figure,
  args: {
    n: 1,
    title: "Dossier structure",
    meta: "Rev A",
    children: (
      <>
        <svg viewBox="0 0 320 120" role="img" aria-label="Three boxes in a row, joined by lines">
          <rect x="10" y="40" width="80" height="40" fill="none" stroke="currentColor" />
          <rect x="120" y="40" width="80" height="40" fill="none" stroke="currentColor" />
          <rect x="230" y="40" width="80" height="40" fill="none" stroke="currentColor" />
          <path d="M90 60 H120 M200 60 H230" stroke="currentColor" />
        </svg>
        <figcaption>Tokens feed the components, and the components the pages.</figcaption>
      </>
    ),
  },
} satisfies Meta<typeof Figure>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const LegendOnly: Story = { args: { meta: undefined, children: undefined } };
