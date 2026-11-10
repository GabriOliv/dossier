import { forwardRef, type ReactElement } from "react";
import { cls } from "../lib/cls";
import { en } from "../locales/en";
import type { Locale } from "../locales/types";
import { pick } from "../lib/labels";
import type { NativeProps } from "../lib/native";

export interface DialSegment {
  /** Degrees, 0 = right (3 o'clock), clockwise. A callout that would overlap another moves down its side. */
  angle: number;
  label: string;
}

interface ProportionDialOwnProps {
  /** 0–100. */
  value: number;
  /** What the share counts, shown under the percentage. */
  label?: string;
  /** Category callouts on the outer ring. */
  segments?: DialSegment[];
  /** Outer ring diameter (default 240). */
  size?: number;
  /** Room each side for callouts (default 180). */
  labelWidth?: number;
  /** Dot spacing in px (default 12). */
  dotStep?: number;
  title?: string;
  /** The accessible name used without `title` and `label`, falling back to English: `labels={ptBR.ProportionDial}`. */
  labels?: Partial<Locale["ProportionDial"]>;
  className?: string;
}

export type ProportionDialProps = ProportionDialOwnProps & NativeProps<"svg", ProportionDialOwnProps>;

/**
 * 45-degree leader from a point on a ring out to a callout beside the figure. `shift` moves the callout line
 * down; the slant then follows it, up to the callout column. With no shift the leader is Dossier's.
 */
function leader(x: number, y: number, cx: number, cy: number, R: number, gap: number, shift = 0) {
  const right = x >= cx;
  const sx = right ? 1 : -1;
  const sy = y < cy ? -1 : 1;
  const qy = y + sy * 16 + shift;
  const qx = x + sx * (shift ? Math.min(Math.abs(qy - y), Math.abs(cx + sx * (R + gap) - x) - 6) : 16);
  let ex = cx + sx * (R + gap);
  if ((right && qx > ex) || (!right && qx < ex)) ex = qx + sx * 12;
  return {
    points: x + "," + y + " " + qx + "," + qy + " " + ex + "," + qy,
    tx: ex + sx * 6,
    ty: qy,
    anchor: right ? ("start" as const) : ("end" as const),
  };
}

/** Ink of each callout's text above (negative) and below its leader line, at the type sizes of tokens.css. */
const REACH = {
  value: [-20, 17], // figure, 48px, baseline at +16
  valueLabel: [-20, 38], // figure, then the label, 11px caps, baseline at +36
  segment: [-4, 6], // label, 11px caps, baseline at +4
} as const;
const GAP = 4;

interface Callout {
  x: number;
  y: number;
  top: number;
  bottom: number;
  /** Where Dossier puts the callout line. */
  line: number;
  shift: number;
}

function callout(x: number, y: number, cy: number, [top, bottom]: readonly [number, number]): Callout {
  return { x, y, top, bottom, line: y + (y < cy ? -16 : 16), shift: 0 };
}

/**
 * On each side, in ring order, moves a callout down until its text clears the one above by GAP.
 * Callouts already clear keep Dossier's position (shift 0), so their markup is the original's.
 */
function separate(callouts: Callout[], cx: number) {
  for (const right of [true, false]) {
    let floor = -Infinity;
    for (const c of callouts.filter((c) => c.x >= cx === right).sort((a, b) => a.line - b.line)) {
      const line = Math.max(c.line, floor - c.top);
      c.shift = line - c.line;
      floor = line + c.bottom + GAP;
    }
  }
}

