import type { Meta, StoryObj } from "@storybook/react-vite";
import { DataTable } from "../src";

const columns = [
  { key: "id", label: "Id" },
  { key: "item", label: "Item" },
  { key: "qty", label: "Qty", numeric: true },
  { key: "ms", label: "Time (ms)", numeric: true },
];
const rows = [
  { id: "A-01", item: "Intake", qty: "12", ms: "410" },
  { id: "A-02", item: "Review", qty: "8", ms: "1,280" },
  { id: "A-03", item: "Archive", qty: "31", ms: "95" },
];

const meta = {
  title: "Components/DataTable",
  component: DataTable,
  args: { caption: "Intake log", columns, rows, highlightRows: [1] },
} satisfies Meta<typeof DataTable>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CaptionAndHighlight: Story = {};
export const Plain: Story = { args: { caption: undefined, rows: rows.slice(0, 2), highlightRows: undefined } };
