import { forwardRef } from "react";

export const B = forwardRef<HTMLElement>(function B(_, ref) {
  return <i ref={ref}>b</i>;
});
