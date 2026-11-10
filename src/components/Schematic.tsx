import { forwardRef, type ReactElement } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

export interface SchematicNode {
  /** 1 = innermost ring. */
  ring: number;
  /** Degrees, 0 = right (3 o'clock), clockwise. */
  angle: number;
  label: string;
  active?: boolean;
}

interface SchematicOwnProps {
  /** Outer ring diameter in px (default 240). */
  size?: number;
  rings?: number;
  nodes?: SchematicNode[];
  /** Width reserved each side for callouts (default 120). */
  labelWidth?: number;
  ticks?: boolean;
  title?: string;
  /** The accessible name used without `title`, falling back to English: `labels={ptBR.Schematic}`. */
  labels?: Partial<Locale["Schematic"]>;
  className?: string;
}

export type SchematicProps = SchematicOwnProps & NativeProps<"svg", SchematicOwnProps>;

/** Port of Dossier's Schematic: concentric rings with nodes and 45-degree leader lines to callouts. */
export const Schematic = forwardRef<SVGSVGElement, SchematicProps>(function Schematic(
  { size: sizeProp, rings: ringsProp, nodes: nodesProp, labelWidth, ticks, title, labels, className, ...rest },
  ref,
) {
  const size = sizeProp || 240;
  const rings = ringsProp || 4;
  const nodes = nodesProp || [];
  const margin = labelWidth || 120;
  const W = size + margin * 2;
  const H = size + 32;
  const cx = W / 2;
  const cy = H / 2;
  const R = size / 2;
  const parts: ReactElement[] = [];

  parts.push(<line key="hx" className="ds-sch-cross" x1={cx - R - 8} y1={cy} x2={cx + R + 8} y2={cy} />);
  parts.push(<line key="vx" className="ds-sch-cross" x1={cx} y1={cy - R - 8} x2={cx} y2={cy + R + 8} />);
  for (let i = 1; i <= rings; i++) {
    parts.push(
      <circle
        key={"r" + i}
        className={i === rings ? "ds-sch-ring" : "ds-sch-ring ds-sch-ring-inner"}
        cx={cx}
        cy={cy}
        r={(R * i) / rings}
      />,
    );
  }
  if (ticks !== false) {
    for (let t = 0; t < 36; t++) {
      const a = (t * Math.PI) / 18;
      const len = t % 9 === 0 ? 8 : 4;
      parts.push(
        <line
          key={"t" + t}
          className="ds-sch-tick"
          x1={cx + Math.cos(a) * R}
          y1={cy + Math.sin(a) * R}
          x2={cx + Math.cos(a) * (R + len)}
          y2={cy + Math.sin(a) * (R + len)}
        />,
      );
    }
  }
  parts.push(<circle key="c" className="ds-sch-core" cx={cx} cy={cy} r={3} />);

  nodes.forEach((n, k) => {
    const rr = (R * Math.min(Math.max(n.ring || 1, 1), rings)) / rings;
    const ang = ((n.angle || 0) * Math.PI) / 180;
    const x = cx + Math.cos(ang) * rr;
    const y = cy + Math.sin(ang) * rr;
    const right = x >= cx;
    const sx = right ? 1 : -1;
    const sy = y < cy ? -1 : 1;
    const qx = x + sx * 14;
    const qy = y + sy * 14;
    let ex = right ? cx + R + 16 : cx - R - 16;
    if ((right && qx > ex) || (!right && qx < ex)) ex = qx + sx * 12;
    parts.push(
      <polyline
        key={"l" + k}
        className={n.active ? "ds-sch-leader ds-sch-on" : "ds-sch-leader"}
        points={x + "," + y + " " + qx + "," + qy + " " + ex + "," + qy}
      />,
    );
    parts.push(
      <circle
        key={"n" + k}
        className={n.active ? "ds-sch-node ds-sch-node-on" : "ds-sch-node"}
        cx={x}
        cy={y}
        r={n.active ? 6 : 5}
      />,
    );
    parts.push(
      <text
        key={"x" + k}
        className={n.active ? "ds-t-label ds-sch-text ds-sch-on-text" : "ds-t-label ds-sch-text"}
        x={ex + sx * 6}
        y={qy + 4}
        textAnchor={right ? "start" : "end"}
      >
        {n.label}
      </text>,
    );
  });

  return (
    <svg
      ref={ref}
      className={cls("ds-schematic", className)}
      viewBox={"0 0 " + W + " " + H}
      width={W}
      height={H}
      role="img"
      aria-label={title || pick(labels?.name, en.Schematic.name)}
      {...rest}
    >
      {parts}
    </svg>
  );
});