/** Port of Dossier's ProportionDial: one share of a whole as a signal arc and a sector of dots. */
export const ProportionDial = forwardRef<SVGSVGElement, ProportionDialProps>(function ProportionDial(
  { value: valueProp, label, segments, size: sizeProp, labelWidth, dotStep, title, labels, className, ...rest },
  ref,
) {
  const v = Math.max(0, Math.min(100, Number(valueProp) || 0));
  const size = sizeProp || 240;
  const margin = labelWidth || 180;
  const W = size + margin * 2;
  const H = size + 96;
  const cx = W / 2;
  const cy = H / 2;
  const R = size / 2;
  const theta = (v / 100) * Math.PI * 2;
  const parts: ReactElement[] = [];
  parts.push(<circle key="outer" className="ds-pd-ring" cx={cx} cy={cy} r={R} />);
  parts.push(<circle key="inner" className="ds-pd-ring ds-pd-ring-inner" cx={cx} cy={cy} r={R * 0.8} />);
  const ex = cx + R * Math.sin(theta);
  const ey = cy - R * Math.cos(theta);
  if (v >= 100) {
    parts.push(<circle key="arc" className="ds-pd-arc" cx={cx} cy={cy} r={R} />);
  } else if (v > 0) {
    parts.push(
      <path
        key="arc"
        className="ds-pd-arc"
        d={"M " + cx + " " + (cy - R) + " A " + R + " " + R + " 0 " + (theta > Math.PI ? 1 : 0) + " 1 " + ex + " " + ey}
      />,
    );
  }
  parts.push(<line key="zero" className="ds-pd-zero" x1={cx} y1={cy - R - 6} x2={cx} y2={cy - R + 6} />);
  const step = dotStep || 12;
  const k = Math.floor((R * 0.68) / step);
  const lim = R * 0.68;
  for (let gy = -k; gy <= k; gy++) {
    for (let gx = -k; gx <= k; gx++) {
      const dx = gx * step;
      const dy = gy * step;
      if (dx * dx + dy * dy > lim * lim) continue;
      let a = Math.atan2(dx, -dy);
      if (a < 0) a += Math.PI * 2;
      const on = a < theta || (dx === 0 && dy === 0 && v > 0);
      parts.push(
        <circle
          key={"d" + gx + "_" + gy}
          className={on ? "ds-pd-dot ds-pd-dot-on" : "ds-pd-dot"}
          cx={cx + dx}
          cy={cy + dy}
          r={on ? 3 : 2.5}
        />,
      );
    }
  }
  const value = callout(ex, ey, cy, label ? REACH.valueLabel : REACH.value);
  const segs = (segments || []).map((s) => {
    const ang = ((s.angle || 0) * Math.PI) / 180;
    return callout(cx + Math.cos(ang) * R, cy + Math.sin(ang) * R, cy, REACH.segment);
  });
  const callouts = [value, ...segs];
  separate(callouts, cx);
  // Grow the canvas only when a callout's text would leave it; otherwise the viewBox is Dossier's.
  const top = Math.min(0, Math.floor(Math.min(...callouts.map((c) => c.line + c.shift + c.top))));
  const bottom = Math.max(H, Math.ceil(Math.max(...callouts.map((c) => c.line + c.shift + c.bottom))));
  const L = leader(ex, ey, cx, cy, R, 24, value.shift);
  parts.push(<polyline key="vl" className="ds-pd-leader ds-pd-on" points={L.points} />);
  parts.push(<circle key="vn" className="ds-pd-node" cx={ex} cy={ey} r={4} />);
  parts.push(
    <text key="vt" className="ds-t-figure ds-pd-value" x={L.tx} y={L.ty + 16} textAnchor={L.anchor}>
      {Math.round(v) + "%"}
    </text>,
  );
  if (label) {
    parts.push(
      <text key="vlab" className="ds-t-label ds-pd-label" x={L.tx} y={L.ty + 36} textAnchor={L.anchor}>
        {label}
      </text>,
    );
  }
  (segments || []).forEach((s, i) => {
    const { x, y, shift } = segs[i];
    const S = leader(x, y, cx, cy, R, 24, shift);
    parts.push(<polyline key={"sl" + i} className="ds-pd-leader" points={S.points} />);
    parts.push(<circle key={"sn" + i} className="ds-pd-seg" cx={x} cy={y} r={3} />);
    parts.push(
      <text key={"st" + i} className="ds-t-label ds-pd-text" x={S.tx} y={S.ty + 4} textAnchor={S.anchor}>
        {s.label}
      </text>,
    );
  });
  return (
    <svg
      ref={ref}
      className={cls("ds-dial", className)}
      viewBox={"0 " + top + " " + W + " " + (bottom - top)}
      width={W}
      height={bottom - top}
      role="img"
      aria-label={(title || label || pick(labels?.name, en.ProportionDial.name)) + ": " + Math.round(v) + "%"}
      {...rest}
    >
      {parts}
    </svg>
  );
});
