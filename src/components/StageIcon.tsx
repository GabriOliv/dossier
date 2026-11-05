import type { ReactElement } from "react";
import { cls } from "../lib/cls";

export type Stage = "A" | "B" | "C" | "D";

export interface StageIconProps {
  /** Maturity stage: A · Semente, B · Broto, C · Árvore, D · Fruto. */
  stage: Stage;
  /** "sm" (default): 16 px, filled, for 14–24 px. "lg": 48 px, 1 px stroke, for 48–128 px. */
  size?: "sm" | "lg";
  /** Set when the stage name is written next to the icon: the icon is hidden from assistive tech so the stage is not read twice. */
  decorative?: boolean;
  className?: string;
}

/** Accessible names, as in each file's `<title>`. */
export const STAGE_NAMES: Record<Stage, string> = {
  A: "Estágio A · Semente",
  B: "Estágio B · Broto",
  C: "Estágio C · Árvore",
  D: "Estágio D · Fruto",
};

const ink = { stroke: "currentColor", strokeWidth: 1 } as const;
const inkLg = { ...ink, vectorEffect: "non-scaling-stroke" } as const;
const signal = "var(--signal, #002fa7)";

/** The drawings of assets/stages/base/, unchanged. Never redraw them: tests compare each one with its file. */
const DRAWINGS: Record<Stage, Record<"sm" | "lg", ReactElement>> = {
  A: {
    sm: (
      <>
        <line x1="3" y1="6" x2="13" y2="6" {...ink} />
        <circle cx="8" cy="11" r="3" {...ink} />
      </>
    ),
    lg: (
      <>
        <line x1="9" y1="18" x2="39" y2="18" {...inkLg} />
        <circle cx="24" cy="33" r="9" {...inkLg} />
      </>
    ),
  },
  B: {
    sm: (
      <>
        <line x1="8" y1="15" x2="8" y2="8" {...ink} />
        <path d="M8 10.5A5 5 0 0 1 3.05 5.55A5 5 0 0 1 8 10.5Z" fill="currentColor" />
        <path d="M8 8.5A5 5 0 0 1 12.95 3.55A5 5 0 0 1 8 8.5Z" fill="currentColor" />
      </>
    ),
    lg: (
      <>
        <line x1="24" y1="45" x2="24" y2="24" {...inkLg} />
        <path d="M24 31.5A15 15 0 0 1 9.15 16.65A15 15 0 0 1 24 31.5Z" {...inkLg} />
        <path d="M24 25.5A15 15 0 0 1 38.85 10.65A15 15 0 0 1 24 25.5Z" {...inkLg} />
      </>
    ),
  },
  C: {
    sm: (
      <>
        <polygon points="8,3.5 3.67,11 12.33,11" fill="currentColor" />
        <polygon points="8,1.5 5.4,6 10.6,6" fill="currentColor" />
        <rect x="7" y="11" width="2" height="3.5" fill="currentColor" />
      </>
    ),
    lg: (
      <>
        <polygon points="24,4.5 16.21,18 31.79,18" {...inkLg} />
        <polyline points="19.67,18 11.01,33 36.99,33 28.33,18" {...inkLg} />
        <rect x="21" y="33" width="6" height="10.5" {...inkLg} />
      </>
    ),
  },
  D: {
    sm: (
      <>
        <circle cx="8" cy="11" r="5" style={{ fill: signal }} />
        <line x1="8" y1="6" x2="8" y2="2.5" {...ink} />
        <path d="M8 4.5A3 3 0 0 1 12.33 2A3 3 0 0 1 8 4.5Z" fill="currentColor" />
      </>
    ),
    lg: (
      <>
        <circle cx="24" cy="33" r="15" style={{ stroke: signal }} strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <line x1="24" y1="18" x2="24" y2="7.5" {...inkLg} />
        <path d="M24 13.5A9 9 0 0 1 36.99 6A9 9 0 0 1 24 13.5Z" {...inkLg} />
      </>
    ),
  },
};

/** One maturity-stage icon of the QA Garden cycle, inline so it follows the page theme (`currentColor`, `--signal`). */
export function StageIcon({ stage, size, decorative, className }: StageIconProps) {
  if (!STAGE_NAMES[stage]) return null;
  const sz = size === "lg" ? "lg" : "sm";
  const px = sz === "lg" ? 48 : 16;
  const name = STAGE_NAMES[stage];
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      className={cls("ds-stage", className)}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": name })}
    >
      {decorative ? null : <title>{name}</title>}
      {DRAWINGS[stage][sz]}
    </svg>
  );
}
