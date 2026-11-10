import { forwardRef } from "react";
import { cls } from "../lib/cls";
import { ICONS, type IconName } from "../lib/icons";
import type { NativeProps } from "../lib/native";

export type { IconName };

interface IconOwnProps {
  /** One of the 22 icons of the Dossier set. Any other name renders nothing. */
  name: IconName;
  /** 16 (default) or 24 px. */
  size?: 16 | 24;
  /** The accessible name. Without it the icon is decorative and hidden from assistive tech. */
  label?: string;
  className?: string;
}

export type IconProps = IconOwnProps & NativeProps<"svg", IconOwnProps>;

/** One icon of the Dossier set: a 1 px square-capped stroke in `currentColor`, inline so it follows the text colour. */
export const Icon = forwardRef<SVGSVGElement, IconProps>(function Icon({ name, size, label, className, ...rest }, ref) {
  if (!Object.hasOwn(ICONS, name)) return null;
  const px = size === 24 ? 24 : 16;
  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={px}
      height={px}
      viewBox={`0 0 ${px} ${px}`}
      fill="none"
      className={cls("ds-icon", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
      {...rest}
    >
      <path
        d={ICONS[name][px]}
        stroke="currentColor"
        strokeWidth={1}
        strokeLinecap="square"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
});
