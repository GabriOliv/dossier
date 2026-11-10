// Type-level checks of the Icon name, compiled by `tsc --noEmit` in the build. ICN-06: `name` accepts the 22 names of
// the set and no other; the record below fails to compile when one name is missing or one is added.
import type { IconName, IconProps } from "../../src/components/Icon";

export const IconNames: Record<IconName, true> = {
  close: true,
  check: true,
  plus: true,
  minus: true,
  "chevron-up": true,
  "chevron-down": true,
  "chevron-left": true,
  "chevron-right": true,
  "arrow-up": true,
  "arrow-down": true,
  "arrow-left": true,
  "arrow-right": true,
  search: true,
  menu: true,
  more: true,
  external: true,
  copy: true,
  download: true,
  info: true,
  warning: true,
  error: true,
  loading: true,
};
export const IconAccepts: IconProps = { name: "close", size: 24, label: "Fechar", id: "a", onClick: () => {} };
// @ts-expect-error "star" is not one of the 22 names
export const IconRejectsOther: IconProps = { name: "star" };
