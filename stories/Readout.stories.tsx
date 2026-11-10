import type { Meta, StoryObj } from "@storybook/react-vite";
import { Readout } from "../src";
import { Row } from "./layout";

const meta = {
  title: "Components/Readout",
  component: Readout,
  args: { label: "Uptime", value: "99.98", unit: "%", note: "Last 30 days" },
} satisfies Meta<typeof Readout>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Trend: Story = { args: { label: "Latency", value: "124", unit: "ms", trend: "down", delta: "-8 ms" } };
export const Hero: Story = { args: { label: "Throughput", value: "4.2", unit: "k/s", size: "hero", tone: "signal" } };
export const All: Story = {
  render: () => (
    <Row>
      <Readout label="Uptime" value="99.98" unit="%" note="Last 30 days" />
      <Readout label="Latency" value="124" unit="ms" trend="down" delta="-8 ms" />
      <Readout label="Open issues" value="17" tone="signal" trend="up" delta="+3" />
      <Readout label="Throughput" value="4.2" unit="k/s" size="hero" tone="signal" />
    </Row>
  ),
};
